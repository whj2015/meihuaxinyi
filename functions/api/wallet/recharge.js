
import { verifyJwt } from '../../lib/security';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  // 1. 鉴权
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({success:false, message: "Unauthorized"}), { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  const user = await verifyJwt(token, env.JWT_SECRET);
  if (!user) {
      return new Response(JSON.stringify({success:false, message: "Invalid Token"}), { status: 401 });
  }

  // 2. 确保日志表存在
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS credit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        type TEXT NOT NULL, 
        amount INTEGER NOT NULL,
        description TEXT,
        timestamp INTEGER
      )
    `).run();
  } catch (e) {
    console.error("Create table error", e);
  }

  const { amount } = await request.json(); 
  const addAmount = amount && amount > 0 ? amount : 10; // 默认充10

  try {
      // 3. 执行充值事务：更新余额 + 写入日志
      const timestamp = Date.now();
      const batch = [
          env.DB.prepare("UPDATE users SET credits = credits + ? WHERE username = ?").bind(addAmount, user.username),
          env.DB.prepare("INSERT INTO credit_logs (username, type, amount, description, timestamp) VALUES (?, 'recharge', ?, '充值点数 (模拟)', ?)").bind(user.username, addAmount, timestamp)
      ];
      await env.DB.batch(batch);

      // 4. 获取最新余额
      const updatedUser = await env.DB.prepare("SELECT credits FROM users WHERE username = ?").bind(user.username).first();

      return new Response(JSON.stringify({ success: true, credits: updatedUser.credits }), { 
          headers: { "Content-Type": "application/json" } 
      });
  } catch (e) {
      return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
  }
}
