import { useState } from 'react';
import { UserProfile, Order, Worker, ReviewItem, OrderStatus, ServiceCategory, BankDetails } from '../../types';
import { 
  Building2, 
  ShieldCheck, 
  MapPin, 
  Users, 
  Star, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Truck, 
  Wrench, 
  Plus, 
  Power, 
  Navigation, 
  FileText, 
  AlertCircle,
  TrendingUp,
  UserCheck,
  Edit2,
  Trash2,
  Calendar,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '../../data/mockData';

interface ProviderDashboardProps {
  user: UserProfile;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, workerId?: string) => void;
  onUpdateProviderDetails: (updatedProfile: UserProfile) => void;
  onSelectOrder: (order: Order) => void;
}

export function ProviderDashboard({
  user,
  orders,
  onUpdateOrderStatus,
  onUpdateProviderDetails,
  onSelectOrder,
}: ProviderDashboardProps) {
  const [activeTab, setActiveTab] = useState<'incoming_orders' | 'cr_and_location' | 'bank_details' | 'workers_ratings' | 'services'>('incoming_orders');
  
  // State for CR & Location form
  const [crNumber, setCrNumber] = useState(user.providerDetails?.crNumber || '');
  const [businessName, setBusinessName] = useState(user.providerDetails?.businessName || user.name);
  const [specialty, setSpecialty] = useState(user.providerDetails?.specialty || 'تكييف وتبريد وكهرباء');
  const [city, setCity] = useState(user.providerDetails?.city || user.city || 'الرياض');
  const [district, setDistrict] = useState(user.providerDetails?.district || user.district || '');
  const [coverageRadius, setCoverageRadius] = useState(user.providerDetails?.coverageRadiusKm || 25);
  const [isAvailable, setIsAvailable] = useState(user.providerDetails?.isAvailableForOrders ?? true);
  const [isCrSaved, setIsCrSaved] = useState(false);

  // State for Bank Details
  const [bankName, setBankName] = useState(user.providerDetails?.bankDetails?.bankName || '');
  const [accountHolder, setAccountHolder] = useState(user.providerDetails?.bankDetails?.accountHolderName || user.name);
  const [iban, setIban] = useState(user.providerDetails?.bankDetails?.iban || '');
  const [isBankSaved, setIsBankSaved] = useState(false);

  // State for Workers
  const [workers, setWorkers] = useState<Worker[]>(user.providerDetails?.workers || []);
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerSpecialty, setNewWorkerSpecialty] = useState('تكييف وتبريد');
  const [newWorkerId, setNewWorkerId] = useState('');

  // Save CR and Location Settings
  const handleSaveCRAndLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...user,
      name: businessName,
      city: city,
      providerDetails: {
        crNumber: crNumber.trim(),
        crVerified: true,
        verificationStatus: 'approved',
        businessName: businessName.trim(),
        specialty: specialty.trim(),
        city: city.trim(),
        district: district.trim(),
        lat: user.providerDetails?.lat || 24.7742,
        lng: user.providerDetails?.lng || 46.6385,
        coverageRadiusKm: Number(coverageRadius),
        isAvailableForOrders: isAvailable,
        bankDetails: user.providerDetails?.bankDetails || {
          bankName,
          accountHolderName: accountHolder,
          iban,
        },
        workers: workers,
        reviews: user.providerDetails?.reviews || [],
      },
    };
    onUpdateProviderDetails(updated);
    setIsCrSaved(true);
    setTimeout(() => setIsCrSaved(false), 3000);
  };

  // Save Bank Details
  const handleSaveBankDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const bankDetails: BankDetails = {
      bankName: bankName.trim(),
      accountHolderName: accountHolder.trim(),
      iban: iban.trim().toUpperCase(),
    };

    const updated: UserProfile = {
      ...user,
      providerDetails: {
        ...(user.providerDetails || {
          crNumber,
          crVerified: true,
          verificationStatus: 'approved',
          businessName,
          specialty,
          city,
          district,
          lat: 24.7742,
          lng: 46.6385,
          coverageRadiusKm: 25,
          isAvailableForOrders: true,
          workers,
          reviews: [],
        }),
        bankDetails,
      },
    };
    onUpdateProviderDetails(updated);
    setIsBankSaved(true);
    setTimeout(() => setIsBankSaved(false), 3000);
  };

  // Toggle Availability
  const handleToggleAvailability = () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    if (user.providerDetails) {
      const updated: UserProfile = {
        ...user,
        providerDetails: {
          ...user.providerDetails,
          isAvailableForOrders: nextState,
        },
      };
      onUpdateProviderDetails(updated);
    }
  };

  // Add Worker
  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim() || !newWorkerPhone.trim()) return;

    const newWorker: Worker = {
      id: `w-${Date.now()}`,
      name: newWorkerName.trim(),
      phone: newWorkerPhone.trim(),
      specialty: newWorkerSpecialty,
      rating: 5.0,
      reviewsCount: 0,
      completedJobs: 0,
      isAvailable: true,
      nationalId: newWorkerId.trim(),
    };

    const updatedWorkers = [newWorker, ...workers];
    setWorkers(updatedWorkers);
    
    if (user.providerDetails) {
      onUpdateProviderDetails({
        ...user,
        providerDetails: {
          ...user.providerDetails,
          workers: updatedWorkers,
        },
      });
    }

    setNewWorkerName('');
    setNewWorkerPhone('');
    setNewWorkerId('');
    setIsAddWorkerOpen(false);
  };

  // Delete worker
  const handleDeleteWorker = (workerId: string) => {
    const updated = workers.filter((w) => w.id !== workerId);
    setWorkers(updated);
    if (user.providerDetails) {
      onUpdateProviderDetails({
        ...user,
        providerDetails: {
          ...user.providerDetails,
          workers: updated,
        },
      });
    }
  };

  const reviews = user.providerDetails?.reviews || [];

  return (
    <div className="space-y-6 text-right font-['Tajawal',sans-serif] max-w-5xl mx-auto pb-16">
      {/* Top Provider Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#2B1B15]/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2B1B15] to-[#43352E] flex items-center justify-center text-[#D5B085] border border-[#D5B085]/30 shadow-md">
              <Building2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-[#2B1B15]">{user.name}</h1>
                {crNumber ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <ShieldCheck size={14} />
                    <span>سجل موثق: {crNumber}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <ShieldCheck size={14} />
                    <span>بانتظار توثيق السجل</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#43352E]/70 mt-0.5">
                {city} {district ? `- ${district}` : ''} • نطاق التغطية: {coverageRadius} كم
              </p>
            </div>
          </div>

          {/* Availability Switch */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end bg-[#F7F5F0] p-2.5 rounded-2xl border border-[#2B1B15]/10">
            <div className="text-right">
              <span className="block text-xs font-bold text-[#2B1B15]">
                {isAvailable ? 'متاح لاستقبال الطلبات' : 'غير متوفر مؤقتاً'}
              </span>
              <span className="block text-[10px] text-[#43352E]/60">
                {isAvailable ? 'يتم تحويل العملاء الأقرب لك' : 'لن يتم استقبال طلبات جديدة'}
              </span>
            </div>
            <button
              onClick={handleToggleAvailability}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                isAvailable 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              <Power size={18} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-[#F7F5F0] rounded-2xl border border-[#2B1B15]/5 text-center">
            <span className="block text-xs text-[#43352E]/70 font-medium">الطلبات النشطة</span>
            <span className="text-lg font-black text-[#A26843] mt-0.5">
              {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length}
            </span>
          </div>

          <div className="p-3 bg-[#F7F5F0] rounded-2xl border border-[#2B1B15]/5 text-center">
            <span className="block text-xs text-[#43352E]/70 font-medium">طاقم الفنيين الميدانيين</span>
            <span className="text-lg font-black text-[#2B1B15] mt-0.5">{workers.length}</span>
          </div>

          <div className="p-3 bg-[#F7F5F0] rounded-2xl border border-[#2B1B15]/5 text-center">
            <span className="block text-xs text-[#43352E]/70 font-medium">متوسط تقييم الفنيين</span>
            <span className="text-lg font-black text-amber-600 mt-0.5 flex items-center justify-center gap-1">
              <Star size={16} fill="currentColor" />
              <span>
                {workers.length > 0 
                  ? (workers.reduce((acc, w) => acc + (w.rating || 5), 0) / workers.length).toFixed(1) 
                  : (user.rating ? user.rating.toFixed(1) : '5.0')}
              </span>
            </span>
          </div>

          <div className="p-3 bg-[#F7F5F0] rounded-2xl border border-[#2B1B15]/5 text-center">
            <span className="block text-xs text-[#43352E]/70 font-medium">الرصيد المتاح للسحب</span>
            <span className="text-lg font-black text-emerald-700 mt-0.5">
              {user.balance || 0} ر.س
            </span>
          </div>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('incoming_orders')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'incoming_orders'
              ? 'bg-[#2B1B15] text-[#D5B085] shadow-sm'
              : 'bg-white border border-[#2B1B15]/10 text-[#43352E]/80 hover:bg-[#F7F5F0]'
          }`}
        >
          <Truck size={16} />
          <span>الطلبات الواردة والتنفيذ</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#A26843] text-white">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('cr_and_location')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'cr_and_location'
              ? 'bg-[#2B1B15] text-[#D5B085] shadow-sm'
              : 'bg-white border border-[#2B1B15]/10 text-[#43352E]/80 hover:bg-[#F7F5F0]'
          }`}
        >
          <MapPin size={16} />
          <span>تثبيت السجل والموقع</span>
        </button>

        <button
          onClick={() => setActiveTab('bank_details')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'bank_details'
              ? 'bg-[#2B1B15] text-[#D5B085] shadow-sm'
              : 'bg-white border border-[#2B1B15]/10 text-[#43352E]/80 hover:bg-[#F7F5F0]'
          }`}
        >
          <CreditCard size={16} />
          <span>الحساب البنكي والتحويلات</span>
        </button>

        <button
          onClick={() => setActiveTab('workers_ratings')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'workers_ratings'
              ? 'bg-[#2B1B15] text-[#D5B085] shadow-sm'
              : 'bg-white border border-[#2B1B15]/10 text-[#43352E]/80 hover:bg-[#F7F5F0]'
          }`}
        >
          <Users size={16} />
          <span>العمال والتقييمات</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white">
            ⭐ 4.9
          </span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'services'
              ? 'bg-[#2B1B15] text-[#D5B085] shadow-sm'
              : 'bg-white border border-[#2B1B15]/10 text-[#43352E]/80 hover:bg-[#F7F5F0]'
          }`}
        >
          <Wrench size={16} />
          <span>الخدمات والأسعار</span>
        </button>
      </div>

      {/* Tab 1: Incoming Orders and Field Status Controller */}
      {activeTab === 'incoming_orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-[#2B1B15]">إدارة وتحديث الطلبات الميدانية</h2>
              <p className="text-xs text-[#43352E]/70">تحكم بمسار الخدمة وإرسال إشعارات فورية للعميل عند الانطلاق والوصول</p>
            </div>
          </div>

          {/* New Incoming Order Alert for Provider */}
          {orders.some(o => o.status === 'received') && (
            <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-lg shadow-sm">
                  🔔
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black">تنبيه: يوجد طلب صيانة جديد وارد بانتظار المراجعة!</h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    وصلك طلب جديد من العميل. يرجى قبول الطلب وتعيين الفني لبدء التنفيذ.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-600 text-white text-[10px] font-bold shrink-0">
                وارد الآن
              </span>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#2B1B15]/10 text-[#43352E]/70 space-y-2">
              <FileText size={40} className="mx-auto text-[#2B1B15]/20" />
              <p className="text-sm font-bold text-[#2B1B15]">لا توجد طلبات واردة حالياً</p>
              <p className="text-xs">ستظهر الطلبات الجديدة هنا فور قيام العملاء بحجز خدماتك</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-[#2B1B15]/10 shadow-xs space-y-5 transition-all hover:border-[#A26843]/40"
                  >
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2B1B15]/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#A26843]/15 flex items-center justify-center text-[#A26843] font-bold">
                          <Wrench size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[#2B1B15]">{order.serviceTitle}</span>
                            <span className="text-xs text-[#43352E]/60 font-mono">{order.orderNumber}</span>
                          </div>
                          <p className="text-xs text-[#43352E]/70 flex items-center gap-1 mt-0.5">
                            <Calendar size={12} className="text-[#A26843]" />
                            <span>الموعد: {order.scheduledDate}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'arrived'
                            ? 'bg-amber-100 text-amber-900 animate-pulse'
                            : order.status === 'on_the_way'
                            ? 'bg-[#A26843]/15 text-[#A26843]'
                            : 'bg-[#2B1B15]/10 text-[#2B1B15]'
                        }`}>
                          {order.status === 'received' && 'طلب جديد مستلم'}
                          {order.status === 'assigned' && 'تم تعيين فني'}
                          {order.status === 'on_the_way' && 'الفني في الطريق 🚗'}
                          {order.status === 'arrived' && 'وصل الفني للموقع 📍'}
                          {order.status === 'in_progress' && 'جاري تنفيذ الصيانة 🔧'}
                          {order.status === 'completed' && 'تم الإنجاز بنجاح ✅'}
                          {order.status === 'cancelled' && 'ملغي'}
                        </span>
                        
                        <span className="text-xs font-black text-[#A26843] bg-[#F7F5F0] px-3 py-1 rounded-full border border-[#2B1B15]/10">
                          {order.price} ر.س
                        </span>
                      </div>
                    </div>

                    {/* Client & Location details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#F7F5F0] p-3.5 rounded-2xl border border-[#2B1B15]/5">
                      <div className="space-y-1">
                        <span className="text-[#43352E]/70 font-medium block">بيانات العميل:</span>
                        <div className="font-bold text-[#2B1B15] flex items-center gap-2">
                          <span>{order.client.name}</span>
                          <a 
                            href={`tel:${order.client.phone}`}
                            className="text-[#A26843] hover:underline flex items-center gap-0.5 dir-ltr font-normal"
                          >
                            <Phone size={12} />
                            <span>{order.client.phone}</span>
                          </a>
                        </div>
                        {order.notes && (
                          <p className="text-[11px] text-[#43352E]/90 bg-white p-2 rounded-xl border border-[#2B1B15]/5 mt-1">
                            ملاحظة: {order.notes}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[#43352E]/70 font-medium block">موقع العميل:</span>
                        <div className="font-bold text-[#2B1B15] flex items-start gap-1">
                          <MapPin size={14} className="text-[#A26843] mt-0.5 flex-shrink-0" />
                          <span>{order.client.address || order.location.addressName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Worker & Status Quick Actions */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#2B1B15]">الفني المسؤول:</span>
                          <select
                            value={order.assignedWorker?.id || workers[0]?.id || ''}
                            onChange={(e) => {
                              const sel = workers.find((w) => w.id === e.target.value);
                              if (sel) {
                                onUpdateOrderStatus(order.id, order.status, sel.id);
                              }
                            }}
                            className="p-1.5 px-3 rounded-xl border border-[#2B1B15]/15 text-xs text-[#2B1B15] bg-white font-medium focus:border-[#A26843] focus:outline-none"
                          >
                            {workers.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name} ({w.specialty}) - ⭐ {w.rating}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={() => onSelectOrder(order)}
                          className="text-xs text-[#A26843] font-bold hover:underline self-end sm:self-auto cursor-pointer"
                        >
                          عرض تفاصيل الطلب كاملة ←
                        </button>
                      </div>

                      {/* Interactive Dispatch Buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'on_the_way')}
                          className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            order.status === 'on_the_way'
                              ? 'bg-[#A26843] text-white shadow-xs'
                              : 'bg-[#A26843]/10 text-[#A26843] hover:bg-[#A26843]/20 border border-[#A26843]/30'
                          }`}
                        >
                          <Truck size={14} />
                          <span>الفني في الطريق 🚗</span>
                        </button>

                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'arrived')}
                          className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            order.status === 'arrived'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                          }`}
                        >
                          <MapPin size={14} />
                          <span>وصل الفني للموقع 📍</span>
                        </button>

                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'in_progress')}
                          className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            order.status === 'in_progress'
                              ? 'bg-[#2B1B15] text-[#D5B085] shadow-xs'
                              : 'bg-[#F7F5F0] text-[#2B1B15] hover:bg-[#FAF8F5] border border-[#2B1B15]/20'
                          }`}
                        >
                          <Wrench size={14} />
                          <span>جاري العمل 🔧</span>
                        </button>

                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                          className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            order.status === 'completed'
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          <CheckCircle2 size={14} />
                          <span>تم إنجاز الطلب ✅</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: CR Number and Location Management */}
      {activeTab === 'cr_and_location' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#2B1B15]/10 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#2B1B15]/10 pb-4">
            <div>
              <h2 className="text-base font-black text-[#2B1B15] flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#A26843]" />
                <span>إدارة السجل التجاري وتحديد الموقع الجغرافي</span>
              </h2>
              <p className="text-xs text-[#43352E]/70 mt-0.5">
                تثبيت وتحديث بيانات المنشأة ونطاق التغطية للظهور المباشر للعملاء في خريطة المنصة
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveCRAndLocation} className="space-y-5">
            {isCrSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>تم حفظ وتثبيت بيانات السجل التجاري والموقع بنجاح!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#2B1B15] mb-1.5">
                  اسم المنشأة / الاسم التجاري
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[#2B1B15]/15 text-xs text-[#2B1B15] focus:outline-none focus:border-[#A26843] bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B1B15] mb-1.5 flex items-center justify-between">
                  <span>رقم السجل التجاري / وثيقة العمل الحر *</span>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                    <ShieldCheck size={12} />
                    <span>موثق رسمياً</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={crNumber}
                  onChange={(e) => setCrNumber(e.target.value)}
                  placeholder="1010xxxxxx"
                  className="w-full p-3 rounded-2xl border border-[#2B1B15]/15 text-xs text-[#2B1B15] focus:outline-none focus:border-[#A26843] bg-white dir-ltr text-right font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B1B15] mb-1.5">المدينة الرئيسية</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="الرياض"
                  className="w-full p-3 rounded-2xl border border-[#2B1B15]/15 text-xs text-[#2B1B15] focus:outline-none focus:border-[#A26843] bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B1B15] mb-1.5">الحي / المقر</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="حي الصحافة"
                  className="w-full p-3 rounded-2xl border border-[#2B1B15]/15 text-xs text-[#2B1B15] focus:outline-none focus:border-[#A26843] bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B1B15] mb-1.5">
                  نطاق التغطية والاستجابة (كم)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={coverageRadius}
                    onChange={(e) => setCoverageRadius(Number(e.target.value))}
                    className="flex-1 accent-[#A26843]"
                  />
                  <span className="text-xs font-black text-[#A26843] w-14 text-center bg-[#A26843]/10 py-1.5 rounded-xl border border-[#A26843]/20">
                    {coverageRadius} كم
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B1B15] mb-1.5">التخصص المعتمد</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[#2B1B15]/15 text-xs text-[#2B1B15] focus:outline-none focus:border-[#A26843] bg-white font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 rounded-2xl brand-gradient-btn text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md"
            >
              حفظ وتثبيت البيانات
            </button>
          </form>
        </div>
      )}

      {/* Tab: Bank Details */}
      {activeTab === 'bank_details' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#2B1B15]/10 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#2B1B15]/10 pb-4">
            <div>
              <h2 className="text-base font-black text-[#2B1B15] flex items-center gap-2">
                <CreditCard size={20} className="text-[#A26843]" />
                <span>الحساب البنكي لتحويل العوائد المالية</span>
              </h2>
              <p className="text-xs text-[#43352E]/70 mt-0.5">
                يتم إيداع مستحقات المنشأة بعد خصم عمولة المنصة تلقائياً على هذا الحساب
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveBankDetails} className="space-y-4">
            {isBankSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>تم تحديث الحساب البنكي بنجاح!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#2B1B15] mb-1.5">اسم البنك</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[#2B1B15]/15 text-xs text-[#2B1B15] bg-white font-bold"
                >
                  <option value="مصرف الراجحي">مصرف الراجحي</option>
                  <option value="البنك الأهلي السعودي (SNB)">البنك الأهلي السعودي (SNB)</option>
                  <option value="بنك الرياض">بنك الرياض</option>
                  <option value="مصرف الإنماء">مصرف الإنماء</option>
                  <option value="البنك السعودي الأول (SAB)">البنك السعودي الأول (SAB)</option>
                  <option value="البنك العربي الوطني (ANB)">البنك العربي الوطني (ANB)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B1B15] mb-1.5">اسم صاحب الحساب المعتمد</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[#2B1B15]/15 text-xs text-[#2B1B15] bg-white font-bold"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#2B1B15] mb-1.5">
                  رقم الآيبان البنكي (IBAN) يبدأ بـ SA
                </label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="SA0000000000000000000000"
                  className="w-full p-3.5 rounded-2xl border border-[#2B1B15]/15 text-xs font-mono font-bold text-[#2B1B15] bg-[#F7F5F0] dir-ltr text-right uppercase tracking-wider"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-3 px-8 rounded-2xl brand-gradient-btn text-white font-bold text-xs sm:text-sm cursor-pointer shadow-md"
            >
              حفظ الحساب البنكي
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Workers Management and Ratings */}
      {activeTab === 'workers_ratings' && (
        <div className="space-y-6">
          {/* Workers Section */}
          <div className="bg-white rounded-3xl p-6 border border-[#2B1B15]/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-[#2B1B15] flex items-center gap-2">
                  <Users size={20} className="text-[#A26843]" />
                  <span>طاقم الفنيين والعمال ({workers.length})</span>
                </h2>
                <p className="text-xs text-[#43352E]/70 mt-0.5">
                  إدارة العمال، تخصصاتهم، ومتابعة تقييم أدائهم الميداني
                </p>
              </div>

              <button
                onClick={() => setIsAddWorkerOpen(!isAddWorkerOpen)}
                className="px-4 py-2 rounded-2xl bg-[#A26843]/10 hover:bg-[#A26843]/15 text-[#A26843] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-[#A26843]/20"
              >
                <Plus size={16} />
                <span>إضافة فني جديد</span>
              </button>
            </div>

            {/* Add Worker Form Modal/Inline */}
            {isAddWorkerOpen && (
              <form onSubmit={handleAddWorker} className="p-4 bg-[#F7F5F0] rounded-2xl border border-[#2B1B15]/10 space-y-3 animate-fade-in">
                <h3 className="text-xs font-bold text-[#2B1B15]">بيانات الفني الجديد</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#2B1B15] mb-1">اسم الفني *</label>
                    <input
                      type="text"
                      value={newWorkerName}
                      onChange={(e) => setNewWorkerName(e.target.value)}
                      placeholder="الاسم الثلاثي"
                      required
                      className="w-full p-2.5 rounded-xl border border-[#2B1B15]/15 text-xs text-[#2B1B15] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2B1B15] mb-1">رقم الجوال *</label>
                    <input
                      type="tel"
                      value={newWorkerPhone}
                      onChange={(e) => setNewWorkerPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      required
                      className="w-full p-2.5 rounded-xl border border-[#2B1B15]/15 text-xs text-[#2B1B15] bg-white dir-ltr text-right font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2B1B15] mb-1">التخصص</label>
                    <select
                      value={newWorkerSpecialty}
                      onChange={(e) => setNewWorkerSpecialty(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#2B1B15]/15 text-xs text-[#2B1B15] bg-white"
                    >
                      <option value="تكييف وتبريد">تكييف وتبريد</option>
                      <option value="كهرباء وإنارة">كهرباء وإنارة</option>
                      <option value="سباكة وصحية">سباكة وصحية</option>
                      <option value="نظافة وتعقيم">نظافة وتعقيم</option>
                      <option value="دهانات وتشطيب">دهانات وتشطيب</option>
                      <option value="أنظمة أمنية وشبكات">أنظمة أمنية وشبكات</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#2B1B15] mb-1">رقم الهوية / الإقامة</label>
                    <input
                      type="text"
                      value={newWorkerId}
                      onChange={(e) => setNewWorkerId(e.target.value)}
                      placeholder="10xxxxxxxx"
                      className="w-full p-2.5 rounded-xl border border-[#2B1B15]/15 text-xs text-[#2B1B15] bg-white dir-ltr text-right font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl brand-gradient-btn text-white text-xs font-bold cursor-pointer"
                  >
                    حفظ الفني
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddWorkerOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#43352E]/70 hover:text-[#2B1B15] cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}

            {/* Workers List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  className="p-4 rounded-2xl border border-[#2B1B15]/10 bg-white hover:border-[#A26843]/40 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#2B1B15] text-[#D5B085] flex items-center justify-center font-bold text-sm">
                        {worker.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-[#2B1B15]">{worker.name}</h3>
                        <p className="text-xs text-[#A26843] font-bold">{worker.specialty}</p>
                        <p className="text-[11px] text-[#43352E]/70 dir-ltr text-right font-mono">{worker.phone}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteWorker(worker.id)}
                      className="text-gray-400 hover:text-red-500 p-1.5 transition-colors cursor-pointer"
                      title="حذف الفني"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#2B1B15]/5 text-center text-xs">
                    <div className="p-2 bg-[#F7F5F0] rounded-xl">
                      <span className="block text-[10px] text-[#43352E]/60">التقييم</span>
                      <span className="font-bold text-amber-500 flex items-center justify-center gap-0.5 mt-0.5">
                        <Star size={12} fill="currentColor" />
                        <span>{worker.rating}</span>
                      </span>
                    </div>

                    <div className="p-2 bg-[#F7F5F0] rounded-xl">
                      <span className="block text-[10px] text-[#43352E]/60">المهام المنجزة</span>
                      <span className="font-bold text-[#2B1B15] mt-0.5 block">{worker.completedJobs}</span>
                    </div>

                    <div className="p-2 bg-[#F7F5F0] rounded-xl">
                      <span className="block text-[10px] text-[#43352E]/60">الحالة</span>
                      <span className={`text-[10px] font-bold mt-0.5 block ${
                        worker.isAvailable ? 'text-emerald-700' : 'text-gray-500'
                      }`}>
                        {worker.isAvailable ? 'متاح للعمل' : 'في مهمة'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client Reviews Section */}
          <div className="bg-white rounded-3xl p-6 border border-[#2B1B15]/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-[#2B1B15] flex items-center gap-2">
                  <Star size={20} className="text-amber-500 fill-amber-500" />
                  <span>سجل تقييمات وآراء العملاء ({reviews.length})</span>
                </h2>
                <p className="text-xs text-[#43352E]/70 mt-0.5">
                  آراء العملاء بعد اكتمال الصيانة الميدانية
                </p>
              </div>

              <div className="flex items-center gap-1 text-sm font-black text-[#2B1B15] bg-amber-50 border border-amber-200 px-3 py-1 rounded-2xl">
                <Star size={16} className="text-amber-500 fill-amber-500" />
                <span>4.9 من 5.0</span>
              </div>
            </div>

            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#2B1B15]/5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#2B1B15]">{rev.clientName}</span>
                      <span className="text-[11px] text-[#43352E]/50">• {rev.date}</span>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill={i < Math.floor(rev.rating) ? 'currentColor' : 'none'}
                          className={i < Math.floor(rev.rating) ? 'text-amber-500' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[#43352E]/80 leading-relaxed">{rev.comment}</p>

                  <div className="flex items-center gap-3 text-[11px] text-[#43352E]/60 pt-1">
                    <span>الخدمة: <strong className="text-[#2B1B15]">{rev.serviceTitle}</strong></span>
                    {rev.workerName && (
                      <span>الفني المنفذ: <strong className="text-[#A26843]">{rev.workerName}</strong></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Services and Pricing */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-3xl p-6 border border-[#2B1B15]/10 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-black text-[#2B1B15] flex items-center gap-2">
              <Wrench size={20} className="text-[#A26843]" />
              <span>الخدمات المتاحة والتسعير الأساسي</span>
            </h2>
            <p className="text-xs text-[#43352E]/70 mt-0.5">
              قائمة الخدمات التي تظهر للعملاء في تطبيق المنصة
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SERVICE_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl border border-[#2B1B15]/10 bg-white flex items-center justify-between gap-3"
              >
                <div>
                  <h3 className="text-xs font-bold text-[#2B1B15]">{cat.title}</h3>
                  <p className="text-[11px] text-[#43352E]/70 line-clamp-1 mt-0.5">{cat.description}</p>
                </div>
                <div className="text-left flex-shrink-0">
                  <span className="text-xs font-black text-[#A26843] block">يبدأ من {cat.priceStart} ر.س</span>
                  <span className="text-[10px] text-emerald-700 font-bold">نشط بالمنصة</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
