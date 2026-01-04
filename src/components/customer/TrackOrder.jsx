import { useState } from 'react';
import { Search, Package, Clock, CheckCircle, XCircle, Calendar, Truck } from 'lucide-react'; 
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
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
import { restoreToInventory } from '../../lib/inventoryUtils';

export function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [cancelOrder, setCancelOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleSearch = () => {
    if (!orderId.trim()) return;

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const found = orders.find(o => o.id === orderId.trim());

    if (found) {
      setOrder(found);
      setNotFound(false);
    } else {
      setOrder(null);
      setNotFound(true);
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
      setOrder(prev => prev ? { 
        ...prev, 
        status: 'cancelled', 
        cancellationReason: cancelReason || 'No reason provided',
        cancelledBy: 'Customer'
      } : null);
    } catch (e) {
      toast.error('Failed to cancel order');
    } finally {
      setCancelOrder(null); 
      setCancelReason('');
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          label: 'Order Received',
          description: 'Your order has been received and will be processed soon.'
        };
      case 'processing':
        return {
          icon: Package,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          label: 'Processing',
          description: 'Your order is being prepared.'
        };
      case 'ready':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          label: 'Ready for Pickup/Delivery',
          description: 'Your order is ready!'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          label: 'Completed',
          description: 'Your order has been completed.'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          label: 'Cancelled',
          description: 'This order has been cancelled.'
        };
      case 'scheduled-tomorrow':
        return {
          icon: Calendar,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          label: 'Scheduled for Tomorrow',
          description: 'Your order is scheduled for tomorrow.'
        };
      case 'out-for-delivery':
        return {
          icon: Truck, 
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          label: 'Out for Delivery',
          description: 'Your order is on its way!'
        };
    }
  };

  const statusInfo = order ? getStatusInfo(order.status) : null;
  const StatusIcon = statusInfo?.icon;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="mb-4">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your order ID to check the status of your order
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Order ID (e.g., ORD1234567890)"
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value);
                setNotFound(false);
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} size="lg">
              <Search className="h-5 w-5 mr-2" />
              Track
            </Button>
          </div>
        </Card>

        {notFound && (
          <Card className="p-8 text-center bg-red-50 border-red-200">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="mb-2 text-red-900">Order Not Found</h3>
            <p className="text-red-700">
              No order found with ID: <span className="font-mono">{orderId}</span>
            </p>
            <p className="text-red-700 text-sm mt-2">
              Please check your order ID and try again.
            </p>
          </Card>
        )}

        {order && statusInfo && StatusIcon && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className={`${statusInfo.bgColor} p-6 rounded-lg text-center mb-6`}>
                <StatusIcon className={`h-16 w-16 ${statusInfo.color} mx-auto mb-4`} />
                <h2 className={`mb-2 ${statusInfo.color}`}>{statusInfo.label}</h2>
                <p className="text-muted-foreground">{statusInfo.description}</p>
              </div>

              {order.status === 'cancelled' && (
                <div className="mb-6 bg-red-50 p-4 rounded-lg border border-red-200">
                   <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-red-800">Cancellation Reason:</p>
                      <p className="text-sm text-red-700 italic">"{order.cancellationReason || 'No reason provided'}"</p>
                    </div>
                    {order.cancelledBy && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded border border-red-200 font-medium">
                        Cancelled by: {order.cancelledBy}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                    <p className="font-mono">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Order Type</p>
                    <p className="capitalize">{order.type}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Customer Name</p>
                  <p>{order.customerName}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <p>{order.phone}</p>
                </div>

                {order.deliveryAddress && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
                    <p>{order.deliveryAddress}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order Date</p>
                  <p>{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <p>{item.service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.isWeightPending ? (
                          <span className="text-primary font-medium">(Pending Wt.)</span>
                        ) : (
                          `${item.quantity} ${item.service.unit}`
                        )}
                      </p>
                    </div>
                    {!item.isWeightPending && (
                      <p>Rs. {(item.service.price * item.quantity).toLocaleString('en-PK')}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <p>Total Amount</p>
                <p className="text-xl">
                  Rs. {order.total.toLocaleString('en-PK')}
                  {order.items.some(i => i.isWeightPending) && " (+ TBD)"}
                </p>
              </div>
            </Card>

            {(order.status === 'pending') && (
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-foreground">Need to cancel?</h4>
                    <p className="text-sm text-muted-foreground">
                      You can cancel this order while it is still pending.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setCancelOrder(order)}
                    className="w-full sm:w-auto"
                  >
                    Cancel Order
                  </Button>
                </div>
              </Card>
            )}

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Need help? Contact us at{' '}
                <a href="tel:+919876543210" className="text-primary hover:underline">
                  +91 98765 43210
                </a>
              </p>
            </div>
          </div>
        )}
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