
import { verifyPassword, signJwt } from '../lib/security';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: "请输入用户名和密码" }), { status: 400 });
    }

    // 查询用户 Hash 和 Salt
    const user = await env.DB.prepare("SELECT id, username, password_hash, salt, credits FROM users WHERE username = ?").bind(username).first();

    if (!user || !user.password_hash || !user.salt) {
      // 模糊错误，或者旧数据不兼容
      return new Response(JSON.stringify({ success: false, message: "用户名或密码错误" }), { status: 401 });
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return new Response(JSON.stringify({ success: false, message: "用户名或密码错误" }), { status: 401 });
    }

    // 签发 JWT
    if (!env.JWT_SECRET) {
      throw new Error("Server misconfiguration: JWT_SECRET missing");
    }
    const token = await signJwt({ sub: user.id, username: user.username }, env.JWT_SECRET);

    return new Response(JSON.stringify({
      success: true,
      username: user.username,
      token: token,
      credits: user.credits || 0
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Login Error:", err);
    return new Response(JSON.stringify({ success: false, message: "登录服务异常" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
