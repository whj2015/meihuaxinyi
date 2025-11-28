
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 从 Body 读取 (HTTPS 通道是安全的)
    const { username, password, gemini_key, deepseek_key } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: "未授权" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 验证密码
    const user = await env.DB.prepare("SELECT password FROM users WHERE username = ?").bind(username).first();
    if (!user || user.password !== password) {
      return new Response(JSON.stringify({ success: false, message: "密码错误" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 更新数据库 (存储原始 Key，或者你可以选择在后端进行加密存储，这里简化为直接存储以便 Proxy 读取)
    // 注意：如果需要极高安全性，可以使用 Cloudflare Secrets，但 D1 对于一般应用足够
    const result = await env.DB.prepare(
      "UPDATE users SET gemini_key = ?, deepseek_key = ? WHERE username = ?"
    ).bind(gemini_key, deepseek_key, username).run();

    if (result.success) {
      return new Response(JSON.stringify({ success: true, message: "Key 配置已更新" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      throw new Error("DB Update Failed");
    }

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
