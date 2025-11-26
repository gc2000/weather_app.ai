import { GoogleGenAI, Type } from "@google/genai";
import { WeatherData, GeminiInsight } from "../types";

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export const generateWeatherInsight = async (weather: WeatherData): Promise<GeminiInsight> => {
  if (!ai) {
    throw new Error("Gemini API Key is missing. Insight features are disabled.");
  }

  const prompt = `
    Current weather data for ${weather.name}, ${weather.sys.country}:
    - Temperature: ${weather.main.temp}°C (Feels like ${weather.main.feels_like}°C)
    - Condition: ${weather.weather[0].description}
    - Humidity: ${weather.main.humidity}%
    - Wind: ${weather.wind.speed} m/s

    Provide a response in JSON format with the following fields:
    - summary: A witty, short summary of the weather (max 1 sentence).
    - outfitAdvice: Practical clothing advice based on the data.
    - funFact: A very short fun fact related to this kind of weather.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            outfitAdvice: { type: Type.STRING },
            funFact: { type: Type.STRING },
          },
          required: ["summary", "outfitAdvice", "funFact"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as GeminiInsight;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    throw new Error("Failed to generate AI insight.");
  }
};
