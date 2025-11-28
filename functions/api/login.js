
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: "请输入用户名和密码" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 查询 usage_count
    const stmt = env.DB.prepare("SELECT username, password, usage_count FROM users WHERE username = ?");
    const user = await stmt.bind(username).first();

    if (!user || user.password !== password) {
      return new Response(JSON.stringify({ success: false, message: "用户名或密码错误" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 登录成功，返回用户名和已使用次数
    return new Response(JSON.stringify({
      success: true,
      username: user.username,
      usageCount: user.usage_count || 0
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "服务器内部错误" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
