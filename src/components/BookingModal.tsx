import { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  ShieldCheck, 
  CreditCard,
  Percent,
  Sparkles,
  Info
} from 'lucide-react';
import { ServiceCategory, Order, PaymentMethodType, UserProfile } from '../types';
import { PaymentMethodBadge } from './PaymentMethodBadge';
import confetti from 'canvas-confetti';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: ServiceCategory | null;
  allCategories: ServiceCategory[];
  onConfirmBooking: (newOrder: Order) => void;
  user: UserProfile;
}

export function BookingModal({
  isOpen,
  onClose,
  category,
  allCategories,
  onConfirmBooking,
  user,
}: BookingModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    category?.id || allCategories[0]?.id || 'ac_cooling'
  );
  const [dateType, setDateType] = useState<'asap' | 'schedule'>('asap');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00 ص');
  
  // Real client form info
  const [clientName, setClientName] = useState(user.name !== 'المستخدم' ? user.name : '');
  const [clientPhone, setClientPhone] = useState(user.phone || '');
  const [address, setAddress] = useState(user.city !== 'المملكة العربية السعودية' ? user.city : '');
  const [notes, setNotes] = useState('');
  
  // Payment methods: visa, mastercard, apple_pay, google_pay, tabby, tamara
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('apple_pay');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');

  if (!isOpen) return null;

  const currentCat = allCategories.find((c) => c.id === selectedCategory) || allCategories[0];
  const basePrice = currentCat.priceStart;
  const vatAmount = Math.round(basePrice * 0.15);
  const totalPrice = basePrice + vatAmount;

  const installmentAmount = (totalPrice / 4).toFixed(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !address.trim()) {
      alert('يرجى تعبئة جميع الحقول المطلوبة (الاسم، الجوال، العنوان).');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FF6B53', '#FF9EB4', '#2B1B3D'],
        });
      } catch {
        // Safe fallback
      }

      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const orderNum = `#SRV-${randomNum}`;
      setCreatedOrderNumber(orderNum);

      const dateStr = dateType === 'asap' 
        ? 'في أقرب وقت متاح' 
        : `${scheduledDate || 'الموعد المحدد'} - الساعة ${scheduledTime}`;

      const isInstallment = paymentMethod === 'tabby' || paymentMethod === 'tamara';

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
        status: 'on_the_way',
        scheduledDate: dateStr,
        price: totalPrice,
        paymentMethod: paymentMethod,
        paymentStatus: isInstallment ? 'installments' : 'paid',
        installmentDetails: isInstallment ? {
          provider: paymentMethod as 'tabby' | 'tamara',
          monthlyAmount: Number(installmentAmount),
          installmentsCount: 4,
        } : undefined,
        location: {
          addressName: address,
          lat: 24.7742,
          lng: 46.6385,
        },
        assignedWorker: {
          id: 'w-1',
          name: 'م. راشد القحطاني',
          rating: 4.9,
          reviewsCount: 120,
          completedJobs: 142,
          isAvailable: true,
          phone: '0555123456',
          specialty: currentCat.title,
        },
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      onConfirmBooking(newOrder);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto font-['Tajawal',sans-serif]">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#2B1B3D]/10 overflow-hidden my-8 text-right animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#2B1B3D] to-[#3C2E4C] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF9EB4]/20 border border-[#FF9EB4]/40 flex items-center justify-center text-[#FF9EB4]">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black">حجز خدمة صيانة فورية</h3>
              <p className="text-xs text-[#FDFBF5]/70">تأكيد الحجز وضمان صيانة معتمد</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 sm:p-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <CheckCircle size={44} />
            </div>

            <div className="space-y-2">
              <h4 className="text-xl font-black text-[#2B1B3D]">تم تأكيد طلبك وحجز الفني بنجاح!</h4>
              <p className="text-sm text-[#3C2E4C]/80">
                رقم الطلب: <span className="font-mono font-black text-[#FF6B53]">{createdOrderNumber}</span>
              </p>
              <p className="text-xs text-[#3C2E4C]/60 max-w-md mx-auto">
                الفني المعتمد في طريقه إليك الآن، وتم إرسال تفاصيل الفاتورة الإلكترونية مع الضمان المعتمد.
              </p>
            </div>

            <div className="p-4 bg-[#FDFBF5] rounded-2xl border border-[#2B1B3D]/10 text-xs text-[#3C2E4C] flex items-center justify-center gap-2">
              <ShieldCheck size={16} className="text-[#FF6B53]" />
              <span>مشمول بضمان الصيانة الذهبي المعتمد لمدة 30 يوماً</span>
            </div>

            <button
              onClick={onClose}
              className="w-full max-w-xs py-3.5 rounded-2xl brand-gradient-btn text-white text-xs font-black shadow-lg shadow-[#FF6B53]/20 mx-auto cursor-pointer"
            >
              متابعة الطلب في لوحة التحكم
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm max-h-[75vh] overflow-y-auto">
            
            {/* Category selection */}
            <div>
              <label className="block font-bold text-[#2B1B3D] mb-2">1. الخدمة المطلوبة</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'border-[#FF6B53] bg-[#FF6B53]/10 text-[#2B1B3D] shadow-xs'
                        : 'border-[#2B1B3D]/10 bg-white hover:border-[#FF6B53]/40 text-[#3C2E4C]'
                    }`}
                  >
                    <span className="font-bold text-xs">{cat.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Details Form */}
            <div className="bg-[#FDFBF5] p-4 rounded-2xl border border-[#2B1B3D]/10 space-y-3">
              <h4 className="font-bold text-[#2B1B3D] text-xs sm:text-sm flex items-center gap-1.5">
                <span>2. بيانات التواصل وموقع الخدمة</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#2B1B3D] mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="مثال: عبد العزيز المنصور"
                    required
                    className="w-full p-2.5 rounded-xl border border-[#2B1B3D]/15 bg-white text-xs text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#2B1B3D] mb-1">رقم الجوال *</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    required
                    className="w-full p-2.5 rounded-xl border border-[#2B1B3D]/15 bg-white text-xs text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] dir-ltr text-right font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2B1B3D] mb-1">العنوان التفصيلي للزيارة *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="المدينة، اسم الحي، الشارع، رقم المبنى"
                    required
                    className="w-full p-2.5 pr-9 rounded-xl border border-[#2B1B3D]/15 bg-white text-xs text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53]"
                  />
                  <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FF6B53]" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2B1B3D] mb-1">ملاحظات أو تفاصيل العطل (اختياري)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="وصف المشكلة لمساعدة فريق الصيانة..."
                  className="w-full p-2.5 rounded-xl border border-[#2B1B3D]/15 bg-white text-xs text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] resize-none"
                />
              </div>
            </div>

            {/* Timing */}
            <div>
              <label className="block font-bold text-[#2B1B3D] mb-2">3. موعد الحضور المطلوب</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDateType('asap')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    dateType === 'asap'
                      ? 'border-[#FF6B53] bg-[#FF6B53] text-white font-bold shadow-xs'
                      : 'border-[#2B1B3D]/10 bg-white text-[#3C2E4C] hover:border-[#FF6B53]/30'
                  }`}
                >
                  <Clock size={16} />
                  <span>في أقرب وقت متاح</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDateType('schedule')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    dateType === 'schedule'
                      ? 'border-[#FF6B53] bg-[#FF6B53] text-white font-bold shadow-xs'
                      : 'border-[#2B1B3D]/10 bg-white text-[#3C2E4C] hover:border-[#FF6B53]/30'
                  }`}
                >
                  <Calendar size={16} />
                  <span>جدولة موعد محدد</span>
                </button>
              </div>

              {dateType === 'schedule' && (
                <div className="grid grid-cols-2 gap-3 mt-3 animate-in fade-in duration-150">
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required={dateType === 'schedule'}
                    className="p-2.5 rounded-xl border border-[#2B1B3D]/15 text-xs text-[#2B1B3D] bg-white focus:outline-none focus:border-[#FF6B53]"
                  />
                  <input
                    type="text"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    placeholder="مثال: 04:00 عصراً"
                    className="p-2.5 rounded-xl border border-[#2B1B3D]/15 text-xs text-[#2B1B3D] bg-white focus:outline-none focus:border-[#FF6B53]"
                  />
                </div>
              )}
            </div>

            {/* Payment Methods Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block font-bold text-[#2B1B3D]">4. اختر طريقة الدفع المعتمدة</label>
                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck size={14} /> بوابات دفع موثقة 100%
                </span>
              </div>

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
            <div className="p-4 bg-[#FDFBF5] rounded-2xl border border-[#2B1B3D]/10 space-y-2">
              <div className="flex justify-between text-xs text-[#3C2E4C]">
                <span>أجور الفحص والخدمة</span>
                <span className="font-bold">{basePrice} ر.س</span>
              </div>
              <div className="flex justify-between text-xs text-[#3C2E4C]">
                <span>ضريبة القيمة المضافة (15%)</span>
                <span>{vatAmount} ر.س</span>
              </div>
              <div className="border-t border-[#2B1B3D]/10 pt-2 flex justify-between font-black text-sm text-[#2B1B3D]">
                <span>المجموع النهائي شامل الضريبة</span>
                <span className="text-[#FF6B53] text-base">{totalPrice} ر.س</span>
              </div>

              {(paymentMethod === 'tabby' || paymentMethod === 'tamara') && (
                <div className="pt-2 text-center text-[11px] font-bold text-emerald-800 bg-emerald-50 py-1.5 rounded-xl border border-emerald-200">
                  قسّم فاتورتك على 4 دفعات بقيمة <strong>{installmentAmount} ر.س / شهرياً</strong> بدون فوائد أو رسوم
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl brand-gradient-btn text-white text-sm font-black shadow-xl shadow-[#FF6B53]/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>جاري إرسال الطلب وحجز الفني...</span>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>تأكيد الحجز والدفع ({totalPrice} ر.س)</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
