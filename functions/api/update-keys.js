
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 1. 从 Body 读取认证信息
    const { username, password } = await request.json();

    // 2. 从 Headers 读取加密的 Key (Base64编码)
    // 前端使用 btoa(encodeURIComponent(key)) 编码
    const geminiHeader = request.headers.get("x-gemini-token");
    const deepseekHeader = request.headers.get("x-deepseek-token");

    // 解码辅助函数
    const decodeKey = (encodedStr) => {
      if (!encodedStr) return null;
      try {
        return decodeURIComponent(atob(encodedStr));
      } catch (e) {
        return null;
      }
    };

    const newGeminiKey = decodeKey(geminiHeader);
    const newDeepseekKey = decodeKey(deepseekHeader);

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: "请输入您的API KEY后保存，未输入只能免费解卦5次。" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. 验证密码并获取当前 Key
    const currentUser = await env.DB.prepare("SELECT password, gemini_key, deepseek_key FROM users WHERE username = ?").bind(username).first();
    
    if (!currentUser || currentUser.password !== password) {
      return new Response(JSON.stringify({ success: false, message: "密码错误" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. 智能合并：只有当前端提供了非空的新 Key 时才更新，否则保留旧值
    // 这样用户在前端留空点击保存时，不会意外清除云端的 Key
    const finalGeminiKey = (newGeminiKey && newGeminiKey.trim() !== "") ? newGeminiKey : currentUser.gemini_key;
    const finalDeepseekKey = (newDeepseekKey && newDeepseekKey.trim() !== "") ? newDeepseekKey : currentUser.deepseek_key;

    // 5. 更新数据库
    const result = await env.DB.prepare(
      "UPDATE users SET gemini_key = ?, deepseek_key = ? WHERE username = ?"
    ).bind(finalGeminiKey, finalDeepseekKey, username).run();

    if (result.success) {
      return new Response(JSON.stringify({ success: true, message: "配置已同步" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      throw new Error("数据库更新失败");
    }

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message || "服务器内部错误" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}