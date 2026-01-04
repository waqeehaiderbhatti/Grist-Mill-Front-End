import { useState, useEffect } from 'react';
import { OrdersTable } from './OrdersTable';
import { PrintSlip } from './PrintSlip';
import { PrintTaskList } from './PrintTaskList';
import { Button } from '../ui/button';
import { Printer, Truck, FileText, Edit } from 'lucide-react'; 
import { toast } from 'sonner';
import { deductFromInventory, restoreToInventory } from '../../lib/inventoryUtils'; 
import { UpdateWeightModal } from './UpdateWeightModal'; 
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
import { useAuth } from '../../lib/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../ui/tooltip";

export function TodaysWork() {
  const [orders, setOrders] = useState([]); 
  const [printOrder, setPrintOrder] = useState(null);
  const [showPrintList, setShowPrintList] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null); 
  const { user, deliveryPersonnel } = useAuth(); 
  const activePersonnel = (deliveryPersonnel || []).filter(p => p.isActive); 

  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const loadOrders = () => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const processing = allOrders.filter((o) => o.status === 'processing');
    setOrders(processing);
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = (orderId, newStatus) => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = allOrders.find((o) => o.id === orderId);

    if (order && order.items.some(item => item.isWeightPending) && (newStatus === 'ready' || newStatus === 'completed')) {
      toast.error('Please update the weight for this order before marking it as ready.');
      return;
    }
    
    const updated = allOrders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date() } : o
    );
    localStorage.setItem('orders', JSON.stringify(updated));
    
    if ((newStatus === 'ready' || newStatus === 'completed') && order) {
      deductFromInventory(order, 'Admin (Order Ready)');
    }
    
    loadOrders();
    
    if (newStatus === 'ready') {
      toast.success('Order marked as ready - Inventory updated');

      // --- WhatsApp Integration Feature ---
      if (order && order.phone) {
        try {
          let phoneNumber = order.phone.replace(/\D/g, ''); // Remove non-digits
          if (phoneNumber.startsWith('0')) {
            phoneNumber = '92' + phoneNumber.slice(1);
          }
          
          // Construct the message
          const message = `Assalam O Alikum ${order.customerName}, your order #${order.id} is ready for pickup at Apni Atta Chakki. Total: Rs ${order.total}.`;
          
          // Create URL
          const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
          
          // Open in new tab
          window.open(url, '_blank');
          toast.success("Opening WhatsApp...");
        } catch (error) {
          console.error("Error opening WhatsApp:", error);
        }
      }
      // ------------------------------------
    }
  };

  const handleAssignPersonnel = (orderId, personnelName) => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updated = allOrders.map((o) =>
      o.id === orderId ? { ...o, deliveryPersonnel: personnelName, updatedAt: new Date() } : o
    );
    localStorage.setItem('orders', JSON.stringify(updated));
    loadOrders();
    
    if (personnelName) {
      toast.success(`Order assigned to ${personnelName}`);
    } else {
      toast.info('Assignment cleared');
    }
  };

  const handleConfirmCancel = () => {
    if (!cancellingOrder) return;
    
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const finalReason = cancelReason || 'Cancelled by Admin'; 
    const performedBy = user?.name || 'Admin';

    const updated = allOrders.map((o) =>
      o.id === cancellingOrder.id ? { 
        ...o, 
        status: 'cancelled', 
        updatedAt: new Date(), 
        cancellationReason: finalReason,
        cancelledBy: performedBy 
      } : o
    );
    localStorage.setItem('orders', JSON.stringify(updated));
    
    const cancelledOrder = updated.find(o => o.id === cancellingOrder.id);
    if (cancelledOrder) {
      restoreToInventory(cancelledOrder, performedBy, finalReason);
    }
    
    loadOrders();
    toast.error('Order cancelled');
    setCancellingOrder(null);
    setCancelReason('');
  };

  return (
    <TooltipProvider>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-foreground">Today's Work</h1>
            <p className="text-muted-foreground">{orders.length} orders in progress</p>
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
            <>
              {order.items.some(item => item.isWeightPending) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => setEditingOrder(order)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Weight
                </Button>
              )}

              {order.type === 'delivery' ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className={order.deliveryPersonnel ? "border-blue-500 text-blue-600" : ""}
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      {order.deliveryPersonnel ? 'Reassign' : 'Assign'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Assign Delivery To</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {activePersonnel.length > 0 ? (
                      activePersonnel.map(person => (
                        <DropdownMenuItem
                          key={person.id}
                          onSelect={() => handleAssignPersonnel(order.id, person.name)}
                        >
                          {person.name}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>No active personnel</DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => handleAssignPersonnel(order.id, '')}
                      className="text-red-600"
                    >
                      Clear Assignment
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-block">
                      <Button size="sm" variant="outline" disabled className="opacity-50">
                        <Truck className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cannot assign to "Pickup" orders</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => setPrintOrder(order)}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button
                size="sm"
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={() => updateOrderStatus(order.id, 'ready')}
              >
                {order.type === 'delivery' ? 'Ready to Ship' : 'Ready'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setCancellingOrder(order)}
              >
                Cancel
              </Button>
            </>
          )}
        />

        <PrintSlip
          order={printOrder}
          open={!!printOrder}
          onClose={() => setPrintOrder(null)}
        />

        <PrintTaskList
          orders={orders}
          title="Today's Work - Processing Orders"
          open={showPrintList}
          onClose={() => setShowPrintList(false)}
        />

        <UpdateWeightModal
          order={editingOrder}
          open={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          onOrderUpdated={() => {
            loadOrders();
            setEditingOrder(null);
          }}
        />

        <AlertDialog open={!!cancellingOrder} onOpenChange={() => { setCancellingOrder(null); setCancelReason(''); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will cancel order #{cancellingOrder?.id}. Stock for confirmed items will be restored to inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              placeholder="Optional: Reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-2"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Order</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleConfirmCancel}
              >
                Yes, Cancel Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}