
import { DivinationResult, AIProvider, CustomAIConfig } from "../types";

/**
 * 构建提示词 (优化版：结构化输出 + 互卦分析 + 中立客观)
 */
const buildPrompt = (divination: DivinationResult, userQuestion: string): string => {
  const { originalHexagram, changedHexagram, huHexagram, relation, relationScore, tiGua, yongGua, movingLineText } = divination;
  
  return `
    你是一位精通《梅花易数》的国学大师，你的解卦风格是：**中立客观、逻辑严密、不欺人、不媚俗**。
    请根据以下卦象数据，为求测者提供一份真实、理性的解读。

    【核心数据】
    - 问事：${userQuestion || "综合运势"}
    - 卦象演变：本卦【${originalHexagram.name}】 -> 互卦【${huHexagram.name}】(过程) -> 变卦【${changedHexagram.name}】(结果)
    - 核心关系：${relation} (${relationScore})
    - 关键动爻：${movingLineText || "无"}

    【解读原则】
    1. **保持中立**：请务必基于五行生克和卦义实话实说。好就是好，坏就是坏。不要只报喜不报忧，也不要故意吓唬用户。
    2. **重视过程**：请特别关注“互卦”，它揭示了事情内部的隐情、中间的波折或潜在的因果链条。
    3. **拒绝迷信**：分析要结合现实逻辑，提供具有操作性的建议。

    【输出格式】
    请严格按照以下 Markdown 格式输出（不要使用代码块）：

    ### 🎯 核心断语
    （用一句话直断吉凶。例如：“此事先难后易，最终可成”或“目前时机未到，强求有悔”。）

    ### 🔍 深度解析
    - **现状（本卦）**：...
    - **过程（互卦）**：基于【${huHexagram.name}】，分析事情发展的中间环节、潜在阻力或内部隐情。
    - **结局（变卦）**：...

    ### 💡 关键转折
    （基于动爻“${movingLineText}”进行分析，说明这一变数如何影响全局。）

    ### 🚀 大师忠告
    - （建议1：客观的行动指南）
    - （建议2：心态或策略调整）
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
    
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      if (payload.provider === 'gemini') {
         // 简单处理 Gemini REST 流
         const parts = chunk.split(/["']text["']\s*:\s*["']((?:[^"'\\]|\\.)*)["']/g);
         for (let i = 1; i < parts.length; i += 2) {
             let t = parts[i];
             t = t.replace(/\\n/g, '\n').replace(/\\"/g, '"');
             fullText += t;
             onStreamUpdate(fullText);
         }
      } else {
         // OpenAI / DeepSeek SSE format
         const lines = buffer.split("\n");
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
    username?: string; 
    apiKey?: string;   
    customConfig?: CustomAIConfig 
  },
  onStreamUpdate: (text: string) => void
): Promise<string> => {
  const prompt = buildPrompt(divination, userQuestion);
  onStreamUpdate("大师正在连接云端，静候天机...");

  try {
    const payload: any = {
        provider,
        prompt,
        username: config.username, 
        apiKey: config.apiKey, 
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