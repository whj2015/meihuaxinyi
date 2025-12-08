
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

  // 2. 确保表存在 (Lazy Initialization)
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS daily_readings (
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

  try {
    const url = new URL(request.url);
    
    // --- GET: 获取今日卦象 ---
    if (request.method === 'GET') {
      const dateParam = url.searchParams.get('date');
      const targetDate = dateParam || new Date().toISOString().split('T')[0];

      const record = await env.DB.prepare(
        "SELECT data FROM daily_readings WHERE username = ? AND date = ?"
      ).bind(username, targetDate).first();

      if (record) {
        return new Response(JSON.stringify({ success: true, data: JSON.parse(record.data) }), {
          headers: { "Content-Type": "application/json" }
        });
      } else {
        return new Response(JSON.stringify({ success: true, data: null }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // --- POST: 保存今日卦象 ---
    if (request.method === 'POST') {
      const body = await request.json();
      const { date, result, guidance } = body;
      
      if (!date || !result) {
        return new Response(JSON.stringify({ success: false, message: "Invalid data" }), { status: 400 });
      }

      const fullDataStr = JSON.stringify({ date, result, guidance });
      const timestamp = Date.now();

      // 使用 INSERT OR IGNORE 避免重复提交报错，或者用 ON CONFLICT DO NOTHING
      const res = await env.DB.prepare(
        "INSERT OR REPLACE INTO daily_readings (username, date, data, created_at) VALUES (?, ?, ?, ?)"
      ).bind(username, date, fullDataStr, timestamp).run();

      if (res.success) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
        });
      } else {
        throw new Error("DB Insert failed");
      }
    }

    return new Response("Method not allowed", { status: 405 });

  } catch (e) {
    console.error("Daily Reading API Error:", e);
    return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
  }
}
