
import { DivinationResult, AIProvider, CustomAIConfig } from "../types";

/**
 * 构建提示词 (发散性思维版：取象比类 + 场景映射)
 */
const buildPrompt = (divination: DivinationResult, userQuestion: string): string => {
  const { originalHexagram, changedHexagram, huHexagram, relation, relationScore, tiGua, yongGua, movingLineText } = divination;
  
  // 提取更细节的象数信息
  const up = originalHexagram.upper;
  const lo = originalHexagram.lower;
  
  // 确定体用卦的具体属性
  const tiTrigram = tiGua === 'upper' ? up : lo;
  const yongTrigram = yongGua === 'upper' ? up : lo;

  const tiDesc = `${tiTrigram.name}(${tiTrigram.nature}/${tiTrigram.element})`;
  const yongDesc = `${yongTrigram.name}(${yongTrigram.nature}/${yongTrigram.element})`;

  // 默认问题处理
  const question = userQuestion && userQuestion.trim() !== "" ? userQuestion : "综合运势（未指定具体事项）";

  return `
    你是一位**精通梅花易数、善于“取象比类”的国学大师**。
    求测者正在询问：**【 ${question} 】**。

    请不要照本宣科地翻译卦辞，你需要**结合具体问题**，通过卦象的自然属性（万物类象）进行发散性推理。

    === 卦象数据 ===
    1. **本卦（现状）**：${originalHexagram.name} 
       - 构成：上${up.name}(${up.nature}/${up.element}) / 下${lo.name}(${lo.nature}/${lo.element})
       - **体卦（代表求测者）**：${tiDesc}
       - **用卦（代表所测事）**：${yongDesc}
       - **能量关系**：${relation} (${relationScore})
    
    2. **互卦（隐情/过程）**：${huHexagram.name}
       - 提示：这是事情内部的潜伏因素，或中间的发展过程。
    
    3. **变卦（结局）**：${changedHexagram.name}
       - 动爻：${movingLineText || "无"}
       - 提示：这是在动爻引发变化后的最终趋势。

    === 解读要求（非常重要） ===
    1. **发散性思维（取象比类）**：
       - 必须将八卦的自然象征（如巽为风、为入、为生意、为长女；离为火、为虚、为文书、为美丽）**映射到用户所问的具体领域**。
       - 例如：问生意，"震"可能代表启动迅速或名声大；问感情，"震"可能代表争吵或一见钟情。请根据具体问题发挥想象力。
    2. **体用深度分析**：
       - 不要只说"吉"或"凶"。解释"为什么"。例如：体克用，是"我辛苦掌控局面"；用生体，是"坐享其成，有贵人助"。
       - 结合五行生克（${yongTrigram.element} 与 ${tiTrigram.element}）来描述现实中的互动模式。
    3. **逻辑连贯**：
       - 按照 现状(本) -> 隐情(互) -> 结局(变) 的时间轴叙述故事。

    === 输出格式 (Markdown) ===
    请严格按照以下格式输出：

    ### 🎯 核心直断
    （一针见血的结论，结合问题定吉凶。不用太长。）

    ### 🖼️ 象意推演
    - **卦象拆解**：(结合八卦的自然属性，解释为什么这个卦对应用户的问题。例如："上乾为天，下风为姤，天风姤象征...")
    - **体用博弈**：(详细解释体卦与用卦的五行生克在现实中代表什么情形。)

    ### 🌊 局势演变
    - **当前**：(本卦分析)
    - **过程**：(互卦分析，指出潜在的阻碍或转机)
    - **结果**：(变卦分析，结合动爻辞)

    ### 💡 大师忠告
    （针对${question}的具体建议，理性和玄学结合）
  `;
};

/**
 * 构建每日一卦的提示词 (JSON格式)
 */
