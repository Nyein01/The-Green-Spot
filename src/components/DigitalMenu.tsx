import React, { useMemo, useEffect, useState } from 'react';
import { InventoryItem, ProductType, FlowerGrade } from '../types';
import { calculateFlowerPrice, formatCurrency } from '../utils/pricing';
import { Leaf, X, Flame, Sparkles } from 'lucide-react';

interface DigitalMenuProps {
  inventory: InventoryItem[];
  onClose: () => void;
  shopName: string;
}

export const DigitalMenu: React.FC<DigitalMenuProps> = ({ inventory, onClose, shopName }) => {
  const [time, setTime] = useState(new Date());

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Only show items in stock
  const inStock = useMemo(() => inventory.filter(i => i.stockLevel > 0), [inventory]);

  const groupedFlowers = useMemo(() => {
    const flowers = inStock.filter(i => i.category === ProductType.FLOWER);
    return {
      [FlowerGrade.TOP_SHELF]: flowers.filter(i => i.grade === FlowerGrade.TOP_SHELF),
      [FlowerGrade.TOP]: flowers.filter(i => i.grade === FlowerGrade.TOP),
      [FlowerGrade.EXOTIC]: flowers.filter(i => i.grade === FlowerGrade.EXOTIC),
      [FlowerGrade.MID]: flowers.filter(i => i.grade === FlowerGrade.MID),
    };
  }, [inStock]);

  const others = useMemo(() => {
    return inStock.filter(i => i.category !== ProductType.FLOWER);
  }, [inStock]);

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white font-sans overflow-y-auto overflow-x-hidden animate-in fade-in duration-500 selection:bg-green-500 selection:text-black">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black pointer-events-none"></div>
      
      {/* Close Button (Hidden in TV mode usually, but needed for navigation) */}
      <button 
        onClick={onClose} 
        className="fixed top-6 right-6 text-white/20 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full z-50 transition-all backdrop-blur-sm"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-6 flex justify-between items-center z-40 shadow-2xl">
        <div className="flex items-center gap-4">
            <div className="relative">
                <div className="absolute inset-0 bg-green-500 blur-lg opacity-40 animate-pulse"></div>
                <Leaf className="w-12 h-12 text-green-500 relative z-10" />
            </div>
            <div>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
                    {shopName}
                </h1>
                <p className="text-green-400 text-sm font-bold tracking-[0.4em] uppercase mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Premium Cannabis Menu
                </p>
            </div>
        </div>
        <div className="hidden md:block text-right">
            <div className="text-3xl font-black text-white/90 font-mono">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-white/40 text-sm font-medium uppercase tracking-widest">
                {time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Render Flower Grades */}
            {[FlowerGrade.TOP_SHELF, FlowerGrade.TOP, FlowerGrade.EXOTIC, FlowerGrade.MID].map((grade) => {
                const items = groupedFlowers[grade as FlowerGrade];
                if (items.length === 0) return null;

                let gradeColor = "text-green-400";
                let borderColor = "border-green-500/50";
                let badgeBg = "bg-green-500/20 text-green-300";
                let title: string = grade;
                let price1g = calculateFlowerPrice(grade as FlowerGrade, 1);

                if (grade === FlowerGrade.TOP_SHELF) { 
                    gradeColor = "text-purple-400"; 
                    borderColor = "border-purple-500/50"; 
                    badgeBg = "bg-purple-500/20 text-purple-300";
                    title = "TOP SHELF"; 
                }
                if (grade === FlowerGrade.TOP) { 
                    gradeColor = "text-blue-400"; 
                    borderColor = "border-blue-500/50"; 
                    badgeBg = "bg-blue-500/20 text-blue-300";
                    title = "TOP TIER"; 
                }
                if (grade === FlowerGrade.EXOTIC) { 
                    gradeColor = "text-yellow-400"; 
                    borderColor = "border-yellow-500/50"; 
                    badgeBg = "bg-yellow-500/20 text-yellow-300";
                    title = "EXOTIC"; 
                }

                return (
                    <div key={grade} className="flex flex-col gap-4 animate-slide-up">
                        <div className={`flex items-end justify-between border-b-2 ${borderColor} pb-2`}>
                            <h2 className={`text-2xl font-black italic tracking-wider ${gradeColor} flex items-center`}>
                                {grade === FlowerGrade.TOP_SHELF && <Sparkles className="w-5 h-5 mr-2 animate-spin-slow" />}
                                {title}
                            </h2>
                            <span className="text-white/50 font-mono text-sm font-bold">1G / {formatCurrency(price1g)}</span>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            {items.map((item, idx) => (
                                <div 
                                    key={item.id} 
                                    className="relative group bg-white/5 border border-white/5 hover:border-white/20 p-4 rounded-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:bg-white/10"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold text-white tracking-wide">{item.name}</h3>
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${badgeBg}`}>
                                            {grade === FlowerGrade.TOP_SHELF ? 'AAA+' : grade}
                                        </span>
                                    </div>
                                    
                                    <div className="mt-3 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Available</span>
                                        </div>
                                        <div className="text-right">
                                            {/* Showing bulk price hint */}
                                            <p className="text-[10px] text-white/40 font-mono">
                                                3.5g ≈ {formatCurrency(calculateFlowerPrice(grade as FlowerGrade, 3.5))}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Accessories & Edibles Section */}
        {others.length > 0 && (
            <div className="mt-12 border-t border-white/10 pt-8 animate-slide-up">
                <h2 className="text-3xl font-black text-white mb-6 flex items-center">
                    <Flame className="w-8 h-8 text-orange-500 mr-3" />
                    EDIBLES & ACCESSORIES
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {others.map((item, idx) => (
                        <div 
                            key={item.id} 
                            className="bg-gradient-to-br from-gray-900 to-black p-5 rounded-2xl border border-white/10 flex flex-col justify-between group hover:border-orange-500/50 transition-colors"
                        >
                            <div>
                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1 block">{item.category}</span>
                                <h3 className="text-lg font-bold text-gray-100 leading-tight">{item.name}</h3>
                            </div>
                            <div className="mt-4 flex justify-between items-end border-t border-white/5 pt-3">
                                <span className="text-xs text-gray-500">{item.stockLevel} units</span>
                                {item.price ? (
                                    <span className="text-xl font-mono font-bold text-white">{formatCurrency(item.price)}</span>
                                ) : (
                                    <span className="text-sm text-gray-500 italic">Var.</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Footer Ticker */}
      <div className="fixed bottom-0 w-full bg-black/90 border-t border-white/10 h-12 flex items-center overflow-hidden z-50 backdrop-blur-md">
        <div className="whitespace-nowrap animate-marquee flex items-center gap-8 text-green-500/80 font-mono font-bold text-sm uppercase tracking-[0.2em]">
            <span>Welcome to {shopName}</span>
            <span>✦</span>
            <span>Ask our budtenders about daily specials</span>
            <span>✦</span>
            <span>Premium Quality Guaranteed</span>
            <span>✦</span>
            <span>Relax responsibly</span>
            <span>✦</span>
            <span>Welcome to {shopName}</span>
            <span>✦</span>
            <span>Ask our budtenders about daily specials</span>
            <span>✦</span>
            <span>Premium Quality Guaranteed</span>
            <span>✦</span>
            <span>Relax responsibly</span>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .animate-marquee {
            animation: marquee 30s linear infinite;
        }
        .animate-spin-slow {
            animation: spin 4s linear infinite;
        }
      `}</style>
    </div>
  );
};