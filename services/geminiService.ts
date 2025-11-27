import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractDataFromImage = async (base64Image: string): Promise<ExtractedData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Analiza esta imagen y extrae la siguiente información si está visible: Folio SIAC, Nombre completo del cliente, Correo electrónico y Número de cliente. Si no encuentras algún dato, déjalo vacío o null.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            folioSiac: { type: Type.STRING, description: "El folio SIAC encontrado en el documento." },
            fullName: { type: Type.STRING, description: "El nombre completo de la persona." },
            email: { type: Type.STRING, description: "El correo electrónico." },
            clientNumber: { type: Type.STRING, description: "Número de cliente o cuenta." },
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ExtractedData;
    }
    throw new Error("No data returned from AI");
  } catch (error) {
    console.error("Error extracting data with Gemini:", error);
    throw error;
  }
};

export const extractNameFromImage = async (base64Image: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
            {
              text: "Extrae SOLAMENTE el nombre completo de la persona que aparece en esta identificación (INE o CURP). Retorna solo el nombre en un JSON simple.",
            },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                extractedName: { type: Type.STRING, description: "El nombre completo encontrado" }
            }
        }
      }
    });
    
    if (response.text) {
        const json = JSON.parse(response.text);
        return json.extractedName || null;
    }
    return null;
  } catch (error) {
    console.error("Error extracting name:", error);
    return null;
  }
}