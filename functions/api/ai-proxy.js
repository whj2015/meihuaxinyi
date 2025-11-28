
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

    let useFreeTier = false;

    // 1. 如果有用户名，尝试获取 Key
    if (username) {
      const user = await env.DB.prepare("SELECT gemini_key, deepseek_key, usage_count FROM users WHERE username = ?").bind(username).first();
      
      if (user) {
        if (finalProvider === 'gemini' && user.gemini_key) finalApiKey = user.gemini_key;
        else if (finalProvider === 'deepseek' && user.deepseek_key) finalApiKey = user.deepseek_key;

        // 【核心逻辑】免费额度判断
        // 如果用户没有配置 Key，且使用次数小于 5 次
        if (!finalApiKey && finalProvider !== 'custom') {
           if ((user.usage_count || 0) < 5) {
               // 从数据库获取管理员 (ID=1) 的 Key
               const admin = await env.DB.prepare("SELECT gemini_key, deepseek_key FROM users WHERE id = 1").first();
               
               if (admin) {
                   // 1. 尝试匹配当前请求的 Provider
                   if (finalProvider === 'deepseek' && admin.deepseek_key) {
                       finalApiKey = admin.deepseek_key;
                       useFreeTier = true;
                   } else if (finalProvider === 'gemini' && admin.gemini_key) {
                       finalApiKey = admin.gemini_key;
                       useFreeTier = true;
                   } 
                   // 2. 如果对应 Provider 的 Key 没有，尝试回退到另一个可用的 Key
                   else if (admin.deepseek_key) {
                       finalProvider = 'deepseek';
                       finalApiKey = admin.deepseek_key;
                       useFreeTier = true;
                   } else if (admin.gemini_key) {
                       finalProvider = 'gemini';
                       finalApiKey = admin.gemini_key;
                       useFreeTier = true;
                   }
               }
               
               if (!finalApiKey) {
                   return new Response(JSON.stringify({ error: "系统免费额度暂时不可用，请联系管理员或自行配置 Key" }), { status: 400 });
               }
           } else {
               return new Response(JSON.stringify({ error: "免费试用次数已用完，请在设置中配置您的 API Key" }), { status: 402 }); // Payment Required
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

    // 4. 如果使用了免费额度，请求成功后扣除次数
    // 乐观扣除
    if (useFreeTier && username) {
        await env.DB.prepare("UPDATE users SET usage_count = usage_count + 1 WHERE username = ?").bind(username).run();
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
