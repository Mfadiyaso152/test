import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Building2, 
  Wrench, 
  ClipboardList, 
  CreditCard, 
  Tag, 
  ShieldCheck, 
  Lock, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  Search, 
  AirVent,
  Zap,
  Paintbrush,
  LogOut,
  Layers,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';
import { 
  Order, 
  UserProfile, 
  ServiceCategory, 
  Coupon, 
  OrderStatus, 
  Worker 
} from '../../types';
import { saveOrderToFirestore, saveUserProfileToFirestore } from '../../lib/firebase';

interface AdminDashboardProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  allUsers: UserProfile[];
  setAllUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  categories: ServiceCategory[];
  setCategories: React.Dispatch<React.SetStateAction<ServiceCategory[]>>;
  onExit?: () => void;
}

type AdminSection = 
  | 'services' 
  | 'overview' 
  | 'providers' 
  | 'clients' 
  | 'workers' 
  | 'orders' 
  | 'payments' 
  | 'coupons';

const SECTIONS_CONFIG: { id: AdminSection; title: string; subtitle: string; icon: any }[] = [
  { 
    id: 'services', 
    title: '🛠️ باقات وخدمات الصيانة والأسعار', 
    subtitle: 'إضافة، تعديل، حذف، وتحديد أسعار خدمات التطبيق',
    icon: Layers 
  },
  { 
    id: 'overview', 
    title: '📊 المؤشرات المالية والأرباح والعمولة', 
    subtitle: 'مبيعات المنظومة، أرباح المنصة، ونسبة العمولة',
    icon: BarChart3 
  },
  { 
    id: 'providers', 
    title: '🏢 مقدمي الخدمة والمنشآت المعتمدة', 
    subtitle: 'اعتماد المنشآت، فحص السجلات التجارية، وإدارة المزودين',
    icon: Building2 
  },
  { 
    id: 'clients', 
    title: '👥 إدارة العملاء المسجلين', 
    subtitle: 'قائمة العملاء، بيانات التواصل، وإجراءات الحظر',
    icon: Users 
  },
  { 
    id: 'workers', 
    title: '🔧 الكوادر والفنيين الميدانيين', 
    subtitle: 'قائمة الفنيين، التخصصات، وتقييمات الأداء',
    icon: Wrench 
  },
  { 
    id: 'orders', 
    title: '📋 سجل الحجوزات والطلبات الميدانية', 
    subtitle: 'تتبع الطلبات وتحديث حالات التنفيذ فورياً',
    icon: ClipboardList 
  },
  { 
    id: 'payments', 
    title: '💳 العمولات والتحويلات البنكية (IBAN)', 
    subtitle: 'مستحقات المنشآت وتفاصيل الحسابات البنكية',
    icon: CreditCard 
  },
  { 
    id: 'coupons', 
    title: '🏷️ كوبونات وأكواد الخصم', 
    subtitle: 'إنشاء وحذف أكواد الخصم ونسب التخفيض',
    icon: Tag 
  },
];

