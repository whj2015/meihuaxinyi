
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { 
      username,       // 已登录用户传用户名
      apiKey,         // 访客传临时 Key (Body)
      provider,       // 'gemini' | 'deepseek' | 'custom'
      prompt,
      customConfig 
    } = await request.json();

    let finalApiKey = apiKey;
    let finalProvider = provider || 'deepseek'; // 默认使用 DeepSeek
    let apiUrl = "";
    let requestBody = {};
    let headers = {
      "Content-Type": "application/json"
    };

    let deductCredits = false;

    // 1. 如果有用户名，进行鉴权和点数检查
    if (username) {
      const user = await env.DB.prepare("SELECT gemini_key, deepseek_key, credits FROM users WHERE username = ?").bind(username).first();
      
      if (user) {
        // 优先使用用户配置的 Key
        if (finalProvider === 'gemini' && user.gemini_key) finalApiKey = user.gemini_key;
        else if (finalProvider === 'deepseek' && user.deepseek_key) finalApiKey = user.deepseek_key;

        // 如果用户没有配置 Key，检查是否有点数(credits)可以使用系统 Key
        if (!finalApiKey && finalProvider !== 'custom') {
           const credits = user.credits !== null ? user.credits : 0;
           
           if (credits > 0) {
               // 尝试获取管理员 (ID=1) 的 Key
               const admin = await env.DB.prepare("SELECT gemini_key, deepseek_key FROM users WHERE id = 1").first();
               
               if (admin) {
                   // 智能匹配 Key
                   if (finalProvider === 'deepseek' && admin.deepseek_key) {
                       finalApiKey = admin.deepseek_key;
                       deductCredits = true;
                   } else if (finalProvider === 'gemini' && admin.gemini_key) {
                       finalApiKey = admin.gemini_key;
                       deductCredits = true;
                   } 
                   // 回退策略
                   else if (admin.deepseek_key) {
                       finalProvider = 'deepseek';
                       finalApiKey = admin.deepseek_key;
                       deductCredits = true;
                   } else if (admin.gemini_key) {
                       finalProvider = 'gemini';
                       finalApiKey = admin.gemini_key;
                       deductCredits = true;
                   }
               }
               
               if (!finalApiKey) {
                   return new Response(JSON.stringify({ error: "系统服务暂时繁忙，请稍后再试或配置自有Key" }), { status: 503 });
               }
           } else {
               return new Response(JSON.stringify({ error: "您的灵力点数不足，请充值或配置 API Key" }), { status: 402 }); 
           }
        }
      }
    }

    if (!finalApiKey && finalProvider !== 'custom') {
      return new Response(JSON.stringify({ error: "未配置 API Key" }), { status: 400 });
    }

    // 2. 构建上游请求
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
        generationConfig: {
            thinkingConfig: { thinkingBudget: 0 }
        }
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

    // 3. 发起上游请求
    const upstreamResponse = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    if (!upstreamResponse.ok) {
        const errText = await upstreamResponse.text();
        return new Response(JSON.stringify({ error: `AI 服务错误: ${upstreamResponse.status}`, details: errText }), { status: upstreamResponse.status });
    }

    // 4. 扣费逻辑：只有在使用系统Key成功请求后才扣除点数
    if (deductCredits && username) {
        await env.DB.prepare("UPDATE users SET credits = credits - 1 WHERE username = ?").bind(username).run();
    }

    // 5. 直接透传流式响应
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": upstreamResponse.headers.get("Content-Type") || "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "代理服务内部错误: " + err.message }), { status: 500 });
  }
}
