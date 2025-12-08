
import { verifyJwt } from '../lib/security';

export async function onRequestGet(context) {
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

  // 通用响应头 (禁止缓存)
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
  };

  try {
    // 获取历史记录，按日期倒序，限制 30 条
    // 强制绑定 username
    const records = await env.DB.prepare(
      "SELECT data FROM user_daily_readings_v1 WHERE username = ? ORDER BY date DESC LIMIT 30"
    ).bind(username).all();

    const parsedData = records.results.map(r => JSON.parse(r.data));

    return new Response(JSON.stringify({ success: true, data: parsedData }), { headers });

  } catch (e) {
    console.error("Daily History API Error:", e);
    return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500, headers });
  }
}
