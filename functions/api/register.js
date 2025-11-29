
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { username, password } = await request.json();

    // --- 安全性验证 ---

    // 1. 基础非空检查
    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: "用户名和密码不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. 长度与格式检查
    // 用户名：3-20位
    if (username.length < 3 || username.length > 20) {
      return new Response(JSON.stringify({ success: false, message: "用户名长度需在 3 到 20 个字符之间" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 密码：至少6位，限制最大长度防止DoS
    if (password.length < 6) {
      return new Response(JSON.stringify({ success: false, message: "密码过于简单，请至少设置 6 位" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (password.length > 100) {
      return new Response(JSON.stringify({ success: false, message: "密码长度过长" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 用户名字符检查 (允许中文、字母、数字、下划线)
    // 避免特殊字符导致潜在的渲染问题或SQL注入边缘情况
    const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return new Response(JSON.stringify({ success: false, message: "用户名包含非法字符，仅限中文、字母、数字和下划线" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // --- 业务逻辑 ---

    // 3. 检查用户名是否已存在
    const existingUser = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
    if (existingUser) {
      return new Response(JSON.stringify({ success: false, message: "该用户名已被注册" }), {
        status: 409, // Conflict
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. 插入新用户 (初始化 credits 为 5)
    const result = await env.DB.prepare(
      "INSERT INTO users (username, password, gemini_key, deepseek_key, credits) VALUES (?, ?, ?, ?, 5)"
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
    // 避免将详细的数据库错误暴露给前端
    console.error("Registration Error:", err);
    return new Response(JSON.stringify({ success: false, message: "注册服务暂时不可用，请稍后再试" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
