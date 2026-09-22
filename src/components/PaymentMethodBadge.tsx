import { PaymentMethodType } from '../types';
import { CreditCard, Smartphone, Check } from 'lucide-react';

interface PaymentMethodBadgeProps {
  method: PaymentMethodType;
  isSelected?: boolean;
  onSelect?: () => void;
  price?: number;
}

export function PaymentMethodBadge({ method, isSelected, onSelect, price }: PaymentMethodBadgeProps) {
  const getDetails = () => {
    switch (method) {
      case 'visa':
        return {
          title: 'فيزا (Visa)',
          subtitle: 'بطاقة مدى / فيزا الائتمانية',
          badge: null,
          icon: (
            <div className="w-10 h-7 rounded-md bg-[#1A1F71] text-white flex items-center justify-center font-black text-[13px] tracking-wider italic shadow-xs">
              VISA
            </div>
          ),
        };
      case 'mastercard':
        return {
          title: 'ماستركارد (Mastercard)',
          subtitle: 'الدفع المباشر والآمن',
          badge: null,
          icon: (
            <div className="w-10 h-7 rounded-md bg-[#222] flex items-center justify-center relative shadow-xs overflow-hidden">
              <div className="w-4 h-4 rounded-full bg-[#EB001B] -mr-1.5 opacity-95"></div>
              <div className="w-4 h-4 rounded-full bg-[#F79E1B] -ml-1.5 opacity-90"></div>
            </div>
          ),
        };
      case 'apple_pay':
        return {
          title: 'أبل باي (Apple Pay)',
          subtitle: 'دفع فوري بلمسة واحدة',
          badge: 'سريع',
          icon: (
            <div className="w-10 h-7 rounded-md bg-black text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
               Pay
            </div>
          ),
        };
      case 'google_pay':
        return {
          title: 'قوقل باي (Google Pay)',
          subtitle: 'دفع مشفر بحساب Google',
          badge: 'G Pay',
          icon: (
            <div className="w-10 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center font-bold text-[11px] text-gray-800 shadow-xs">
              <span className="text-[#4285F4]">G</span>&nbsp;Pay
            </div>
          ),
        };
      case 'tabby':
        return {
          title: 'تابي (Tabby)',
          subtitle: price ? `قسّم إلى 4 دفعات (${(price / 4).toFixed(1)} ر.س/شهر)` : 'قسّم على 4 دفعات بدون فوائد',
          badge: 'بدون فوائد',
          icon: (
            <div className="w-10 h-7 rounded-md bg-[#29e798] text-[#2B1B3D] flex items-center justify-center font-black text-[10px] tracking-tight shadow-xs">
              tabby
            </div>
          ),
        };
      case 'tamara':
        return {
          title: 'تمارا (Tamara)',
          subtitle: price ? `قسّم إلى 4 دفعات (${(price / 4).toFixed(1)} ر.س/شهر)` : 'قسّم فاتورتك بكل سهولة',
          badge: 'متوافق مع الشريعة',
          icon: (
            <div className="w-10 h-7 rounded-md bg-gradient-to-r from-[#ff6200] to-[#ff9800] text-white flex items-center justify-center font-black text-[9px] shadow-xs">
              tamara
            </div>
          ),
        };
    }
  };

  const details = getDetails();

  return (
    <div
      onClick={onSelect}
      className={`relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer text-right flex items-center justify-between gap-3 ${
        isSelected
          ? 'border-[#FF6B53] bg-[#FF6B53]/5 ring-2 ring-[#FF6B53]/20 shadow-xs'
          : 'border-[#2B1B3D]/10 bg-white hover:border-[#FF6B53]/40 hover:bg-[#FDFBF5]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0">{details.icon}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-extrabold text-[#2B1B3D]">{details.title}</span>
            {details.badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                {details.badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#3C2E4C]/70 truncate mt-0.5">{details.subtitle}</p>
        </div>
      </div>

      <div className="shrink-0">
        <div
          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
            isSelected
              ? 'border-[#FF6B53] bg-[#FF6B53] text-white'
              : 'border-[#2B1B3D]/20 bg-white'
          }`}
        >
          {isSelected && <Check size={12} strokeWidth={3} />}
        </div>
      </div>
    </div>
  );
}
