
import { hashPassword } from '../lib/security';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { username, password } = await request.json();

    // --- 安全性验证 ---
    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: "用户名和密码不能为空" }), { status: 400 });
    }
    if (username.length < 3 || username.length > 20) {
      return new Response(JSON.stringify({ success: false, message: "用户名长度需在 3 到 20 个字符之间" }), { status: 400 });
    }
    if (password.length < 6) {
      return new Response(JSON.stringify({ success: false, message: "密码至少 6 位" }), { status: 400 });
    }
    if (password.length > 100) {
       return new Response(JSON.stringify({ success: false, message: "密码过长" }), { status: 400 });
    }
    const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return new Response(JSON.stringify({ success: false, message: "用户名包含非法字符" }), { status: 400 });
    }

    // --- 业务逻辑 ---

    // 1. 检查用户名是否存在
    const existingUser = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
    if (existingUser) {
      return new Response(JSON.stringify({ success: false, message: "该用户名已被注册" }), { status: 409 });
    }

    // 2. 密码哈希 (PBKDF2)
    const { hash, salt } = await hashPassword(password);

    // 3. 插入用户 (credits 默认为 5)
    // 注意：假设表结构已更新：users (username, password_hash, salt, gemini_key, deepseek_key, credits)
    // 如果没有 salt 字段，可以将 salt 拼接在 hash 后面存储，或者要求用户更新表结构
    // 这里假设用户已执行：ALTER TABLE users ADD COLUMN password_hash TEXT; ALTER TABLE users ADD COLUMN salt TEXT;
    
    // 为了兼容性，如果用户没删 password 字段，我们暂时不管它，主要存 hash 和 salt
    // 实际生产应删除 password 字段
    const result = await env.DB.prepare(
      "INSERT INTO users (username, password_hash, salt, credits) VALUES (?, ?, ?, 5)"
    ).bind(username, hash, salt).run();

    if (result.success) {
      return new Response(JSON.stringify({ success: true, message: "注册成功" }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      throw new Error("数据库插入失败");
    }

  } catch (err) {
    console.error("Registration Error:", err);
    return new Response(JSON.stringify({ success: false, message: "注册服务异常: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
