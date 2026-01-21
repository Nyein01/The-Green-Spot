import { FlowerGrade } from '../types';

export const calculateFlowerPrice = (grade: FlowerGrade, weightGrams: number): number => {
  // Base logic: finds the best deal package. 
  // Realistically for this app, we will use a simple tiered lookup or linear approximation if exact matches aren't found,
  // but the prompt gave specific breakpoints. We will try to match breakpoints or interpolate/extrapolate reasonably.

  let price = 0;

  switch (grade) {
    case FlowerGrade.MID:
      // 1g - 100, 5g - 300
      if (weightGrams < 5) return weightGrams * 100;
      return (weightGrams / 5) * 300; // Assuming linear scaling after bulk pack

    case FlowerGrade.EXOTIC:
      // 1g - 200, 3g - 500, 5g - 700
      if (weightGrams < 3) return weightGrams * 200;
      if (weightGrams < 5) {
        // Between 3 and 5, simplistic approach: base 500 for first 3, then 200/g for remainder? 
        // Or linear interp? Let's do simple linear approximation based on 3g price
        const remainder = weightGrams - 3;
        return 500 + (remainder * (200)); // Non-discounted remainder
      }
      return (weightGrams / 5) * 700;

    case FlowerGrade.TOP:
      // 1g - 300, 5g - 1250
      if (weightGrams < 5) return weightGrams * 300;
      return (weightGrams / 5) * 1250;

    case FlowerGrade.TOP_SHELF:
      // 1g - 400, 5g - 1800
      if (weightGrams < 5) return weightGrams * 400;
      return (weightGrams / 5) * 1800;
    
    default:
      return 0;
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};