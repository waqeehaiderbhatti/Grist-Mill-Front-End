import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { ShoppingBag, Clock, CheckCircle, TrendingUp, IndianRupee, Package, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../ui/skeleton';

export function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(true);
  
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedToday: 0,
    tomorrowScheduled: 0
  });

  const [overdueOrdersCount, setOverdueOrdersCount] = useState(0);
  const [staleOrdersCount, setStaleOrdersCount] = useState(0);

  useEffect(() => {
    // Initial fetch
    loadStats();

    // Set up polling interval
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = () => {
    // Simulate network latency only on first load if we want to see skeletons
    // In a real app, this would be an async fetch
    
    const calculateStats = () => {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const today = new Date().toDateString();
      const now = Date.now();

      const todayOrders = orders.filter(
        o => new Date(o.createdAt).toDateString() === today
      );

      const completedToday = orders.filter(
        o => o.status === 'completed' && new Date(o.updatedAt).toDateString() === today
      );

      setStats({
        todayRevenue: todayOrders.reduce((sum, o) => sum + o.total, 0),
        todayOrders: todayOrders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        processingOrders: orders.filter(o => o.status === 'processing' || o.status === 'ready').length,
        completedToday: completedToday.length,
        tomorrowScheduled: orders.filter(o => o.status === 'scheduled-tomorrow').length
      });

      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const overdue = orders.filter(o => {
        const isUnpaid = o.paymentStatus === 'pending' || o.paymentStatus === 'partial';
        const isNotCancelled = o.status !== 'cancelled';
        const isOld = (now - new Date(o.createdAt).getTime()) > sevenDaysMs;
        return isUnpaid && isNotCancelled && isOld;
      });
      setOverdueOrdersCount(overdue.length);

      const oneDayMs = 24 * 60 * 60 * 1000;
      const stale = orders.filter(o => {
        const isPending = o.status === 'pending';
        const isOld = (now - new Date(o.createdAt).getTime()) > oneDayMs;
        return isPending && isOld;
      });
      setStaleOrdersCount(stale.length);
    };

    if (isLoading) {
      setTimeout(() => {
        calculateStats();
        setIsLoading(false);
      }, 800); // Artificial delay to show Skeletons
    } else {
      calculateStats();
    }
  };

  const statCards = [
    {
      title: "Today's Revenue",
      value: `₹${stats.todayRevenue.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: "Today's Orders",
      value: stats.todayOrders.toString(),
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders.toString(),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'In Progress',
      value: stats.processingOrders.toString(),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Completed Today',
      value: stats.completedToday.toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Tomorrow Scheduled',
      value: stats.tomorrowScheduled.toString(),
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1>{t('Dashboard')}</h1>
        <p className="text-muted-foreground">Overview of your business performance</p>
      </div>

      {/* Alerts Section */}
      {(overdueOrdersCount > 0 || staleOrdersCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overdueOrdersCount > 0 && (
            <Card className="p-4 border-red-200 bg-red-50 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-1" />
                <div>
                  <h3 className="text-red-900 font-semibold">{t('Payment Overdue')}</h3>
                  <p className="text-red-700 text-sm">
                    {overdueOrdersCount} orders have payments pending for &gt;7 days.
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-red-300 text-red-900 hover:bg-red-100"
                onClick={() => navigate('/admin/records')}
              >
                {t('View')}
              </Button>
            </Card>
          )}

          {staleOrdersCount > 0 && (
            <Card className="p-4 border-orange-200 bg-orange-50 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-1" />
                <div>
                  <h3 className="text-orange-900 font-semibold">{t('Stale Orders')}</h3>
                  <p className="text-orange-700 text-sm">
                    {staleOrdersCount} new orders are pending for &gt;24 hours.
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-orange-300 text-orange-900 hover:bg-orange-100"
                onClick={() => navigate('/admin')}
              >
                {t('View')}
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              {isLoading ? (
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">{t(stat.title)}</p>
                    <h2 className="mb-0">{stat.value}</h2>
                  </div>
                  <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Quick Actions & Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="mb-4">{t('Quick Actions')}</h3>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : (
            <div className="space-y-3">
              <a
                href="/admin"
                className="block p-4 bg-accent hover:bg-accent/80 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p>{t('New Orders')}</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.pendingOrders} orders waiting
                    </p>
                  </div>
                  <span className="text-2xl">📋</span>
                </div>
              </a>
              <a
                href="/admin/today"
                className="block p-4 bg-accent hover:bg-accent/80 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p>{t("Today's Work")}</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.processingOrders} orders in progress
                    </p>
                  </div>
                  <span className="text-2xl">⏰</span>
                </div>
              </a>
              <a
                href="/admin/services"
                className="block p-4 bg-accent hover:bg-accent/80 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p>{t('Manage Services')}</p>
                    <p className="text-sm text-muted-foreground">
                      Update your catalog
                    </p>
                  </div>
                  <span className="text-2xl">⚙️</span>
                </div>
              </a>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="mb-4">{t('Business Tips')}</h3>
          {isLoading ? (
             <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
             </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm">💡 <span className="text-blue-900">Peak hours are typically 8-10 AM. Consider staffing accordingly.</span></p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm">📱 <span className="text-green-900">Enable WhatsApp notifications to respond faster to customers.</span></p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm">🎁 <span className="text-purple-900">Offer discounts on bulk orders to attract more customers.</span></p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}