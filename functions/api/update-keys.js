
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 这里为了演示简单，再次传递用户名密码进行验证
    // 生产环境应使用 JWT 或 Session Token 验证身份
    const { username, password, gemini_key, deepseek_key } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: "未授权的操作" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 1. 验证用户
    const user = await env.DB.prepare("SELECT password FROM users WHERE username = ?").bind(username).first();
    
    if (!user || user.password !== password) {
      return new Response(JSON.stringify({ success: false, message: "身份验证失败" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. 更新 Keys
    const result = await env.DB.prepare(
      "UPDATE users SET gemini_key = ?, deepseek_key = ? WHERE username = ?"
    ).bind(gemini_key, deepseek_key, username).run();

    if (result.success) {
      return new Response(JSON.stringify({ success: true, message: "云端 Key 更新成功" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      throw new Error("数据库更新失败");
    }

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "更新失败: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
