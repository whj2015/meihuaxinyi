
import { verifyJwt } from '../lib/security';

export async function onRequest(context) {
  const { request, env } = context;

  // 1. 鉴权
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  const userPayload = await verifyJwt(token, env.JWT_SECRET);
  if (!userPayload) {
    return new Response(JSON.stringify({ success: false, message: "Invalid Token" }), { status: 401 });
  }
  const username = userPayload.username;

  // 2. 确保表存在 (Schema V1 - User Isolated)
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_daily_readings_v1 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        date TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER,
        UNIQUE(username, date)
      )
    `).run();
  } catch (e) {
    console.error("Table creation failed:", e);
  }

  // 通用响应头 (禁止缓存)
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
  };

  try {
    const url = new URL(request.url);
    
    // --- GET: 获取今日卦象 ---
    if (request.method === 'GET') {
      const dateParam = url.searchParams.get('date');
      const targetDate = dateParam || new Date().toISOString().split('T')[0];

      // 强制校验 username
      const record = await env.DB.prepare(
        "SELECT data FROM user_daily_readings_v1 WHERE username = ? AND date = ?"
      ).bind(username, targetDate).first();

      if (record) {
        return new Response(JSON.stringify({ success: true, data: JSON.parse(record.data) }), { headers });
      } else {
        return new Response(JSON.stringify({ success: true, data: null }), { headers });
      }
    }

    // --- POST: 保存今日卦象 ---
    if (request.method === 'POST') {
      const body = await request.json();
      const { date, result, guidance } = body;
      
      if (!date || !result) {
        return new Response(JSON.stringify({ success: false, message: "Invalid data" }), { status: 400, headers });
      }

      const fullDataStr = JSON.stringify({ date, result, guidance });
      const timestamp = Date.now();

      // 使用 INSERT OR REPLACE 确保每个用户每天只有一条记录
      const res = await env.DB.prepare(
        "INSERT OR REPLACE INTO user_daily_readings_v1 (username, date, data, created_at) VALUES (?, ?, ?, ?)"
      ).bind(username, date, fullDataStr, timestamp).run();

      if (res.success) {
        return new Response(JSON.stringify({ success: true }), { headers });
      } else {
        throw new Error("DB Insert failed");
      }
    }

    return new Response("Method not allowed", { status: 405, headers });

  } catch (e) {
    console.error("Daily Reading API Error:", e);
    return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500, headers });
  }
}
