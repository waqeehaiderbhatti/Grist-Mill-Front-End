import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Search, Truck } from 'lucide-react';

export function OrdersTable({ orders, actions, showSearch = true }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterType === 'all' || order.type === filterType;

    return matchesSearch && matchesFilter;
  });

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filterType === 'pickup' ? 'default' : 'outline'}
              onClick={() => setFilterType('pickup')}
              size="sm"
            >
              Pickup
            </Button>
            <Button
              variant={filterType === 'delivery' ? 'default' : 'outline'}
              onClick={() => setFilterType('delivery')}
              size="sm"
            >
              Delivery
            </Button>
          </div>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-border rounded-lg">
          <p>No orders match your search</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total & Payment</TableHead>
                <TableHead>Type & Method</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const remainingBalance = order.total - (order.advancePayment || 0);

                return (
                <TableRow key={order.id}>
                  <TableCell>
                    <div>
                      <p className="text-foreground font-medium">{order.customerName}</p>
                      <p className="text-sm text-muted-foreground">{order.phone}</p>
                      
                      {/* --- VISUAL CONFIRMATION OF ASSIGNMENT --- */}
                      {order.deliveryPersonnel && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-full border border-blue-100">
                          <Truck className="h-3 w-3" />
                          <span>{order.deliveryPersonnel}</span>
                        </div>
                      )}
                      
                      {order.status === 'cancelled' && (
                        <div className="mt-1">
                          <p className="text-xs text-red-600 italic max-w-[150px] truncate" title={order.cancellationReason}>
                            Reason: {order.cancellationReason || 'None'}
                          </p>
                          {order.cancelledBy && (
                            <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded border border-red-200 inline-block mt-0.5">
                              By: {order.cancelledBy}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm">
                          {item.service.name} × {item.isWeightPending ? (
                            <span className="text-primary font-bold">(Pending Wt.)</span>
                          ) : (
                            item.quantity
                          )}
                        </p>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="text-foreground">Rs. {order.total}</span>
                      {order.items.some(i => i.isWeightPending) && (
                        <span className="text-xs text-primary block">(+ TBD)</span>
                      )}
                      
                      {order.advancePayment && order.advancePayment > 0 && (
                        <p className="text-xs text-success block mt-1">
                          Advance: Rs. {order.advancePayment}
                        </p>
                      )}

                      {remainingBalance > 0 && (
                          <p className="text-xs text-red-600 font-medium block">
                            Due: Rs. {remainingBalance}
                          </p>
                      )}

                      {order.paymentStatus && (
                        <div className="mt-1">
                          <Badge 
                            className={order.paymentStatus === 'paid' ? 'bg-green-500 text-white' : 
                                       order.paymentStatus === 'partial' ? 'bg-blue-500 text-white' : 
                                       'bg-orange-500 text-white'}
                          >
                            {order.paymentStatus === 'paid' ? '✓ Paid' : 
                             order.paymentStatus === 'partial' ? 'Partial' : 
                             'Unpaid'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        variant={order.type === 'delivery' ? 'default' : 'secondary'}
                        className={order.type === 'delivery' ? 'bg-warning text-warning-foreground' : ''}
                      >
                        {order.type === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                      </Badge>
                      {order.paymentMethod && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {order.paymentMethod === 'jazzcash' ? 'JazzCash' : 
                           order.paymentMethod === 'easypaisa' ? 'EasyPaisa' : 
                           order.paymentMethod}
                        </p>
                      )}
                      {order.deliveryAddress && (
                        <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {order.deliveryAddress}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.source === 'manual' ? 'secondary' : 'default'}
                      className={order.source === 'manual' ? '' : 'bg-blue-500 text-white'}
                    >
                      {order.source === 'manual' ? 'Manual' : 'Online'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {actions && actions(order)}
                    </div>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}