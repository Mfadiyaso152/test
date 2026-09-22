import { useState } from 'react';
import { 
  Search, 
  ChevronLeft, 
  Zap, 
  Wrench, 
  Sparkles, 
  Paintbrush, 
  AirVent, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  PlusCircle,
  Layers
} from 'lucide-react';
import { ServiceCategory, Order, UserProfile } from '../../types';

interface HomeTabProps {
  user: UserProfile;
  categories: ServiceCategory[];
  activeOrder?: Order;
  onSelectCategory: (cat: ServiceCategory) => void;
  onOpenMap: () => void;
  onOpenOrders: () => void;
  onOpenBookingModal: () => void;
}

export function HomeTab({
  user,
  categories,
  activeOrder,
  onSelectCategory,
  onOpenOrders,
  onOpenMap,
}: HomeTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'AirVent':
        return <AirVent className="w-6 h-6 text-[#FF6B53]" />;
      case 'Zap':
        return <Zap className="w-6 h-6 text-[#FF6B53]" />;
      case 'Wrench':
        return <Wrench className="w-6 h-6 text-[#FF6B53]" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-[#FF9EB4]" />;
      case 'Paintbrush':
        return <Paintbrush className="w-6 h-6 text-[#FF6B53]" />;
      default:
        return <ShieldCheck className="w-6 h-6 text-[#FF6B53]" />;
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.title.includes(searchQuery) || c.description.includes(searchQuery)
  );

  return (
    <div id="home-tab-container" className="space-y-6 text-right pb-16 font-['Tajawal',sans-serif]">
      {/* Brand Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl brand-card-dark p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
            <path d="M 0,50 Q 150,150 300,50 T 500,100" fill="none" stroke="#FF9EB4" strokeWidth="2.5" />
            <path d="M 0,100 Q 200,20 350,120 T 500,60" fill="none" stroke="#FF6B53" strokeWidth="3" />
            <path d="M 0,140 Q 120,80 280,160 T 500,130" fill="none" stroke="#FF9EB4" strokeWidth="1.5" />
            <circle cx="380" cy="90" r="28" fill="none" stroke="#FF6B53" strokeWidth="4" opacity="0.4" />
          </svg>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B53]/25 border border-[#FF9EB4]/30 text-[#FF9EB4] text-xs font-bold">
                <ShieldCheck size={14} className="text-[#FF6B53]" />
                <span>خدمات ميدانية موثقة ومضمونة</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#FDFBF5]">
                مرحباً {user.name} 👋
              </h1>
            </div>

            <button
              onClick={onOpenMap}
              className="py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-[#FDFBF5] border border-[#FF9EB4]/30 text-xs font-bold flex items-center gap-2 backdrop-blur-xs transition-all cursor-pointer shadow-sm"
            >
              <MapPin size={15} className="text-[#FF6B53]" />
              <span>مقدمي الخدمة بالقرب منك</span>
            </button>
          </div>

          <p className="text-xs sm:text-sm text-[#FDFBF5]/85 max-w-xl leading-relaxed">
            اطلب نخبة الفنيين والمنشآت المعتمدة لصيانة منزلك أو منشأتك. متابعة فورية، فحص احترافي، وضمان معتمد على جميع الأعمال.
          </p>

          <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-[#FF9EB4] font-semibold">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#FF6B53]" /> سرعة استجابة فورية</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#FF6B53]" /> فنيين مدربين ومفحوصين</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-[#FF6B53]" /> دفع آمن وتقسيط تابي وتمارا</span>
          </div>
        </div>
      </section>

      {/* Active Order Banner if present */}
      {activeOrder && activeOrder.status !== 'completed' && activeOrder.status !== 'cancelled' && (
        <div 
          onClick={onOpenOrders}
          id="active-order-banner"
          className="p-4 rounded-3xl bg-white border-2 border-[#FF6B53]/30 shadow-md flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FDFBF5] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FF6B53]/15 flex items-center justify-center text-[#FF6B53] shrink-0">
              <Clock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#2B1B3D]">
                  طلب نشط: {activeOrder.orderNumber}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FF6B53] text-white text-[10px] font-bold shadow-xs">
                  {activeOrder.status === 'on_the_way' ? 'الفني في الطريق 🚗' : activeOrder.status === 'arrived' ? 'وصل الفني 📍' : 'قيد التنفيذ'}
                </span>
              </div>
              <span className="text-[11px] text-[#3C2E4C]/75 block mt-0.5 font-medium">
                {activeOrder.serviceTitle} • {activeOrder.scheduledDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[#FF6B53] text-xs font-bold">
            <span>تتبع الطلب</span>
            <ChevronLeft size={16} />
          </div>
        </div>
      )}

      {/* Search Bar (only if there are categories or active search) */}
      {categories.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث عن خدمة صيانة (تكييف، كهرباء، سباكة، نظافة...)"
            id="home-search-input"
            className="w-full py-3.5 pr-11 pl-11 rounded-2xl bg-white border border-[#2B1B3D]/10 text-xs sm:text-sm text-[#2B1B3D] placeholder-[#3C2E4C]/40 shadow-xs focus:outline-none focus:border-[#FF6B53] transition-all"
          />
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3C2E4C]/50" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-[#3C2E4C]/60 hover:text-[#2B1B3D]"
            >
              مسح
            </button>
          )}
        </div>
      )}

      {/* Services Grid */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-[#2B1B3D]">بطاقات الخدمات المتاحة</h2>
          {categories.length > 0 && (
            <span className="text-xs text-[#3C2E4C]/70 font-semibold">{filteredCategories.length} خدمة متوفرة</span>
          )}
        </div>

        {categories.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#2B1B3D]/10 shadow-xs text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-[#FF6B53]/10 text-[#FF6B53] flex items-center justify-center mx-auto">
              <Layers size={32} />
            </div>
            <h3 className="text-base font-black text-[#2B1B3D]">لا توجد خدمات مضافة حتى الآن</h3>
            <p className="text-xs text-[#3C2E4C]/70 max-w-sm mx-auto leading-relaxed">
              يمكن لإدارة المنظومة إضافة وتعديل باقات الخدمات وأسعارها بسهولة من لوحة تحكم الإدارة.
            </p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-[#2B1B3D]/10 text-center text-xs text-[#3C2E4C]/70">
            لم يتم العثور على خدمات مطابقة للبحث.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat)}
                id={`cat-card-${cat.id}`}
                className="p-5 rounded-3xl bg-white border border-[#2B1B3D]/10 shadow-xs hover:border-[#FF6B53]/60 hover:shadow-lg transition-all flex flex-col justify-between text-right group cursor-pointer relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between w-full mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#FDFBF5] border border-[#2B1B3D]/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {getCategoryIcon(cat.icon)}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#FDFBF5] flex items-center justify-center text-[#2B1B3D] group-hover:bg-[#FF6B53] group-hover:text-white transition-all">
                      <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-[#2B1B3D] group-hover:text-[#FF6B53] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-[#3C2E4C]/75 mt-1 line-clamp-2 leading-relaxed font-medium">
                    {cat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
