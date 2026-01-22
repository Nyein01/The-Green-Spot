import { GoogleGenAI } from "@google/genai";
import { SaleItem, InventoryItem } from '../types';

export const generateSalesAnalysis = async (
  sales: SaleItem[], 
  inventory: InventoryItem[],
  timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Summarize data for the prompt
    const totalRevenue = sales.reduce((sum, s) => sum + s.price, 0);
    const productStats = sales.reduce((acc, curr) => {
      acc[curr.productName] = (acc[curr.productName] || 0) + curr.quantity;
      return acc;
    }, {} as Record<string, number>);

    const topSelling = Object.entries(productStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, qty]) => `${name}: ${qty} units/grams`);

    const lowStock = inventory.filter(i => i.stockLevel < 20).map(i => `${i.name} (${i.stockLevel} left)`);

    const prompt = `
      You are a high-level business consultant for a premium cannabis dispensary. 
      Analyze this ${timeframe} performance data for the owner:
      
      Timeframe: ${timeframe.toUpperCase()}
      Total Revenue: ${totalRevenue} THB
      Total Transactions: ${sales.length}
      
      Top 5 Best Selling Products:
      ${topSelling.join('\n')}

      Inventory Alerts (Critical):
      ${lowStock.slice(0, 5).join(', ')}

      Please provide a professional, data-driven report (max 200 words). 
      Include:
      1. A "Manager's Summary" of overall health.
      2. Specific insights on the best-selling products.
      3. Actionable advice for the coming period (stocking, promotions, etc).
      
      Format with bold headings and professional bullet points.
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