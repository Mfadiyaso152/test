import { useState } from 'react';
import { 
  ArrowRight, 
  MapPin, 
  Clock, 
  Calendar, 
  CreditCard, 
  FileText, 
  Star, 
  X, 
  Trash2,
  User,
  Phone,
  Truck,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface OrderDetailsPageProps {
  order: Order;
  onBack: () => void;
  onCancelOrder: (orderId: string) => void;
  onRateOrder?: (orderId: string, rating: number, comment: string, workerRating?: number) => void;
}

export function OrderDetailsPage({
  order,
  onBack,
  onCancelOrder,
  onRateOrder,
}: OrderDetailsPageProps) {
  const [showInvoice, setShowInvoice] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(order.rating || 5);
  const [workerRating, setWorkerRating] = useState(order.workerRating || 5);
  const [reviewText, setReviewText] = useState(order.reviewComment || '');

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'received':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#2B1B3D]/10 text-[#2B1B3D] border border-[#2B1B3D]/20">طلب جديد</span>;
      case 'assigned':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FF6B53]/10 text-[#FF6B53] border border-[#FF6B53]/20">تم تعيين الفني</span>;
      case 'on_the_way':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FF6B53] text-white flex items-center gap-1"><Truck size={12} /> الفني في الطريق 🚗</span>;
      case 'arrived':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FF9EB4] text-[#2B1B3D] flex items-center gap-1 animate-pulse"><MapPin size={12} /> وصل الفني للموقع 📍</span>;
      case 'in_progress':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#2B1B3D] text-[#FF9EB4] animate-pulse">جاري تنفيذ الصيانة 🔧</span>;
      case 'completed':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600/15 text-emerald-800 border border-emerald-600/30 flex items-center gap-1"><CheckCircle2 size={12} /> مكتمل ✅</span>;
      case 'cancelled':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 border border-rose-500/20">ملغي</span>;
    }
  };

  const getPaymentName = (method: string) => {
    switch (method) {
      case 'visa': return 'فيزا (Visa)';
      case 'mastercard': return 'ماستركارد (Mastercard)';
      case 'apple_pay': return 'أبل باي (Apple Pay)';
      case 'google_pay': return 'قوقل باي (Google Pay)';
      case 'tabby': return 'تابي';
      case 'tamara': return 'تمارا';
      default: return method;
    }
  };

  const handleSaveRating = () => {
    if (onRateOrder) {
      onRateOrder(order.id, rating, reviewText, workerRating);
    }
    setShowRating(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-right pb-16 font-['Tajawal',sans-serif]">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-3xl border border-[#2B1B3D]/10 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-2xl bg-[#2B1B3D]/5 hover:bg-[#2B1B3D]/10 flex items-center justify-center text-[#2B1B3D] transition-colors cursor-pointer"
            title="رجوع"
          >
            <ArrowRight size={18} />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-[#2B1B3D]">تفاصيل الطلب</h1>
            <span className="text-xs text-[#3C2E4C]/60 font-mono">{order.orderNumber}</span>
          </div>
        </div>

        <div>
          {getStatusBadge(order.status)}
        </div>
      </div>

      {/* Arrival Alert Banner if arrived */}
      {order.status === 'arrived' && (
        <div className="p-4 bg-[#FF9EB4]/20 border border-[#FF9EB4]/40 rounded-3xl flex items-center gap-3 text-[#2B1B3D] animate-bounce-subtle">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B53] text-white flex items-center justify-center flex-shrink-0">
            <MapPin size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black">وصل الفني إلى موقعك الآن! 📍</h3>
            <p className="text-xs text-[#3C2E4C] mt-0.5">
              الفني متواجد عند العنوان المسجل، يرجى استقباله لبدء إجراءات الفحص والصيانة.
            </p>
          </div>
        </div>
      )}

      {/* Assigned Worker Card */}
      {order.assignedWorker && (
        <div className="bg-white rounded-3xl p-5 border border-[#2B1B3D]/10 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#2B1B3D] flex items-center gap-1.5">
              <User size={15} className="text-[#FF6B53]" />
              <span>الفني المسؤول عن تنفيذ الطلب</span>
            </span>
            <span className="text-xs font-bold text-[#FF6B53] flex items-center gap-1">
              <Star size={13} fill="currentColor" />
              <span>{order.assignedWorker.rating || 4.9} ({order.assignedWorker.completedJobs || 120}+ خدمة)</span>
            </span>
          </div>

          <div className="p-3.5 bg-[#FDFBF5] rounded-2xl border border-[#2B1B3D]/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2B1B3D] text-[#FF9EB4] font-bold text-base flex items-center justify-center">
                {order.assignedWorker.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-black text-[#2B1B3D]">{order.assignedWorker.name}</h3>
                <p className="text-xs text-[#FF6B53] font-bold">{order.assignedWorker.specialty}</p>
                <p className="text-[11px] text-[#3C2E4C]/70 dir-ltr text-right font-mono">{order.assignedWorker.phone}</p>
              </div>
            </div>

            <a
              href={`tel:${order.assignedWorker.phone}`}
              className="px-3.5 py-2 rounded-xl brand-gradient-btn text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Phone size={13} />
              <span>اتصال</span>
            </a>
          </div>
        </div>
      )}

      {/* Main Order Info Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#2B1B3D]/10 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#2B1B3D]/10 pb-4">
          <div>
            <h2 className="text-lg font-black text-[#2B1B3D]">{order.serviceTitle}</h2>
            <p className="text-xs text-[#3C2E4C]/70 mt-0.5">تاريخ الطلب: {order.createdAt}</p>
          </div>
          <span className="text-xl font-black text-[#FF6B53]">{order.price} ر.س</span>
        </div>

        {/* Customer & Address Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-[#FDFBF5] border border-[#2B1B3D]/5 space-y-1">
            <span className="text-[#3C2E4C]/70 block font-semibold">اسم العميل:</span>
            <span className="font-bold text-[#2B1B3D]">{order.client.name}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FDFBF5] border border-[#2B1B3D]/5 space-y-1">
            <span className="text-[#3C2E4C]/70 block font-semibold">رقم الجوال:</span>
            <span className="font-bold text-[#2B1B3D] dir-ltr text-right block font-mono">{order.client.phone}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FDFBF5] border border-[#2B1B3D]/5 space-y-1 sm:col-span-2">
            <span className="text-[#3C2E4C]/70 block font-semibold">العنوان:</span>
            <span className="font-bold text-[#2B1B3D]">{order.client.address || order.location.addressName}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FDFBF5] border border-[#2B1B3D]/5 space-y-1">
            <span className="text-[#3C2E4C]/70 block font-semibold">الموعد:</span>
            <span className="font-bold text-[#2B1B3D]">{order.scheduledDate}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FDFBF5] border border-[#2B1B3D]/5 space-y-1">
            <span className="text-[#3C2E4C]/70 block font-semibold">طريقة الدفع:</span>
            <span className="font-bold text-[#2B1B3D]">{getPaymentName(order.paymentMethod)}</span>
          </div>
        </div>

        {order.notes && (
          <div className="p-4 rounded-2xl bg-[#FDFBF5] border border-[#2B1B3D]/5 text-xs space-y-1">
            <span className="text-[#3C2E4C]/70 block font-semibold">ملاحظات:</span>
            <p className="text-[#2B1B3D]">{order.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#2B1B3D]/10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowInvoice(true)}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#2B1B3D] hover:bg-[#3C2E4C] text-[#FF9EB4] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <FileText size={16} />
            <span>عرض الفاتورة</span>
          </button>

          {(order.status === 'completed' || order.status === 'arrived' || order.status === 'in_progress') && (
            <button
              onClick={() => setShowRating(true)}
              className="py-3 px-4 rounded-2xl bg-[#FF6B53]/10 hover:bg-[#FF6B53]/20 text-[#FF6B53] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#FF6B53]/20"
            >
              <Star size={15} />
              <span>{order.rating ? `تقييم الخدمة (${order.rating}/5)` : 'تقييم الفني والخدمة'}</span>
            </button>
          )}

          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <button
              onClick={() => {
                onCancelOrder(order.id);
                onBack();
              }}
              className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer border border-rose-200"
            >
              إلغاء الطلب
            </button>
          )}
        </div>
      </div>

      {/* Invoice Full View Modal/Section */}
      {showInvoice && (
        <div className="bg-white rounded-3xl p-6 border border-[#2B1B3D]/10 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-[#2B1B3D]/10 pb-3">
            <h3 className="text-base font-black text-[#2B1B3D]">الفاتورة المعتمدة</h3>
            <button
              onClick={() => setShowInvoice(false)}
              className="w-7 h-7 rounded-full bg-[#2B1B3D]/10 flex items-center justify-center text-[#2B1B3D] cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#3C2E4C]/70">رقم الطلب:</span>
              <span className="font-bold text-[#2B1B3D]">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#3C2E4C]/70">الخدمة:</span>
              <span className="font-bold text-[#2B1B3D]">{order.serviceTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#3C2E4C]/70">الفني المنفذ:</span>
              <span className="font-bold text-[#2B1B3D]">{order.assignedWorker?.name || 'فني معتمد'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#3C2E4C]/70">طريقة السداد:</span>
              <span className="font-bold text-[#FF6B53]">{getPaymentName(order.paymentMethod)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#2B1B3D]/10 font-bold text-sm text-[#2B1B3D]">
              <span>المبلغ الإجمالي المدفوع:</span>
              <span className="text-[#FF6B53]">{order.price} ر.س</span>
            </div>
          </div>
        </div>
      )}

      {/* Rating View */}
      {showRating && (
        <div className="bg-white rounded-3xl p-6 border border-[#2B1B3D]/10 shadow-lg space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-[#2B1B3D]/10 pb-3">
            <div>
              <h3 className="text-base font-black text-[#2B1B3D]">تقييم الفني ومقدم الخدمة</h3>
              <p className="text-xs text-[#3C2E4C]/70">رأيك يساهم في تحسين جودة الخدمات الميدانية</p>
            </div>
            <button
              onClick={() => setShowRating(false)}
              className="w-7 h-7 rounded-full bg-[#2B1B3D]/10 flex items-center justify-center text-[#2B1B3D] cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Rate Worker Specifically */}
          {order.assignedWorker && (
            <div className="p-3 bg-[#FDFBF5] rounded-2xl border border-[#2B1B3D]/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2B1B3D]">تقييم أداء الفني ({order.assignedWorker.name}):</span>
                <span className="text-xs font-black text-[#FF6B53]">{workerRating} / 5</span>
              </div>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setWorkerRating(s)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      size={24}
                      className={s <= workerRating ? 'text-[#FF6B53] fill-[#FF6B53]' : 'text-gray-300'}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rate Overall Service */}
          <div className="p-3 bg-[#FDFBF5] rounded-2xl border border-[#2B1B3D]/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2B1B3D]">التقييم العام للخدمة وسرعة الاستجابة:</span>
              <span className="text-xs font-black text-[#FF6B53]">{rating} / 5</span>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
                >
                  <Star
                    size={24}
                    className={s <= rating ? 'text-[#FF6B53] fill-[#FF6B53]' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="اكتب ملاحظاتك وتجربتك مع الفني والخدمة..."
            rows={3}
            className="w-full p-3 rounded-2xl border border-[#2B1B3D]/15 text-xs text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] resize-none bg-white"
          />

          <button
            onClick={handleSaveRating}
            className="w-full py-3 rounded-2xl brand-gradient-btn text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            إرسال التقييم
          </button>
        </div>
      )}
    </div>
  );
}
