import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { User, Package, MapPin, Phone, Mail, Edit, Save, X, LogOut } from 'lucide-react'; 
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '../../lib/AuthContext';
import { restoreToInventory } from '../../lib/inventoryUtils';

export function UserAccount() {
  const { user, logout } = useAuth(); 
  const navigate = useNavigate(); 
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);
  const [orders, setOrders] = useState([]);
  const [cancelOrder, setCancelOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadProfile();
    loadOrders();
  }, [user]);

  const loadProfile = () => {
    if (user) {
      const storedProfile = localStorage.getItem(`user_profile_${user.username}`);
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        setProfile(parsed);
        setTempProfile(parsed);
      } else {
        const defaultProfile = {
          name: user.name || 'Customer',
          phone: user.username, 
          email: '',
          address: ''
        };
        setProfile(defaultProfile);
        setTempProfile(defaultProfile);
        localStorage.setItem(`user_profile_${user.username}`, JSON.stringify(defaultProfile));
      }
    }
  };

  const loadOrders = () => {
    if (user) {
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const userOrders = allOrders.filter((order) => 
        order.phone === user.username
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(userOrders);
    }
  };

  const handleEdit = () => {
    setTempProfile(profile);
    setEditMode(true);
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setEditMode(false);
  };

  const handleSave = () => {
    if (!tempProfile.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!tempProfile.phone.trim() || !tempProfile.phone.match(/^(03\d{2}-?\d{7}|\+92-?3\d{2}-?\d{7})$/)) {
      toast.error('Please enter a valid Pakistani phone number');
      return;
    }

    if (user) {
      localStorage.setItem(`user_profile_${user.username}`, JSON.stringify(tempProfile));
      setProfile(tempProfile);
      setEditMode(false);
      toast.success('Profile updated successfully!');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('You have been logged out.');
    navigate('/'); 
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'processing':
      case 'partial':
      case 'out-for-delivery':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelOrder = () => {
    if (!cancelOrder) return;

    try {
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const updatedOrders = allOrders.map(o =>
        o.id === cancelOrder.id
          ? { 
              ...o, 
              status: 'cancelled', 
              updatedAt: new Date(), 
              cancellationReason: cancelReason || 'No reason provided',
              cancelledBy: 'Customer'
            }
          : o
      );
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      
      restoreToInventory(cancelOrder, 'Customer', cancelReason);
      
      toast.success('Order cancelled successfully');
      loadOrders(); 
    } catch (e) {
      toast.error('Failed to cancel order');
    } finally {
      setCancelOrder(null); 
      setCancelReason('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-foreground mb-2">My Account</h1>
            <p className="text-muted-foreground">Manage your profile and view order history</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-foreground">{profile.name}</h2>
                    <p className="text-muted-foreground">{profile.phone}</p>
                  </div>
                </div>
                {!editMode && (
                  <Button onClick={handleEdit} variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    {editMode ? (
                      <Input
                        id="name"
                        value={tempProfile.name}
                        onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                        placeholder="Ahmed Khan"
                      />
                    ) : (
                      <p className="mt-1 text-foreground">{profile.name || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    {editMode ? (
                      <Input
                        id="phone"
                        value={tempProfile.phone}
                        onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                        placeholder="0300-1234567"
                      />
                    ) : (
                      <p className="mt-1 text-foreground">{profile.phone || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email (Optional)
                    </Label>
                    {editMode ? (
                      <Input
                        id="email"
                        type="email"
                        value={tempProfile.email}
                        onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                        placeholder="ahmed@example.com"
                      />
                    ) : (
                      <p className="mt-1 text-foreground">{profile.email || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </Label>
                    {editMode ? (
                      <Input
                        id="address"
                        value={tempProfile.address}
                        onChange={(e) => setTempProfile({ ...tempProfile, address: e.target.value })}
                        placeholder="House # 123, Street 1, Lahore"
                      />
                    ) : (
                      <p className="mt-1 text-foreground">{profile.address || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {editMode && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button onClick={handleCancel} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="space-y-4">
              {orders.length === 0 ? (
                <Card className="p-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="mb-2">No orders yet</h3>
                  <p className="text-muted-foreground">When you place an order, it will appear here</p>
                </Card>
              ) : (
                orders.map((order) => {
                  const remainingBalance = order.total - (order.advancePayment || 0);
                  
                  return (
                  <Card key={order.id} className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-foreground">Order #{order.id}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                            {order.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-primary">
                          Rs. {order.total.toFixed(2)}
                          {order.items.some(i => i.isWeightPending) && (
                            <span className="text-xs ml-1">(+ TBD)</span>
                          )}
                        </p>
                        {order.advancePayment && order.advancePayment > 0 && (
                            <p className="text-xs text-success font-medium mt-1">
                                Advance Paid: Rs. {order.advancePayment.toFixed(2)}
                            </p>
                        )}
                        {remainingBalance > 0 && (
                            <p className="text-sm text-red-600 font-bold">
                                Due: Rs. {remainingBalance.toFixed(2)}
                            </p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <h4 className="mb-3 text-sm">Order Items</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.service.name} x {item.isWeightPending ? (
                                <span className="text-primary font-medium">(Pending Wt.)</span>
                              ) : (
                                item.quantity
                              )}
                            </span>
                            {!item.isWeightPending && (
                              <span className="text-foreground">Rs. {(item.service.price * item.quantity).toFixed(2)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.type === 'delivery' && order.deliveryAddress && (
                      <div className="border-t border-border pt-4 mt-4">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {order.deliveryAddress}
                        </p>
                      </div>
                    )}

                    <div className="border-t border-border pt-4 mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Method</p>
                        <p className="text-sm">{order.paymentMethod.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Status</p>
                        <p 
                            className={`text-sm ${order.paymentStatus === 'paid' ? 'text-green-600' : 
                                               order.paymentStatus === 'partial' ? 'text-blue-600' : 
                                               'text-orange-600'}`}
                        >
                          {order.paymentStatus.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    
                    {order.status === 'cancelled' && (
                      <div className="border-t border-border pt-4 mt-4 bg-red-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-red-800">Cancellation Reason:</p>
                            <p className="text-sm text-red-700 italic">"{order.cancellationReason || 'No reason'}"</p>
                          </div>
                          {order.cancelledBy && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded border border-red-200 font-medium">
                              Cancelled by: {order.cancelledBy}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {(order.status === 'pending') && (
                      <div className="border-t border-border pt-4 mt-4">
                        <Button
                          variant="destructive"
                          onClick={() => setCancelOrder(order)}
                        >
                          Cancel Order
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!cancelOrder} onOpenChange={() => { setCancelOrder(null); setCancelReason(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
              {cancelOrder?.items.some(i => !i.isWeightPending) && (
                " Stock for confirmed items will be restored to inventory."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Optional: Tell us why you're cancelling..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep Order</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleCancelOrder}
            >
              Yes, Cancel My Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}