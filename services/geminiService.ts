
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function getCoachFeedback(poseSnapshot: string, moveName: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: poseSnapshot
          }
        },
        {
          text: `You are a professional world-class dance coach. Analyze this snapshot of a dancer attempting the move "${moveName}". 
          Give a very short (15 words max) encouraging tip to improve their form. Be specific (e.g., "Raise your elbows higher" or "Bend your knees more").`
        }
      ],
      config: {
        systemInstruction: "You are a professional, energetic, and concise dance coach. Provide quick, actionable feedback based on visuals."
      }
    });

    return response.text || "Keep grooving! You're doing great!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Nice move! Keep pushing!";
  }
}
