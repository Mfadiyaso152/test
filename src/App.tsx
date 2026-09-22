import { useState, useEffect } from 'react';
import { TabType, ServiceCategory, Order, UserProfile, OrderStatus, Worker } from './types';
import { SERVICE_CATEGORIES, INITIAL_ORDERS } from './data/mockData';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeTab } from './components/tabs/HomeTab';
import { MapTab } from './components/tabs/MapTab';
import { OrdersTab } from './components/tabs/OrdersTab';
import { AccountTab } from './components/tabs/AccountTab';
import { BookingPage } from './components/BookingPage';
import { OrderDetailsPage } from './components/OrderDetailsPage';
import { LoginPage } from './components/LoginPage';
import { ProviderDashboard } from './components/provider/ProviderDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { 
  fetchOrdersFromFirestore, 
  saveOrderToFirestore, 
  fetchUsersFromFirestore, 
  saveUserProfileToFirestore 
} from './lib/firebase';
import { sendDevicePushNotification } from './lib/notifications';

type ViewMode = 'tabs' | 'booking' | 'order-details' | 'admin';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      return 'admin';
    }
    return 'tabs';
  });
  const [categories, setCategories] = useState<ServiceCategory[]>(SERVICE_CATEGORIES);
  const [selectedCategoryForBooking, setSelectedCategoryForBooking] = useState<ServiceCategory | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);

  // Authentication state
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('field_app_user_v6');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return null;
  });

  // Registered platform providers and users - ONLY real registered users
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('field_app_all_users_v6');
      if (saved) {
        const parsed: UserProfile[] = JSON.parse(saved);
        // Exclude all legacy mock users and mock providers
        const clean = parsed.filter((u) => 
          u.id !== 'user-default' && 
          u.id !== 'provider-default' && 
          u.id !== 'usr-prov-02' && 
          u.name !== 'محمد فهد' &&
          !u.name.includes('المدار') &&
          !u.name.includes('إمداد التميز')
        );
        return clean;
      }
    } catch {
      // Fallback
    }
    return [];
  });

  // Real Orders state (no fake sample orders)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('field_app_orders_v6');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean out any legacy mock order IDs
        return parsed.filter((o: Order) => 
          !o.id.startsWith('ord-10') &&
          !o.providerName?.includes('المدار') &&
          !o.providerName?.includes('إمداد التميز')
        );
      }
    } catch {
      // Fallback
    }
    return INITIAL_ORDERS;
  });

  // Hash Routing sync (support #home, #orders, #map, #account, #admin)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash === 'admin' || window.location.pathname === '/admin') {
        setViewMode('admin');
        return;
      }
      if (hash === 'home' || hash === 'orders' || hash === 'map' || hash === 'account') {
        setActiveTab(hash as TabType);
        setViewMode('tabs');
      }
    };

    if (window.location.hash) {
      handleHashChange();
    } else if (window.location.pathname === '/admin') {
      setViewMode('admin');
    } else {
      window.location.hash = 'home';
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToTab = (tab: TabType) => {
    setActiveTab(tab);
    setViewMode('tabs');
    window.location.hash = tab;
  };

  // Sync with Firebase Firestore on mount
  useEffect(() => {
    async function loadFirestoreData() {
      try {
        const firestoreOrders = await fetchOrdersFromFirestore();
        if (firestoreOrders && firestoreOrders.length > 0) {
          // Filter out any legacy dummy orders
          const cleanOrders = firestoreOrders.filter((o) => 
            !o.id.startsWith('ord-10') && 
            !o.providerName?.includes('المدار') && 
            !o.providerName?.includes('إمداد التميز')
          );
          setOrders(cleanOrders);
        }

        const firestoreUsers = await fetchUsersFromFirestore();
        if (firestoreUsers && firestoreUsers.length > 0) {
          const cleanUsers = firestoreUsers.filter((u) => 
            u.id !== 'user-default' && 
            u.id !== 'provider-default' && 
            u.id !== 'usr-prov-02' && 
            u.name !== 'محمد فهد' &&
            !u.name.includes('المدار') &&
            !u.name.includes('إمداد التميز')
          );
          setAllUsers((prev) => {
            const merged = [...prev];
            cleanUsers.forEach((cu) => {
              const idx = merged.findIndex((m) => m.id === cu.id || (cu.phone && m.phone === cu.phone));
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...cu };
              } else {
                merged.push(cu);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.warn('Initial Firestore sync offline or fallback to cache:', err);
      }
    }

    loadFirestoreData();
  }, [user?.id]);

  // Persist allUsers
  useEffect(() => {
    try {
      localStorage.setItem('field_app_all_users_v6', JSON.stringify(allUsers));
    } catch {
      // Safe fallback
    }
  }, [allUsers]);

  // Sync active user into allUsers
  useEffect(() => {
    if (user) {
      setAllUsers((prev) => {
        const idx = prev.findIndex((u) => u.id === user.id || (user.phone && u.phone === user.phone));
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...user };
          return updated;
        } else {
          return [user, ...prev];
        }
      });
    }
  }, [user?.id, user?.phone, user?.name]);

  // Real-time Ban Sync: if active user is banned in allUsers, enforce it immediately
  useEffect(() => {
    if (user) {
      const match = allUsers.find((u) => u.id === user.id || (user.phone && u.phone === user.phone));
      if (match && match.isBanned !== user.isBanned) {
        setUser((prev) => prev ? { ...prev, isBanned: match.isBanned } : null);
      }
    }
  }, [allUsers, user?.id, user?.phone, user?.isBanned]);

  // Persist User
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('field_app_user_v6', JSON.stringify(user));
        saveUserProfileToFirestore(user).catch(() => {});
      } else {
        localStorage.removeItem('field_app_user_v6');
      }
    } catch {
      // Safe fallback
    }
  }, [user]);

  // Persist Orders
  useEffect(() => {
    try {
      localStorage.setItem('field_app_orders_v6', JSON.stringify(orders));
    } catch {
      // Safe fallback
    }
  }, [orders]);

  // Admin Dashboard View (Accessible via /admin or #admin)
  if (viewMode === 'admin') {
    return (
      <AdminDashboard
        orders={orders}
        setOrders={setOrders}
        allUsers={allUsers}
        setAllUsers={setAllUsers}
        categories={categories}
        setCategories={setCategories}
        onExit={() => {
          setViewMode('tabs');
          window.location.hash = 'home';
        }}
      />
    );
  }

  // If user is banned
  if (user && user.isBanned) {
    return (
      <div className="min-h-screen bg-[#2B1B15] flex items-center justify-center p-4 font-['Tajawal',sans-serif] text-right">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-xl font-black text-[#2B1B15]">تم إيقاف هذا الحساب</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            تم تعليق حسابك من قبل إدارة المنصة لمخالفة شروط الخدمة. يُرجى التواصل مع الدعم الفني للاستفسار.
          </p>
          <button
            onClick={() => {
              setUser(null);
              localStorage.removeItem('field_app_user_v6');
            }}
            className="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold cursor-pointer"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  // If user is not logged in, show LoginPage
  if (!user) {
    return (
      <LoginPage 
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
          setAllUsers((prev) => {
            const exists = prev.some((u) => u.id === loggedInUser.id || u.email === loggedInUser.email);
            if (!exists) {
              return [loggedInUser, ...prev];
            }
            return prev.map((u) => u.id === loggedInUser.id ? loggedInUser : u);
          });
        }} 
      />
    );
  }

  const handleSelectCategory = (cat: ServiceCategory) => {
    setSelectedCategoryForBooking(cat);
    setViewMode('booking');
  };

  const handleOpenBooking = () => {
    setSelectedCategoryForBooking(null);
    setViewMode('booking');
  };

  const handleOpenBookingWithLocation = () => {
    setSelectedCategoryForBooking(categories[0] || SERVICE_CATEGORIES[0]);
    setViewMode('booking');
  };

  const handleConfirmBooking = async (newOrder: Order) => {
    setOrders([newOrder, ...orders]);
    setSelectedOrderForDetails(newOrder);
    setViewMode('order-details');
    navigateToTab('orders');

    // Save to Firestore
    saveOrderToFirestore(newOrder).catch((e) => console.warn('Order save offline:', e));

    // Native push notification to the assigned provider
    sendDevicePushNotification(`طلب صيانة وارد لـ ${newOrder.providerName} 🔔`, {
      body: `طلب جديد (${newOrder.serviceTitle}) من العميل ${newOrder.client.name} بقيمة ${newOrder.price} ر.س`,
      tag: `provider-alert-${newOrder.id}`,
    });
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrderForDetails(order);
    setViewMode('order-details');
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm('تأكيد إلغاء هذا الطلب؟')) {
      const updated = orders.map((o) => {
        if (o.id === orderId) {
          const mod = { ...o, status: 'cancelled' as OrderStatus };
          saveOrderToFirestore(mod).catch(() => {});
          return mod;
        }
        return o;
      });
      setOrders(updated);
      sendDevicePushNotification('تم إلغاء الطلب ❌', {
        body: 'تم تسجيل طلب الإلغاء بنجاح.',
      });
    }
  };

  const handleRateOrder = (orderId: string, rating: number, comment: string, workerRating?: number) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        const mod = {
          ...o,
          rating,
          workerRating: workerRating || rating,
          reviewComment: comment,
        };
        saveOrderToFirestore(mod).catch(() => {});
        return mod;
      }
      return o;
    });
    setOrders(updated);

    sendDevicePushNotification('شكراً على تقييمك ⭐', {
      body: 'تم تسجيل تقييمك للخدمة بنجاح، ويسهم ذلك في تحسين جودة مقدمي الخدمة.',
    });
  };

  // Provider update order status handler with automatic native device push notifications
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus, assignedWorkerOrId?: Worker | string) => {
    let assignedWorker: Worker | undefined;
    if (typeof assignedWorkerOrId === 'object' && assignedWorkerOrId !== null) {
      assignedWorker = assignedWorkerOrId;
    } else if (typeof assignedWorkerOrId === 'string' && user.providerDetails?.workers) {
      assignedWorker = user.providerDetails.workers.find((w) => w.id === assignedWorkerOrId);
    }

    setOrders((prevOrders) =>
      prevOrders.map((ord) => {
        if (ord.id === orderId) {
          const modOrder: Order = {
            ...ord,
            status: newStatus,
            assignedWorker: assignedWorker || ord.assignedWorker,
          };
          saveOrderToFirestore(modOrder).catch(() => {});
          return modOrder;
        }
        return ord;
      })
    );

    const targetOrder = orders.find((o) => o.id === orderId);
    const serviceName = targetOrder?.serviceTitle || 'خدمة الصيانة';

    if (newStatus === 'assigned') {
      sendDevicePushNotification('تم تعيين فني لطلبك 👷‍♂️', {
        body: assignedWorker ? `تم تعيين الفني (${assignedWorker.name}) لتنفيذ ${serviceName}.` : `تم تعيين فني متخصص لتنفيذ ${serviceName}.`,
      });
    } else if (newStatus === 'on_the_way') {
      sendDevicePushNotification('الفني في الطريق إليك 🚗', {
        body: `الفني انطلق متوجهاً إلى موقعك لتنفيذ ${serviceName}. يُرجى التواجد في الموقع.`,
      });
    } else if (newStatus === 'arrived') {
      sendDevicePushNotification('وصل الفني إلى موقعك الآن! 📍', {
        body: `الفني متواجد الآن عند عنوانك لبدء أعمال الصيانة.`,
      });
    } else if (newStatus === 'in_progress') {
      sendDevicePushNotification('جاري تنفيذ أعمال الصيانة 🔧', {
        body: `بدأ الفني في إجراءات صيانة وإصلاح ${serviceName}.`,
      });
    } else if (newStatus === 'completed') {
      sendDevicePushNotification('اكتملت الخدمة بنجاح ✅', {
        body: `تم الانتهاء من صيانة ${serviceName} وتفعيل الضمان المعتمد. نرجو تقييم الفني.`,
      });
    }
  };

  const handleUpdateProviderDetails = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => u.id === updatedUser.id ? updatedUser : u));
    saveUserProfileToFirestore(updatedUser).catch(() => {});
  };

  const handleLogout = () => {
    setUser(null);
    setViewMode('tabs');
    navigateToTab('home');
  };

  const activeOrdersCount = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length;
  const latestActiveOrder = orders.find((o) => o.status !== 'completed' && o.status !== 'cancelled');

  return (
    <div className="min-h-screen bg-[#FDFBF5] text-[#2B1B3D] flex flex-col font-['Tajawal',sans-serif] selection:bg-[#FF6B53] selection:text-white pb-20 md:pb-0 overflow-x-hidden">
      {/* Top Navigation - Hidden when in Map mode or Booking/Order details */}
      {viewMode === 'tabs' && activeTab !== 'map' && (
        <Navbar
          activeTab={activeTab}
          onChangeTab={navigateToTab}
          onOpenBooking={handleOpenBooking}
          user={user}
          activeOrdersCount={activeOrdersCount}
        />
      )}

      {/* Main Content Area */}
      <main className={viewMode === 'tabs' && activeTab === 'map' ? 'w-full h-full p-0 m-0' : 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6'}>
        {/* Full-Page Booking View with Provider Selection by Rating */}
        {viewMode === 'booking' && (
          <BookingPage
            category={selectedCategoryForBooking}
            allCategories={categories}
            providers={allUsers.filter((u) => u.role === 'provider')}
            onConfirmBooking={handleConfirmBooking}
            onBack={() => setViewMode('tabs')}
            user={user}
          />
        )}

        {/* Full-Page Order Details View */}
        {viewMode === 'order-details' && selectedOrderForDetails && (
          <OrderDetailsPage
            order={orders.find((o) => o.id === selectedOrderForDetails.id) || selectedOrderForDetails}
            onBack={() => {
              setViewMode('tabs');
              navigateToTab('orders');
            }}
            onCancelOrder={handleCancelOrder}
            onRateOrder={handleRateOrder}
          />
        )}

        {/* Regular Tabs View */}
        {viewMode === 'tabs' && (
          <>
            {/* HOME TAB: If user is Provider, show Provider Dashboard! Otherwise show Client HomeTab */}
            {activeTab === 'home' && (
              user.role === 'provider' ? (
                <ProviderDashboard
                  user={user}
                  orders={orders}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onUpdateProviderDetails={handleUpdateProviderDetails}
                  onSelectOrder={handleSelectOrder}
                />
              ) : (
                <HomeTab
                  user={user}
                  categories={categories}
                  activeOrder={latestActiveOrder}
                  onSelectCategory={handleSelectCategory}
                  onOpenMap={() => navigateToTab('map')}
                  onOpenOrders={() => navigateToTab('orders')}
                  onOpenBookingModal={handleOpenBooking}
                />
              )
            )}

            {/* MAP TAB (Full-Screen Google Maps Style) */}
            {activeTab === 'map' && (
              <MapTab
                categories={categories}
                providers={allUsers.filter((u) => u.role === 'provider')}
                onOpenBookingWithLocation={handleOpenBookingWithLocation}
                userAddress={user.providerDetails?.district || user.city}
              />
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <OrdersTab
                orders={orders}
                onSelectOrder={handleSelectOrder}
                onOpenBooking={handleOpenBooking}
              />
            )}

            {/* ACCOUNT TAB */}
            {activeTab === 'account' && (
              <AccountTab
                user={user}
                onUpdateUser={setUser}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Nav (Icons only) */}
      {viewMode === 'tabs' && (
        <BottomNav
          activeTab={activeTab}
          onChangeTab={navigateToTab}
          activeOrdersCount={activeOrdersCount}
          role={user.role}
        />
      )}
    </div>
  );
}

export default App;
