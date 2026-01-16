
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FALLBACK_WISDOM = [
  "Crunch crunch! That was delicious! 🥕",
  "Yummy! More please! 🐰",
  "I love hopping and eating with you! ✨",
  "You're a great provider! *wiggle nose*",
  "Keep those carrots coming! 🥕🥕",
  "Hop hop! Life is good! 🌸",
  "Did you know carrots make my ears extra perky?",
  "Speedy hopping makes me hungry! 💨",
  "Happiness is a full tummy! 🐰💖",
  "Let's beat that high score together!"
];

/**
 * Helper to delay execution for a given time
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches wisdom from Gemini with exponential backoff and local fallbacks
 */
export const getRabbitWisdom = async (score: number, retryCount = 0): Promise<string> => {
  const MAX_RETRIES = 3;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The player just fed a rabbit in a forest game. The current score is ${score}. Give a very short (max 10 words) encouraging or funny message from the perspective of a happy bunny.`,
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
    console.error(`Gemini Error (Attempt ${retryCount + 1}):`, error);

    // Check if the error is a rate limit (429) or server error (5xx)
    const isRetryable = error?.message?.includes("429") || 
                        error?.message?.includes("RESOURCE_EXHAUSTED") ||
                        (error?.status >= 500 && error?.status < 600);

    if (isRetryable && retryCount < MAX_RETRIES) {
      // Exponential backoff: 1s, 2s, 4s...
      const backoffTime = Math.pow(2, retryCount) * 1000;
      await wait(backoffTime);
      return getRabbitWisdom(score, retryCount + 1);
    }

    // If we've exhausted retries or it's a non-retryable error, return fallback
    const randomIndex = Math.floor(Math.random() * FALLBACK_WISDOM.length);
    return FALLBACK_WISDOM[randomIndex];
  }
};
