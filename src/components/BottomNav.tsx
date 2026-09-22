import { Home, MapPin, ClipboardList, User, Building2 } from 'lucide-react';
import { TabType, UserRole } from '../types';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  activeOrdersCount: number;
  role?: UserRole;
}

export function BottomNav({ activeTab, onChangeTab, activeOrdersCount, role }: BottomNavProps) {
  const isProvider = role === 'provider';

  const tabs: { id: TabType; icon: React.ElementType; ariaLabel: string }[] = [
    { id: 'home', icon: isProvider ? Building2 : Home, ariaLabel: isProvider ? 'لوحة التحكم' : 'الرئيسية' },
    { id: 'map', icon: MapPin, ariaLabel: 'الخريطة' },
    { id: 'orders', icon: ClipboardList, ariaLabel: isProvider ? 'الطلبات الواردة' : 'الطلبات' },
    { id: 'account', icon: User, ariaLabel: 'الحساب' },
  ];

  return (
    <nav 
      id="bottom-navigation-bar" 
      aria-label="شريط التنقل السفلي للأجهزة الذكية"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#2B1B3D]/10 shadow-[0_-8px_30px_rgba(43,27,61,0.08)] px-6 py-2.5"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              aria-label={tab.ariaLabel}
              aria-selected={isActive}
              role="tab"
              className={`relative flex items-center justify-center w-14 h-12 rounded-2xl transition-all duration-200 outline-none select-none cursor-pointer ${
                isActive 
                  ? 'text-[#FDFBF5]' 
                  : 'text-[#3C2E4C]/60 hover:text-[#2B1B3D] hover:bg-[#2B1B3D]/5'
              }`}
            >
              {/* Active Tab Animated Background Pill */}
              {isActive && (
                <motion.div
                  layoutId="activeTabMobileIndicator"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#2B1B3D] via-[#3C2E4C] to-[#FF6B53] shadow-md shadow-[#FF6B53]/25 border border-[#FF9EB4]/30"
                />
              )}

              {/* Icon Container */}
              <div className="relative z-10 flex items-center justify-center">
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.4 : 1.8}
                  className={`transition-transform duration-200 ${isActive ? 'scale-110 text-[#FF9EB4]' : 'scale-100'}`}
                />

                {/* Notification Badge on Orders tab if active service exists */}
                {tab.id === 'orders' && activeOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B53] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#FF6B53] text-white text-[9px] font-black items-center justify-center border border-white">
                      {activeOrdersCount}
                    </span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
