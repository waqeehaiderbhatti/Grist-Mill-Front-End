import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Search, User, Phone, ChevronRight, DollarSign, History, CheckCircle, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export function UdhaarKhata() {
  const [ledgers, setLedgers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    loadLedgers();
  }, []);

  const loadLedgers = () => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    // 1. Filter for unpaid orders
    const unpaidOrders = allOrders.filter(o => 
      (o.paymentStatus === 'pending' || o.paymentStatus === 'partial') && 
      o.status !== 'cancelled'
    );

    // 2. Group by Customer (Phone is the unique ID)
    const ledgerMap = new Map();

    unpaidOrders.forEach(order => {
      const dueAmount = order.total - (order.advancePayment || 0);
      
      if (dueAmount <= 0) return; // Skip if strictly 0 or less (safety check)

      if (!ledgerMap.has(order.phone)) {
        ledgerMap.set(order.phone, {
          phone: order.phone,
          name: order.customerName,
          totalDebt: 0,
          orderCount: 0,
          lastOrderDate: new Date(0), // Init with old date
          orders: []
        });
      }

      const customer = ledgerMap.get(order.phone);
      customer.totalDebt += dueAmount;
      customer.orderCount += 1;
      customer.orders.push(order);
      
      const orderDate = new Date(order.createdAt);
      if (orderDate > customer.lastOrderDate) {
        customer.lastOrderDate = orderDate;
      }
    });

    const ledgerArray = Array.from(ledgerMap.values()).sort((a, b) => b.totalDebt - a.totalDebt);
    setLedgers(ledgerArray);
  };

  const handleReceivePayment = () => {
    if (!selectedCustomer || !paymentAmount) return;

    const amountReceived = parseFloat(paymentAmount);
    if (isNaN(amountReceived) || amountReceived <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amountReceived > selectedCustomer.totalDebt) {
      toast.error(`Amount exceeds total debt of Rs. ${selectedCustomer.totalDebt}`);
      return;
    }

    // --- FIFO Logic: Pay off oldest orders first ---
    const sortedOrders = [...selectedCustomer.orders].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    let remainingPayment = amountReceived;
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = [...allOrders];

    for (const customerOrder of sortedOrders) {
      if (remainingPayment <= 0) break;

      const orderIndex = updatedOrders.findIndex(o => o.id === customerOrder.id);
      if (orderIndex === -1) continue;

      const order = updatedOrders[orderIndex];
      const currentAdvance = order.advancePayment || 0;
      const due = order.total - currentAdvance;

      if (remainingPayment >= due) {
        // Full payment for this order
        updatedOrders[orderIndex] = {
          ...order,
          advancePayment: order.total, // Fully paid
          paymentStatus: 'paid',
          updatedAt: new Date()
        };
        remainingPayment -= due;
      } else {
        // Partial payment for this order
        updatedOrders[orderIndex] = {
          ...order,
          advancePayment: currentAdvance + remainingPayment,
          paymentStatus: 'partial',
          updatedAt: new Date()
        };
        remainingPayment = 0;
      }
    }

    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    toast.success(`Payment of Rs. ${amountReceived} recorded for ${selectedCustomer.name}`);
    
    setShowPaymentDialog(false);
    setPaymentAmount('');
    setSelectedCustomer(null);
    loadLedgers(); 
  };

  const filteredLedgers = ledgers.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.phone.includes(searchTerm)
  );

  const totalOutstanding = ledgers.reduce((sum, l) => sum + l.totalDebt, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-2">Udhaar Khata</h1>
          <p className="text-muted-foreground">Customer Ledger & Outstanding Payments</p>
        </div>
        <Card className="px-4 py-2 bg-red-50 border-red-200 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-red-600 font-medium">Total Outstanding</p>
            <p className="text-xl font-bold text-red-700">Rs. {totalOutstanding.toLocaleString()}</p>
          </div>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Pending Orders</TableHead>
              <TableHead>Last Order</TableHead>
              <TableHead>Total Debt</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLedgers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  {searchTerm ? "No customers found matching your search." : "No outstanding debts! Good job."}
                </TableCell>
              </TableRow>
            ) : (
              filteredLedgers.map((customer) => (
                <TableRow key={customer.phone}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      {customer.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{customer.orderCount} Orders</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {customer.lastOrderDate.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className="text-red-600 font-bold">Rs. {customer.totalDebt.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      View & Settle <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Detail & Settle Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => { if(!open) setSelectedCustomer(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedCustomer?.name}'s Ledger</span>
              <span className="text-red-600 font-bold mr-6">Total Due: Rs. {selectedCustomer?.totalDebt.toLocaleString()}</span>
            </DialogTitle>
            <DialogDescription>
              Phone: {selectedCustomer?.phone}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Payment Action */}
            <div className="bg-secondary/30 p-4 rounded-lg border border-border flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="payAmount">Receive Payment</Label>
                <Input 
                  id="payAmount" 
                  type="number" 
                  placeholder="Enter amount to settle..." 
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will automatically pay off oldest orders first.
                </p>
              </div>
              <Button onClick={() => setShowPaymentDialog(true)} disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Settle Amount
              </Button>
            </div>

            {/* Order History Table */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <History className="h-4 w-4" /> Outstanding Orders History
              </h4>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCustomer?.orders.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map(order => {
                      const paid = order.advancePayment || 0;
                      const due = order.total - paid;
                      return (
                        <TableRow key={order.id}>
                          <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono text-xs">{order.id}</TableCell>
                          <TableCell>Rs. {order.total}</TableCell>
                          <TableCell className="text-green-600">Rs. {paid}</TableCell>
                          <TableCell className="font-bold text-red-600">Rs. {due}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedCustomer(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to receive <strong>Rs. {paymentAmount}</strong> from <strong>{selectedCustomer?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button onClick={handleReceivePayment} className="bg-green-600 hover:bg-green-700">
              Confirm & Update Ledger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}