
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { username, password } = await request.json();

    // 安全性验证：基本边界检查
    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: "请输入用户名和密码" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 防止超长Payload攻击数据库查询
    if (username.length > 50 || password.length > 100) {
       return new Response(JSON.stringify({ success: false, message: "输入格式错误" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 查询用户
    const stmt = env.DB.prepare("SELECT username, password, credits FROM users WHERE username = ?");
    const user = await stmt.bind(username).first();

    // 密码比对
    // 注意：生产环境应使用 bcrypt.compare，此处为简单实现
    if (!user || user.password !== password) {
      // 模糊错误提示，防止枚举用户名
      return new Response(JSON.stringify({ success: false, message: "用户名或密码错误" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 登录成功
    return new Response(JSON.stringify({
      success: true,
      username: user.username,
      credits: user.credits !== null ? user.credits : 0
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Login Error:", err);
    return new Response(JSON.stringify({ success: false, message: "服务器内部错误" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
