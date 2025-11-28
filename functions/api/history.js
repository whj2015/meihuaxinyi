
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    // GET: 获取历史记录列表
    if (request.method === 'GET') {
      const username = url.searchParams.get('username');
      if (!username) {
        return new Response(JSON.stringify({ success: false, message: "Missing username" }), { status: 400 });
      }

      const results = await env.DB.prepare(
        "SELECT * FROM history WHERE username = ? ORDER BY timestamp DESC LIMIT 50"
      ).bind(username).all();

      return new Response(JSON.stringify({ success: true, data: results.results }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // POST: 创建新记录
    if (request.method === 'POST') {
      const { username, question, n1, n2, n3, timestamp } = await request.json();

      const res = await env.DB.prepare(
        "INSERT INTO history (username, question, n1, n2, n3, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(username, question || "", n1, n2, n3, timestamp).run();

      if (res.success) {
        return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), {
          headers: { "Content-Type": "application/json" }
        });
      } else {
         throw new Error("Failed to insert history");
      }
    }

    // PUT: 更新 AI 解读
    if (request.method === 'PUT') {
       const { id, ai_response } = await request.json();
       
       const res = await env.DB.prepare(
           "UPDATE history SET ai_response = ? WHERE id = ?"
       ).bind(ai_response, id).run();

       return new Response(JSON.stringify({ success: true }), {
         headers: { "Content-Type": "application/json" }
       });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
    });
  }
}
