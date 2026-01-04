import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';
import { Trash2, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../lib/AuthContext';

export function AddManualOrder() {
  const { user } = useAuth();
  const navigate = useNavigate(); 
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderType, setOrderType] = useState('pickup');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [orderStatus, setOrderStatus] = useState('processing');
  
  const [services, setServices] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [advancePayment, setAdvancePayment] = useState(0);

  useEffect(() => {
    const storedServices = localStorage.getItem('services');
    if (storedServices) {
      setServices(JSON.parse(storedServices));
    }
  }, []);

  const handleAddItem = () => {
    if (!selectedService || selectedQuantity <= 0) {
      toast.error('Please select a service and quantity');
      return;
    }
    const service = services.find(s => s.id === selectedService);
    if (!service) return;

    const existingItem = items.find(i => i.service.id === service.id);
    if (existingItem) {
      setItems(items.map(i => 
        i.service.id === service.id 
          ? { ...i, quantity: i.quantity + selectedQuantity }
          : i
      ));
    } else {
      setItems([...items, { service, quantity: selectedQuantity }]);
    }
    setSelectedService('');
    setSelectedQuantity(1);
  };

  const removeItem = (serviceId) => {
    setItems(items.filter(i => i.service.id !== serviceId));
  };

  const total = items.reduce((sum, item) => sum + item.service.price * item.quantity, 0);

  const handleSubmit = () => {
    if (!customerName || !phone) {
      toast.error('Please fill in Customer Name and Phone');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Auto-set payment status
    let finalPaymentStatus = paymentStatus;
    if (advancePayment > 0 && finalPaymentStatus !== 'paid') {
        finalPaymentStatus = 'partial';
    } else if (advancePayment >= total) {
        finalPaymentStatus = finalPaymentStatus === 'paid' ? 'paid' : 'paid';
    } else if (advancePayment === 0 && finalPaymentStatus === 'partial') {
        finalPaymentStatus = 'pending';
    }

    const orderId = `ORD${Date.now()}`;
    const newOrder = {
      id: orderId,
      customerName,
      phone,
      items,
      total,
      type: orderType,
      deliveryAddress: orderType === 'delivery' ? address : undefined,
      status: orderStatus,
      paymentMethod,
      paymentStatus: finalPaymentStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'manual',
      advancePayment: advancePayment > 0 ? advancePayment : undefined,
    };

    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    existingOrders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(existingOrders));

    toast.success('Manual order created successfully! Redirecting...');
    
    navigate('/admin');
  };

  const remainingBalance = total - advancePayment;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-foreground mb-2">Add Manual Order</h1>
        <p className="text-muted-foreground">
          Create a new order manually. This will affect inventory just like an online order.
        </p>
      </div>
      
      <Card className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left Column: Customer & Order Details */}
          <div className="space-y-4 p-6 border-b lg:border-b-0 lg:border-r border-border">
            <h4 className="text-foreground">1. Customer & Order Details</h4>
            <div>
              <Label htmlFor="manual-name">Full Name *</Label>
              <Input id="manual-name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="manual-phone">Phone Number *</Label>
              <Input id="manual-phone" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="manual-type">Order Type</Label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {orderType === 'delivery' && (
              <div>
                <Label htmlFor="manual-address">Delivery Address</Label>
                <Input id="manual-address" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
            )}
            <h4 className="text-foreground pt-4">2. Status & Payment</h4>
            <div>
              <Label htmlFor="manual-order-status">Initial Status</Label>
              <Select value={orderStatus} onValueChange={setOrderStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending (Goes to New Orders)</SelectItem>
                  <SelectItem value="processing">Processing (Goes to Today's Work)</SelectItem>
                  <SelectItem value="completed">Completed (Goes to Completed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="manual-advance-payment">Advance Payment (₹)</Label>
              <Input 
                id="manual-advance-payment" 
                type="number" 
                min="0"
                max={total}
                value={advancePayment} 
                onChange={e => setAdvancePayment(Math.max(0, parseFloat(e.target.value) || 0))} 
              />
              <p className="text-xs text-muted-foreground mt-1">If set, overrides default status logic to 'Partial'.</p>
            </div>
            
            <div>
              <Label htmlFor="manual-payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="jazzcash">JazzCash</SelectItem>
                  <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="manual-payment-status">Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right Column: Items */}
          <div className="space-y-4 p-6">
            <h4 className="text-foreground">3. Order Items</h4>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Service</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} (Rs. {s.price}/{s.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20">
                <Label>Qty</Label>
                <Input type="number" value={selectedQuantity} onChange={e => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>
              <div className="self-end">
                <Button size="icon" onClick={handleAddItem}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 border-b border-border pb-4">
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No items added yet.</p>
              )}
              {items.map(item => (
                <div key={item.service.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                  <div>
                    <p className="text-sm font-medium">{item.service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.service.unit} × Rs. {item.service.price}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Rs. {item.quantity * item.service.price}</p>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(item.service.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {items.length > 0 && (
              <>
                {advancePayment > 0 && (
                  <div className="border-t pt-4 flex justify-between items-center text-sm">
                    <p className="text-muted-foreground">Advance Paid</p>
                    <p className="font-medium text-success">Rs. {advancePayment}</p>
                  </div>
                )}
                <div className="border-t pt-4 flex justify-between items-center">
                  <p className="text-lg font-bold">Total (Excl. Advance)</p>
                  <p className="text-2xl font-bold">Rs. {total}</p>
                </div>
                {remainingBalance > 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold text-red-600">Remaining Due</p>
                    <p className="text-2xl font-bold text-red-600">Rs. {remainingBalance}</p>
                  </div>
                )}
              </>
            )}
            <Button onClick={handleSubmit} disabled={items.length === 0} size="lg" className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Create Order and Go to New Orders
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}