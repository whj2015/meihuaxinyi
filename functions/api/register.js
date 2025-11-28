
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: "用户名和密码不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 1. 检查用户名是否已存在
    const existingUser = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
    if (existingUser) {
      return new Response(JSON.stringify({ success: false, message: "该用户名已被注册" }), {
        status: 409, // Conflict
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. 插入新用户 (生产环境请务必对密码进行 Hash 处理)
    const result = await env.DB.prepare(
      "INSERT INTO users (username, password, gemini_key, deepseek_key) VALUES (?, ?, ?, ?)"
    ).bind(username, password, "", "").run();

    if (result.success) {
      return new Response(JSON.stringify({ success: true, message: "注册成功" }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      throw new Error("数据库插入失败");
    }

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "注册失败: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
