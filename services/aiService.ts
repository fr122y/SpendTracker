
import { GoogleGenAI, Type } from "@google/genai";
import { Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const categorizeExpense = async (
  description: string, 
  amount: number, 
  userCategories: Category[]
): Promise<{ category: string; emoji: string }> => {
  const categoryNames = userCategories.map(c => c.name);
  if (categoryNames.length === 0) {
    categoryNames.push("Другое");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Проанализируй трату и выбери ОДНУ наиболее подходящую категорию из списка пользователя: ${categoryNames.join(", ")}. 
      Также подбери один подходящий эмодзи (даже если он отличается от стандартного для категории, но лучше подходит к описанию).
      Трата: "${description}", Сумма: ${amount}.
      Если трата абсолютно не подходит ни под одну категорию, выбери ту, которая ближе всего по смыслу, или "Другое", если такая есть в списке.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "Название категории строго из предоставленного списка.",
            },
            emoji: {
              type: Type.STRING,
              description: "Один эмодзи, соответствующий конкретной трате.",
            },
          },
          required: ["category", "emoji"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    
    // Fallback to user categories to ensure safety
    const finalCategory = categoryNames.includes(result.category) ? result.category : (categoryNames[0] || "Другое");

    return {
      category: finalCategory,
      emoji: result.emoji || "💸",
    };
  } catch (error) {
    console.error("AI Categorization failed:", error);
    return {
      category: categoryNames[0] || "Другое",
      emoji: "📝",
    };
  }
};
