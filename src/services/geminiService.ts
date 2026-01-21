import { GoogleGenAI } from "@google/genai";
import { SaleItem, InventoryItem } from '../types';

export const generateSalesAnalysis = async (sales: SaleItem[], inventory: InventoryItem[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Summarize data for the prompt to save tokens
    const totalRevenue = sales.reduce((sum, s) => sum + s.price, 0);
    const topProducts = sales.reduce((acc, curr) => {
      acc[curr.productName] = (acc[curr.productName] || 0) + curr.quantity;
      return acc;
    }, {} as Record<string, number>);

    const lowStock = inventory.filter(i => i.stockLevel < 20).map(i => `${i.name} (${i.stockLevel}g left)`);

    const prompt = `
      You are a business analyst for a cannabis dispensary. 
      Analyze the following sales data for today:
      
      Total Revenue: ${totalRevenue} THB
      Total Transactions: ${sales.length}
      
      Sales Data (JSON sample):
      ${JSON.stringify(sales.slice(0, 20))}
      
      Top Selling Products (Quantity):
      ${JSON.stringify(topProducts)}

      Inventory Alerts (Low Stock):
      ${lowStock.join(', ')}

      Please provide a concise, encouraging, and actionable summary (max 150 words) for the owner. 
      Highlight the best selling strain, any inventory warnings, and total performance.
      Format with clear headings or bullet points using Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating AI analysis. Please check your connection or API key.";
  }
};