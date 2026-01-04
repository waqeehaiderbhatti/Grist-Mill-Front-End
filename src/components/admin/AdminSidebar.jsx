import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, Calendar, CheckCircle, Wheat, Settings, LayoutDashboard, Package, FileText, Truck, LogOut, Archive, Plus, BookOpen, Users, BarChart3 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { LanguageToggle } from '../LanguageToggle';
import { useTranslation } from 'react-i18next';

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ur';
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const pending = orders.filter((o) => o.status === 'pending').length;
      setNewOrdersCount(pending);
    };

    updateCount();
    const interval = setInterval(updateCount, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/analytics', label: 'Analytics (P&L)', icon: BarChart3 },
    { path: '/admin/add-order', label: 'Add Manual Order', icon: Plus },
    { path: '/admin', label: 'New Orders', icon: ClipboardList, badge: newOrdersCount },
    { path: '/admin/today', label: "Today's Work", icon: Clock },
    { path: '/admin/tomorrow', label: "Tomorrow's List", icon: Calendar },
    { path: '/admin/completed', label: 'Completed Orders', icon: CheckCircle },
    { path: '/admin/records', label: 'Orders Record', icon: FileText },
    { path: '/admin/udhaar', label: 'Udhaar Khata', icon: Users },
    { path: '/admin/khata', label: 'Digital Khata', icon: BookOpen },
    { path: '/admin/inventory', label: 'Inventory', icon: Archive },
    { path: '/admin/services', label: 'Manage Services', icon: Package },
    { path: '/admin/delivery', label: 'Delivery Team', icon: Truck },
    { path: '/admin/settings', label: 'Store Settings', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-2">
           <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Wheat className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg text-sidebar-foreground font-semibold">Admin</span>
          </Link>
          <LanguageToggle />
        </div>
        
        {user && (
          <p className="text-xs text-sidebar-foreground/60 mt-1">{t('Welcome back')}, {user.name}</p>
        )}
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1">{t(item.label)}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge className="bg-success text-success-foreground">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <button
          onClick={() => {
            if (confirm('Clear all demo orders?')) {
              localStorage.removeItem('orders');
              window.location.reload();
            }
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-sm"
        >
          <span>🗑️ {t('Clear Demo Data')}</span>
        </button>
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <span>{isRTL ? '→' : '←'} {t('Back to Store')}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>{t('Logout')}</span>
        </button>
      </div>
    </aside>
  );
}