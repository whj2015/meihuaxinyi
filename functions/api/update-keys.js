
import { verifyJwt, encryptData } from '../lib/security';

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. 强制安全检查：必须配置 DATA_SECRET
  if (!env.DATA_SECRET) {
      return new Response(JSON.stringify({ success: false, message: "Server Error: DATA_SECRET environment variable is missing. Security enforcement." }), { status: 500 });
  }

  try {
    // 2. JWT 鉴权
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, message: "未授权" }), { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const payload = await verifyJwt(token, env.JWT_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ success: false, message: "Token 无效或过期" }), { status: 401 });
    }
    const username = payload.username;

    // 3. 获取 Headers 中的 Key (前端已 Base64 编码)
    const geminiHeader = request.headers.get("x-gemini-token");
    const deepseekHeader = request.headers.get("x-deepseek-token");

    const decodeKey = (encodedStr) => {
      if (!encodedStr) return null;
      try { return decodeURIComponent(atob(encodedStr)); } catch (e) { return null; }
    };

    const newGeminiKey = decodeKey(geminiHeader);
    const newDeepseekKey = decodeKey(deepseekHeader);

    // 4. 获取旧的加密数据
    const currentUser = await env.DB.prepare("SELECT gemini_key, deepseek_key FROM users WHERE username = ?").bind(username).first();
    if (!currentUser) return new Response(JSON.stringify({ success: false, message: "用户不存在" }), { status: 404 });

    // 5. 服务端加密存储
    let finalGeminiEncrypted = currentUser.gemini_key;
    let finalDeepseekEncrypted = currentUser.deepseek_key;

    if (newGeminiKey && newGeminiKey.trim() !== "") {
        finalGeminiEncrypted = await encryptData(newGeminiKey, env.DATA_SECRET);
    }
    if (newDeepseekKey && newDeepseekKey.trim() !== "") {
        finalDeepseekEncrypted = await encryptData(newDeepseekKey, env.DATA_SECRET);
    }

    // 6. 更新数据库
    const result = await env.DB.prepare(
      "UPDATE users SET gemini_key = ?, deepseek_key = ? WHERE username = ?"
    ).bind(finalGeminiEncrypted, finalDeepseekEncrypted, username).run();

    if (result.success) {
      return new Response(JSON.stringify({ success: true, message: "配置已同步 (服务端加密存储)" }), { status: 200 });
    } else {
      throw new Error("DB Update failed");
    }

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, message: "更新失败" }), { status: 500 });
  }
}
