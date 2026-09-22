import { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck,
  Building2,
  AlertCircle
} from 'lucide-react';
import { ServiceCategory, Order, PaymentMethodType, UserProfile } from '../types';
import { PaymentMethodBadge } from './PaymentMethodBadge';
import { sendDevicePushNotification } from '../lib/notifications';

interface BookingPageProps {
  category?: ServiceCategory | null;
  allCategories: ServiceCategory[];
  providers?: UserProfile[];
  onConfirmBooking: (newOrder: Order) => void;
  onBack: () => void;
  user: UserProfile;
}

export function BookingPage({
  category,
  allCategories = [],
  providers = [],
  onConfirmBooking,
  onBack,
  user,
}: BookingPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    category?.id || allCategories[0]?.id || ''
  );
  const [dateType, setDateType] = useState<'asap' | 'schedule'>('asap');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00 ص');

  const [clientName, setClientName] = useState(user.name !== 'المستخدم' ? user.name : '');
  const [clientPhone, setClientPhone] = useState(user.phone || '');
  const [address, setAddress] = useState(user.city !== 'المملكة العربية السعودية' ? (user.district ? `${user.city} - ${user.district}` : user.city) : '');
  const [notes, setNotes] = useState('');

  // Available real verified providers
  const availableProviders = useMemo(() => {
    return providers.filter(
      (p) => p.role === 'provider' && p.providerDetails?.verificationStatus !== 'rejected'
    );
  }, [providers]);

  // Provider Selection
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    availableProviders[0]?.id || ''
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('apple_pay');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safe category lookup
  const currentCat = allCategories.find((c) => c.id === selectedCategory) || allCategories[0] || null;
  const basePrice = currentCat ? currentCat.priceStart : 0;
  const vatAmount = Math.round(basePrice * 0.15);
  const totalPrice = basePrice + vatAmount;
  const installmentAmount = (totalPrice / 4).toFixed(1);

  const chosenProvider = useMemo(() => {
    if (!selectedProviderId && availableProviders.length > 0) {
      return availableProviders[0];
    }
    return availableProviders.find((p) => p.id === selectedProviderId) || availableProviders[0] || null;
  }, [selectedProviderId, availableProviders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (user.isBanned) {
      alert('تم إيقاف هذا الحساب من قبل إدارة المنصة. لا يمكنك تقديم طلبات جديدة.');
      return;
    }

    if (availableProviders.length === 0) {
      alert('عذراً، لا يوجد مقدمو خدمة متاحون حالياً في المنظومة. لا يمكن تقديم الطلب الآن.');
      return;
    }

    if (!currentCat) {
      alert('يرجى اختيار خدمة صيانة صالحة للمتابعة.');
      return;
    }

    if (!clientName.trim() || !clientPhone.trim() || !address.trim()) {
      alert('يرجى تعبئة جميع الحقول المطلوبة (الاسم، الجوال، العنوان).');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const orderNum = `#SRV-${randomNum}`;

      const dateStr = dateType === 'asap' 
        ? 'في أقرب وقت متاح' 
        : `${scheduledDate || 'الموعد المحدد'} - ${scheduledTime}`;

      const isInstallment = paymentMethod === 'tabby' || paymentMethod === 'tamara';

      const assignedProviderName = chosenProvider?.providerDetails?.businessName || chosenProvider?.name || 'مقدم خدمة معتمد';
      const assignedProviderId = chosenProvider?.id || availableProviders[0]?.id || '';

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: orderNum,
        serviceTitle: currentCat.title,
        category: currentCat.id,
        client: {
          name: clientName,
          phone: clientPhone,
          address: address,
        },
        status: 'received',
        createdAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        scheduledDate: dateStr,
        price: totalPrice,
        paymentMethod: paymentMethod,
        paymentStatus: isInstallment ? 'installments' : 'paid',
        installmentDetails: isInstallment ? {
          provider: paymentMethod,
          monthlyAmount: parseFloat(installmentAmount),
          installmentsCount: 4,
        } : undefined,
        notes: notes || 'طلب صيانة',
        providerId: assignedProviderId,
        providerName: assignedProviderName,
        location: {
          lat: 24.7136,
          lng: 46.6753,
          addressName: address,
        },
      };

      // Native push notifications: To Client and To Assigned Provider
      sendDevicePushNotification('تم إرسال طلبك بنجاح ✅', {
        body: `تم إرسال طلب ${currentCat.title} إلى ${assignedProviderName}`,
        tag: `order-${newOrder.id}`,
      });

      sendDevicePushNotification(`طلب صيانة وارد لـ ${assignedProviderName} 🔔`, {
        body: `طلب جديد (${currentCat.title}) من العميل ${clientName} بمبلغ ${totalPrice} ر.س`,
        tag: `provider-order-${newOrder.id}`,
      });

      onConfirmBooking(newOrder);
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-right pb-16 font-['Tajawal',sans-serif]">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-3xl border border-[#2B1B15]/10 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-[#2B1B15]/5 hover:bg-[#2B1B15]/10 flex items-center justify-center text-[#2B1B15] transition-colors cursor-pointer"
            title="رجوع"
          >
            <ArrowRight size={18} />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-[#2B1B15]">طلب خدمة ميدانية</h1>
            <p className="text-[11px] text-[#43352E]/70 font-semibold">اختر الخدمة ومقدم الخدمة المعتمد</p>
          </div>
        </div>
      </div>

      {/* Warning if no providers */}
      {availableProviders.length === 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertCircle size={20} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-black text-amber-950">لا يوجد مقدمو خدمة متاحون حالياً</h3>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              عذراً، لا يتوفر حالياً مزودو خدمة معتمدون لاستقبال الطلبات. لا يمكن إرسال الطلب في الوقت الحالي حتى يتم تفعيل مقدمي خدمة بالمنصة.
            </p>
          </div>
        </div>
      )}

      {/* Warning if no categories */}
      {allCategories.length === 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertCircle size={20} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-black text-amber-950">لا توجد باقات خدمات مضافة</h3>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              يرجى إضافة باقات الخدمات والأسعار أولاً من لوحة تحكم الإدارة لتمكين العملاء من إرسال الطلبات.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Choice */}
        {allCategories.length > 0 && (
          <div className="bg-white p-5 rounded-3xl border border-[#2B1B15]/10 shadow-xs space-y-3">
            <label className="block text-xs sm:text-sm font-black text-[#2B1B15]">1. اختر نوع الخدمة</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {allCategories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                    (selectedCategory === c.id || (!selectedCategory && currentCat?.id === c.id))
                      ? 'border-[#A26843] bg-[#A26843]/10 text-[#2B1B15] font-black ring-1 ring-[#A26843]'
                      : 'border-[#2B1B15]/10 bg-white text-[#43352E] hover:border-[#A26843]/40'
                  }`}
                >
                  <span className="block text-xs sm:text-sm font-bold truncate">{c.title}</span>
                  <span className="text-[11px] text-[#A26843] font-bold mt-1 block">
                    يبدأ من {c.priceStart} ر.س
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PROVIDER SELECTION */}
        <div className="bg-white p-5 rounded-3xl border border-[#2B1B15]/10 shadow-xs space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-black text-[#2B1B15]">
              2. اختيار مقدم الخدمة
            </label>
            <p className="text-[11px] text-[#43352E]/70 font-semibold mt-0.5">
              اختر المنشأة المرخصة والمقدم المعتمد لتنفيذ طلبك
            </p>
          </div>

          {availableProviders.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#2B1B15]/10 text-center text-xs text-[#43352E]/70">
              لا توجد منشآت أو مقدمي خدمة متاحين حالياً
            </div>
          ) : (
            <div className="space-y-2.5">
              {availableProviders.map((prov) => {
                const isSelected = selectedProviderId === prov.id || (availableProviders.length === 1);
                const bName = prov.providerDetails?.businessName || prov.name;
                const crNum = prov.providerDetails?.crNumber;
                const spec = prov.providerDetails?.specialty || 'صيانة عامة';

                return (
                  <div
                    key={prov.id}
                    onClick={() => setSelectedProviderId(prov.id)}
                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#A26843] bg-[#A26843]/10 ring-1 ring-[#A26843]'
                        : 'border-[#2B1B15]/10 hover:border-[#A26843]/40 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#2B1B15]/10 text-[#2B1B15] flex items-center justify-center font-black">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black text-[#2B1B15]">{bName}</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            <ShieldCheck size={11} />
                            معتمد
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#43352E]/80 mt-1">
                          <span>{spec}</span>
                          {crNum && (
                            <>
                              <span>•</span>
                              <span className="text-[10px] font-mono">سجل: {crNum}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{prov.city}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-[#A26843] bg-[#A26843] text-white' : 'border-[#2B1B15]/20'
                    }`}>
                      {isSelected && <CheckCircle2 size={13} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Contact & Address */}
        <div className="bg-white p-5 rounded-3xl border border-[#2B1B15]/10 shadow-xs space-y-4">
          <h3 className="text-xs sm:text-sm font-black text-[#2B1B15]">3. بيانات الطلب والموقع</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2B1B15] mb-1">الاسم الكامل *</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="الاسم الكريم"
                required
                className="w-full p-3 rounded-2xl border border-[#2B1B15]/15 bg-[#F7F5F0] text-xs font-bold text-[#2B1B15] focus:outline-none focus:border-[#A26843]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B1B15] mb-1">رقم الجوال *</label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="05xxxxxxxx"
                required
                className="w-full p-3 rounded-2xl border border-[#2B1B15]/15 bg-[#F7F5F0] text-xs font-bold text-[#2B1B15] focus:outline-none focus:border-[#A26843] dir-ltr text-right font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2B1B15] mb-1">العنوان والموقع *</label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="المدينة، الحي، اسم الشارع"
                required
                className="w-full p-3 pr-10 rounded-2xl border border-[#2B1B15]/15 bg-[#F7F5F0] text-xs font-bold text-[#2B1B15] focus:outline-none focus:border-[#A26843]"
              />
              <MapPin size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A26843]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2B1B15] mb-1">تفاصيل وملاحظات إضافية (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="اكتب أي تفاصيل توضح المشكلة أو رقم الشقة..."
              className="w-full p-3 rounded-2xl border border-[#2B1B15]/15 bg-[#F7F5F0] text-xs font-bold text-[#2B1B15] focus:outline-none focus:border-[#A26843] resize-none"
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-white p-5 rounded-3xl border border-[#2B1B15]/10 shadow-xs space-y-3">
          <label className="block text-xs sm:text-sm font-black text-[#2B1B15]">4. موعد الحضور</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDateType('asap')}
              className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                dateType === 'asap'
                  ? 'border-[#A26843] bg-gradient-to-r from-[#2B1B15] to-[#43352E] text-[#D5B085] font-black shadow-xs'
                  : 'border-[#2B1B15]/10 bg-white text-[#43352E]'
              }`}
            >
              <Clock size={16} />
              <span className="text-xs font-bold">في أقرب وقت متاح</span>
            </button>
            <button
              type="button"
              onClick={() => setDateType('schedule')}
              className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                dateType === 'schedule'
                  ? 'border-[#A26843] bg-gradient-to-r from-[#2B1B15] to-[#43352E] text-[#D5B085] font-black shadow-xs'
                  : 'border-[#2B1B15]/10 bg-white text-[#43352E]'
              }`}
            >
              <Calendar size={16} />
              <span className="text-xs font-bold">جدولة موعد لاحق</span>
            </button>
          </div>

          {dateType === 'schedule' && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required={dateType === 'schedule'}
                className="p-3 rounded-2xl border border-[#2B1B15]/15 text-xs font-bold text-[#2B1B15] bg-[#F7F5F0] focus:outline-none focus:border-[#A26843]"
              />
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="مثال: 04:00 عصراً"
                className="p-3 rounded-2xl border border-[#2B1B15]/15 text-xs font-bold text-[#2B1B15] bg-[#F7F5F0] focus:outline-none focus:border-[#A26843]"
              />
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-5 rounded-3xl border border-[#2B1B15]/10 shadow-xs space-y-3">
          <label className="block text-xs sm:text-sm font-black text-[#2B1B15]">5. طريقة الدفع</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <PaymentMethodBadge
              method="apple_pay"
              isSelected={paymentMethod === 'apple_pay'}
              onSelect={() => setPaymentMethod('apple_pay')}
            />
            <PaymentMethodBadge
              method="google_pay"
              isSelected={paymentMethod === 'google_pay'}
              onSelect={() => setPaymentMethod('google_pay')}
            />
            <PaymentMethodBadge
              method="visa"
              isSelected={paymentMethod === 'visa'}
              onSelect={() => setPaymentMethod('visa')}
            />
            <PaymentMethodBadge
              method="mastercard"
              isSelected={paymentMethod === 'mastercard'}
              onSelect={() => setPaymentMethod('mastercard')}
            />
            <PaymentMethodBadge
              method="tabby"
              isSelected={paymentMethod === 'tabby'}
              onSelect={() => setPaymentMethod('tabby')}
              price={totalPrice}
            />
            <PaymentMethodBadge
              method="tamara"
              isSelected={paymentMethod === 'tamara'}
              onSelect={() => setPaymentMethod('tamara')}
              price={totalPrice}
            />
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-white p-5 rounded-3xl border border-[#2B1B15]/10 shadow-xs space-y-2 text-xs">
          <div className="flex justify-between text-[#43352E]/70">
            <span>تكلفة الخدمة الأساسية:</span>
            <span className="font-bold text-[#2B1B15]">{basePrice} ر.س</span>
          </div>
          <div className="flex justify-between text-[#43352E]/70">
            <span>ضريبة القيمة المضافة (15%):</span>
            <span className="font-bold text-[#2B1B15]">{vatAmount} ر.س</span>
          </div>
          <div className="flex justify-between text-base font-black text-[#2B1B15] pt-2 border-t border-[#2B1B15]/10">
            <span>المجموع النهائي:</span>
            <span className="text-[#A26843]">{totalPrice} ر.س</span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || availableProviders.length === 0 || !currentCat}
          className="w-full py-4 px-6 rounded-2xl brand-gradient-btn text-white font-black text-sm sm:text-base shadow-lg shadow-[#A26843]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : availableProviders.length === 0 ? (
            <span>لا يوجد مقدمو خدمة متاحون حالياً للطلب</span>
          ) : !currentCat ? (
            <span>يرجى إضافة خدمة صيانة أولاً</span>
          ) : (
            <span>تأكيد الطلب والحجز ({totalPrice} ر.س)</span>
          )}
        </button>
      </form>
    </div>
  );
}
