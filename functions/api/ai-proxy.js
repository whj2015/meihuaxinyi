
import { verifyJwt, decryptData } from '../lib/security';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { 
      // apiKey, // REMOVED: Guest Key no longer in body
      provider,       
      prompt,
      customConfig 
    } = await request.json();

    let finalProvider = provider || 'deepseek';
    let currentUser = null;
    let finalApiKey = null;

    // --- 1. 获取 Headers 中的访客 Key ---
    const geminiHeader = request.headers.get("x-gemini-token");
    const deepseekHeader = request.headers.get("x-deepseek-token");

    const decodeKey = (encodedStr) => {
        if (!encodedStr) return null;
        try { return decodeURIComponent(atob(encodedStr)); } catch (e) { return null; }
    };

    if (finalProvider === 'gemini') finalApiKey = decodeKey(geminiHeader);
    if (finalProvider === 'deepseek') finalApiKey = decodeKey(deepseekHeader);

    // --- 2. 鉴权与身份识别 (User Token) ---
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

    // --- 3. Key 策略与扣费判定 ---
    let creditsDeducted = false;

    if (currentUser) {
        // 如果 Header 没传 Key，尝试用数据库存的 Key
        if (!finalApiKey) {
            let userGeminiKey = null;
            let userDeepseekKey = null;
            
            if (env.DATA_SECRET) {
                userGeminiKey = await decryptData(currentUser.gemini_key, env.DATA_SECRET);
                userDeepseekKey = await decryptData(currentUser.deepseek_key, env.DATA_SECRET);
            } else {
                // 回退兼容
                userGeminiKey = currentUser.gemini_key;
                userDeepseekKey = currentUser.deepseek_key;
            }

            if (finalProvider === 'gemini' && userGeminiKey) finalApiKey = userGeminiKey;
            else if (finalProvider === 'deepseek' && userDeepseekKey) finalApiKey = userDeepseekKey;
        }

        // 如果还是没 Key，尝试扣费使用系统 Key
        if (!finalApiKey && finalProvider !== 'custom') {
            const credits = currentUser.credits || 0;
            if (credits > 0) {
                // 预扣费
                const deductRes = await env.DB.prepare("UPDATE users SET credits = credits - 1 WHERE username = ? AND credits > 0").bind(currentUser.username).run();
                
                if (deductRes.meta.changes > 0) {
                    creditsDeducted = true; // 标记已扣费
                    
                    const sysDeepseek = env.DEFAULT_DEEPSEEK_KEY;
                    const sysGemini = env.DEFAULT_GEMINI_KEY;

                    if (finalProvider === 'deepseek' && sysDeepseek) {
                        finalApiKey = sysDeepseek;
                    } else if (finalProvider === 'gemini' && sysGemini) {
                        finalApiKey = sysGemini;
                    } else if (sysDeepseek) {
                        finalProvider = 'deepseek';
                        finalApiKey = sysDeepseek;
                    } else if (sysGemini) {
                        finalProvider = 'gemini';
                        finalApiKey = sysGemini;
                    }
                } else {
                     return new Response(JSON.stringify({ error: "灵力点数不足" }), { status: 402 });
                }
            } else {
                return new Response(JSON.stringify({ error: "灵力点数不足" }), { status: 402 });
            }
        }
    }

    if (!finalApiKey && finalProvider !== 'custom') {
      // 如果已扣费但没找到Key，退款
      if (creditsDeducted) {
          await env.DB.prepare("UPDATE users SET credits = credits + 1 WHERE username = ?").bind(currentUser.username).run();
      }
      return new Response(JSON.stringify({ error: "未配置 API Key 且系统默认服务暂不可用" }), { status: 400 });
    }

    // --- 4. 发起请求 ---
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
        // 请求失败，执行退款
        if (creditsDeducted) {
            await env.DB.prepare("UPDATE users SET credits = credits + 1 WHERE username = ?").bind(currentUser.username).run();
        }
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
    // 捕获异常，尝试退款（如果是扣费用户）
    // 注意：如果是流式传输中断，可能无法在此处捕获
    return new Response(JSON.stringify({ error: "Proxy Error: " + err.message }), { status: 500 });
  }
}
