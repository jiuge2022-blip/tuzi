
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 扩充后的本地语料库，用于离线模式或 API 受限时
const FALLBACK_WISDOM = [
  "咔嚓咔嚓！这也太好吃了吧！ 🥕",
  "好香！再来一个嘛！ 🐰",
  "我就知道你是最好的投喂大师！ ✨",
  "你看我动鼻子，是在夸你投得准呢！ *wiggle nose*",
  "多吃胡萝卜，我的耳朵会变得更有力气！ 🥕🥕",
  "蹦蹦跳跳，生活真奇妙！ 🌸",
  "刚才那下投篮，我给你打 100 分！",
  "速度加倍，饥饿感也加倍了！ 💨",
  "肚肚饱饱，烦恼跑跑！ 🐰💖",
  "我们要一起打破最高分纪录！",
  "是零食时间了吗？我觉得是的！ 🥕",
  "你的投喂技巧越来越娴熟了，快赶上我的跳跃速度了！ 🎯",
  "再吃一个胡萝卜，我就能飞起来！",
  "谢谢你一直照顾我的肚子！ ✨",
  "有你陪我在这片森林里跑，真好！ 🐰🤝"
];

/**
 * 延迟执行辅助函数
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 从本地备份库中随机获取一条消息
 */
const getRandomFallback = () => {
  const randomIndex = Math.floor(Math.random() * FALLBACK_WISDOM.length);
  return FALLBACK_WISDOM[randomIndex];
};

/**
 * 获取兔子语录：支持离线检测、指数退避重试和本地兜底
 */
export const getRabbitWisdom = async (score: number, retryCount = 0): Promise<string> => {
  const MAX_RETRIES = 3;
  
  // 1. 离线检测：如果设备没联网，直接使用本地语料，避免不必要的超时等待
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return getRandomFallback();
  }

  try {
    // 2. 预检 API Key：确保在环境未配置 Key 时也能正常运行
    if (!process.env.API_KEY) {
      return getRandomFallback();
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The player just fed a rabbit in a forest game. The current score is ${score}. Give a very short (max 10 words) encouraging or funny message from the perspective of a happy bunny. Answer in Chinese.`,
      config: {
        temperature: 0.8,
        topK: 40,
        topP: 0.9,
      }
    });

    const text = response.text?.trim();
    if (!text) throw new Error("Empty response from AI");
    
    return text;

  } catch (error: any) {
    console.debug(`Gemini API 提示 (尝试 ${retryCount + 1}):`, error.message);

    // 检查是否为可重试错误（如 429 频率限制或 5xx 服务器错误）
    const isRetryable = error?.message?.includes("429") || 
                        error?.message?.includes("RESOURCE_EXHAUSTED") ||
                        (error?.status >= 500 && error?.status < 600);

    if (isRetryable && retryCount < MAX_RETRIES) {
      // 指数退避重试：1s, 2s, 4s...
      const backoffTime = Math.pow(2, retryCount) * 1000;
      await wait(backoffTime);
      return getRabbitWisdom(score, retryCount + 1);
    }

    // 3. 最终兜底：所有重试失败或不可重试时，返回本地语料
    return getRandomFallback();
  }
};
