import { useState } from 'react';
import { 
  ChevronLeft, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Star, 
  MapPin, 
  Sparkles 
} from 'lucide-react';
import { Order } from '../../types';
import { PaymentMethodBadge } from '../PaymentMethodBadge';

interface OrdersTabProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onOpenBooking: () => void;
}

export function OrdersTab({
  orders,
  onSelectOrder,
  onOpenBooking,
}: OrdersTabProps) {
  const [activeSegment, setActiveSegment] = useState<'active' | 'completed'>('active');

  const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
  const completedOrders = orders.filter((o) => o.status === 'completed' || o.status === 'cancelled');

  const currentList = activeSegment === 'active' ? activeOrders : completedOrders;

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'on_the_way':
        return <span className="px-2.5 py-1 rounded-xl bg-[#FF6B53]/15 text-[#FF6B53] font-bold text-xs">🚗 الفني في الطريق</span>;
      case 'arrived':
        return <span className="px-2.5 py-1 rounded-xl bg-[#FF9EB4]/30 text-[#2B1B3D] font-bold text-xs">📍 وصل الفني للموقع</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 rounded-xl bg-[#3C2E4C]/15 text-[#2B1B3D] font-bold text-xs">🔧 جاري العمل</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">✅ اكتمل بنجاح</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-bold text-xs">❌ ملغي</span>;
      default:
        return <span className="px-2.5 py-1 rounded-xl bg-[#2B1B3D]/10 text-[#2B1B3D] font-bold text-xs">⏳ قيد التنفيذ</span>;
    }
  };

  return (
    <div id="orders-tab-container" className="space-y-6 text-right pb-16 font-['Tajawal',sans-serif]">
      {/* Segmented Switcher */}
      <div className="p-1 rounded-2xl bg-white border border-[#2B1B3D]/10 shadow-xs flex items-center gap-1 max-w-md">
        <button
          onClick={() => setActiveSegment('active')}
          id="tab-segment-active"
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSegment === 'active'
              ? 'bg-gradient-to-r from-[#2B1B3D] to-[#3C2E4C] text-[#FF9EB4] shadow-xs'
              : 'text-[#3C2E4C]/70 hover:text-[#2B1B3D]'
          }`}
        >
          <Clock size={14} />
          <span>الطلبات الحالية ({activeOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveSegment('completed')}
          id="tab-segment-completed"
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSegment === 'completed'
              ? 'bg-gradient-to-r from-[#2B1B3D] to-[#3C2E4C] text-[#FF9EB4] shadow-xs'
              : 'text-[#3C2E4C]/70 hover:text-[#2B1B3D]'
          }`}
        >
          <CheckCircle2 size={14} />
          <span>الطلبات السابقة ({completedOrders.length})</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-3.5">
        {currentList.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-3xl border border-[#2B1B3D]/10 space-y-3">
            <h3 className="text-sm font-bold text-[#2B1B3D]">لا توجد طلبات في هذا القسم</h3>
            <p className="text-xs text-[#3C2E4C]/60">يمكنك حجز خدمة جديدة في أي وقت وبضمان معتمد</p>
            <button
              onClick={onOpenBooking}
              className="py-2.5 px-5 brand-gradient-btn text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
            >
              حجز خدمة الآن
            </button>
          </div>
        ) : (
          currentList.map((order) => (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              id={`order-row-${order.id}`}
              className="p-5 rounded-3xl bg-white border border-[#2B1B3D]/10 hover:border-[#FF6B53]/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all group"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-[#2B1B3D] group-hover:text-[#FF6B53] transition-colors font-mono">
                    {order.orderNumber}
                  </span>
                  <span className="font-bold text-xs text-[#3C2E4C]">
                    {order.serviceTitle}
                  </span>
                  {getStatusBadge(order.status)}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#3C2E4C]/75">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-[#FF6B53]" />
                    {order.location.addressName}
                  </span>
                  <span>الموعد: {order.scheduledDate}</span>
                </div>

                {order.assignedWorker && (
                  <div className="inline-flex items-center gap-1.5 text-xs bg-[#FDFBF5] px-3 py-1 rounded-xl text-[#2B1B3D] border border-[#2B1B3D]/5">
                    <Wrench size={13} className="text-[#FF6B53]" />
                    <span>الفني المباشر: <strong>{order.assignedWorker.name}</strong></span>
                    <span className="flex items-center text-[#FF6B53] font-bold mr-1">
                      <Star size={11} className="fill-[#FF6B53]" /> {order.assignedWorker.rating}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#2B1B3D]/5">
                <div className="text-right sm:text-left">
                  <div className="text-base font-black text-[#FF6B53]">{order.price} ر.س</div>
                  <PaymentMethodBadge method={order.paymentMethod} />
                </div>

                <div className="w-8 h-8 rounded-full bg-[#FDFBF5] group-hover:bg-[#FF6B53] group-hover:text-white text-[#2B1B3D] flex items-center justify-center transition-all">
                  <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
