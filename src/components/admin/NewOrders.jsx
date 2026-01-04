import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrdersTable } from './OrdersTable';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../lib/AuthContext'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '../ui/dropdown-menu'; 
import { Truck, UserPlus } from 'lucide-react'; 
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../ui/tooltip";

export function NewOrders() {
  const [orders, setOrders] = useState([]); 
  const { deliveryPersonnel } = useAuth(); 
  const navigate = useNavigate();
  
  // Safe filtering of personnel
  const activePersonnel = (deliveryPersonnel || []).filter(p => p.isActive); 

  const loadOrders = () => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]'); 
    const pending = allOrders.filter((o) => o.status === 'pending');
    setOrders(pending);
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
    
    if (newStatus === 'processing') {
      toast.success('Order moved to processing');
    } else if (newStatus === 'scheduled-tomorrow') {
      toast.success('Order scheduled for tomorrow');
    }
  };

  const handleAssignPersonnel = (orderId, personnelName) => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updated = allOrders.map((o) =>
      o.id === orderId ? { ...o, deliveryPersonnel: personnelName, updatedAt: new Date() } : o
    );
    localStorage.setItem('orders', JSON.stringify(updated));
    
    // Force immediate reload of local state
    loadOrders(); 
    
    if (personnelName) {
      toast.success(`Order assigned to ${personnelName}`);
    } else {
      toast.info('Delivery assignment cleared');
    }
  };

  return (
    <TooltipProvider>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-foreground">New Orders</h1>
          <p className="text-muted-foreground">{orders.length} pending orders</p>
        </div>

        <OrdersTable
          orders={orders}
          actions={(order) => (
            <div className="flex items-center gap-2">
              {order.type === 'delivery' ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className={order.deliveryPersonnel ? "border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100" : ""}
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      {order.deliveryPersonnel ? `Assigned: ${order.deliveryPersonnel}` : 'Assign Driver'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Assign Delivery To</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {activePersonnel.length > 0 ? (
                      activePersonnel.map(person => (
                        <DropdownMenuItem
                          key={person.id}
                          onSelect={() => handleAssignPersonnel(order.id, person.name)}
                          className="cursor-pointer"
                        >
                          <span>{person.name}</span>
                          {person.phone && <span className="ml-auto text-xs text-muted-foreground">{person.phone}</span>}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <>
                        <DropdownMenuItem disabled>No active personnel</DropdownMenuItem>
                        <DropdownMenuItem 
                          onSelect={() => navigate('/admin/delivery')}
                          className="text-primary cursor-pointer font-medium"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Delivery Staff
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => handleAssignPersonnel(order.id, '')}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
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
                        Pickup Order
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cannot assign driver to "Pickup" orders</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <Button
                size="sm"
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={() => updateOrderStatus(order.id, 'processing')}
              >
                Start Processing
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => updateOrderStatus(order.id, 'scheduled-tomorrow')}
              >
                Move to Tomorrow
              </Button>
            </div>
          )}
        />
      </div>
    </TooltipProvider>
  );
}