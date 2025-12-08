
import { verifyJwt } from '../../lib/security';

export async function onRequest(context) {
  const { request, env } = context;

  // 1. 鉴权
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  const user = await verifyJwt(token, env.JWT_SECRET);
  if (!user) {
    return new Response(JSON.stringify({ success: false, message: "Invalid Token" }), { status: 401 });
  }

  // 2. 确保表存在
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS credit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        type TEXT NOT NULL, 
        amount INTEGER NOT NULL,
        description TEXT,
        timestamp INTEGER
      )
    `).run();
  } catch (e) {
    console.error("Create table error", e);
  }

  // 3. GET 请求：获取记录
  if (request.method === 'GET') {
      try {
          const logs = await env.DB.prepare(
              "SELECT * FROM credit_logs WHERE username = ? ORDER BY timestamp DESC LIMIT 50"
          ).bind(user.username).all();
          
          return new Response(JSON.stringify({ success: true, data: logs.results }), { 
              headers: { "Content-Type": "application/json" } 
          });
      } catch (e) {
          return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
      }
  }

  return new Response("Method not allowed", { status: 405 });
}
