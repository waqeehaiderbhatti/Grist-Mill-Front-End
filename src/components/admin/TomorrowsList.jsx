import { useState, useEffect } from 'react';
import { OrdersTable } from './OrdersTable';
import { PrintTaskList } from './PrintTaskList';
import { Button } from '../ui/button';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

export function TomorrowsList() {
  const [orders, setOrders] = useState([]);
  const [showPrintList, setShowPrintList] = useState(false);

  const loadOrders = () => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const tomorrow = allOrders.filter((o) => o.status === 'scheduled-tomorrow');
    setOrders(tomorrow);
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = (orderId, newStatus) => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updated = allOrders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date() } : o
    );
    localStorage.setItem('orders', JSON.stringify(updated));
    loadOrders();
    toast.success('Order moved to processing');
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Tomorrow's Work List</h1>
          <p className="text-muted-foreground">{orders.length} orders scheduled</p>
        </div>
        <Button
          onClick={() => setShowPrintList(true)}
          disabled={orders.length === 0}
          className="bg-primary"
        >
          <FileText className="h-4 w-4 mr-2" />
          Print Full List
        </Button>
      </div>

      <OrdersTable
        orders={orders}
        actions={(order) => (
          <Button
            size="sm"
            className="bg-success hover:bg-success/90 text-success-foreground"
            onClick={() => updateOrderStatus(order.id, 'processing')}
          >
            Start Processing
          </Button>
        )}
      />

      <PrintTaskList
        orders={orders}
        title="Tomorrow's Work List - Scheduled Orders"
        open={showPrintList}
        onClose={() => setShowPrintList(false)}
      />
    </div>
  );
}