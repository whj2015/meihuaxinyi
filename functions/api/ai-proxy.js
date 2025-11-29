
import { verifyJwt, decryptData } from '../lib/security';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { 
      // username, // 废弃：不再信任 Body 中的 username
      apiKey,         
      provider,       
      prompt,
      customConfig 
    } = await request.json();

    let finalApiKey = apiKey;
    let finalProvider = provider || 'deepseek';
    let deductCredits = false;
    let currentUser = null;

    // --- 1. 鉴权与身份识别 ---
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
       const token = authHeader.split(" ")[1];
       if (env.JWT_SECRET) {
           const payload = await verifyJwt(token, env.JWT_SECRET);
           if (payload) {
               // Token 有效，查询用户信息
               currentUser = await env.DB.prepare("SELECT username, gemini_key, deepseek_key, credits FROM users WHERE username = ?").bind(payload.username).first();
           }
       }
    }

    // --- 2. Key 策略与扣费判定 ---
    if (currentUser) {
        // 解密用户存储的 Key
        let userGeminiKey = null;
        let userDeepseekKey = null;
        
        if (env.DATA_SECRET) {
            userGeminiKey = await decryptData(currentUser.gemini_key, env.DATA_SECRET);
            userDeepseekKey = await decryptData(currentUser.deepseek_key, env.DATA_SECRET);
        } else {
            // 回退兼容（如果未开启加密）
            userGeminiKey = currentUser.gemini_key;
            userDeepseekKey = currentUser.deepseek_key;
        }

        // 优先使用用户的 Key
        if (finalProvider === 'gemini' && userGeminiKey) finalApiKey = userGeminiKey;
        else if (finalProvider === 'deepseek' && userDeepseekKey) finalApiKey = userDeepseekKey;

        // 如果用户没 Key，尝试使用系统免费额度
        if (!finalApiKey && finalProvider !== 'custom') {
            const credits = currentUser.credits || 0;
            if (credits > 0) {
                // 预扣费逻辑：原子化扣减，确保不超扣
                // D1 的 UPDATE ... RETURNING 不一定所有驱动都支持，这里使用更稳妥的 check-and-update
                // 但为了并发安全，最好是一条 SQL
                const deductRes = await env.DB.prepare("UPDATE users SET credits = credits - 1 WHERE username = ? AND credits > 0").bind(currentUser.username).run();
                
                if (deductRes.meta.changes > 0) {
                    // 扣费成功，获取管理员 Key
                    deductCredits = true; // 标记已扣费（用于日志，实际上已在 DB 扣除）
                    
                    const admin = await env.DB.prepare("SELECT gemini_key, deepseek_key FROM users WHERE id = 1").first();
                    // 这里假设管理员的 Key 也是加密存储的，需要解密
                    // 如果管理员是在旧版本创建的，可能是明文。尝试解密，失败则认为是明文。
                    let adminDsKey = admin?.deepseek_key;
                    let adminGemKey = admin?.gemini_key;
                    
                    if (env.DATA_SECRET) {
                        const d1 = await decryptData(adminDsKey, env.DATA_SECRET);
                        if (d1) adminDsKey = d1; 
                        const d2 = await decryptData(adminGemKey, env.DATA_SECRET);
                        if (d2) adminGemKey = d2;
                    }

                    if (finalProvider === 'deepseek' && adminDsKey) finalApiKey = adminDsKey;
                    else if (finalProvider === 'gemini' && adminGemKey) finalApiKey = adminGemKey;
                    else if (adminDsKey) { finalProvider = 'deepseek'; finalApiKey = adminDsKey; }
                    else if (adminGemKey) { finalProvider = 'gemini'; finalApiKey = adminGemKey; }
                } else {
                     return new Response(JSON.stringify({ error: "灵力点数不足" }), { status: 402 });
                }
            } else {
                return new Response(JSON.stringify({ error: "灵力点数不足" }), { status: 402 });
            }
        }
    }

    if (!finalApiKey && finalProvider !== 'custom') {
      // 如果已预扣费但没找到 Key (极罕见)，理应退款，但此处简化处理报错
      return new Response(JSON.stringify({ error: "未配置 API Key 且系统 Key 不可用" }), { status: 400 });
    }

    // --- 3. 发起请求 ---
    let apiUrl = "";
    let requestBody = {};
    let headers = { "Content-Type": "application/json" };

    if (finalProvider === 'deepseek') {
      apiUrl = "https://api.deepseek.com/chat/completions";
      headers["Authorization"] = `Bearer ${finalApiKey}`;
      requestBody = {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是一位精通周易和梅花易数的国学大师。" },
          { role: "user", content: prompt }
        ],
        stream: true,
        temperature: 1.3
      };
    } else if (finalProvider === 'gemini') {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${finalApiKey}`;
      requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { thinkingConfig: { thinkingBudget: 0 } }
      };
    } else if (finalProvider === 'custom') {
      apiUrl = customConfig.baseUrl;
      if (!apiUrl.endsWith('/chat/completions')) {
         if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
         if (!apiUrl.includes('chat/completions')) apiUrl += '/chat/completions';
      }
      headers["Authorization"] = `Bearer ${customConfig.apiKey}`;
      requestBody = {
        model: customConfig.modelName || "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "你是一位精通周易和梅花易数的国学大师。" },
          { role: "user", content: prompt }
        ],
        stream: true
      };
    }

    const upstreamResponse = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    if (!upstreamResponse.ok) {
        const errText = await upstreamResponse.text();
        return new Response(JSON.stringify({ error: `AI 服务错误: ${upstreamResponse.status}`, details: errText }), { status: upstreamResponse.status });
    }

    // 透传流
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": upstreamResponse.headers.get("Content-Type") || "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Proxy Error: " + err.message }), { status: 500 });
  }
}
