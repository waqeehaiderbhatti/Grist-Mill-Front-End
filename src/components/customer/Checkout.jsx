import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Trash2, CreditCard, Smartphone, Banknote, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useCart } from '../../lib/CartContext';
import { toast } from 'sonner';
import { useAuth } from '../../lib/AuthContext';

export function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { cart, getTotalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderType, setOrderType] = useState('pickup');
  const [address, setAddress] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [profile, setProfile] = useState(null);

  const total = getTotalPrice();
  const hasPendingWeightItem = cart.some(item => item.isWeightPending);

  // Load user data on mount if logged in
  useEffect(() => {
    if (user && user.role === 'customer') {
      const storedProfile = localStorage.getItem(`user_profile_${user.username}`);
      if (storedProfile) {
        const loadedProfile = JSON.parse(storedProfile);
        setProfile(loadedProfile); 
        setCustomerName(loadedProfile.name || '');
        setPhone(loadedProfile.phone || user.username);
        setAddress(loadedProfile.address || '');
      } else {
        const defaultProfile = {
          name: user.name || 'Customer',
          phone: user.username,
          email: '',
          address: ''
        };
        setProfile(defaultProfile); 
        setCustomerName(defaultProfile.name);
        setPhone(defaultProfile.phone);
      }
    }
  }, [user]);

  const handleGetLocation = () => {
    setLocationStatus('Getting location...');
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setAddress(`Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            setLocationStatus('Location captured!');
            toast.success('Location captured successfully');
          } catch (error) {
            setLocationStatus('Could not get address');
            toast.error('Failed to get address');
          }
        },
        (error) => {
          setLocationStatus('Location access denied');
          toast.error('Please enable location access');
        }
      );
    } else {
      setLocationStatus('Location not supported');
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const handlePlaceOrder = () => {
    if (!user) {
      toast.error('Please log in to place an order');
      navigate('/login/customer', { state: { from: location } });
      return;
    }

    if (!customerName || !phone) {
      toast.error('Please fill in your details');
      return;
    }

    if (orderType === 'delivery' && !address) {
      toast.error('Please provide a delivery address');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (paymentMethod !== 'cash') {
      setShowPaymentDialog(true);
    } else {
      completeOrder('pending');
    }
  };

  const processOnlinePayment = async () => {
    if ((paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && !mobileNumber) {
      toast.error('Please enter mobile number');
      return;
    }
    if (paymentMethod === 'card' && cardNumber.length < 16) {
      toast.error('Please enter valid card number');
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowPaymentDialog(false);
      toast.success('Payment successful!');
      completeOrder('paid', `TXN${Date.now()}`);
    }, 2000);
  };

  const completeOrder = (paymentStatus, transactionId) => {
    const orderId = `ORD${Date.now()}`;
    
    const order = {
      id: orderId,
      customerName,
      phone,
      items: cart, 
      total, 
      type: orderType,
      deliveryAddress: orderType === 'delivery' ? address : undefined,
      status: 'pending',
      paymentMethod,
      paymentStatus,
      transactionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'online',
    };

    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    existingOrders.push(order);
    localStorage.setItem('orders', JSON.stringify(existingOrders));

    clearCart();
    navigate(`/order-confirmation/${orderId}`);
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <h1 className="mb-4 text-foreground">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-6">Add some items from our services to get started</p>
        <Button onClick={() => navigate('/')}>Browse Services</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="mb-6 text-foreground">Checkout</h1>

      {/* Order Summary */}
      <Card className="p-6 mb-6">
        <h3 className="mb-4 text-foreground">Order Summary</h3>
        <div className="space-y-4">
          {cart.map(item => (
            <div key={item.service.id} className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0">
              <div className="flex-1">
                <h4 className="text-foreground">{item.service.name}</h4>
                {item.isWeightPending ? (
                  <p className="text-sm text-primary font-medium">
                    Weight to be confirmed (Price TBD)
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Rs. {item.service.price} × {item.quantity} {item.service.unit}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                {!item.isWeightPending && (
                  <p className="text-foreground">Rs. {item.service.price * item.quantity}</p>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(item.service.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          <div className="flex justify-between pt-4 border-t border-border">
            <span className="text-foreground">Total</span>
            <span className="text-foreground">Rs. {total}</span>
          </div>
          {hasPendingWeightItem && (
            <p className="text-sm text-primary text-right mt-2">
              Total does not include items with pending weight.
            </p>
          )}
        </div>
      </Card>

      {/* Customer Details */}
      <Card className="p-6 mb-6">
        <h3 className="mb-4 text-foreground">Your Details</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your name"
              className="mt-1"
              readOnly={!!user} 
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="mt-1"
              readOnly={!!user} 
            />
          </div>
          {user && (
            <p className="text-xs text-muted-foreground">
              To change your details, please go to your 'My Account' page.
            </p>
          )}
        </div>
      </Card>

      {/* Order Type */}
      <Card className="p-6 mb-6">
        <h3 className="mb-4 text-foreground">Order Type</h3>
        <RadioGroup value={orderType} onValueChange={(value) => setOrderType(value)}>
          <div className="flex items-center space-x-2 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors">
            <RadioGroupItem value="pickup" id="pickup" />
            <Label htmlFor="pickup" className="flex-1 cursor-pointer">
              <div>
                <p>Pickup</p>
                <p className="text-sm text-muted-foreground">Collect from our store</p>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors">
            <RadioGroupItem value="delivery" id="delivery" />
            <Label htmlFor="delivery" className="flex-1 cursor-pointer">
              <div>
                <p>Delivery</p>
                <p className="text-sm text-muted-foreground">Get it delivered to your door</p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </Card>

      {/* Delivery Section */}
      {orderType === 'delivery' && (
        <Card className="p-6 mb-6">
          <h3 className="mb-4 text-foreground">Delivery Address</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your delivery address"
                className="mt-1"
                readOnly={!!user && !!profile?.address} 
              />
              {user && profile?.address && (
                 <p className="text-xs text-muted-foreground mt-1">
                   To change your address, please go to your 'My Account' page.
                 </p>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGetLocation}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Use My Current Location
            </Button>
            {locationStatus && (
              <p className="text-sm text-muted-foreground text-center">
                {locationStatus}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Payment Method */}
      <Card className="p-6 mb-6">
        <h3 className="mb-4 text-foreground">Payment Method</h3>
        <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value)}>
          <div className="flex items-center space-x-2 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors">
            <RadioGroupItem value="cash" id="cash" />
            <Label htmlFor="cash" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3">
                <Banknote className="h-5 w-5 text-primary" />
                <div>
                  <p>Cash on {orderType === 'delivery' ? 'Delivery' : 'Pickup'}</p>
                  <p className="text-sm text-muted-foreground">Pay when you receive</p>
                </div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors">
            <RadioGroupItem value="jazzcash" id="jazzcash" />
            <Label htmlFor="jazzcash" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-primary" />
                <div>
                  <p>JazzCash</p>
                  <p className="text-sm text-muted-foreground">Pay via JazzCash wallet</p>
                </div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors">
            <RadioGroupItem value="easypaisa" id="easypaisa" />
            <Label htmlFor="easypaisa" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-primary" />
                <div>
                  <p>EasyPaisa</p>
                  <p className="text-sm text-muted-foreground">Pay via EasyPaisa wallet</p>
                </div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors">
            <RadioGroupItem value="card" id="card" />
            <Label htmlFor="card" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <p>Card Payment</p>
                  <p className="text-sm text-muted-foreground">Debit/Credit card</p>
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </Card>

      {/* Place Order Button */}
      <Button
        className="w-full bg-success hover:bg-success/90 text-success-foreground"
        size="lg"
        onClick={handlePlaceOrder}
      >
        {paymentMethod === 'cash' ? 'Place Order' : 'Proceed to Payment'} (Rs. {total}){hasPendingWeightItem && " + TBD"}
      </Button>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentMethod === 'jazzcash' && 'JazzCash Payment'}
              {paymentMethod === 'easypaisa' && 'EasyPaisa Payment'}
              {paymentMethod === 'card' && 'Card Payment'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-2xl mb-2">Rs. {total}</p>
              <p className="text-sm text-muted-foreground">Amount to pay</p>
              {hasPendingWeightItem && (
                <p className="text-xs text-primary mt-1">
                  (Additional charges for pending items will be due on delivery/pickup)
                </p>
              )}
            </div>

            {(paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && (
              <div>
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  placeholder="03XX XXXXXXX"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  maxLength={11}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Demo: Use any mobile number for testing
                </p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" maxLength={3} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Demo: Use any card details for testing
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={processOnlinePayment}
                disabled={isProcessingPayment}
                className="flex-1"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay Rs. ${total}`
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                disabled={isProcessingPayment}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}