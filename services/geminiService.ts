import { GoogleGenAI } from "@google/genai";

export const generateExerciseTip = async (exerciseName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a concise, bullet-point guide on how to perform the "${exerciseName}" with proper form for hypertrophy. 
      Include 3 key "Do's" and 1 common "Don't". Keep it under 150 words.
      Format neatly with bolding where appropriate.`,
    });
    
    return response.text || "No tip generated.";
  } catch (error) {
    console.error("Gemini Text Error:", error);
    throw new Error("Failed to get tips from AI.");
  }
};

export const generateExerciseVisual = async (exerciseName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A high-quality, minimalistic line-art or 3D render style illustration of a fitness model performing the ${exerciseName}. 
            White background, blue and grey accents. Clean, anatomical focus. No text.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image returned");
  } catch (error) {
    console.error("Gemini Image Error:", error);
    throw new Error("Failed to generate visual.");
  }
};