import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Printer } from 'lucide-react';

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-GB') + ' ' + new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const getPaidCount = (orders) => orders.filter(o => o.paymentStatus === 'paid').length;
const getUnpaidCount = (orders) => orders.filter(o => o.paymentStatus === 'pending').length;
const getDeliveryCount = (orders) => orders.filter(o => o.type === 'delivery').length;
const getPickupCount = (orders) => orders.filter(o => o.type === 'pickup').length;
const getPartialCount = (orders) => orders.filter(o => o.paymentStatus === 'partial').length;

export function PrintTaskList({ orders, title, open, onClose }) {
  const handlePrint = () => window.print();
  
  const confirmedTotalRevenue = orders
    .filter(o => !o.items.some(i => i.isWeightPending))
    .reduce((s, o) => s + o.total, 0);
    
  const pendingWeightOrders = orders.filter(o => o.items.some(i => i.isWeightPending));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] w-full overflow-x-auto print:max-w-none print:w-full print:h-auto print:overflow-visible print:p-0 print:border-0 print:shadow-none print:block"
        hideCloseButton
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 landscape; margin: 10mm; }
            body { background: white; }
            
            body > * { display: none !important; }
            .print\\:hidden { display: none !important; }

            body > [data-radix-portal] {
              display: block !important;
              position: static;
            }
            
            [data-radix-portal] > [data-state] {
              background: none !important;
              position: static !important;
              transform: none !important;
              padding: 0 !important;
            }

            #printable-list { 
              display: block !important;
              visibility: visible !important;
              width: 100%;
              position: static;
            }
            
            #printable-list * {
              font-family: monospace !important;
              color: black !important;
            }
            
            .order-card { 
              page-break-inside: avoid; 
              margin-bottom: 15px; 
              border: 1px dashed #000; 
              padding: 10px;
            }
            
            .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          `}
        </style>

        <DialogHeader className="print:hidden">
          <DialogTitle>Print {title}</DialogTitle>
        </DialogHeader>

        <div id="printable-list" className="font-mono text-sm space-y-6 print:space-y-4">
          {/* ==== HEADER ==== */}
          <div className="text-center border-b-2 border-dashed border-border pb-4 print:pb-2 print:border-black">
            <h2 className="text-2xl font-bold mb-1">GRISTMILL'S</h2>
            <h3 className="text-lg mt-2 font-semibold">{title}</h3>
            <p className="text-xs mt-2">Printed on: {formatDate(new Date())}</p>
          </div>

          {/* ==== SUMMARY ==== */}
          <div className="border-2 border-dashed border-border p-5 bg-gray-50 print:bg-transparent print:border-black rounded print:rounded-none">
            <h4 className="text-center font-bold mb-3 text-base">SUMMARY</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm print:grid-3">
              <div className="text-center">
                <p className="text-muted-foreground print:text-black">Total Orders</p>
                <p className="text-xl font-bold">{orders.length}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground print:text-black">Confirmed Revenue</p>
                <p className="text-xl font-bold">Rs. {confirmedTotalRevenue}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground print:text-black">Pending Weight</p>
                <p className="text-xl font-bold">{pendingWeightOrders.length} Orders</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground print:text-black">Paid / Partial / Unpaid</p>
                <p className="text-xl">
                  {getPaidCount(orders)} / {getPartialCount(orders)} / {getUnpaidCount(orders)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground print:text-black">Delivery / Pickup</p>
                <p className="text-xl">
                   {getDeliveryCount(orders)} / {getPickupCount(orders)}
                </p>
              </div>
            </div>
          </div>

          {/* ==== ORDERS ==== */}
          <div className="space-y-6 print:space-y-4">
            {orders.map((order, idx) => {
                const remainingBalance = order.total - (order.advancePayment || 0); 
                
                return (
              <div
                key={order.id}
                className="order-card border-2 border-dashed border-border p-4 rounded-lg print:border-black print:rounded-none"
              >
                {/* Header */}
                <div className="flex justify-between mb-3 border-b border-dashed border-border print:border-black pb-3">
                  <div>
                    <p className="text-base font-bold">#{idx + 1} – {order.customerName}</p>
                    <p className="text-xs text-muted-foreground print:text-black">ID: {order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">SUBTOTAL: Rs. {order.total}{order.items.some(i => i.isWeightPending) && " (+TBD)"}</p>
                    {order.advancePayment && order.advancePayment > 0 && (
                        <p className="text-xs text-green-600 print:text-black">ADVANCE: Rs. {order.advancePayment}</p>
                    )}
                    {remainingBalance > 0 && (
                        <p className="text-base font-bold text-red-600 print:text-black">DUE: Rs. {remainingBalance}</p>
                    )}
                    <p className={`text-xs font-bold uppercase ${order.paymentStatus === 'paid' ? 'text-green-600 print:text-black' : order.paymentStatus === 'partial' ? 'text-blue-600 print:text-black' : 'text-orange-600 print:text-black'}`}>
                        STATUS: {order.paymentStatus}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3 print:grid-2">
                  <div>Phone: <span className="font-medium">{order.phone}</span></div>
                  <div>Type: <span className="uppercase font-medium">{order.type}</span></div>
                  <div>Payment: <span className="uppercase font-medium">{order.paymentMethod}</span></div>
                  <div>Status: <span className="uppercase font-medium">{order.status.replace(/-/g, ' ')}</span></div>
                </div>

                {/* Delivery Address */}
                {order.deliveryAddress && (
                  <div className="mb-3 text-xs">
                    <span className="font-medium">Address: </span>
                    <span className="break-words">{order.deliveryAddress}</span>
                  </div>
                )}

                {/* Items */}
                <div className="border-t border-dashed border-border print:border-black pt-3">
                  <p className="text-xs font-medium mb-2">Items:</p>
                  <div className="space-y-1 text-xs">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="break-words w-[70%]">
                          {item.service.name} × {item.isWeightPending ? (
                            <span className="font-bold">(Pending Wt.)</span>
                          ) : (
                            `${item.quantity} ${item.service.unit}`
                          )}
                        </span>
                        {!item.isWeightPending && (
                          <span className="font-medium whitespace-nowrap">
                            Rs. {item.quantity * item.service.price}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cancellation Info */}
                {order.status === 'cancelled' && (
                  <div className="mt-3 pt-2 border-t border-dashed border-border print:border-black">
                     <p className="text-xs font-bold">CANCELLED</p>
                     {order.cancellationReason && <p className="text-xs italic">Reason: {order.cancellationReason}</p>}
                     {order.cancelledBy && <p className="text-xs">By: {order.cancelledBy}</p>}
                  </div>
                )}

                {/* Cash Collection Alert */}
                {order.paymentStatus !== 'paid' && order.paymentMethod === 'cash' && order.status !== 'cancelled' && remainingBalance > 0 && (
                  <div className="mt-3 pt-2 border-t border-dashed border-border print:border-black text-center font-bold text-sm">
                    COLLECT: Rs. {remainingBalance}
                    {order.items.some(i => i.isWeightPending) && " (+ TBD)"}
                  </div>
                )}
              </div>
            );
            })} 
          </div>

          {/* ==== FOOTER ==== */}
          <div className="text-center text-xs text-muted-foreground print:text-black pt-6 border-t-2 border-dashed border-border print:border-black print:pt-4">
            <p className="font-medium">End of {title}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-6 print:hidden">
          <Button onClick={handlePrint} className="flex-1 bg-primary">
            <Printer className="h-4 w-4 mr-2" />
            Print List
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}