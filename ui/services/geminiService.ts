import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize the Gemini API client
// CRITICAL: Using process.env.API_KEY as strictly required.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Sends a chat message to the Gemini API.
 */
export const sendMessageToGemini = async (prompt: string, history: string[] = []): Promise<string> => {
  try {
    // We can use the chat API or simple generateContent. 
    // For simplicity in a single-turn wrapper or managing state externally, generateContent works.
    // However, to maintain context properly, we'll pass the conversation history or use chat.
    // Here we will use generateContent with a constructed prompt for simplicity in this stateless service wrapper,
    // or ideally use ai.chats.create if we were persisting the chat object. 
    // To keep it simple and robust for this demo:

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt, // In a real app, you'd format 'contents' to include history.
      config: {
        systemInstruction: "You are a helpful, professional, and concise AI assistant integrated into a social dashboard.",
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Analyzes a post sentiment using Gemini.
 */
export const analyzePostSentiment = async (postContent: string): Promise<string> => {
  try {
    const prompt = `Analyze the sentiment of this social media post. Reply with only one word: Positive, Negative, or Neutral. Post: "${postContent}"`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text?.trim() || "Unknown";
  } catch (error) {
    console.error("Gemini API Sentiment Error:", error);
    return "Error";
  }
};