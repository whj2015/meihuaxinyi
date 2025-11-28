
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { 
      username,       // 已登录用户传用户名
      apiKey,         // 访客传临时 Key (在 Body 中，HTTPS 安全)
      provider,       // 'gemini' | 'deepseek' | 'custom'
      prompt,
      customConfig 
    } = await request.json();

    let finalApiKey = apiKey;
    let apiUrl = "";
    let requestBody = {};
    let headers = {
      "Content-Type": "application/json"
    };

    // 1. 如果有用户名，从数据库获取 Key (覆盖传入的 apiKey)
    if (username) {
      const user = await env.DB.prepare("SELECT gemini_key, deepseek_key FROM users WHERE username = ?").bind(username).first();
      if (user) {
        if (provider === 'gemini') finalApiKey = user.gemini_key;
        else if (provider === 'deepseek') finalApiKey = user.deepseek_key;
      }
    }

    if (!finalApiKey && provider !== 'custom') {
      return new Response(JSON.stringify({ error: "未配置 API Key" }), { status: 400 });
    }

    // 2. 构建上游请求
    if (provider === 'gemini') {
      // Gemini REST API (Stream)
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${finalApiKey}`;
      requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            thinkingConfig: { thinkingBudget: 0 } // Flash model requires 0 or specific budget
        }
      };
    } else if (provider === 'deepseek') {
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
    } else if (provider === 'custom') {
      apiUrl = customConfig.baseUrl;
      if (!apiUrl.endsWith('/chat/completions')) {
         // Simple normalization
         if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
         if (!apiUrl.includes('chat/completions')) apiUrl += '/chat/completions';
      }
      headers["Authorization"] = `Bearer ${customConfig.apiKey}`; // User provided in body
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

    // 4. 直接透传流式响应 (Streaming Proxy)
    // 这样前端就能收到 SSE流 或 Gemini 的 JSON 流
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
