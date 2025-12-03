export async function onRequestPost(context) {
  try {
    // Prioritize DeepSeek_key as requested, fallback to DEEPSEEK_API_KEY
    const apiKey = context.env.DeepSeek_key || context.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server Configuration Error: Missing DeepSeek_key" }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
      });
    }

    const { messages, model, stream, response_format } = await context.request.json();

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages,
        stream: stream || false,
        response_format: response_format
      })
    });

    // If streaming, just pipe the response body
    if (stream) {
        return new Response(response.body, {
            headers: { 
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });
    }

    // Otherwise return JSON
    const data = await response.json();
    return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}