
import { DivinationResult, AIProvider, CustomAIConfig } from "../types";

/**
 * 构建提示词 (优化版：结构化输出)
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
    你是一位精通《梅花易数》的国学大师，你的风格是：**直击要害、逻辑清晰、语气平和**。
    请根据以下卦象数据，为求测者提供一份结构化的解读。

    【基本信息】
    - 问事：${userQuestion || "综合运势"}
    - 卦象：本卦【${originalHexagram.name}】之变卦【${changedHexagram.name}】
    - 核心：${relation} (${relationScore})

    【解读要求】
    请严格按照以下 Markdown 格式输出（不要使用代码块，直接输出文本）：

    ### 🎯 核心结论
    （用一句话直接断吉凶成败，不要模棱两可。）

    ### 📜 古义今解
    （简要引用一句最关键的卦辞或爻辞，然后迅速用现代大白话解释其现实含义。不要大段掉书袋。）

    ### 💡 关键转折
    （基于动爻和变卦，说明事情会发生什么变化，是变好还是变坏。）

    ### 🚀 大师建议
    - （建议1：具体行动）
    - （建议2：心态调整）
    
    【注意事项】
    1. 排版要美观，使用 **加粗** 标记重点。
    2. 列表项请使用 "- " 开头。
    3. 语气要像长者对晚辈的叮嘱，温暖而有力量。
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
  onStreamUpdate("大师正在连接云端...");

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
