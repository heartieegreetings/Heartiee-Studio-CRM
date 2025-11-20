
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, Platform, LeadStatus } from "../types";

// Helper to convert file to base64
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url part
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeLeadScreenshot = async (file: File): Promise<Partial<Lead>> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToGenerativePart(file);

  const modelId = 'gemini-2.5-flash';

  const prompt = `
    You are an assistant for a Wedding Design Studio. 
    Analyze this screenshot. It is likely a conversation from WhatsApp, Instagram DM, or an email, or a profile view.
    
    Extract the following information about a potential client lead:
    1. Client Name (if visible, otherwise guess based on handle or context).
    2. Platform (Instagram, WhatsApp, Pinterest, Email, Other).
    3. Contact Handle or Phone Number.
    4. Event Date (if mentioned in the conversation).
    5. Items Inquired (e.g., "E-invite", "Physical Cards", "Itinerary", "Logo", "Box Invite").
    6. Estimated Budget/Value (if numbers are mentioned, make a conservative estimate, otherwise 0).
    7. Urgency (Low, Medium, High) based on their tone (e.g. "urgent", "wedding is next week").
    8. A short summary note of the request.
    
    Be intelligent about Indian wedding context (e.g. "Sangeet", "Mehndi", "Roka").
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING },
            platform: { type: Type.STRING, enum: ["WhatsApp", "Instagram", "Pinterest", "Email", "Other"] },
            contactHandle: { type: Type.STRING },
            eventDate: { type: Type.STRING, description: "ISO Date YYYY-MM-DD if possible, else empty string" },
            inquiredItems: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            estimatedValue: { type: Type.NUMBER },
            urgency: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            notes: { type: Type.STRING }
          },
          required: ["clientName", "platform", "inquiredItems"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      
      // Map string platform to Enum
      let platformEnum = Platform.OTHER;
      switch (data.platform) {
        case "WhatsApp": platformEnum = Platform.WHATSAPP; break;
        case "Instagram": platformEnum = Platform.INSTAGRAM; break;
        case "Pinterest": platformEnum = Platform.PINTEREST; break;
        case "Email": platformEnum = Platform.EMAIL; break;
      }

      return {
        clientName: data.clientName || "Unknown Client",
        platform: platformEnum,
        contactHandle: data.contactHandle || "",
        eventDate: data.eventDate || undefined,
        inquiredItems: data.inquiredItems || [],
        estimatedValue: data.estimatedValue || 0,
        urgency: (data.urgency as 'Low' | 'Medium' | 'High') || 'Medium',
        notes: data.notes || "",
        status: LeadStatus.NEW,
        reminders: [],
        followUpHistory: [],
        transferHistory: []
      };
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Error analyzing screenshot:", error);
    throw error;
  }
};
