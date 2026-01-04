import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { CartProvider } from './lib/CartContext';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Toaster } from './components/ui/sonner';
import { initializeMockOrders } from './lib/mockData';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

// Layouts (Keep these static as they define the shell)
import { Header } from './components/customer/Header';
import { Footer } from './components/customer/Footer';
import { AdminSidebar } from './components/admin/AdminSidebar';

// --- Lazy Loaded Components ---

// Customer Pages
const Homepage = lazy(() => import('./components/customer/Homepage').then(module => ({ default: module.Homepage })));
const Checkout = lazy(() => import('./components/customer/Checkout').then(module => ({ default: module.Checkout })));
const OrderConfirmation = lazy(() => import('./components/customer/OrderConfirmation').then(module => ({ default: module.OrderConfirmation })));
const TrackOrder = lazy(() => import('./components/customer/TrackOrder').then(module => ({ default: module.TrackOrder })));
const Contact = lazy(() => import('./components/customer/Contact').then(module => ({ default: module.Contact })));
const UserAccount = lazy(() => import('./components/customer/UserAccount').then(module => ({ default: module.UserAccount })));

// Auth Pages
const AdminLogin = lazy(() => import('./components/auth/AdminLogin').then(module => ({ default: module.AdminLogin })));
const DeliveryLogin = lazy(() => import('./components/auth/DeliveryLogin').then(module => ({ default: module.DeliveryLogin })));
const CustomerLogin = lazy(() => import('./components/auth/CustomerLogin').then(module => ({ default: module.CustomerLogin })));
const CustomerSignUp = lazy(() => import('./components/auth/CustomerSignUp').then(module => ({ default: module.CustomerSignUp })));

// Delivery Panel
const DeliveryPanel = lazy(() => import('./components/delivery/DeliveryPanel').then(module => ({ default: module.DeliveryPanel })));

// Admin Pages
const Dashboard = lazy(() => import('./components/admin/Dashboard').then(module => ({ default: module.Dashboard })));
const NewOrders = lazy(() => import('./components/admin/NewOrders').then(module => ({ default: module.NewOrders })));
const TodaysWork = lazy(() => import('./components/admin/TodaysWork').then(module => ({ default: module.TodaysWork })));
const TomorrowsList = lazy(() => import('./components/admin/TomorrowsList').then(module => ({ default: module.TomorrowsList })));
const CompletedOrders = lazy(() => import('./components/admin/CompletedOrders').then(module => ({ default: module.CompletedOrders })));
const OrdersRecord = lazy(() => import('./components/admin/OrdersRecord').then(module => ({ default: module.OrdersRecord })));
const InventoryManagement = lazy(() => import('./components/admin/InventoryManagement').then(module => ({ default: module.InventoryManagement })));
const ManageServices = lazy(() => import('./components/admin/ManageServices').then(module => ({ default: module.ManageServices })));
const ManageDelivery = lazy(() => import('./components/admin/ManageDelivery').then(module => ({ default: module.ManageDelivery })));
const Settings = lazy(() => import('./components/admin/Settings').then(module => ({ default: module.Settings })));
const AddManualOrder = lazy(() => import('./components/admin/AddManualOrder').then(module => ({ default: module.AddManualOrder })));
const DigitalKhata = lazy(() => import('./components/admin/DigitalKhata').then(module => ({ default: module.DigitalKhata })));
const UdhaarKhata = lazy(() => import('./components/admin/UdhaarKhata').then(module => ({ default: module.UdhaarKhata })));
const FinancialAnalytics = lazy(() => import('./components/admin/FinancialAnalytics').then(module => ({ default: module.FinancialAnalytics })));

function PageLoader() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
    </div>
  );
}

function CustomerLayout({ children }) {
  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <Header />
      <main className="flex-1 mt-16 pb-20 md:pb-24">
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

function ProtectedAdminRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login/admin" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function ProtectedDeliveryRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user || user.role !== 'delivery') {
    return <Navigate to="/login/delivery" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    initializeMockOrders();
  }, []);

  useEffect(() => {
    const isUrdu = i18n.language === 'ur';
    document.documentElement.dir = isUrdu ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    if (isUrdu) {
      document.documentElement.classList.add('font-urdu');
    } else {
      document.documentElement.classList.remove('font-urdu');
    }
  }, [i18n.language]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Auth Routes - Wrapped in Suspense for consistency, though they load fast */}
            <Route path="/login/admin" element={<Suspense fallback={<PageLoader />}><AdminLogin /></Suspense>} />
            <Route path="/login/delivery" element={<Suspense fallback={<PageLoader />}><DeliveryLogin /></Suspense>} />
            <Route path="/login/customer" element={<Suspense fallback={<PageLoader />}><CustomerLogin /></Suspense>} />
            <Route path="/signup/customer" element={<Suspense fallback={<PageLoader />}><CustomerSignUp /></Suspense>} />

            {/* Customer Routes */}
            <Route path="/" element={<CustomerLayout><Homepage /></CustomerLayout>} />
            <Route path="/checkout" element={<CustomerLayout><Checkout /></CustomerLayout>} />
            <Route path="/order-confirmation/:orderId" element={<CustomerLayout><OrderConfirmation /></CustomerLayout>} />
            <Route path="/track-order" element={<CustomerLayout><TrackOrder /></CustomerLayout>} />
            <Route path="/contact" element={<CustomerLayout><Contact /></CustomerLayout>} />
            <Route path="/account" element={<CustomerLayout><UserAccount /></CustomerLayout>} />

            {/* Delivery Panel */}
            <Route path="/delivery" element={<ProtectedDeliveryRoute><Suspense fallback={<PageLoader />}><DeliveryPanel /></Suspense></ProtectedDeliveryRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/add-order" element={<ProtectedAdminRoute><AdminLayout><AddManualOrder /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin" element={<ProtectedAdminRoute><AdminLayout><NewOrders /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/today" element={<ProtectedAdminRoute><AdminLayout><TodaysWork /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/tomorrow" element={<ProtectedAdminRoute><AdminLayout><TomorrowsList /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/completed" element={<ProtectedAdminRoute><AdminLayout><CompletedOrders /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/records" element={<ProtectedAdminRoute><AdminLayout><OrdersRecord /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/udhaar" element={<ProtectedAdminRoute><AdminLayout><UdhaarKhata /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/khata" element={<ProtectedAdminRoute><AdminLayout><DigitalKhata /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/analytics" element={<ProtectedAdminRoute><AdminLayout><FinancialAnalytics /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/inventory" element={<ProtectedAdminRoute><AdminLayout><InventoryManagement /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/services" element={<ProtectedAdminRoute><AdminLayout><ManageServices /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/delivery" element={<ProtectedAdminRoute><AdminLayout><ManageDelivery /></AdminLayout></ProtectedAdminRoute>} />
            <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminLayout><Settings /></AdminLayout></ProtectedAdminRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}