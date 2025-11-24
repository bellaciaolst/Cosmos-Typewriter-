import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function continueWriting(context: string): Promise<string> {
  try {
    const prompt = `You are a cosmic muse. Continue the text in a sci-fi/atmospheric style (2-3 sentences). Input: "${context}"`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error (Continue Writing):", error);
    throw error;
  }
}

export async function polishWriting(text: string): Promise<string> {
  try {
    const prompt = `Rewrite to be more evocative/literary sci-fi. Input: "${text}"`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error (Polish Writing):", error);
    throw error;
  }
}