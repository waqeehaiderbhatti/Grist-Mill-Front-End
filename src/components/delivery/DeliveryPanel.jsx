import { useState, useEffect } from 'react';
import { MapPin, Phone, Navigation, CheckCircle, Package, LogOut, Wheat, Clock, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAuth } from '../../lib/AuthContext';
import { LanguageToggle } from '../LanguageToggle';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { deductFromInventory } from '../../lib/inventoryUtils';

export function DeliveryPanel() {
  const [orders, setOrders] = useState([]);
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const loadOrders = () => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    const deliveryOrders = allOrders.filter(
      (o) =>
        o.type === 'delivery' &&
        (
          // Case 1: Ready orders (Unassigned OR Assigned to me)
          (o.status === 'ready' && (!o.deliveryPersonnel || o.deliveryPersonnel === user?.name)) ||
          // Case 2: Active deliveries (Assigned to me)
          (o.status === 'out-for-delivery' && o.deliveryPersonnel === user?.name) ||
          // Case 3: Upcoming/Processing orders (Assigned to me) - NEW
          ((o.status === 'pending' || o.status === 'processing') && o.deliveryPersonnel === user?.name)
        )
    );
    
    // Sort: Out for delivery -> Ready -> Processing/Pending
    const sortedOrders = deliveryOrders.sort((a, b) => {
      const statusOrder = { 'out-for-delivery': 1, 'ready': 2, 'processing': 3, 'pending': 4 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
    
    setOrders(sortedOrders);
  };

  const handleStartDelivery = (order) => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = allOrders.map(o =>
      o.id === order.id
        ? { ...o, status: 'out-for-delivery', deliveryPersonnel: user?.name, updatedAt: new Date().toISOString() }
        : o
    );
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    loadOrders();
    toast.success('Delivery started!');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCompleteDelivery = (order) => {
    if (confirm('Mark this delivery as completed?')) {
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const updatedOrders = allOrders.map(o =>
        o.id === order.id
          ? { ...o, status: 'completed', updatedAt: new Date().toISOString() }
          : o
      );
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      deductFromInventory(order, `Delivery (${user?.name || 'Staff'})`);
      loadOrders();
      toast.success('Delivery completed!');
    }
  };

  const openMaps = (address) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'processing': return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Processing</Badge>;
      case 'ready': return <Badge className="bg-green-600 text-white">Ready for Pickup</Badge>;
      case 'out-for-delivery': return <Badge className="bg-purple-600 text-white animate-pulse">Out for Delivery</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Wheat className="h-6 w-6" />
              <h1 className="text-xl font-bold">{t("GristMill's Delivery")}</h1>
            </div>
            <p className="text-xs text-primary-foreground/80 mt-1">
              {user?.name && `Driver: ${user.name}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle className="text-primary-foreground hover:bg-primary-foreground/20 border-white/20" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">{t('No Deliveries Available')}</h2>
            <p className="text-muted-foreground">
              You have no active deliveries or assigned tasks at the moment.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isActionable = order.status === 'ready' || order.status === 'out-for-delivery';
              
              return (
              <Card key={order.id} className={`p-5 overflow-hidden ${!isActionable ? 'opacity-75 bg-gray-50' : 'border-l-4 border-l-primary'}`}>
                <div className="space-y-4">
                  {/* Order Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground">#{order.id.slice(-6)}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <h3 className="font-bold text-lg">{order.customerName}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">₹{order.total}</p>
                      <Badge variant="outline" className="text-xs">
                        {order.paymentStatus === 'paid' ? 'Paid Online' : 'Collect Cash'}
                      </Badge>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex gap-3 bg-background p-3 rounded-md border border-border">
                    <MapPin className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{order.deliveryAddress || "No address provided"}</p>
                    </div>
                    {isActionable && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 text-blue-600"
                        onClick={() => openMaps(order.deliveryAddress || '')}
                      >
                        <Navigation className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Contact */}
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${order.phone}`} className="text-sm hover:underline font-medium">
                      {order.phone}
                    </a>
                  </div>

                  {/* Actions */}
                  {isActionable ? (
                    <div className="pt-2">
                      {order.status === 'ready' && (
                        <Button
                          onClick={() => handleStartDelivery(order)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          size="lg"
                        >
                          <Truck className="h-5 w-5 mr-2" />
                          {t('Start Delivery')}
                        </Button>
                      )}
                      {order.status === 'out-for-delivery' && (
                        <Button
                          onClick={() => handleCompleteDelivery(order)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          size="lg"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          {t('Mark as Delivered')}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2">
                      <p className="text-xs text-center text-orange-600 font-medium bg-orange-50 py-2 rounded">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Order is being prepared. You will be notified when ready.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}