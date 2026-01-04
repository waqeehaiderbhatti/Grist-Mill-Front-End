import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { PrintOrderDetails } from './PrintOrderDetails';
import { PrintTaskList } from './PrintTaskList'; 
import { format } from 'date-fns';
import { cn } from '../ui/utils';
import { 
  Search, 
  Package, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Printer,
  CalendarDays,
  CreditCard,
  AlertTriangle,
  FileText 
} from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog'; 
import { toast } from 'sonner'; 

export function OrdersRecord() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState(undefined);
  
  const [printOrder, setPrintOrder] = useState(null);
  const [showPrintList, setShowPrintList] = useState(false);

  const [showAdvanceOnly, setShowAdvanceOnly] = useState(false);
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);

  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = () => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    setOrders(allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const matchesDate = (orderDateStr) => {
    if (!dateRange || !dateRange.from) return true;
    const orderDate = new Date(orderDateStr);
    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    if (orderDate < fromDate) return false;
    const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
    toDate.setHours(23, 59, 59, 999); 
    if (orderDate > toDate) return false;
    return true;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.type === typeFilter;
    const matchesDateFilter = matchesDate(order.createdAt);
    const matchesAdvance = !showAdvanceOnly || (order.advancePayment !== undefined && order.advancePayment > 0);
    
    const matchesUnpaid = !showUnpaidOnly || 
                          ((order.paymentStatus === 'pending' || order.paymentStatus === 'partial') && order.status !== 'cancelled');

    return matchesSearch && matchesStatus && matchesType && matchesDateFilter && matchesAdvance && matchesUnpaid;
  });

  const totalPayment = filteredOrders.reduce((sum, order) => {
    const paidAmount = order.paymentStatus === 'paid' ? order.total : (order.advancePayment || 0);
    if (order.status !== 'cancelled' && paidAmount > 0) {
      return sum + paidAmount;
    }
    return sum;
  }, 0);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    outForDelivery: orders.filter(o => o.status === 'out-for-delivery').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    scheduledTomorrow: orders.filter(o => o.status === 'scheduled-tomorrow').length,
    totalRevenue: orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0),
    paidOrders: orders.filter(o => o.paymentStatus === 'paid').length,
    unpaidOrders: orders.filter(o => o.paymentStatus === 'pending').length,
    partialOrders: orders.filter(o => o.paymentStatus === 'partial').length,
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { label: 'Pending', className: 'bg-yellow-500 text-white' },
      'processing': { label: 'Processing', className: 'bg-blue-500 text-white' },
      'ready': { label: 'Ready', className: 'bg-green-500 text-white' },
      'out-for-delivery': { label: 'Out for Delivery', className: 'bg-purple-500 text-white' },
      'completed': { label: 'Completed', className: 'bg-gray-500 text-white' },
      'cancelled': { label: 'Cancelled', className: 'bg-red-500 text-white' },
      'scheduled-tomorrow': { label: 'Tomorrow', className: 'bg-orange-500 text-white' },
    };

    const config = statusConfig[status] || { label: status, className: '' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };
  
  const getPaymentStatusBadge = (status) => {
    switch(status) {
        case 'paid':
            return <Badge className='bg-green-500 text-white mt-1'>Paid</Badge>;
        case 'partial':
            return <Badge className='bg-blue-500 text-white mt-1'>Partial</Badge>;
        case 'pending':
        default:
            return <Badge className='bg-orange-500 text-white mt-1'>Unpaid</Badge>;
    }
  }

  const handleSavePayment = () => {
    if (!paymentOrder) return;
    
    const amountToAdd = parseFloat(paymentAmount);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
        toast.error("Please enter a valid amount");
        return;
    }

    const currentAdvance = paymentOrder.advancePayment || 0;
    const newAdvance = currentAdvance + amountToAdd;
    const total = paymentOrder.total;
    
    let newStatus = 'pending';
    if (newAdvance >= total) {
        newStatus = 'paid';
    } else if (newAdvance > 0) {
        newStatus = 'partial';
    }

    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = allOrders.map(o => 
        o.id === paymentOrder.id 
        ? { ...o, advancePayment: newAdvance, paymentStatus: newStatus, updatedAt: new Date() }
        : o
    );

    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
    toast.success(`Payment of Rs. ${amountToAdd} added successfully!`);
    
    setPaymentOrder(null);
    setPaymentAmount('');
  };

  return (
    <div>
      <div className="mb-6">
        <div>
          <h1 className="text-foreground mb-2">Orders Record</h1>
          <p className="text-muted-foreground">Complete record of all orders</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl mt-1">{stats.total}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl mt-1">{stats.completed}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl mt-1">{stats.pending}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl mt-1">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  showWeekNumber 
                />
              </PopoverContent>
            </Popover>
            {dateRange && (
              <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
                Clear Date
              </Button>
            )}

            {/* Advance Payment Checkbox */}
            <div className="flex items-center space-x-2 border p-2 rounded-md bg-secondary/20">
              <Checkbox 
                id="advance-filter" 
                checked={showAdvanceOnly} 
                onCheckedChange={(c) => {
                  setShowAdvanceOnly(c);
                  if(c) setShowUnpaidOnly(false); 
                }} 
              />
              <Label htmlFor="advance-filter" className="text-sm font-medium cursor-pointer">
                Advance Only
              </Label>
            </div>

            {/* Unpaid Filter Checkbox */}
            <div className="flex items-center space-x-2 border p-2 rounded-md bg-red-50 border-red-100">
              <Checkbox 
                id="unpaid-filter" 
                checked={showUnpaidOnly} 
                onCheckedChange={(c) => {
                  setShowUnpaidOnly(c);
                  if(c) setShowAdvanceOnly(false);
                }} 
              />
              <Label htmlFor="unpaid-filter" className="text-sm font-medium cursor-pointer text-red-700">
                Show Unpaid/Due Only
              </Label>
            </div>

            {/* Print Filtered List Button */}
            <Button 
              variant="default" 
              size="sm"
              className="ml-auto"
              disabled={filteredOrders.length === 0}
              onClick={() => setShowPrintList(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Print List
            </Button>

          </div>

          <div className="flex flex-wrap gap-2">
            {/* Status Filters */}
            <div className="flex gap-2 items-center">
              <p className="text-sm text-muted-foreground">Status:</p>
              {['all', 'pending', 'processing', 'ready', 'completed', 'cancelled'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  size="sm"
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>

            {/* Type Filters */}
            <div className="flex gap-2 items-center ml-auto">
              <p className="text-sm text-muted-foreground">Type:</p>
              {['all', 'pickup', 'delivery'].map(type => (
                <Button
                  key={type}
                  variant={typeFilter === type ? 'default' : 'outline'}
                  onClick={() => setTypeFilter(type)}
                  size="sm"
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 mb-6">
        <h3 className="text-lg font-medium text-foreground">
          Filtered Records Summary
        </h3>
        <div className="flex items-baseline gap-4 mt-2">
          <p className="text-3xl font-bold">
            Rs. {totalPayment.toLocaleString('en-IN')}
          </p>
          <p className="text-muted-foreground">
            (Total paid/advance from {filteredOrders.length} matching orders)
          </p>
        </div>
      </Card>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No orders found matching your filters.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Delivery Staff</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const remainingBalance = order.total - (order.advancePayment || 0);
                
                const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                const isOverdue = (Date.now() - new Date(order.createdAt).getTime() > sevenDaysMs) && 
                                  (order.paymentStatus === 'pending' || order.paymentStatus === 'partial') && 
                                  order.status !== 'cancelled';

                return (
                <TableRow key={order.id} className={isOverdue ? "bg-red-50 hover:bg-red-100" : ""}>
                  <TableCell>
                    <span className="font-mono text-sm">{order.id}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-foreground">{order.customerName}</p>
                      <p className="text-sm text-muted-foreground">{order.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <p key={idx} className="text-sm">
                          {item.service.name} × {item.isWeightPending ? (
                            <span className="text-primary font-bold">(Pending Wt.)</span>
                          ) : (
                            item.quantity
                          )}
                        </p>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{order.items.length - 2} more
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-foreground">₹{order.total}</p>
                      {order.items.some(i => i.isWeightPending) && (
                        <span className="text-xs text-primary block">(+ TBD)</span>
                      )}
                      
                      {order.advancePayment && order.advancePayment > 0 && (
                        <p className="text-xs text-success block mt-1 font-medium">
                          Adv: Rs. {order.advancePayment}
                        </p>
                      )}

                      {remainingBalance > 0 && (
                          <p className="text-xs text-red-600 font-medium block">
                            Due: Rs. {remainingBalance}
                          </p>
                      )}

                      {order.paymentStatus && getPaymentStatusBadge(order.paymentStatus)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.type === 'delivery' ? 'default' : 'secondary'}>
                      {order.type === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm capitalize">
                      {order.paymentMethod === 'jazzcash' ? 'JazzCash' : 
                       order.paymentMethod === 'easypaisa' ? 'EasyPaisa' : 
                       order.paymentMethod || 'Cash'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.source === 'manual' ? 'secondary' : 'default'}
                      className={order.source === 'manual' ? '' : 'bg-blue-500 text-white'}
                    >
                      {order.source === 'manual' ? 'Manual' : 'Online'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{order.deliveryPersonnel || 'N/A'}</span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                    
                    {order.status === 'cancelled' && (
                      <div className="flex flex-col gap-1 mt-1">
                        {order.cancellationReason && (
                          <p className="text-xs text-red-600 italic max-w-[150px] whitespace-normal break-words" title={order.cancellationReason}>
                            {order.cancellationReason}
                          </p>
                        )}
                        {order.cancelledBy && (
                          <span className="text-[10px] w-fit bg-red-100 text-red-800 px-1.5 py-0.5 rounded border border-red-200">
                            By: {order.cancelledBy}
                          </span>
                        )}
                      </div>
                    )}

                  </TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    {isOverdue && (
                      <Badge className="bg-red-600 text-white mt-1 flex w-fit items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Overdue
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col gap-2 items-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPrintOrder(order)}
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                      
                      {order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => {
                            setPaymentOrder(order);
                            setPaymentAmount('');
                          }}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Add Payment
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>
      
      <PrintOrderDetails
        order={printOrder}
        open={!!printOrder}
        onClose={() => setPrintOrder(null)}
      />

      <PrintTaskList 
        orders={filteredOrders}
        title={`Orders List ${showUnpaidOnly ? '(Unpaid/Due Only)' : ''}`}
        open={showPrintList}
        onClose={() => setShowPrintList(false)}
      />

      <Dialog open={!!paymentOrder} onOpenChange={() => setPaymentOrder(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add Payment</DialogTitle>
                <DialogDescription>
                    Record a payment for Order #{paymentOrder?.id}. 
                    Current Due: Rs. {(paymentOrder?.total || 0) - (paymentOrder?.advancePayment || 0)}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label htmlFor="amount">Amount Received (Rs.)</Label>
                    <Input 
                        id="amount" 
                        type="number" 
                        placeholder="Enter amount" 
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        max={(paymentOrder?.total || 0) - (paymentOrder?.advancePayment || 0)}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setPaymentOrder(null)}>Cancel</Button>
                <Button onClick={handleSavePayment}>Save Payment</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}