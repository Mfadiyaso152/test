import { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { UserProfile, UserRole } from '../types';
import { 
  User, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { INITIAL_WORKERS, INITIAL_REVIEWS } from '../data/mockData';
import { loginWithGoogle, syncUserProfile } from '../lib/firebase';
import { requestDeviceNotificationPermission } from '../lib/notifications';

interface LoginPageProps {
  onLogin: (user: UserProfile) => void;
}

type AuthScreen = 
  | 'welcome'               // Step 0: Welcome screen with platform definition & permissions
  | 'role_selection'        // Step 1: Select Account Type (عميل / مقدم خدمة)
  | 'phone_first_and_methods' // Step 2: Enter phone number first OR choose Google / Apple / Email
  | 'email_cred'            // Step 2.1: If Email -> enter email & password
  | 'apple_cred'            // Step 2.2: If Apple -> enter Apple ID email
  | 'complete_social'       // Step 3 (for Google/Apple): Full Name + Phone
  | 'complete_email'        // Step 3 (for Email): Full Name + Birth Date + Phone
  | 'complete_phone';       // Step 3 (for Phone): Full Name + Email + Birth Date

type AuthMethod = 'phone' | 'google' | 'apple' | 'email_password';

export function LoginPage({ onLogin }: LoginPageProps) {
  const [screen, setScreen] = useState<AuthScreen>('welcome');
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Permissions state on Welcome Page
  const [geoGranted, setGeoGranted] = useState(false);
  const [isRequestingGeo, setIsRequestingGeo] = useState(false);

  // Form Fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('الرياض');
  const [district, setDistrict] = useState('');

  // Provider specific details
  const [businessName, setBusinessName] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [specialty, setSpecialty] = useState('تكييف وتبريد');
  const [bankName, setBankName] = useState('مصرف الراجحي');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [iban, setIban] = useState('SA');

  // Check initial permissions
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((res) => {
        if (res.state === 'granted') setGeoGranted(true);
      }).catch(() => {});
    }
  }, []);

  // Request Geolocation Permission on Welcome Page
  const handleEnableLocation = () => {
    if (!navigator.geolocation) return;
    setIsRequestingGeo(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setGeoGranted(true);
        setIsRequestingGeo(false);
      },
      () => {
        setIsRequestingGeo(false);
      },
      { timeout: 8000 }
    );
  };

  // Step 1: User picks Role -> automatically move to Phone-First & Methods
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage('');
    setScreen('phone_first_and_methods');
  };

  // Step 2.A: Submit with Phone Number first
  const handleContinueWithPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.trim().length < 9) {
      setErrorMessage('يرجى إدخال رقم هاتف صحيح (مثال: 05XXXXXXXX)');
      return;
    }
    setAuthMethod('phone');
    setErrorMessage('');
    setScreen('complete_phone');
  };

  // Step 2.B: Continue with Google
  const handleContinueWithGoogle = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setAuthMethod('google');

    try {
      const fbUser = await loginWithGoogle();
      if (fbUser) {
        if (fbUser.email) setEmailAddress(fbUser.email);
        if (fbUser.displayName) setFullName(fbUser.displayName);
        if (fbUser.phoneNumber) setPhoneNumber(fbUser.phoneNumber);
      }
      setScreen('complete_social');
    } catch (err: any) {
      console.warn('Google auth notice:', err);
      setFullName('مستخدم Google');
      setScreen('complete_social');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2.C: Continue with Apple
  const handleContinueWithApple = () => {
    setAuthMethod('apple');
    setErrorMessage('');
    setScreen('apple_cred');
  };

  const handleAppleCredSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress.trim()) {
      setErrorMessage('يرجى كتابة Apple ID');
      return;
    }
    setErrorMessage('');
    setScreen('complete_social');
  };

  // Step 2.D: Continue with Email & Password
  const handleContinueWithEmail = () => {
    setAuthMethod('email_password');
    setErrorMessage('');
    setScreen('email_cred');
  };

  const handleEmailCredSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress.trim() || !password.trim()) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setErrorMessage('');
    setScreen('complete_email');
  };

  // Final Step: Complete Registration & Create User Profile
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const finalPhone = phoneNumber.trim() || '0500000000';
    const finalEmail = emailAddress.trim();

    // Check if account already exists in registered users or is banned
    let existingProfile: UserProfile | null = null;
    try {
      const savedAll = localStorage.getItem('field_app_all_users_v6');
      if (savedAll) {
        const list: UserProfile[] = JSON.parse(savedAll);
        existingProfile = list.find((u) => 
          (finalPhone && u.phone === finalPhone) || 
          (finalEmail && u.email && u.email.toLowerCase() === finalEmail.toLowerCase())
        ) || null;
      }
    } catch {
      // Fallback
    }

    if (existingProfile?.isBanned) {
      setErrorMessage('تم إيقاف هذا الحساب من قبل إدارة المنصة لمخالفة شروط الاستخدام.');
      setIsLoading(false);
      return;
    }

    const displayName = selectedRole === 'provider' 
      ? (businessName.trim() || fullName.trim() || 'مؤسسة صيانة معتمدة') 
      : (fullName.trim() || 'عميل كريم');

    const finalUser: UserProfile = existingProfile ? {
      ...existingProfile,
      name: displayName || existingProfile.name,
      phone: finalPhone,
      email: finalEmail || existingProfile.email,
      city: city || existingProfile.city,
      district: district.trim() || existingProfile.district,
    } : {
      id: `usr-${Date.now()}`,
      name: displayName,
      role: selectedRole,
      phone: finalPhone,
      email: finalEmail || undefined,
      birthDate: birthDate.trim() || undefined,
      city: city,
      district: district.trim() || 'الرياض',
      isBanned: false,
      providerDetails: selectedRole === 'provider' ? {
        crNumber: crNumber.trim() || '1010789456',
        crVerified: true,
        businessName: displayName,
        specialty: specialty,
        city: city,
        district: district.trim() || 'المنطقة المركزية',
        lat: 24.7742,
        lng: 46.6385,
        coverageRadiusKm: 30,
        isAvailableForOrders: true,
        verificationStatus: 'approved',
        bankDetails: {
          bankName,
          accountHolderName: accountHolderName.trim() || displayName,
          iban: iban.trim().toUpperCase(),
        },
        workers: INITIAL_WORKERS,
        reviews: INITIAL_REVIEWS,
      } : undefined,
    };

    syncUserProfile(finalUser).catch((err) => {
      console.warn('Background profile sync note:', err);
    });

    onLogin(finalUser);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFBF5] text-right font-['Tajawal',sans-serif] flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      
      {/* SCREEN 0: WELCOME SCREEN */}
      {screen === 'welcome' && (
        <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-10 border border-[#2B1B3D]/10 shadow-2xl space-y-6 animate-in fade-in duration-200">
          
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <Logo size={64} variant="icon-only" />
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#2B1B3D]">
                أهلاً بك
              </h1>
              <p className="text-xs sm:text-sm text-[#3C2E4C]/80 leading-relaxed max-w-md mx-auto font-medium">
                المنظومة المعتمدة لخدمات الصيانة والتشغيل الميداني، تجمع نخبة الفنيين والمنشآت المرخصة مع العملاء في تجربة موحدة، مع تتبع لحظي عبر خرائط Google وضمان شامل على كافة الأعمال.
              </p>
            </div>
          </div>

          {/* Value Highlights */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-[#FDFBF5] border border-[#2B1B3D]/5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF6B53]/15 text-[#FF6B53] flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <span className="text-[11px] sm:text-xs font-black text-[#2B1B3D]">ضمان ذهبي معتمد</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FDFBF5] border border-[#2B1B3D]/5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF6B53]/15 text-[#FF6B53] flex items-center justify-center shrink-0">
                <MapPin size={18} />
              </div>
              <span className="text-[11px] sm:text-xs font-black text-[#2B1B3D]">تتبع مباشر تفاعلي</span>
            </div>
          </div>

          {/* Interactive Geolocation Permission Section */}
          <div className="space-y-3 pt-2 border-t border-[#2B1B3D]/10">
            <div className="p-4 rounded-2xl bg-[#FDFBF5] border border-[#2B1B3D]/10 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#2B1B3D]/10 text-[#2B1B3D] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#2B1B3D] block">تحديد الموقع الجغرافي (GPS)</span>
                    <p className="text-[11px] text-[#3C2E4C]/75 leading-relaxed mt-0.5">
                      تحديد موقعك بدقة لتوجيه أقرب فني معتمد واحتساب وقت الوصول والمسافة بدقة.
                    </p>
                  </div>
                </div>
              </div>

              {geoGranted ? (
                <div className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
                  <Check size={14} />
                  <span>تم تفعيل إذن الموقع الجغرافي بنجاح</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleEnableLocation}
                  disabled={isRequestingGeo}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-white/80 border border-[#2B1B3D]/20 text-[#2B1B3D] text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <MapPin size={14} />
                  <span>{isRequestingGeo ? 'جاري تحديد الإحداثيات...' : 'تفعيل إذن الموقع'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Primary CTA Button "ابدأ الآن" */}
          <div className="pt-2">
            <button
              onClick={() => setScreen('role_selection')}
              id="btn-start-now"
              className="w-full py-4 px-6 rounded-2xl brand-gradient-btn text-white text-base font-black shadow-xl shadow-[#FF6B53]/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>ابدأ الآن</span>
              <ArrowRight size={18} className="rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 1: ROLE SELECTION */}
      {screen === 'role_selection' && (
        <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-10 border border-[#2B1B3D]/10 shadow-2xl space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#2B1B3D]/10 pb-4">
            <h2 className="text-lg sm:text-xl font-black text-[#2B1B3D]">اختر نوع الحساب</h2>
            <button
              onClick={() => setScreen('welcome')}
              className="text-xs text-[#3C2E4C]/70 hover:text-[#2B1B3D] font-bold cursor-pointer"
            >
              رجوع
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Client Role Option */}
            <button
              type="button"
              onClick={() => handleSelectRole('client')}
              id="role-btn-client"
              className="p-6 rounded-3xl border-2 border-[#2B1B3D]/10 hover:border-[#FF6B53] bg-[#FDFBF5]/60 hover:bg-white flex flex-col items-center text-center gap-3 transition-all hover:scale-102 cursor-pointer group shadow-xs"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#FF6B53]/15 text-[#FF6B53] group-hover:bg-[#FF6B53] group-hover:text-white flex items-center justify-center transition-colors">
                <User size={28} />
              </div>
              <div>
                <span className="block text-base font-black text-[#2B1B3D]">عميل</span>
                <span className="text-xs text-[#3C2E4C]/70 mt-1 block">طلب ومتابعة خدمات الصيانة</span>
              </div>
            </button>

            {/* Provider Role Option */}
            <button
              type="button"
              onClick={() => handleSelectRole('provider')}
              id="role-btn-provider"
              className="p-6 rounded-3xl border-2 border-[#2B1B3D]/10 hover:border-[#FF6B53] bg-[#FDFBF5]/60 hover:bg-white flex flex-col items-center text-center gap-3 transition-all hover:scale-102 cursor-pointer group shadow-xs"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#2B1B3D]/10 text-[#2B1B3D] group-hover:bg-[#2B1B3D] group-hover:text-[#FF9EB4] flex items-center justify-center transition-colors">
                <Building2 size={28} />
              </div>
              <div>
                <span className="block text-base font-black text-[#2B1B3D]">مقدم خدمة</span>
                <span className="text-xs text-[#3C2E4C]/70 mt-1 block">استقبال وتنفيذ الطلبات</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2: PHONE FIRST INPUT, THEN "أو", THEN GOOGLE / APPLE / EMAIL */}
      {screen === 'phone_first_and_methods' && (
        <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-10 border border-[#2B1B3D]/10 shadow-2xl space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#2B1B3D]/10 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#2B1B3D]">تسجيل الدخول</h2>
              <p className="text-xs text-[#3C2E4C]/70 mt-0.5">
                الدخول كـ {selectedRole === 'client' ? 'عميل' : 'مقدم خدمة'}
              </p>
            </div>
            <button
              onClick={() => setScreen('role_selection')}
              className="text-xs text-[#3C2E4C]/70 hover:text-[#2B1B3D] font-bold cursor-pointer"
            >
              تغيير
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Phone Number Input FIRST */}
          <form onSubmit={handleContinueWithPhone} className="space-y-3">
            <div>
              <label className="block text-xs font-black text-[#2B1B3D] mb-1.5">
                أدخل رقم الهاتف
              </label>
              <div className="relative flex items-center">
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                  className="w-full p-3.5 pr-4 pl-16 rounded-2xl border border-[#2B1B3D]/15 bg-[#FDFBF5] text-sm font-bold text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] focus:bg-white text-right font-mono"
                />
                <span className="absolute left-4 text-xs font-bold text-[#3C2E4C]/60 font-mono">966+</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl brand-gradient-btn text-white text-xs font-black shadow-md shadow-[#FF6B53]/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] transition-transform"
            >
              <span>المتابعة برقم الهاتف</span>
              <ArrowRight size={16} className="rotate-180" />
            </button>
          </form>

          {/* Divider "أو" */}
          <div className="relative flex items-center justify-center py-2">
            <div className="w-full border-t border-[#2B1B3D]/10"></div>
            <span className="absolute bg-white px-3 text-xs font-bold text-[#3C2E4C]/50">أو عبر</span>
          </div>

          {/* Social / Email Options */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleContinueWithGoogle}
              disabled={isLoading}
              className="w-full p-3 rounded-2xl bg-[#FDFBF5] hover:bg-[#F3EFE6] border border-[#2B1B3D]/10 text-xs font-black text-[#2B1B3D] flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isLoading ? 'جاري التحقق...' : 'المتابعة بحساب Google'}</span>
            </button>

            <button
              type="button"
              onClick={handleContinueWithApple}
              className="w-full p-3 rounded-2xl bg-[#2B1B3D] hover:bg-[#3C2E4C] text-[#FDFBF5] text-xs font-black flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.83-11.97-14.34-6.3-9.57-11.2-20.7-14.7-33.38-3.5-12.67-5.25-24.3-5.25-34.88 0-14.45 3.6-26.37 10.8-35.77 7.2-9.4 16.27-14.17 27.23-14.32 4.8 0 10.02 1.25 15.66 3.75 5.64 2.5 9.4 3.82 11.28 3.96 1.54 0 5.43-1.39 11.66-4.17 6.23-2.78 11.73-4.04 16.5-3.79 12.35.63 22.37 5.16 30.07 13.6-10.74 6.52-16 15.44-15.78 26.77.21 8.84 3.6 16.14 10.18 21.9 6.58 5.76 14.46 9.07 23.63 9.94-2.2 6.5-4.8 12.8-7.8 18.9zM119.22 31.84c0-7.23 2.65-13.88 7.95-19.95 5.3-6.07 11.75-9.67 19.34-10.8 1.08 7.4-1.28 14.15-7.07 20.25-5.79 6.1-12.52 9.68-20.22 10.5z" />
              </svg>
              <span>المتابعة بحساب Apple</span>
            </button>

            <button
              type="button"
              onClick={handleContinueWithEmail}
              className="w-full p-3 rounded-2xl bg-white hover:bg-[#FDFBF5] border border-[#2B1B3D]/15 text-xs font-bold text-[#2B1B3D] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>المتابعة بالبريد وكلمة المرور</span>
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 2.1: EMAIL & PASSWORD INPUT */}
      {screen === 'email_cred' && (
        <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-10 border border-[#2B1B3D]/10 shadow-2xl space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#2B1B3D]/10 pb-4">
            <h2 className="text-lg sm:text-xl font-black text-[#2B1B3D]">الدخول بالبريد الإلكتروني</h2>
            <button
              onClick={() => setScreen('phone_first_and_methods')}
              className="text-xs text-[#3C2E4C]/70 hover:text-[#2B1B3D] font-bold cursor-pointer"
            >
              رجوع
            </button>
          </div>

          <form onSubmit={handleEmailCredSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#2B1B3D] mb-1">البريد الإلكتروني *</label>
              <input
                type="email"
                required
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="name@example.com"
                dir="ltr"
                className="w-full p-3.5 rounded-2xl border border-[#2B1B3D]/15 bg-[#FDFBF5] text-xs font-bold text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] focus:bg-white text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B1B3D] mb-1">كلمة المرور *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3.5 rounded-2xl border border-[#2B1B3D]/15 bg-[#FDFBF5] text-xs font-bold text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] focus:bg-white text-right"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl brand-gradient-btn text-white text-xs font-black shadow-md shadow-[#FF6B53]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>متابعة</span>
              <ArrowRight size={16} className="rotate-180" />
            </button>
          </form>
        </div>
      )}

      {/* SCREEN 2.2: APPLE ID INPUT */}
      {screen === 'apple_cred' && (
        <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-10 border border-[#2B1B3D]/10 shadow-2xl space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#2B1B3D]/10 pb-4">
            <h2 className="text-lg sm:text-xl font-black text-[#2B1B3D]">الدخول بحساب Apple ID</h2>
            <button
              onClick={() => setScreen('phone_first_and_methods')}
              className="text-xs text-[#3C2E4C]/70 hover:text-[#2B1B3D] font-bold cursor-pointer"
            >
              رجوع
            </button>
          </div>

          <form onSubmit={handleAppleCredSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#2B1B3D] mb-1">Apple ID (البريد الإلكتروني) *</label>
              <input
                type="email"
                required
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="name@icloud.com"
                dir="ltr"
                className="w-full p-3.5 rounded-2xl border border-[#2B1B3D]/15 bg-[#FDFBF5] text-xs font-bold text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] focus:bg-white text-right"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#2B1B3D] hover:bg-[#3C2E4C] text-[#FDFBF5] text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>متابعة بواسطة Apple</span>
              <ArrowRight size={16} className="rotate-180" />
            </button>
          </form>
        </div>
      )}

      {/* SCREEN 3: COMPLETION FOR ALL METHODS */}
      {(screen === 'complete_phone' || screen === 'complete_email' || screen === 'complete_social') && (
        <form onSubmit={handleFinalSubmit} className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-10 border border-[#2B1B3D]/10 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="border-b border-[#2B1B3D]/10 pb-3">
            <h2 className="text-lg sm:text-xl font-black text-[#2B1B3D]">إكمال البيانات</h2>
            <p className="text-xs text-[#3C2E4C]/70 mt-0.5">
              {selectedRole === 'provider' ? 'معلومات منشأة الصيانة وموقع التغطية' : 'المعلومات الشخصية لإتمام الطلبات'}
            </p>
          </div>

          {/* 1. Full Name */}
          <div>
            <label className="block text-xs font-bold text-[#2B1B3D] mb-1">
              {selectedRole === 'provider' ? 'اسم المشرف / الممثل *' : 'الاسم الكامل *'}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: عبدالله محمد"
              className="w-full p-3.5 rounded-2xl border border-[#2B1B3D]/15 bg-[#FDFBF5] text-xs font-bold text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] focus:bg-white"
            />
          </div>

          {/* 2. Phone Number (Required if not entered before) */}
          {screen !== 'complete_phone' && (
            <div>
              <label className="block text-xs font-bold text-[#2B1B3D] mb-1">رقم الهاتف *</label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="05XXXXXXXX"
                dir="ltr"
                className="w-full p-3.5 rounded-2xl border border-[#2B1B3D]/15 bg-[#FDFBF5] text-xs font-bold text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] focus:bg-white text-right font-mono"
              />
            </div>
          )}

          {/* 3. Email (Required if Phone method) */}
          {screen === 'complete_phone' && (
            <div>
              <label className="block text-xs font-bold text-[#2B1B3D] mb-1">البريد الإلكتروني *</label>
              <input
                type="email"
                required
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="example@domain.com"
                dir="ltr"
                className="w-full p-3.5 rounded-2xl border border-[#2B1B3D]/15 bg-[#FDFBF5] text-xs font-bold text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] focus:bg-white text-right"
              />
            </div>
          )}

          {/* 4. Birth Date */}
          {(screen === 'complete_email' || screen === 'complete_phone') && (
            <div>
              <label className="block text-xs font-bold text-[#2B1B3D] mb-1">تاريخ الميلاد *</label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-[#2B1B3D]/15 bg-[#FDFBF5] text-xs font-bold text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] focus:bg-white"
              />
            </div>
          )}

          {/* City Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2B1B3D] mb-1">المدينة</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-[#2B1B3D]/15 bg-[#FDFBF5] text-xs font-bold text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] focus:bg-white"
              >
                <option value="الرياض">الرياض</option>
                <option value="جدة">جدة</option>
                <option value="الدمام">الدمام</option>
                <option value="مكة المكرمة">مكة المكرمة</option>
                <option value="المدينة المنورة">المدينة المنورة</option>
                <option value="الخبر">الخبر</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B1B3D] mb-1">الحي السكني</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="مثال: حي الصحافة"
                className="w-full p-3.5 rounded-2xl border border-[#2B1B3D]/15 bg-[#FDFBF5] text-xs font-bold text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] focus:bg-white"
              />
            </div>
          </div>

          {/* If Provider, collect Business & Bank info */}
          {selectedRole === 'provider' && (
            <div className="space-y-3 pt-2 border-t border-[#2B1B3D]/10">
              <div>
                <label className="block text-xs font-bold text-[#2B1B3D] mb-1">اسم المنشأة الرسمية *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="مثال: مؤسسة المدار للصيانة المعتمدة"
                  className="w-full p-3 rounded-2xl border border-[#2B1B3D]/15 bg-[#FDFBF5] text-xs font-bold text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2B1B3D] mb-1">رقم السجل التجاري *</label>
                  <input
                    type="text"
                    required
                    value={crNumber}
                    onChange={(e) => setCrNumber(e.target.value)}
                    placeholder="1010XXXXXX"
                    className="w-full p-3 rounded-2xl border border-[#2B1B3D]/15 bg-[#FDFBF5] text-xs font-bold text-[#2B1B3D] focus:outline-none focus:border-[#FF6B53] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2B1B3D] mb-1">التخصص</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-[#2B1B3D]/15 bg-[#FDFBF5] text-xs font-bold text-[#2B1B3D]"
                  >
                    <option value="تكييف وتبريد">تكييف وتبريد</option>
                    <option value="كهرباء وإنارة">كهرباء وإنارة</option>
                    <option value="سباكة وصحية">سباكة وصحية</option>
                    <option value="نظافة وتعقيم">نظافة وتعقيم</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-[#FDFBF5] rounded-2xl border border-[#2B1B3D]/10 space-y-2.5">
                <span className="text-xs font-black text-[#2B1B3D] block">الحساب البنكي للعوائد</span>
                <input
                  type="text"
                  required
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="اسم صاحب الحساب البنكي"
                  className="w-full p-2.5 rounded-xl border border-[#2B1B3D]/15 bg-white text-xs font-bold"
                />
                <input
                  type="text"
                  required
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="رقم الآيبان (SA00...)"
                  dir="ltr"
                  className="w-full p-2.5 rounded-xl border border-[#2B1B3D]/15 bg-white text-xs font-bold font-mono text-left"
                />
              </div>
            </div>
          )}

          <div className="pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl brand-gradient-btn text-white text-xs font-black shadow-lg shadow-[#FF6B53]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isLoading ? 'جاري الحفظ والتحقق...' : 'دخول التطبيق'}</span>
              <CheckCircle2 size={16} />
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
