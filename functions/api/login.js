
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 1. 解析请求体
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: "请输入用户名和密码" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. 查询 D1 数据库
    // 注意：env.DB 必须在 Cloudflare 后台或 wrangler.toml 中绑定，绑定名称为 "DB"
    const stmt = env.DB.prepare("SELECT username, password, gemini_key, deepseek_key FROM users WHERE username = ?");
    const user = await stmt.bind(username).first();

    // 3. 验证逻辑
    // 警告：生产环境请务必存储 bcrypt 哈希后的密码，此处仅为演示明文对比
    if (!user || user.password !== password) {
      return new Response(JSON.stringify({ success: false, message: "用户名或密码错误" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. 登录成功，返回 Keys
    return new Response(JSON.stringify({
      success: true,
      username: user.username,
      keys: {
        gemini: user.gemini_key || "",
        deepseek: user.deepseek_key || ""
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "服务器内部错误: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
