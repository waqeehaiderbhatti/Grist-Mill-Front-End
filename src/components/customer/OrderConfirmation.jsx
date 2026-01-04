import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export function OrderConfirmation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const foundOrder = orders.find((o) => o.id === orderId);
      setOrder(foundOrder);
    }
  }, [orderId]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-success" />
          </div>
        </div>
        
        <h1 className="mb-4 text-foreground">Order Placed!</h1>
        
        <p className="text-muted-foreground mb-2">
          Your order <span className="text-foreground">#{orderId}</span> has been received.
        </p>
        
        <p className="text-muted-foreground mb-8">
          We will notify you when it's ready.
        </p>

        {order && (
          <div className="mb-8 p-4 bg-secondary rounded-lg text-left">
            <h3 className="mb-3 text-foreground">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="text-foreground">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="text-foreground">{order.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="text-foreground capitalize">{order.type}</span>
              </div>
              
              <div className="pt-2 border-t border-border">
                <span className="text-muted-foreground">Items:</span>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.service.name}</span>
                    {item.isWeightPending ? (
                      <span className="text-primary font-medium">Pending Wt.</span>
                    ) : (
                      <span>x {item.quantity}</span>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment:</span>
                <span className="text-foreground capitalize">
                  {order.paymentMethod === 'jazzcash' ? 'JazzCash' : 
                   order.paymentMethod === 'easypaisa' ? 'EasyPaisa' : 
                   order.paymentMethod}
                  {order.paymentStatus === 'paid' && ' ✓'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="text-foreground">
                  Rs. {order.total}
                  {order.items.some(i => i.isWeightPending) && " (+ TBD)"}
                </span>
              </div>
              {order.paymentStatus === 'paid' && order.transactionId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="text-foreground font-mono text-xs">{order.transactionId}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <Button
          onClick={() => navigate('/')}
          className="bg-primary hover:bg-primary/90"
        >
          Back to Home
        </Button>
      </Card>
    </div>
  );
}