const buildDailyPrompt = (divination: DivinationResult): string => {
    const { originalHexagram, changedHexagram, huHexagram, relation, relationScore, movingLineText, movingLine } = divination;
    
    // Construct clearer text data
    const guaci = originalHexagram.text?.guaci || "";
    const xiang = originalHexagram.text?.xiang || "";
    const movingLineInfo = movingLineText ? `动爻(第${movingLine}爻): ${movingLineText}` : "无动爻";

    return `
      你是一位温暖且深邃的易学生活导师。用户抽取了“今日一卦”。
      请务必**综合所有卦象信息**（本卦、互卦、变卦、卦辞、爻辞、五行生克），为用户提供今日的精准行动指引。

      === 完整卦象数据 ===
      1. **本卦（现状/背景）**：${originalHexagram.name}
         - 卦辞：${guaci}
         - 大象：${xiang}
      2. **动爻（核心变数）**：${movingLineInfo}
      3. **互卦（内在过程）**：${huHexagram.name}
      4. **变卦（最终趋势）**：${changedHexagram.name}
      5. **能量分析**：${relation} (${relationScore})

      === 解读要求 ===
      1. **深度结合**：不要只看卦名。解读必须呼应“卦辞”的哲理和“动爻”的吉凶指示。
      2. **全息视角**：结合互卦（过程）和变卦（结果）推导今日的运势走向。
      3. **生活化**：将易理转化为现代生活的具体建议（心态、工作、人际）。
      4. **温暖有力**：给用户力量，指出风险但不制造焦虑。

      请**务必**返回且仅返回一个纯 JSON 字符串（不要包含 Markdown 代码块标记 \`\`\`json），格式如下：
      {
        "score": *, // 今日运势评分 (0-100) *表示根据解析给出的分数
        "keywords": ["关键词1", "关键词2"], // 两个四字以内的核心词
        "summary": "一句话运势总结（50字以内，要有古韵且通俗）。",
        "fortune": "详细的运势解读（150字左右）。必须显式地结合卦辞或爻辞的含义来解释今日运势。",
        "todo": ["宜做之事1", "宜做之事2"], // 简短
        "not_todo": ["忌做之事1", "忌做之事2"] // 简短
      }
    `;
};

/**
 * 统一代理调用函数
 * 所有请求都发往 /api/ai-proxy
 */
const callProxyStream = async (
  payload: any, 
  token: string | undefined,
  guestKey: string | undefined, // NEW: Receive Guest Key
  provider: AIProvider,
  onStreamUpdate: (text: string) => void
): Promise<string> => {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    // 1. User Token
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 2. Guest Key via Headers (Base64 Encoded)
    if (guestKey && !token) {
        const encodedKey = btoa(encodeURIComponent(guestKey));
        if (provider === 'gemini') {
            headers['x-gemini-token'] = encodedKey;
        } else if (provider === 'deepseek') {
            headers['x-deepseek-token'] = encodedKey;
        }
    }

    const response = await fetch('/api/ai-proxy', {
      method: 'POST',
      headers: headers,
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
                    // ignore
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
    token?: string; 
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
        customConfig: config.customConfig
    };

    const result = await callProxyStream(payload, config.token, config.apiKey, provider, onStreamUpdate);
    return result;
  } catch (error: any) {
    const errMsg = `解读中断：${error.message || '网络连接失败'}`;
    onStreamUpdate(errMsg);
    return errMsg;
  }
};

/**
 * 获取每日指引 (JSON Mode)
 */
export const getDailyGuidance = async (
    divination: DivinationResult,
    provider: AIProvider,
    config: { 
      token?: string; 
      apiKey?: string; 
      customConfig?: CustomAIConfig 
    }
  ): Promise<any> => {
    const prompt = buildDailyPrompt(divination);
    let fullText = "";
  
    try {
      const payload: any = {
          provider,
          prompt,
          customConfig: config.customConfig
      };
  
      await callProxyStream(payload, config.token, config.apiKey, provider, (text) => {
          fullText = text;
      });
      
      // 尝试清理 Markdown 标记
      const cleanJson = fullText.replace(/```json\s*|\s*```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error: any) {
      console.error("Daily Guidance Parse Error", error, fullText);
      return null;
    }
};
