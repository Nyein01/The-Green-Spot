import React, { useMemo, useState } from 'react';
import { SaleItem } from '../types';
import { User, Search, Trophy, Calendar, DollarSign, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../utils/pricing';

interface CustomerViewProps {
  sales: SaleItem[]; // Pass all available sales history (live + maybe archived if loaded)
}

interface CustomerStats {
  name: string;
  totalSpent: number;
  visitCount: number;
  lastVisit: number;
  favoriteItem: string;
  history: SaleItem[];
}

export const CustomerView: React.FC<CustomerViewProps> = ({ sales }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerStats | null>(null);

  // Aggregate Sales by Customer Name
  const customers = useMemo(() => {
    const map: Record<string, CustomerStats> = {};
    
    sales.forEach(sale => {
      const name = sale.customerName?.trim();
      if (!name) return; // Skip anonymous sales

      if (!map[name]) {
        map[name] = {
          name,
          totalSpent: 0,
          visitCount: 0,
          lastVisit: 0,
          favoriteItem: '',
          history: []
        };
      }

      map[name].totalSpent += sale.price;
      map[name].visitCount += 1;
      map[name].history.push(sale);
      if (sale.timestamp > map[name].lastVisit) {
        map[name].lastVisit = sale.timestamp;
      }
    });

    // Calculate favorite item for each customer
    Object.values(map).forEach(c => {
        const itemCounts: Record<string, number> = {};
        c.history.forEach(h => {
            itemCounts[h.productName] = (itemCounts[h.productName] || 0) + h.quantity;
        });
        const fav = Object.entries(itemCounts).sort((a,b) => b[1] - a[1])[0];
        c.favoriteItem = fav ? fav[0] : 'N/A';
        c.history.sort((a,b) => b.timestamp - a.timestamp); // Sort history desc
    });

    return Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent); // Sort by VIP (spend)
  }, [sales]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-[80vh] gap-6 animate-fade-in">
       {/* Left: Customer List */}
       <div className="w-full md:w-1/3 glass-panel rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-slate-900/40">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-400" />
                  Customer Directory
              </h2>
              <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input 
                      type="text" 
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                  />
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
              {filteredCustomers.length === 0 ? (
                  <div className="text-center p-8 text-slate-500 text-sm">
                      No customer records found matching "{searchQuery}".
                  </div>
              ) : (
                  filteredCustomers.map(c => (
                      <div 
                        key={c.name}
                        onClick={() => setSelectedCustomer(c)}
                        className={`p-3 rounded-xl cursor-pointer transition-colors border border-transparent ${selectedCustomer?.name === c.name ? 'bg-blue-600/20 border-blue-500/50' : 'hover:bg-white/5 hover:border-white/5'}`}
                      >
                          <div className="flex justify-between items-start">
                              <h3 className="font-bold text-white">{c.name}</h3>
                              {c.totalSpent > 5000 && <Trophy className="w-3 h-3 text-yellow-500" />}
                          </div>
                          <div className="flex justify-between items-end mt-1">
                              <span className="text-xs text-slate-400">{c.visitCount} visits</span>
                              <span className="font-mono font-bold text-green-400">{formatCurrency(c.totalSpent)}</span>
                          </div>
                      </div>
                  ))
              )}
          </div>
       </div>

       {/* Right: Customer Detail */}
       <div className="w-full md:w-2/3 glass-panel rounded-2xl p-6 overflow-y-auto custom-scrollbar relative">
           {selectedCustomer ? (
               <div className="space-y-6 animate-slide-up">
                   <div className="flex items-start justify-between border-b border-white/10 pb-6">
                       <div className="flex items-center gap-4">
                           <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-black text-white">
                               {selectedCustomer.name.charAt(0).toUpperCase()}
                           </div>
                           <div>
                               <h2 className="text-3xl font-black text-white">{selectedCustomer.name}</h2>
                               <p className="text-slate-400 text-sm flex items-center gap-2">
                                   <Calendar className="w-3 h-3" />
                                   Last seen: {new Date(selectedCustomer.lastVisit).toLocaleDateString()}
                               </p>
                           </div>
                       </div>
                       <div className="text-right">
                           <p className="text-xs text-slate-400 uppercase tracking-widest">Lifetime Value</p>
                           <p className="text-3xl font-mono font-black text-green-400">{formatCurrency(selectedCustomer.totalSpent)}</p>
                       </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                            <p className="text-xs text-slate-500 uppercase mb-1">Favorite Strain</p>
                            <p className="text-lg font-bold text-white flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-purple-400" />
                                {selectedCustomer.favoriteItem}
                            </p>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                            <p className="text-xs text-slate-500 uppercase mb-1">Avg Spend / Visit</p>
                            <p className="text-lg font-bold text-white flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-400" />
                                {formatCurrency(selectedCustomer.totalSpent / selectedCustomer.visitCount)}
                            </p>
                        </div>
                   </div>

                   <div>
                       <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">Purchase History</h3>
                       <div className="space-y-2">
                           {selectedCustomer.history.map((sale) => (
                               <div key={sale.id} className="bg-white/5 p-3 rounded-lg flex justify-between items-center text-sm border border-white/5">
                                   <div>
                                       <span className="text-white font-bold">{sale.productName}</span>
                                       <span className="text-slate-500 ml-2 text-xs">{new Date(sale.timestamp).toLocaleDateString()}</span>
                                   </div>
                                   <div className="flex items-center gap-4">
                                       <span className="text-slate-400 text-xs">{sale.quantity} {sale.productType === 'Flower' ? 'g' : 'u'}</span>
                                       <span className="text-green-400 font-mono font-bold">{formatCurrency(sale.price)}</span>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               </div>
           ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                   <User className="w-16 h-16 mb-4" />
                   <p className="text-lg">Select a customer to view details</p>
               </div>
           )}
       </div>
    </div>
  );
};
