
import { verifyJwt } from '../lib/security';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // JWT 鉴权 helper
  async function getAuthUser() {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    return await verifyJwt(token, env.JWT_SECRET);
  }

  try {
    const userPayload = await getAuthUser();
    
    // GET: 获取历史
    if (request.method === 'GET') {
      // 必须登录
      if (!userPayload) {
          return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
      }

      // 强制查询 Token 中用户的记录，忽略 URL 中的 username 参数（防止越权）
      const results = await env.DB.prepare(
        "SELECT * FROM history WHERE username = ? ORDER BY timestamp DESC LIMIT 50"
      ).bind(userPayload.username).all();

      return new Response(JSON.stringify({ success: true, data: results.results }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // POST: 创建
    if (request.method === 'POST') {
      const { question, n1, n2, n3, timestamp } = await request.json();
      
      if (!userPayload) {
           return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
      }

      const res = await env.DB.prepare(
        "INSERT INTO history (username, question, n1, n2, n3, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(userPayload.username, question || "", n1, n2, n3, timestamp).run();

      if (res.success) {
        return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // PUT: 更新
    if (request.method === 'PUT') {
       const { id, ai_response } = await request.json();
       if (!userPayload) return new Response(JSON.stringify({ success: false }), { status: 401 });

       // 增加 AND username = ? 确保只能更新自己的记录
       const res = await env.DB.prepare(
           "UPDATE history SET ai_response = ? WHERE id = ? AND username = ?"
       ).bind(ai_response, id, userPayload.username).run();

       return new Response(JSON.stringify({ success: true }), {
         headers: { "Content-Type": "application/json" }
       });
    }

    // DELETE: 删除
    if (request.method === 'DELETE') {
        const { id } = await request.json();
        if (!userPayload) return new Response(JSON.stringify({ success: false }), { status: 401 });

        // 只能删除属于自己的记录
        const res = await env.DB.prepare(
            "DELETE FROM history WHERE id = ? AND username = ?"
        ).bind(id, userPayload.username).run();

        if (res.success) {
            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json" }
            });
        } else {
            return new Response(JSON.stringify({ success: false, message: "Delete failed" }), { status: 500 });
        }
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
  }
}