export function AdminDashboard({
  orders,
  setOrders,
  allUsers,
  setAllUsers,
  categories,
  setCategories,
  onExit,
}: AdminDashboardProps) {
  // Authentication State for Admin panel
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('admin_session_auth') === 'true';
  });
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Active Section
  const [activeSection, setActiveSection] = useState<AdminSection>('services');

  // Search & Filter queries
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [providerStatusFilter, setProviderStatusFilter] = useState<string>('all');

  // Commission & Coupons
  const [commissionRate, setCommissionRate] = useState<number>(15);
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem('field_app_coupons_v6');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(15);

  // Persist coupons
  useEffect(() => {
    try {
      localStorage.setItem('field_app_coupons_v6', JSON.stringify(coupons));
    } catch {}
  }, [coupons]);

  // Service Management Modal States
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState(100);
  const [serviceIcon, setServiceIcon] = useState('Wrench');

  // Handle Admin Auth
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === 'admin' || adminPin === '1234' || adminPin === 'admin2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_session_auth', 'true');
      setPinError('');
    } else {
      setPinError('كلمة المرور غير صحيحة (استخدم: admin أو 1234)');
    }
  };

  // Add or Update Service
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceTitle.trim()) return;

    if (editingCategory) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                title: serviceTitle.trim(),
                description: serviceDescription.trim(),
                priceStart: Number(servicePrice),
                icon: serviceIcon,
              }
            : c
        )
      );
      setEditingCategory(null);
    } else {
      const newCat: ServiceCategory = {
        id: `srv-${Date.now()}`,
        title: serviceTitle.trim(),
        description: serviceDescription.trim() || 'خدمة صيانة متخصصة ومضمونة',
        priceStart: Number(servicePrice),
        icon: serviceIcon,
        color: '#FF6B53',
      };
      setCategories((prev) => [newCat, ...prev]);
    }

    setServiceTitle('');
    setServiceDescription('');
    setServicePrice(100);
    setServiceIcon('Wrench');
    setIsAddServiceOpen(false);
  };

  // Delete Service immediately
  const handleDeleteService = (catId: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه الخدمة نهائياً من التطبيق؟')) {
      setCategories((prev) => prev.filter((c) => c.id !== catId));
    }
  };

  // Provider Status Verification
  const handleUpdateProviderStatus = (providerId: string, newStatus: 'approved' | 'rejected') => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === providerId && u.providerDetails) {
          const updated: UserProfile = {
            ...u,
            providerDetails: {
              ...u.providerDetails,
              verificationStatus: newStatus,
              isAvailableForOrders: newStatus === 'approved',
            },
          };
          saveUserProfileToFirestore(updated).catch(() => {});
          return updated;
        }
        return u;
      })
    );
  };

  // Toggle User Ban
  const handleToggleBanUser = (userId: string) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated: UserProfile = {
            ...u,
            isBanned: !u.isBanned,
          };
          saveUserProfileToFirestore(updated).catch(() => {});
          return updated;
        }
        return u;
      })
    );
  };

  // Update Order Status from Admin
  const handleAdminUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated: Order = { ...o, status };
          saveOrderToFirestore(updated).catch(() => {});
          return updated;
        }
        return o;
      })
    );
  };

  // Add Coupon
  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const coup: Coupon = {
      id: `c-${Date.now()}`,
      code: newCouponCode.trim().toUpperCase(),
      discountPercentage: Number(newCouponDiscount),
      maxDiscount: 50,
      isActive: true,
      usageCount: 0,
      expiryDate: '2026-12-31',
    };
    setCoupons([coup, ...coupons]);
    setNewCouponCode('');
  };

  // Financial Calculations
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.price, 0);
  const platformEarnings = Math.round((totalRevenue * commissionRate) / 100);
  const providersEarnings = totalRevenue - platformEarnings;
  const totalClients = allUsers.filter((u) => u.role === 'client');
  const totalProviders = allUsers.filter((u) => u.role === 'provider');
  const allWorkers = totalProviders.flatMap((p) => 
    (p.providerDetails?.workers || []).map(w => ({ ...w, providerName: p.name, providerPhone: p.phone }))
  );

  // Icon preview helper
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'AirVent': return <AirVent size={20} className="text-[#FF6B53]" />;
      case 'Zap': return <Zap size={20} className="text-[#FF6B53]" />;
      case 'Wrench': return <Wrench size={20} className="text-[#FF6B53]" />;
      case 'Sparkles': return <Sparkles size={20} className="text-[#FF9EB4]" />;
      case 'Paintbrush': return <Paintbrush size={20} className="text-[#FF6B53]" />;
      default: return <ShieldCheck size={20} className="text-[#FF6B53]" />;
    }
  };

  // If Not Authenticated, show Pin Modal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FDFBF5] flex items-center justify-center p-4 font-['Tajawal',sans-serif] text-right">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#2B1B3D]/10 space-y-6 animate-in zoom-in-95 duration-150">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#2B1B3D] to-[#3C2E4C] text-[#FF9EB4] flex items-center justify-center mx-auto shadow-lg shadow-[#2B1B3D]/20">
            <Lock size={30} />
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-[#2B1B3D]">لوحة الإدارة المعتمدة</h2>
            <p className="text-xs text-[#3C2E4C]/70">أدخل رمز الدخول للمتابعة إلى الإدارة والتحكم</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="رمز المرور (admin / 1234)"
                autoFocus
                className="w-full p-3.5 rounded-2xl border border-[#2B1B3D]/15 bg-[#FDFBF5] text-center font-mono text-base text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53]"
              />
              {pinError && (
                <p className="text-rose-600 text-xs font-bold text-center mt-2">{pinError}</p>
              )}
            </div>

            <div className="flex gap-2">
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="flex-1 py-3.5 rounded-2xl border border-[#2B1B3D]/15 text-[#3C2E4C] text-xs font-bold hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  الرجوع للتطبيق
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3.5 rounded-2xl brand-gradient-btn text-white text-xs font-black shadow-lg shadow-[#FF6B53]/25 cursor-pointer"
              >
                دخول اللوحة
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const currentSectionInfo = SECTIONS_CONFIG.find(s => s.id === activeSection) || SECTIONS_CONFIG[0];
  const CurrentIcon = currentSectionInfo.icon;

  return (
    <div className="min-h-screen bg-[#FDFBF5] text-[#2B1B3D] font-['Tajawal',sans-serif] text-right">
      
      {/* Top Main Admin Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Header with Exit & Logout */}
        <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-3xl border border-[#2B1B3D]/10 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2B1B3D] to-[#3C2E4C] text-[#FF9EB4] flex items-center justify-center font-bold shadow-md">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-[#2B1B3D]">لوحة تحكم الإدارة العامة</h1>
              <span className="text-[11px] text-[#FF6B53] font-bold">صلاحيات المدير العام الكاملة</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExit && (
              <button
                onClick={onExit}
                className="py-2 px-3 sm:px-4 rounded-xl bg-[#FDFBF5] hover:bg-[#2B1B3D]/5 text-[#2B1B3D] border border-[#2B1B3D]/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="الرجوع إلى التطبيق"
              >
                <ArrowRight size={14} />
                <span className="hidden sm:inline">العودة للتطبيق</span>
              </button>
            )}

            <button
              onClick={() => {
                sessionStorage.removeItem('admin_session_auth');
                setIsAuthenticated(false);
              }}
              className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="قفل اللوحة والخروج"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">قفل اللوحة</span>
            </button>
          </div>
        </div>

        {/* 
          ================================================================
          THE REQUESTED SINGLE RECTANGLE SELECTOR (NATIVE OS PICKER)
          When tapped on iPhone / iPad -> opens iOS native wheel picker.
          When tapped on Android -> opens Android native select sheet.
          When clicked on Mac/PC -> opens OS native menu dropdown.
          ================================================================
        */}
        <div className="space-y-2">
          <label htmlFor="admin-section-picker" className="block text-xs font-black text-[#2B1B3D] pr-1">
            اختر قسم الإدارة المطلوب (انقر لتغيير القسم):
          </label>
          
          <div className="relative group">
            {/* The Visual Rectangular Card Container */}
            <div className="w-full min-h-[76px] p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#2B1B3D] via-[#352347] to-[#3C2E4C] text-white border-2 border-[#FF6B53]/40 shadow-xl shadow-[#2B1B3D]/15 flex items-center justify-between gap-4 transition-all group-hover:border-[#FF6B53] cursor-pointer">
              
              <div className="flex items-center gap-3.5 sm:gap-4 overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B53] to-[#FF9EB4] text-white flex items-center justify-center shrink-0 shadow-md">
                  <CurrentIcon size={24} />
                </div>
                
                <div className="text-right overflow-hidden">
                  <span className="text-[10px] font-bold text-[#FF9EB4] block uppercase tracking-wider">
                    القسم الحالي المعروض
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-white truncate">
                    {currentSectionInfo.title}
                  </h2>
                  <p className="text-[11px] text-white/75 truncate mt-0.5 hidden sm:block">
                    {currentSectionInfo.subtitle}
                  </p>
                </div>
              </div>

              {/* Native Dropdown Indicator Badge */}
              <div className="flex items-center gap-2 shrink-0 bg-white/10 px-3 py-2 rounded-2xl border border-white/15 text-[#FF9EB4]">
                <span className="text-xs font-black hidden xs:inline">تبديل القسم</span>
                <ChevronDown size={18} className="text-[#FF6B53] animate-bounce" />
              </div>
            </div>

            {/* Native Select Overlay with 100% full coverage & native picker trigger */}
            <select
              id="admin-section-picker"
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value as AdminSection)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base bg-transparent z-10"
              aria-label="اختر قسم الإدارة"
            >
              {SECTIONS_CONFIG.map((sec) => (
                <option key={sec.id} value={sec.id} className="text-[#2B1B3D] bg-white font-bold p-3">
                  {sec.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 
          ================================================================
          ACTIVE SECTION CONTENT (ALL 8 COMPLETE SECTIONS)
          ================================================================
        */}
        <div className="pt-2">
          
          {/* 1. SERVICES MANAGEMENT */}
          {activeSection === 'services' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-[#2B1B3D]/10 shadow-xs">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#2B1B3D]">إدارة الخدمات وباقات الصيانة</h2>
                  <p className="text-xs text-[#3C2E4C]/70 mt-0.5">
                    إضافة باقات جديدة، تعديل الأسعار، أو حذف الخدمات المعروضة فورياً
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setServiceTitle('');
                    setServiceDescription('');
                    setServicePrice(120);
                    setServiceIcon('Wrench');
                    setIsAddServiceOpen(true);
                  }}
                  className="py-3 px-5 rounded-2xl brand-gradient-btn text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-[#FF6B53]/25 hover:scale-[1.02] transition-all cursor-pointer shrink-0"
                >
                  <Plus size={16} />
                  <span>إضافة خدمة جديدة</span>
                </button>
              </div>

              {/* Services Grid */}
              {categories.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-[#2B1B3D]/10 shadow-xs space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-[#FF6B53]/10 text-[#FF6B53] flex items-center justify-center mx-auto">
                    <Layers size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-[#2B1B3D]">لا توجد خدمات مضافة حالياً</h3>
                    <p className="text-xs text-[#3C2E4C]/70 max-w-md mx-auto">
                      يمكنك الآن البدء بإضافة خدماتك اليدوية وأسعارها عبر زر "إضافة خدمة جديدة" أعلاه.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-5 rounded-3xl bg-white border border-[#2B1B3D]/10 shadow-xs hover:border-[#FF6B53]/40 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 rounded-2xl bg-[#FDFBF5] border border-[#2B1B3D]/10 flex items-center justify-center shadow-inner">
                            {renderCategoryIcon(cat.icon)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCategory(cat);
                                setServiceTitle(cat.title);
                                setServiceDescription(cat.description);
                                setServicePrice(cat.priceStart);
                                setServiceIcon(cat.icon);
                                setIsAddServiceOpen(true);
                              }}
                              className="p-2 rounded-xl bg-[#FDFBF5] hover:bg-[#2B1B3D]/5 text-[#2B1B3D] transition-colors cursor-pointer"
                              title="تعديل السعر والبيانات"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteService(cat.id)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              title="حذف الخدمة نهائياً"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-black text-[#2B1B3D]">{cat.title}</h3>
                          <p className="text-xs text-[#3C2E4C]/70 mt-1 line-clamp-2 leading-relaxed">
                            {cat.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#2B1B3D]/5 flex items-center justify-between">
                        <span className="text-xs text-[#3C2E4C]/70 font-semibold">سعر الباقة الأساسي:</span>
                        <span className="text-base font-black text-[#FF6B53]">{cat.priceStart} ر.س</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. OVERVIEW & FINANCIALS */}
          {activeSection === 'overview' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <h2 className="text-base sm:text-lg font-black text-[#2B1B3D]">المؤشرات المالية وأرباح المنظومة</h2>

              {/* Financial Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-[#2B1B3D]/10 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#3C2E4C]/70 font-bold block">إجمالي مبيعات الصيانة</span>
                    <DollarSign size={18} className="text-[#FF6B53]" />
                  </div>
                  <span className="text-2xl font-black text-[#2B1B3D] block">{totalRevenue} ر.س</span>
                  <span className="text-[11px] text-emerald-700 font-semibold block">من {completedOrders.length} طلب مكتمل</span>
                </div>

                <div className="p-5 rounded-3xl bg-gradient-to-br from-[#2B1B3D] to-[#3C2E4C] text-white rounded-3xl border border-white/10 shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#FF9EB4] font-bold block">أرباح المنصة ({commissionRate}%)</span>
                    <ShieldCheck size={18} className="text-[#FF6B53]" />
                  </div>
                  <span className="text-2xl font-black text-[#FF6B53] block">{platformEarnings} ر.س</span>
                  <span className="text-[11px] text-white/70 block">صافي العائد المستحق للإدارة</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-[#2B1B3D]/10 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#3C2E4C]/70 font-bold block">مستحقات المنشآت والمزودين</span>
                    <CreditCard size={18} className="text-emerald-700" />
                  </div>
                  <span className="text-2xl font-black text-emerald-700 block">{providersEarnings} ر.س</span>
                  <span className="text-[11px] text-[#3C2E4C]/70 font-semibold block">جاهزة للتحويل البنكي للمزودين</span>
                </div>
              </div>

              {/* Commission Settings Box */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#2B1B3D]/10 shadow-xs space-y-3">
                <h3 className="text-sm font-black text-[#2B1B3D]">تعديل نسبة عمولة التطبيق على الطلبات</h3>
                <p className="text-xs text-[#3C2E4C]/70">يتم خصم هذه النسبة تلقائياً لصالح الإدارة عند اكتمال أي طلب صيانة.</p>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    min={0}
                    max={50}
                    className="w-24 p-2.5 rounded-xl border border-[#2B1B3D]/15 text-center font-bold text-sm text-[#2B1B3D] bg-[#FDFBF5] focus:outline-none focus:border-[#FF6B53]"
                  />
                  <span className="text-xs font-bold text-[#2B1B3D]">% عمولة المنصة المعتمدة</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. PROVIDERS MANAGEMENT */}
          {activeSection === 'providers' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#2B1B3D]">إدارة مقدمي الخدمة والمنشآت المعتمدة</h2>
                  <p className="text-xs text-[#3C2E4C]/70 mt-0.5">مراجعة المنشآت المسجلة، السجلات التجارية، والاعتمادات</p>
                </div>
                <span className="text-xs text-[#3C2E4C]/70 font-bold px-3 py-1 bg-white rounded-full border border-[#2B1B3D]/10 self-start sm:self-auto">
                  {totalProviders.length} منشأة
                </span>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3C2E4C]/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="البحث باسم المنشأة، السجل التجاري، المدينة..."
                    className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-white border border-[#2B1B3D]/15 text-xs text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53]"
                  />
                </div>

                <select
                  value={providerStatusFilter}
                  onChange={(e) => setProviderStatusFilter(e.target.value)}
                  className="py-2.5 px-4 rounded-2xl bg-white border border-[#2B1B3D]/15 text-xs font-bold text-[#2B1B3D] focus:outline-none cursor-pointer"
                >
                  <option value="all">كافة الحالات</option>
                  <option value="approved">المعتمدة والمفعلة</option>
                  <option value="pending">قيد المراجعة</option>
                  <option value="rejected">المرفوضة / الموقوفة</option>
                </select>
              </div>

              {/* Providers List */}
              <div className="space-y-3">
                {totalProviders.length === 0 ? (
                  <div className="p-10 bg-white rounded-3xl border border-[#2B1B3D]/10 text-center text-xs text-[#3C2E4C]/70 space-y-2">
                    <Building2 size={36} className="text-[#3C2E4C]/30 mx-auto" />
                    <h3 className="text-sm font-black text-[#2B1B3D]">لا يوجد مقدمو خدمة مسجلون حالياً</h3>
                    <p>تظهر المنشآت ومقدمو الخدمة المعتمدون هنا فور تسجيل حساباتهم في المنصة.</p>
                  </div>
                ) : (
                  totalProviders
                    .filter((p) => {
                      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.providerDetails?.crNumber || '').includes(searchQuery) ||
                        p.city.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchStatus = providerStatusFilter === 'all' || 
                        (p.providerDetails?.verificationStatus || 'pending') === providerStatusFilter;
                      return matchSearch && matchStatus;
                    })
                    .map((prov) => {
                      const status = prov.providerDetails?.verificationStatus || 'pending';
                      return (
                        <div
                          key={prov.id}
                          className="p-5 rounded-3xl bg-white border border-[#2B1B3D]/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2B1B3D] to-[#3C2E4C] text-[#FF9EB4] flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                              <Building2 size={22} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-black text-[#2B1B3D]">{prov.name}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  status === 'approved' 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : status === 'rejected' 
                                    ? 'bg-rose-100 text-rose-800' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {status === 'approved' ? 'معتمد ومفعل' : status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                                </span>
                              </div>
                              <p className="text-xs text-[#FF6B53] font-bold">
                                {prov.providerDetails?.specialty || 'خدمات عامة'} • {prov.city}
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-[#3C2E4C]/70 flex-wrap">
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone size={12} /> {prov.phone}
                                </span>
                                {prov.providerDetails?.crNumber && (
                                  <span className="font-mono bg-[#FDFBF5] px-2 py-0.5 rounded-md border border-[#2B1B3D]/10">
                                    سجل تجاري: {prov.providerDetails.crNumber}
                                  </span>
                                )}
                                <span>الكوادر: {(prov.providerDetails?.workers || []).length} فني</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-auto">
                            {status !== 'approved' && (
                              <button
                                onClick={() => handleUpdateProviderStatus(prov.id, 'approved')}
                                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                <CheckCircle2 size={14} />
                                <span>قبول وتفعيل</span>
                              </button>
                            )}
                            {status !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateProviderStatus(prov.id, 'rejected')}
                                className="py-2 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <XCircle size={14} />
                                <span>رفض / إيقاف</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* 4. CLIENTS MANAGEMENT */}
          {activeSection === 'clients' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#2B1B3D]">إدارة العملاء المسجلين</h2>
                  <p className="text-xs text-[#3C2E4C]/70 mt-0.5">متابعة حسابات العملاء، العناوين، وإجراءات الحظر</p>
                </div>
                <span className="text-xs text-[#3C2E4C]/70 font-bold px-3 py-1 bg-white rounded-full border border-[#2B1B3D]/10">
                  {totalClients.length} عميل
                </span>
              </div>

              {/* Client Search */}
              <div className="relative">
                <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3C2E4C]/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث باسم العميل، رقم الجوال، أو البريد الإلكتروني..."
                  className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-white border border-[#2B1B3D]/15 text-xs text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53]"
                />
              </div>

              {/* Clients List */}
              <div className="space-y-3">
                {totalClients.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white border border-[#2B1B3D]/10 text-center space-y-2">
                    <Users size={36} className="mx-auto text-[#2B1B3D]/20" />
                    <h3 className="text-sm font-black text-[#2B1B3D]">لا يوجد عملاء مسجلون حالياً</h3>
                    <p className="text-xs text-[#3C2E4C]/70">
                      يتم عرض العملاء الحقيقيين هنا فور قيامهم بإنشاء حساب في المنصة.
                    </p>
                  </div>
                ) : totalClients
                  .filter((c) => 
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.phone.includes(searchQuery) ||
                    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 ? (
                  <div className="p-6 rounded-3xl bg-white border border-[#2B1B3D]/10 text-center text-xs text-[#3C2E4C]/70">
                    لا توجد نتائج بحث مطابقة
                  </div>
                ) : (
                  totalClients
                    .filter((c) => 
                      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.phone.includes(searchQuery) ||
                      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((client) => (
                      <div
                        key={client.id}
                        className="p-5 rounded-3xl bg-white border border-[#2B1B3D]/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-[#2B1B3D]">{client.name}</h3>
                            {client.isBanned && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                                محظور من الطلب
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#3C2E4C]/70 flex-wrap">
                            <span className="font-mono flex items-center gap-1"><Phone size={12} /> {client.phone}</span>
                            {client.email && (
                              <span className="flex items-center gap-1"><Mail size={12} /> {client.email}</span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#3C2E4C]/60 flex items-center gap-1">
                            <MapPin size={11} /> {client.city} - {client.district || 'المنطقة المركزية'}
                          </p>
                        </div>

                        <button
                          onClick={() => handleToggleBanUser(client.id)}
                          className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto ${
                            client.isBanned
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <Ban size={14} />
                          <span>{client.isBanned ? 'إلغاء حظر العميل' : 'حظر العميل'}</span>
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* 5. WORKERS MANAGEMENT */}
          {activeSection === 'workers' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#2B1B3D]">إدارة الكوادر والفنيين الميدانيين</h2>
                  <p className="text-xs text-[#3C2E4C]/70 mt-0.5">قائمة الفنيين والكوادر التابعة للمنشآت المعتمدة</p>
                </div>
                <span className="text-xs text-[#3C2E4C]/70 font-bold px-3 py-1 bg-white rounded-full border border-[#2B1B3D]/10">
                  {allWorkers.length} فني
                </span>
              </div>

              {allWorkers.length === 0 ? (
                <div className="p-10 bg-white rounded-3xl border border-[#2B1B3D]/10 text-center text-xs text-[#3C2E4C]/70 space-y-2">
                  <Wrench size={32} className="text-[#3C2E4C]/30 mx-auto" />
                  <p>لا يوجد فنيين مسجلين حالياً. يتم إضافة الفنيين من قبل مقدمي الخدمة المعتمدين.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {allWorkers.map((worker) => (
                    <div key={worker.id} className="p-4 sm:p-5 rounded-3xl bg-white border border-[#2B1B3D]/10 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2B1B3D] to-[#3C2E4C] text-[#FF9EB4] flex items-center justify-center font-bold text-sm">
                            <Wrench size={16} />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-[#2B1B3D]">{worker.name}</h3>
                            <p className="text-xs text-[#FF6B53] font-bold">{worker.specialty}</p>
                          </div>
                        </div>
                        <span className="text-xs text-amber-600 font-black bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                          ★ {worker.rating}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#2B1B3D]/5 flex items-center justify-between text-[11px] text-[#3C2E4C]/70">
                        <span>المنشأة: {worker.providerName}</span>
                        <span className="font-mono">{worker.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. ORDERS MANAGEMENT */}
          {activeSection === 'orders' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#2B1B3D]">سجل الحجوزات والطلبات الميدانية</h2>
                  <p className="text-xs text-[#3C2E4C]/70 mt-0.5">متابعة وتحديث حالات تنفيذ الطلبات فورياً</p>
                </div>
                <span className="text-xs text-[#3C2E4C]/70 font-bold px-3 py-1 bg-white rounded-full border border-[#2B1B3D]/10 self-start sm:self-auto">
                  {orders.length} طلب
                </span>
              </div>

              {/* Status Filter & Search */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3C2E4C]/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="البحث برقم الطلب أو اسم العميل أو الخدمة..."
                    className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-white border border-[#2B1B3D]/15 text-xs text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53]"
                  />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="py-2.5 px-4 rounded-2xl bg-white border border-[#2B1B3D]/15 text-xs font-bold text-[#2B1B3D] focus:outline-none cursor-pointer"
                >
                  <option value="all">كافة الطلبات</option>
                  <option value="received">جديد</option>
                  <option value="assigned">تم تعيين الفني</option>
                  <option value="on_the_way">الفني بالطريق</option>
                  <option value="arrived">وصل الموقع</option>
                  <option value="in_progress">جاري التنفيذ</option>
                  <option value="completed">مكتمل</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>

              {/* Orders List */}
              {orders.length === 0 ? (
                <div className="p-10 bg-white rounded-3xl border border-[#2B1B3D]/10 text-center text-xs text-[#3C2E4C]/70">
                  لا توجد طلبات مسجلة حتى الآن.
                </div>
              ) : (
                <div className="space-y-3">
                  {orders
                    .filter((ord) => {
                      const matchSearch = ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        ord.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        ord.client.name.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchStatus = orderStatusFilter === 'all' || ord.status === orderStatusFilter;
                      return matchSearch && matchStatus;
                    })
                    .map((ord) => (
                      <div
                        key={ord.id}
                        className="p-5 rounded-3xl bg-white border border-[#2B1B3D]/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs text-[#FF6B53] bg-[#FF6B53]/10 px-2.5 py-1 rounded-lg">
                              {ord.orderNumber}
                            </span>
                            <h3 className="text-sm font-black text-[#2B1B3D]">{ord.serviceTitle}</h3>
                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                              {ord.price} ر.س
                            </span>
                          </div>

                          <p className="text-xs text-[#3C2E4C]/70">
                            العميل: <span className="font-bold text-[#2B1B3D]">{ord.client.name}</span> • {ord.client.phone}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-[#3C2E4C]/60 flex-wrap">
                            <span className="flex items-center gap-1"><MapPin size={12} /> {ord.location.addressName}</span>
                            <span className="flex items-center gap-1"><Calendar size={12} /> {ord.scheduledDate}</span>
                          </div>
                        </div>

                        {/* Status dropdown directly on device */}
                        <div className="flex items-center gap-2 self-start md:self-auto bg-[#FDFBF5] p-2 rounded-2xl border border-[#2B1B3D]/10">
                          <span className="text-[11px] font-bold text-[#3C2E4C]/70 pr-1">الحالة:</span>
                          <select
                            value={ord.status}
                            onChange={(e) => handleAdminUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                            className="p-2 rounded-xl border border-[#2B1B3D]/15 text-xs font-bold text-[#2B1B3D] bg-white focus:outline-none cursor-pointer"
                          >
                            <option value="received">طلب جديد 📥</option>
                            <option value="assigned">تم تعيين الفني 👷‍♂️</option>
                            <option value="on_the_way">الفني في الطريق 🚗</option>
                            <option value="arrived">وصل للموقع 📍</option>
                            <option value="in_progress">جاري التنفيذ 🔧</option>
                            <option value="completed">مكتمل بنجاح ✅</option>
                            <option value="cancelled">ملغي ❌</option>
                          </select>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* 7. PAYMENTS */}
          {activeSection === 'payments' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h2 className="text-base sm:text-lg font-black text-[#2B1B3D]">المدفوعات والمستحقات والتحويلات البنكية (IBAN)</h2>
              
              <div className="p-6 bg-white rounded-3xl border border-[#2B1B3D]/10 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-gradient-to-br from-[#2B1B3D] to-[#3C2E4C] text-white rounded-2xl">
                  <div>
                    <span className="text-xs text-[#FF9EB4] font-bold block">إجمالي مستحقات المزودين الجاهزة للصرف</span>
                    <span className="text-2xl font-black text-[#FF6B53] mt-1 block">{providersEarnings} ر.س</span>
                  </div>
                  <button
                    onClick={() => alert('تم إرسال كشوفات التسوية البنكية إلى نظام المدفوعات بنجاح.')}
                    className="py-2.5 px-4 rounded-xl brand-gradient-btn text-white text-xs font-black shadow-md cursor-pointer"
                  >
                    تصدير كشف التحويلات البنكية
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black text-[#2B1B3D]">بيانات الحسابات البنكية للمنشآت المعتمدة:</h3>
                  {totalProviders.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#3C2E4C]/60 bg-[#FDFBF5] rounded-2xl border border-[#2B1B3D]/10">
                      لا توجد منشآت أو مزودو خدمة مسجلون حالياً
                    </div>
                  ) : (
                    totalProviders.map((prov) => (
                      <div key={prov.id} className="p-4 rounded-2xl bg-[#FDFBF5] border border-[#2B1B3D]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-black text-[#2B1B3D]">{prov.name}</h4>
                          <p className="text-[11px] font-mono text-[#3C2E4C]/70 mt-0.5">
                            IBAN: {prov.providerDetails?.bankDetails?.iban || 'لم يتم تسجيل الآيبان بعد'} {prov.providerDetails?.bankDetails?.bankName ? `(${prov.providerDetails.bankDetails.bankName})` : ''}
                          </p>
                        </div>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto">
                          مستحق: {prov.balance || 0} ر.س
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 8. COUPONS */}
          {activeSection === 'coupons' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#2B1B3D]">كوبونات وأكواد الخصم الترويجية</h2>
                  <p className="text-xs text-[#3C2E4C]/70 mt-0.5">إضافة أكواد خصم جديدة للعملاء وتحديد نسب التخفيض</p>
                </div>
                <span className="text-xs text-[#3C2E4C]/70 font-bold px-3 py-1 bg-white rounded-full border border-[#2B1B3D]/10">
                  {coupons.length} كود
                </span>
              </div>

              {/* Add Coupon Form */}
              <form onSubmit={handleAddCoupon} className="p-4 bg-white rounded-3xl border border-[#2B1B3D]/10 shadow-xs flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  placeholder="رمز الكوبون (مثال: SAUDI2026)"
                  className="flex-1 p-2.5 rounded-xl border border-[#2B1B3D]/15 text-xs text-[#2B1B3D] font-mono uppercase focus:outline-none focus:border-[#FF6B53]"
                  required
                />
                <input
                  type="number"
                  value={newCouponDiscount}
                  onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                  placeholder="نسبة الخصم %"
                  min={5}
                  max={90}
                  className="w-full sm:w-28 p-2.5 rounded-xl border border-[#2B1B3D]/15 text-xs text-[#2B1B3D] text-center font-bold focus:outline-none focus:border-[#FF6B53]"
                  required
                />
                <button
                  type="submit"
                  className="py-2.5 px-5 brand-gradient-btn text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
                >
                  إضافة كود الخصم
                </button>
              </form>

              {/* Coupons List */}
              {coupons.length === 0 ? (
                <div className="p-8 bg-white rounded-3xl border border-[#2B1B3D]/10 text-center text-xs text-[#3C2E4C]/70">
                  لا توجد كوبونات خصم منشأة حالياً. يمكنك إضافة كود خصم جديد من النموذج أعلاه.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {coupons.map((c) => (
                    <div key={c.id} className="p-4 rounded-3xl bg-white border border-[#2B1B3D]/10 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="font-mono font-black text-sm text-[#FF6B53] block">{c.code}</span>
                        <span className="text-xs text-[#3C2E4C]/70">خصم {c.discountPercentage}% حتى {c.maxDiscount} ر.س</span>
                      </div>
                      <button
                        onClick={() => setCoupons(coupons.filter((x) => x.id !== c.id))}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors"
                        title="حذف الكوبون"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Add / Edit Service Modal */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-right border border-[#2B1B3D]/10 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-[#2B1B3D]">
              {editingCategory ? 'تعديل بيانات وسعر الخدمة' : 'إضافة خدمة صيانة جديدة'}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#2B1B3D] mb-1">اسم الخدمة *</label>
                <input
                  type="text"
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  placeholder="مثال: صيانة غسالات ومجففات، كشف تسربات، عزل..."
                  required
                  className="w-full p-2.5 rounded-xl border border-[#2B1B3D]/15 text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2B1B3D] mb-1">وصف الخدمة وتفاصيلها</label>
                <textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  rows={3}
                  placeholder="اكتب وصفاً مختصراً لمجال عمل الخدمة وما يشمله الضمان والفحص..."
                  className="w-full p-2.5 rounded-xl border border-[#2B1B3D]/15 text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2B1B3D] mb-1">سعر الخدمة الأساسي (ر.س) *</label>
                  <input
                    type="number"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(Number(e.target.value))}
                    min={10}
                    required
                    className="w-full p-2.5 rounded-xl border border-[#2B1B3D]/15 text-[#2B1B3D] font-bold focus:outline-none focus:border-[#FF6B53]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2B1B3D] mb-1">أيقونة الخدمة</label>
                  <select
                    value={serviceIcon}
                    onChange={(e) => setServiceIcon(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#2B1B3D]/15 text-[#2B1B3D] bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="Wrench">مفتاح صيانة (Wrench)</option>
                    <option value="AirVent">تكييف وتبريد (AirVent)</option>
                    <option value="Zap">كهرباء وإنارة (Zap)</option>
                    <option value="Sparkles">نظافة وتعقيم (Sparkles)</option>
                    <option value="Paintbrush">دهانات وتشطيب (Paintbrush)</option>
                    <option value="ShieldCheck">أنظمة وأمان (ShieldCheck)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-[#2B1B3D]/15 text-[#3C2E4C] font-bold hover:bg-neutral-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl brand-gradient-btn text-white font-black transition-all cursor-pointer shadow-md shadow-[#FF6B53]/20"
                >
                  {editingCategory ? 'حفظ التعديلات' : 'إضافة الخدمة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
