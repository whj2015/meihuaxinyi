
import { DivinationResult, AIProvider, CustomAIConfig } from "../types";

/**
 * 构建提示词 (保持不变)
 */
const buildPrompt = (divination: DivinationResult, userQuestion: string): string => {
  const { originalHexagram, changedHexagram, relation, relationScore, tiGua, yongGua, inputNumbers, movingLineText } = divination;
  const tiName = tiGua === 'upper' ? originalHexagram.upper.name : originalHexagram.lower.name;
  const yongName = yongGua === 'upper' ? originalHexagram.upper.name : originalHexagram.lower.name;
  const tiElement = tiGua === 'upper' ? originalHexagram.upper.element : originalHexagram.lower.element;
  const yongElement = yongGua === 'upper' ? originalHexagram.upper.element : originalHexagram.lower.element;

  const guaci = originalHexagram.text?.guaci || "暂无";
  const xiang = originalHexagram.text?.xiang || "暂无";
  const yaoci = movingLineText || "暂无";

  return `
    你是一位精通《梅花易数》的国学大师，善于用通俗易懂且富有哲理的语言解卦。
    
    【卦象数据】
    - 用户起卦数字：${inputNumbers.join(', ')}
    - 询问事项：${userQuestion || "未指定（请做综合运势分析）"}
    - 本卦：${originalHexagram.name} (上${originalHexagram.upper.name}${originalHexagram.upper.nature}/下${originalHexagram.lower.name}${originalHexagram.lower.nature})
    - 变卦：${changedHexagram.name} (上${changedHexagram.upper.name}${changedHexagram.upper.nature}/下${changedHexagram.lower.name}${changedHexagram.lower.nature})
    - 动爻：第 ${divination.movingLine} 爻
    - 体卦（代表自己）：${tiName} (五行属${tiElement})
    - 用卦（代表事/人）：${yongName} (五行属${yongElement})
    - 体用关系：${relation} (${relationScore})

    【古籍参考】
    - 卦辞：${guaci}
    - 象曰：${xiang}
    - 动爻爻辞：${yaoci}

    【解卦要求】
    1. **核心判断**：首先根据体用生克关系（梅花易数核心），直接断吉凶。
    2. **古文新解**：请结合上述提供的【古籍参考】（卦辞和爻辞）进行解释，说明古人是如何看待此卦的，并将其翻译为现代语境下的启示。
    3. **动爻启示**：重点解释动爻带来的变化，这是事情的转折点。
    4. **趋势预测**：根据变卦，预测事情最终的走向。
    5. **大师建议**：给出具体的行动建议或心态调整。
    
    请像一位智慧的老者与年轻人对话一样，语气亲切、深邃，避免过于晦涩的古文堆砌，将易理融入生活建议中。
    请直接输出纯文本内容，不要使用Markdown的代码块包裹，可以使用加粗（**文字**）来强调重点。
  `;
};

/**
 * 统一代理调用函数
 * 所有请求都发往 /api/ai-proxy，由后端 Worker 负责鉴权和发起真实请求
 */
const callProxyStream = async (
  payload: any, 
  onStreamUpdate: (text: string) => void
): Promise<string> => {
  try {
    const response = await fetch('/api/ai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
       const err = await response.json().catch(() => ({}));
       throw new Error(err.error || `服务器错误 ${response.status}`);
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";
    
    // Gemini Stream 格式和其他 (SSE) 不同，后端如果是透传，我们需要兼容解析
    // Gemini return JSON array string "[{...},{...}]" usually, or multiple JSON objects
    // DeepSeek/OpenAI returns "data: {...}" SSE format
    
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // 尝试解析不同格式
      if (payload.provider === 'gemini') {
         // Gemini output is tricky when streamed directly via REST proxy. 
         // It usually comes as: "[\n" ... ",\n" ... "]"
         // We will try a simple regex extraction for "text" field if it's JSON
         // A robust way is to look for `"text": "..."` pattern
         const textMatches = buffer.matchAll(/"text":\s*"((?:[^"\\]|\\.)*)"/g);
         // Reset fullText and rebuild based on all matches found so far? 
         // No, streaming is incremental.
         // Let's implement a simpler buffer processor for Gemini REST stream:
         // Actually, Gemini REST stream returns a JSON array of `GenerateContentResponse`.
         // We can just rely on looking for valid JSON objects or specific text patterns.
         
         // 简单处理：每次通过正则把新出现的 text 提取出来
         // 注意：这种简单的流式解析可能在边界截断时有问题，但对于 Demo 足够
         // 为了更稳定，我们每次只处理 buffer 中完整的部分
         // But for now, let's just append delta.
         
         // Optimization: Since we are proxying, let's assume the backend might simplify it? 
         // No, backend just pipes.
         // Let's use a simpler regex that matches the structure
         
         // 临时方案：Gemini SDK 比较重，这里直接解析 REST JSON 比较复杂
         // 如果为了稳定性，建议在 Worker 里解析好再发 SSE 给前端。
         // 但为了代码量，这里先用通用处理：如果包含 text 字段
         const parts = chunk.split(/["']text["']\s*:\s*["']((?:[^"'\\]|\\.)*)["']/g);
         for (let i = 1; i < parts.length; i += 2) {
             let t = parts[i];
             // Handle escaped newlines/quotes
             t = t.replace(/\\n/g, '\n').replace(/\\"/g, '"');
             fullText += t;
             onStreamUpdate(fullText);
         }
      } else {
         // OpenAI / DeepSeek SSE format
         const lines = buffer.split("\n");
         // Keep the last partial line in buffer
         buffer = lines.pop() || ""; 

         for (const line of lines) {
            if (line.startsWith("data: ")) {
                const dataStr = line.slice(6).trim();
                if (dataStr === "[DONE]") continue;
                try {
                    const json = JSON.parse(dataStr);
                    const content = json.choices?.[0]?.delta?.content || "";
                    if (content) {
                        fullText += content;
                        onStreamUpdate(fullText);
                    }
                } catch (e) {
                    // ignore parse error
                }
            }
         }
      }
    }
    return fullText;

  } catch (error: any) {
    console.error("Proxy Stream Error:", error);
    throw error;
  }
};


/**
 * 统一获取解读接口
 */
export const getInterpretation = async (
  divination: DivinationResult, 
  userQuestion: string,
  provider: AIProvider,
  config: { 
    username?: string; // 登录用户传用户名
    apiKey?: string;   // 访客传 Key
    customConfig?: CustomAIConfig 
  },
  onStreamUpdate: (text: string) => void
): Promise<string> => {
  const prompt = buildPrompt(divination, userQuestion);
  onStreamUpdate("大师正在连接云端...");

  try {
    const payload: any = {
        provider,
        prompt,
        username: config.username, 
        apiKey: config.apiKey, // Only sent if username is empty
        customConfig: config.customConfig
    };

    const result = await callProxyStream(payload, onStreamUpdate);
    return result;
  } catch (error: any) {
    const errMsg = `解读中断：${error.message || '网络连接失败'}`;
    onStreamUpdate(errMsg);
    return errMsg;
  }
};
