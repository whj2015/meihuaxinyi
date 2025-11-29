
import { verifyJwt, encryptData } from '../lib/security';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 1. JWT 鉴权
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

    // 2. 获取 Headers 中的 Key (前端已 Base64 编码，防止 Body 泄露)
    const geminiHeader = request.headers.get("x-gemini-token");
    const deepseekHeader = request.headers.get("x-deepseek-token");

    const decodeKey = (encodedStr) => {
      if (!encodedStr) return null;
      try { return decodeURIComponent(atob(encodedStr)); } catch (e) { return null; }
    };

    const newGeminiKey = decodeKey(geminiHeader);
    const newDeepseekKey = decodeKey(deepseekHeader);

    // 3. 获取旧的加密数据
    const currentUser = await env.DB.prepare("SELECT gemini_key, deepseek_key FROM users WHERE username = ?").bind(username).first();
    if (!currentUser) return new Response(JSON.stringify({ success: false, message: "用户不存在" }), { status: 404 });

    // 4. 服务端加密存储 (如果用户传了新 Key)
    // 如果用户传了新 Key，加密后存入；如果没传，保持原样
    // 注意：encryptData 返回 JSON 字符串 { iv, data }
    
    let finalGeminiEncrypted = currentUser.gemini_key;
    let finalDeepseekEncrypted = currentUser.deepseek_key;

    if (env.DATA_SECRET) {
        if (newGeminiKey && newGeminiKey.trim() !== "") {
            finalGeminiEncrypted = await encryptData(newGeminiKey, env.DATA_SECRET);
        }
        if (newDeepseekKey && newDeepseekKey.trim() !== "") {
            finalDeepseekEncrypted = await encryptData(newDeepseekKey, env.DATA_SECRET);
        }
    } else {
        // 如果没有配置 DATA_SECRET，则不安全地存储（降级处理，不推荐）
        // 建议必须配置 DATA_SECRET
        console.warn("DATA_SECRET missing, storing plaintext (unsafe)");
        if (newGeminiKey) finalGeminiEncrypted = newGeminiKey;
        if (newDeepseekKey) finalDeepseekEncrypted = newDeepseekKey;
    }

    // 5. 更新数据库
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
