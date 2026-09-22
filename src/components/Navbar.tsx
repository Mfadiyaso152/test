import { TabType, UserProfile } from '../types';
import { Logo } from './Logo';
import { Home, MapPin, ClipboardList, User, Plus, Building2 } from 'lucide-react';

interface NavbarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenBooking: () => void;
  user: UserProfile;
  activeOrdersCount: number;
}

export function Navbar({
  activeTab,
  onChangeTab,
  onOpenBooking,
  user,
  activeOrdersCount,
}: NavbarProps) {
  const isProvider = user.role === 'provider';

  const clientNavLinks: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'map', label: 'الخريطة', icon: MapPin },
    { id: 'orders', label: 'الطلبات', icon: ClipboardList },
    { id: 'account', label: 'الحساب', icon: User },
  ];

  const providerNavLinks: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'لوحة التحكم', icon: Building2 },
    { id: 'map', label: 'الخريطة الميدانية', icon: MapPin },
    { id: 'orders', label: 'الطلبات الواردة', icon: ClipboardList },
    { id: 'account', label: 'حساب المنشأة', icon: User },
  ];

  const navLinks = isProvider ? providerNavLinks : clientNavLinks;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#2B1B3D]/10 shadow-xs font-['Tajawal',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onChangeTab('home')}
              className="text-right focus:outline-none transition-transform hover:opacity-95 cursor-pointer flex items-center gap-2"
            >
              <Logo size={42} variant="icon-only" />
            </button>
            {isProvider && (
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-xl bg-[#FF6B53]/10 border border-[#FF6B53]/20 text-[#FF6B53] text-xs font-black">
                بوابة مقدم الخدمة
              </span>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#FDFBF5] p-1.5 rounded-2xl border border-[#2B1B3D]/10">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  id={`desktop-nav-${link.id}`}
                  onClick={() => onChangeTab(link.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none relative ${
                    isActive
                      ? 'bg-gradient-to-r from-[#2B1B3D] to-[#3C2E4C] text-white shadow-sm border border-[#FF9EB4]/30'
                      : 'text-[#3C2E4C]/80 hover:text-[#2B1B3D] hover:bg-white'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-[#FF6B53]' : ''} />
                  <span>{link.label}</span>

                  {link.id === 'orders' && activeOrdersCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#FF6B53] text-white text-[10px] font-black flex items-center justify-center -mr-1 shadow-sm">
                      {activeOrdersCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Booking Button (Only visible on Home Tab) */}
          <div className="flex items-center gap-2.5">
            {!isProvider ? (
              activeTab === 'home' && (
                <button
                  onClick={onOpenBooking}
                  id="header-create-order-btn"
                  className="py-2.5 px-4 rounded-2xl brand-gradient-btn text-white text-xs font-bold shadow-md shadow-[#FF6B53]/25 flex items-center gap-2 transition-all cursor-pointer animate-in fade-in"
                >
                  <Plus size={18} />
                  <span>طلب خدمة</span>
                </button>
              )
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#FDFBF5] border border-[#2B1B3D]/10 text-xs font-bold text-[#2B1B3D]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>متاح لاستقبال الطلبات</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
