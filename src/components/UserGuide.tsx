import React, { useState } from 'react';
import { 
  X, 
  ShoppingCart, 
  Package, 
  FileText, 
  Settings, 
  BookOpen, 
  ChevronRight, 
  CheckCircle2, 
  Search,
  Plus,
  CreditCard,
  Save
} from 'lucide-react';
import { translations, Language } from '../utils/translations';

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const UserGuide: React.FC<UserGuideProps> = ({ isOpen, onClose, language }) => {
  const [activeSection, setActiveSection] = useState<'sales' | 'inventory' | 'reports' | 'general'>('sales');

  const t = translations[language].guide;

  if (!isOpen) return null;

  const sections = [
    { id: 'sales', label: t.tabs.sales, icon: ShoppingCart },
    { id: 'inventory', label: t.tabs.inventory, icon: Package },
    { id: 'reports', label: t.tabs.reports, icon: FileText },
    { id: 'general', label: t.tabs.general, icon: Settings },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'sales':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
              <h3 className="font-bold text-green-800 dark:text-green-300 flex items-center mb-2">
                <ShoppingCart className="w-5 h-5 mr-2" />
                {t.sales.title}
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400">
                {t.sales.desc}
              </p>
            </div>

            <div className="space-y-4">
              {t.sales.steps.map((step, idx) => (
                  <Step 
                    key={idx}
                    num={idx + 1}
                    title={step.t}
                    desc={step.d}
                    icon={idx === 0 ? <Search className="w-4 h-4" /> : idx === 3 ? <ShoppingCart className="w-4 h-4"/> : undefined}
                  />
              ))}
            </div>
          </div>
        );
      case 'inventory':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center mb-2">
                <Package className="w-5 h-5 mr-2" />
                {t.inventory.title}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {t.inventory.desc}
              </p>
            </div>

            <div className="space-y-4">
              {t.inventory.steps.map((step, idx) => (
                  <Step 
                    key={idx}
                    num={idx + 1}
                    title={step.t}
                    desc={step.d}
                  />
              ))}
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
              <h3 className="font-bold text-orange-800 dark:text-orange-300 flex items-center mb-2">
                <FileText className="w-5 h-5 mr-2" />
                {t.reports.title}
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                {t.reports.desc}
              </p>
            </div>

            <div className="space-y-4">
              {t.reports.steps.map((step, idx) => (
                  <Step 
                    key={idx}
                    num={idx + 1}
                    title={step.t}
                    desc={step.d}
                    icon={idx === 2 ? <Save className="w-4 h-4" /> : undefined}
                  />
              ))}
            </div>
          </div>
        );
      case 'general':
        return (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-slate-300 flex items-center mb-2">
                <Settings className="w-5 h-5 mr-2" />
                {t.general.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t.general.desc}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
               {t.general.features.map((feat, idx) => (
                   <div key={idx} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                      <h4 className="font-bold text-sm mb-1 text-gray-900 dark:text-white">{feat.t}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                          {feat.d}
                      </p>
                   </div>
               ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/10 relative">
        
        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
        >
            <X className="w-5 h-5" />
        </button>

        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-950/50 border-r border-gray-100 dark:border-gray-800 p-6 flex-shrink-0">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-green-500 rounded-lg text-white">
               <BookOpen className="w-6 h-6" />
            </div>
            <div>
               <h2 className="font-black text-lg text-gray-900 dark:text-white leading-none">{t.title}</h2>
               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.subtitle}</p>
            </div>
          </div>

          <div className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all ${
                    isActive 
                      ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm border border-gray-200 dark:border-gray-700' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white dark:bg-gray-900">
           {renderContent()}
        </div>

      </div>
    </div>
  );
};

const Step: React.FC<{ num: number; title: string; desc: string; icon?: React.ReactNode }> = ({ num, title, desc, icon }) => (
  <div className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700 group">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center font-bold text-sm border border-gray-200 dark:border-gray-700 group-hover:bg-green-500 group-hover:text-white group-hover:border-green-500 transition-colors">
      {num}
    </div>
    <div>
      <h4 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
        {title}
        {icon && <span className="text-gray-400 dark:text-gray-500 group-hover:text-green-500 transition-colors">{icon}</span>}
      </h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);
