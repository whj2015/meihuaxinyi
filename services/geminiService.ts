
import { GoogleGenAI } from "@google/genai";
import { DivinationResult, AIProvider } from "../types";

// DeepSeek API 配置
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

/**
 * 构建提示词
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
    请直接输出纯文本内容，不要使用Markdown的代码块包裹，可以使用加粗等简单的Markdown格式。
  `;
};

/**
 * 调用 Google Gemini
 */
const callGemini = async (apiKey: string, prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "大师正在闭目沉思，请稍后再试...";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Gemini 服务连接失败，请检查 Key 是否有效。");
  }
};

/**
 * 调用 DeepSeek
 */
const callDeepSeek = async (apiKey: string, prompt: string): Promise<string> => {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是一位精通周易和梅花易数的国学大师。" },
          { role: "user", content: prompt }
        ],
        stream: false,
        temperature: 1.3 // 稍微增加随机性，让解读更灵动
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek API Error: ${response.status} ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "DeepSeek 大师似乎在沉思，未给出回应。";
  } catch (error: any) {
    console.error("DeepSeek Error:", error);
    throw new Error(`DeepSeek 连接失败: ${error.message}`);
  }
};

/**
 * 统一获取解读接口
 */
export const getInterpretation = async (
  divination: DivinationResult, 
  userQuestion: string,
  provider: AIProvider,
  apiKey: string
): Promise<string> => {
  if (!apiKey) {
    return `请先配置 ${provider === 'gemini' ? 'Google Gemini' : 'DeepSeek'} 的 API Key`;
  }

  const prompt = buildPrompt(divination, userQuestion);

  try {
    if (provider === 'gemini') {
      return await callGemini(apiKey, prompt);
    } else {
      return await callDeepSeek(apiKey, prompt);
    }
  } catch (error: any) {
    return `解读过程中遇到阻碍：${error.message || '未知错误'}`;
  }
};
