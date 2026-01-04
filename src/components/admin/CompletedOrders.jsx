import { useState, useEffect } from 'react';
import { OrdersTable } from './OrdersTable';
import { PrintTaskList } from './PrintTaskList';
import { Button } from '../ui/button';
import { FileText } from 'lucide-react';

export function CompletedOrders() {
  const [orders, setOrders] = useState([]);
  const [showPrintList, setShowPrintList] = useState(false);

  const loadOrders = () => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const completed = allOrders.filter((o) => 
      o.status === 'ready' || o.status === 'completed' || o.status === 'cancelled'
    );
    setOrders(completed);
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Completed Orders</h1>
          <p className="text-muted-foreground">{orders.length} orders</p>
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

      <OrdersTable orders={orders} />

      <PrintTaskList
        orders={orders}
        title="Completed Orders"
        open={showPrintList}
        onClose={() => setShowPrintList(false)}
      />
    </div>
  );
}