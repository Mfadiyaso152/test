import { useState } from 'react';
import { 
  User, 
  MapPin, 
  Edit3, 
  Plus, 
  Trash2, 
  LogOut, 
  X,
  CreditCard,
  Building2,
  Calendar,
  Phone,
  Mail,
  CheckCircle2
} from 'lucide-react';
import { UserProfile } from '../../types';

interface AccountTabProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout: () => void;
}

export function AccountTab({
  user,
  onUpdateUser,
  onLogout,
}: AccountTabProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || '',
    email: user.email || '',
    birthDate: user.birthDate || '',
    city: user.city || '',
  });

  const [savedAddresses, setSavedAddresses] = useState([
    { id: '1', title: 'الرئيسي', address: `${user.city || 'الرياض'} - ${user.district || 'حي العليا'}` },
  ]);
  const [newAddress, setNewAddress] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      birthDate: formData.birthDate,
      city: formData.city,
    });
    setIsEditOpen(false);
  };

  const handleAddAddress = () => {
    if (!newAddress.trim()) return;
    setSavedAddresses([
      ...savedAddresses,
      { id: Date.now().toString(), title: 'عنوان إضافي', address: newAddress.trim() },
    ]);
    setNewAddress('');
    setShowAddAddress(false);
  };

  const handleDeleteAddress = (id: string) => {
    setSavedAddresses(savedAddresses.filter((a) => a.id !== id));
  };

  return (
    <div id="account-tab-container" className="space-y-6 text-right pb-16 max-w-3xl mx-auto font-['Tajawal',sans-serif]">
      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#2B1B3D]/10 shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2B1B3D] to-[#3C2E4C] border-2 border-[#FF9EB4] flex items-center justify-center text-[#FF9EB4] text-2xl font-black shadow-md">
              {user.name ? user.name.charAt(0) : <User size={28} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#2B1B3D]">{user.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                  user.role === 'provider'
                    ? 'bg-[#FF6B53]/15 text-[#FF6B53] border border-[#FF6B53]/30'
                    : 'bg-[#2B1B3D]/10 text-[#2B1B3D]'
                }`}>
                  {user.role === 'provider' ? 'مقدم خدمة معتمد' : 'عميل'}
                </span>
              </div>

              {user.role === 'provider' && user.providerDetails?.crNumber && (
                <p className="text-xs text-[#FF6B53] font-bold mt-1">
                  السجل التجاري: <span className="font-mono">{user.providerDetails.crNumber}</span>
                </p>
              )}

              {user.phone && (
                <p className="text-xs text-[#3C2E4C]/80 dir-ltr text-right mt-1 font-mono font-bold">{user.phone}</p>
              )}
              {user.email && (
                <p className="text-xs text-[#3C2E4C]/60 dir-ltr text-right">{user.email}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setFormData({
                name: user.name,
                phone: user.phone || '',
                email: user.email || '',
                birthDate: user.birthDate || '',
                city: user.city || '',
              });
              setIsEditOpen(true);
            }}
            className="p-2.5 rounded-2xl bg-[#FDFBF5] hover:bg-[#FF9EB4]/20 text-[#2B1B3D] border border-[#2B1B3D]/10 transition-colors cursor-pointer"
            title="تعديل البيانات"
          >
            <Edit3 size={16} />
          </button>
        </div>

        {/* Client extra info with Birth date immediately under email */}
        {user.role === 'client' && user.birthDate && (
          <div className="p-3 bg-[#FDFBF5] rounded-2xl border border-[#2B1B3D]/5 flex items-center justify-between text-xs">
            <span className="text-[#3C2E4C] flex items-center gap-1.5 font-bold">
              <Calendar size={14} className="text-[#FF6B53]" />
              تاريخ الميلاد المسجل
            </span>
            <span className="font-bold text-[#2B1B3D]">{user.birthDate}</span>
          </div>
        )}

        {user.role === 'provider' && user.providerDetails?.bankDetails && (
          <div className="p-4 bg-gradient-to-r from-[#2B1B3D] to-[#3C2E4C] text-white rounded-2xl border border-[#FF9EB4]/30 space-y-2">
            <div className="flex items-center justify-between text-[#FF9EB4] text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <CreditCard size={15} />
                الحساب البنكي لتحويل العوائد
              </span>
              <span>{user.providerDetails.bankDetails.bankName}</span>
            </div>
            <div className="font-mono text-sm font-bold tracking-wider text-white">
              {user.providerDetails.bankDetails.iban}
            </div>
            <div className="text-[11px] text-[#FDFBF5]/70">
              اسم المستفيد: {user.providerDetails.bankDetails.accountHolderName}
            </div>
          </div>
        )}
      </div>

      {/* Saved Addresses */}
      <div className="bg-white rounded-3xl p-6 border border-[#2B1B3D]/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-[#2B1B3D] flex items-center gap-2">
            <MapPin size={16} className="text-[#FF6B53]" />
            <span>العناوين المسجلة</span>
          </h3>
          <button
            onClick={() => setShowAddAddress(!showAddAddress)}
            className="text-xs text-[#FF6B53] font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Plus size={14} />
            <span>إضافة موقع جديد</span>
          </button>
        </div>

        {showAddAddress && (
          <div className="p-3 bg-[#FDFBF5] rounded-2xl space-y-2 border border-[#2B1B3D]/10">
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="اكتب العنوان (مثال: حي النرجس، شارع أنس بن مالك)..."
              className="w-full p-2.5 rounded-xl border border-[#2B1B3D]/15 text-xs text-[#2B1B3D] bg-white focus:outline-none focus:border-[#FF6B53]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddAddress(false)}
                className="py-1 px-3 text-xs text-[#3C2E4C]/70 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddAddress}
                className="py-1.5 px-4 brand-gradient-btn text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                حفظ العنوان
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {savedAddresses.map((addr) => (
            <div
              key={addr.id}
              className="p-3 rounded-2xl bg-[#FDFBF5] border border-[#2B1B3D]/5 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-[#2B1B3D] block">{addr.title}</span>
                <span className="text-[11px] text-[#3C2E4C]/75 block mt-0.5">{addr.address}</span>
              </div>
              <button
                onClick={() => handleDeleteAddress(addr.id)}
                className="text-[#3C2E4C]/40 hover:text-rose-500 p-1 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Logout Action */}
      <button
        onClick={onLogout}
        className="w-full p-4 rounded-3xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
      >
        <LogOut size={16} />
        <span>تسجيل الخروج من الحساب</span>
      </button>

      {/* Edit Form Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-right border border-[#2B1B3D]/10 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#2B1B3D]/10 pb-3">
              <h3 className="text-sm font-black text-[#2B1B3D]">تعديل المعلومات الشخصية</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="w-7 h-7 rounded-full bg-[#2B1B3D]/10 flex items-center justify-center text-[#2B1B3D] cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#2B1B3D] mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full p-2.5 rounded-xl border border-[#2B1B3D]/15 text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2B1B3D] mb-1">رقم الجوال</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#2B1B3D]/15 text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] dir-ltr text-right font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2B1B3D] mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#2B1B3D]/15 text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] dir-ltr text-right"
                />
              </div>

              {/* Birth date directly under email */}
              {user.role === 'client' && (
                <div>
                  <label className="block font-bold text-[#2B1B3D] mb-1">تاريخ الميلاد</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#2B1B3D]/15 text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53]"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-[#2B1B3D] mb-1">المدينة</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#2B1B3D]/15 text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#2B1B3D]/15 text-[#3C2E4C] font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl brand-gradient-btn text-white font-bold transition-colors cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
