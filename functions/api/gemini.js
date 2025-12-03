export async function onRequestPost(context) {
  try {
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server Configuration Error: Missing GEMINI_API_KEY" }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
      });
    }

    const { contents, systemInstruction, model, stream, responseSchema } = await context.request.json();
    
    // Construct URL for Gemini API (REST)
    // Default to gemini-2.5-flash if not specified
    const targetModel = model || 'gemini-2.5-flash';
    const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
    const action = stream ? "streamGenerateContent" : "generateContent";
    const url = `${baseUrl}/${targetModel}:${action}?key=${apiKey}`;

    const bodyPayload = {
        contents: contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: responseSchema ? { responseMimeType: "application/json", responseSchema: responseSchema } : undefined
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ error: `Gemini API Error: ${response.status}`, details: errorText }), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (stream) {
        // Proxy stream
        return new Response(response.body, {
            headers: { 
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}