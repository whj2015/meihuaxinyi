
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

  try {
    // 获取历史记录，按日期倒序，限制 30 条
    const records = await env.DB.prepare(
      "SELECT data FROM daily_readings WHERE username = ? ORDER BY date DESC LIMIT 30"
    ).bind(username).all();

    const parsedData = records.results.map(r => JSON.parse(r.data));

    return new Response(JSON.stringify({ success: true, data: parsedData }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    console.error("Daily History API Error:", e);
    return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
  }
}
