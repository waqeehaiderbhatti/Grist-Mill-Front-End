import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Printer } from 'lucide-react';

export function PrintOrderDetails({ order, open, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      pending: 'Pending',
      processing: 'Processing',
      ready: 'Ready for Pickup/Delivery',
      'out-for-delivery': 'Out for Delivery',
      completed: 'Completed',
      cancelled: 'Cancelled',
      'scheduled-tomorrow': 'Scheduled for Tomorrow',
    };
    return statusLabels[status] || status;
  };

  const hasPendingItems = order.items.some(i => i.isWeightPending);
  const remainingBalance = order.total - (order.advancePayment || 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-3xl overflow-x-auto print:max-w-full print:overflow-visible"
        hideCloseButton
      >
        {/* ---------- PRINT-ONLY STYLES ---------- */}
        <style type="text/css" media="print">
          {`
            @page { size: auto; margin: 10mm; }
            body {
              visibility: visible;
            }
            body > #root { 
              visibility: hidden; 
            }
            #printable-order-details,
            #printable-order-details * { 
              visibility: visible; 
            }
            #printable-order-details {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print\\:hidden { display: none !important; }
            .text-red-600 { color: #dc2626 !important; }
            .text-red-900 { color: #7f1d1d !important; }
            .bg-red-50 { background-color: #fef2f2 !important; }
            .border-red-300 { border-color: #fecaca !important; }
            .text-blue-600 { color: #2563eb !important; }
            .text-blue-900 { color: #1e3a8a !important; }
            .bg-blue-50 { background-color: #eff6ff !important; }
            .border-blue-300 { border-color: #bfdbfe !important; }
          `}
        </style>

        <DialogHeader className="print:hidden">
          <DialogTitle>Print Order Details</DialogTitle>
        </DialogHeader>

        <div
          id="printable-order-details"
          className="print:p-8 print:w-full min-w-[500px] font-mono text-sm space-y-4"
        >
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-border pb-4">
            <h2 className="text-2xl mb-1">GRISTMILL'S</h2>
            <p className="text-xs text-muted-foreground">Fresh Flour Daily</p>
            <h3 className="text-lg mt-3">ORDER DETAILS</h3>
          </div>

          {/* Order Info */}
          <div className="border-2 border-dashed border-border p-4 bg-gray-50 print:bg-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground">Order ID:</p>
                <p className="text-foreground font-mono">{order.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Order Date:</p>
                <p className="text-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}{' '}
                  {new Date(order.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status:</p>
                <p className="text-foreground uppercase">{getStatusLabel(order.status)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Order Type:</p>
                <p className="text-foreground uppercase">{order.type}</p>
              </div>
              
              {order.status === 'cancelled' && order.cancellationReason && (
                <div className="col-span-2 bg-red-50 p-2 border border-red-300">
                  <p className="text-muted-foreground text-red-900">Cancellation Reason:</p>
                  <p className="text-foreground text-red-600 italic">"{order.cancellationReason}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t border-dashed border-border pt-4 space-y-2">
            <h4 className="mb-2">CUSTOMER INFORMATION</h4>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer Name:</span>
              <span className="text-foreground">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone Number:</span>
              <span className="text-foreground">{order.phone}</span>
            </div>
            {order.deliveryAddress && (
              <div className="pt-2">
                <p className="text-muted-foreground mb-1">Delivery Address:</p>
                <p className="text-foreground text-xs bg-gray-100 p-2 rounded">
                  {order.deliveryAddress}
                </p>
              </div>
            )}
            {order.deliveryPersonnel && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Personnel:</span>
                <span className="text-foreground">{order.deliveryPersonnel}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border-t-2 border-dashed border-border pt-4">
            <h3 className="mb-3 text-center">ORDER ITEMS</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-start border-b border-dashed pb-2"
                >
                  <div className="flex-1 pr-4">
                    <p className="text-foreground whitespace-normal">{item.service.name}</p>
                    {item.isWeightPending ? (
                      <p className="font-bold">** WEIGHT TBD **</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} {item.service.unit} × ₹{item.service.price}
                      </p>
                    )}
                  </div>
                  {!item.isWeightPending && (
                    <p className="text-foreground whitespace-nowrap">
                      ₹{item.quantity * item.service.price}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t-2 border-dashed border-border pt-4">
            <div className="flex justify-between text-xl">
              <span className="text-foreground">SUBTOTAL:</span>
              <span className="text-foreground whitespace-nowrap">
                ₹{order.total}
                {hasPendingItems && " (+ TBD)"}
              </span>
            </div>
            
            {order.advancePayment && order.advancePayment > 0 && (
                <div className="flex justify-between text-lg mt-2">
                  <span className="text-muted-foreground">ADVANCE PAID:</span>
                  <span className="text-green-600 font-bold whitespace-nowrap">
                    - ₹{order.advancePayment}
                  </span>
                </div>
            )}
            
            {remainingBalance > 0 && (
                <div className="flex justify-between text-xl mt-2 border-t border-dashed pt-2">
                  <span className="text-red-600 font-bold">REMAINING DUE:</span>
                  <span className="text-red-600 font-bold whitespace-nowrap">
                    ₹{remainingBalance}
                  </span>
                </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="border-t-2 border-dashed border-border pt-4 space-y-2">
            <h4 className="mb-2">PAYMENT INFORMATION</h4>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="text-foreground uppercase">
                {order.paymentMethod === 'jazzcash'
                  ? 'JAZZCASH'
                  : order.paymentMethod === 'easypaisa'
                  ? 'EASYPAISA'
                  : order.paymentMethod || 'CASH'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Status:</span>
              <span
                className={
                  order.paymentStatus === 'paid'
                    ? 'text-green-600 font-bold'
                    : order.paymentStatus === 'partial'
                    ? 'text-blue-600 font-bold' 
                    : 'text-orange-600 font-bold'
                }
              >
                {order.paymentStatus === 'paid' ? '✓ PAID' : 
                 order.paymentStatus === 'partial' ? 'PARTIAL' : 
                 '✗ UNPAID'}
              </span>
            </div>
            {order.paymentStatus === 'paid' && order.transactionId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="text-foreground text-xs font-mono">
                  {order.transactionId}
                </span>
              </div>
            )}
            {order.paymentStatus !== 'paid' && remainingBalance > 0 && (
              <div className="bg-red-50 p-3 mt-2 rounded border-2 border-red-300 text-center">
                <p className="text-red-900 font-bold text-lg">
                  ⚠ COLLECT PAYMENT: ₹{remainingBalance}
                  {hasPendingItems && " (+ TBD)"}
                </p>
              </div>
            )}
          </div>

          {/* Print Info */}
          <div className="border-t border-dashed border-border pt-4 text-xs text-muted-foreground">
            <p>
              Printed on: {new Date().toLocaleDateString()} at{' '}
              {new Date().toLocaleTimeString()}
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t-2 border-dashed border-border">
            <p>Thank you for your business!</p>
            <p className="mt-1">GRISTMILL'S - Fresh Flour Daily</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-4 print:hidden">
          <Button onClick={handlePrint} className="flex-1 bg-primary">
            <Printer className="h-4 w-4 mr-2" />
            Print Details
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}