import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Printer, MessageCircle } from 'lucide-react'; 
import { toast } from 'sonner';

export function PrintSlip({ order, open, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const lineBreak = "%0A";
    const dateStr = new Date().toLocaleDateString('en-GB'); 
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const remainingBalance = order.total - (order.advancePayment || 0);
    
    let message = `*🧾 MUGHAL ATTA CHAKKI - DIGITAL INVOICE*${lineBreak}`;
    message += `─────────────────────────${lineBreak}`;
    message += `📅 *Date:* ${dateStr}   ⏰ *Time:* ${timeStr}${lineBreak}`;
    message += `🔢 *Order No:* ${order.id.slice(-6)}${lineBreak}`;
    message += `👤 *Customer:* ${order.customerName}${lineBreak}`;
    message += `─────────────────────────${lineBreak}`;
    
    message += `*🛒 ORDER SUMMARY:*${lineBreak}`;
    
    order.items.forEach(item => {
        if (item.isWeightPending) {
            message += `▫️ *${item.service.name}*${lineBreak}`;
            message += `    _Weight to be confirmed at shop_${lineBreak}`;
        } else {
            message += `▫️ *${item.service.name}*${lineBreak}`;
            message += `    ${item.quantity} ${item.service.unit}  x  Rs. ${item.service.price}  =  *Rs. ${(item.quantity * item.service.price).toLocaleString()}*${lineBreak}`;
        }
    });
    
    message += `─────────────────────────${lineBreak}`;
    
    if (order.items.some(i => i.isWeightPending)) {
        message += `*⚠️ FINAL TOTAL PENDING*${lineBreak}`;
        message += `_(Waiting for weight confirmation)_${lineBreak}`;
    } else {
        message += `*💰 GRAND TOTAL:     Rs. ${order.total.toLocaleString()}*${lineBreak}`;
    }

    if (order.advancePayment && order.advancePayment > 0) {
        message += `✅ *Paid / Advance:   Rs. ${order.advancePayment.toLocaleString()}*${lineBreak}`;
    }
    
    if (remainingBalance > 0 && !order.items.some(i => i.isWeightPending)) {
        message += `❗ *BALANCE DUE:      Rs. ${remainingBalance.toLocaleString()}*${lineBreak}`;
    }
    
    message += `─────────────────────────${lineBreak}`;
    
    if (order.type === 'delivery') {
        message += `🚚 *Delivery Address:*${lineBreak}`;
        message += `${order.deliveryAddress || 'Not provided'}${lineBreak}${lineBreak}`;
    }

    message += `📍 *Store Location:*${lineBreak}`;
    message += `Main Bazaar, Lahore, Pakistan${lineBreak}`;
    message += `📞 *Contact:* +92 322 8483029${lineBreak}${lineBreak}`;
    message += `🌾 _Pure Grains, Fresh Quality - Guaranteed!_${lineBreak}`;
    message += `🙏 Thank you for choosing Mughal Atta Chakki!`;

    let phoneNumber = order.phone.replace(/\D/g, ''); 
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '92' + phoneNumber.slice(1);
    }

    const url = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(url, '_blank');
    toast.success("Opening WhatsApp invoice...");
  };
  
  const slipTotal = order.total;
  const hasPendingItems = order.items.some(i => i.isWeightPending);
  const remainingBalance = slipTotal - (order.advancePayment || 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md overflow-x-auto print:max-w-none print:w-[80mm] print:overflow-visible print:p-0 print:border-0 print:shadow-none"
        hideCloseButton
      >
        <style type="text/css" media="print">
          {`
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              visibility: visible;
              background: #fff;
            }
            body > * { display: none !important; }
            body > [data-radix-portal] {
              display: block !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            [data-radix-portal] > [data-state] { background: none !important; }
            #printable-slip {
              display: block !important;
              visibility: visible !important;
              width: 100%;
              max-width: 78mm;
              margin: 0 auto;
              padding: 2mm;
              font-size: 12px;
            }
            #printable-slip * { visibility: visible !important; }
            .print\\:hidden { display: none !important; }
          `}
        </style>

        <DialogHeader className="print:hidden">
          <DialogTitle>Print Order Slip</DialogTitle>
        </DialogHeader>

        {/* Scrollable printable area */}
        <div
          id="printable-slip"
          className="font-mono text-sm space-y-4 min-w-[300px] print:min-w-0"
        >
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-border pb-3 print:pb-2">
            <h2 className="text-lg mb-1 print:text-base font-bold">MUGHAL ATTA CHAKKI</h2>
            <p className="text-xs text-muted-foreground">Pure & Fresh Processing</p>
          </div>

          {/* Order Info */}
          <div className="space-y-1 pt-3 print:pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="text-foreground font-medium">{order.id}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Date:</span>
              <span className="text-foreground">
                {new Date().toLocaleDateString('en-GB')}
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t border-dashed border-border pt-3 print:pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Customer:</span>
              <span className="text-foreground max-w-[60%] truncate">{order.customerName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Phone:</span>
              <span className="text-foreground">{order.phone}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Type:</span>
              <span className="text-foreground uppercase">{order.type}</span>
            </div>
            {order.deliveryAddress && (
              <div className="pt-2 print:pt-1">
                <p className="text-muted-foreground text-xs mb-1">Delivery Address:</p>
                <p className="text-foreground text-xs whitespace-normal break-words bg-gray-50 print:bg-transparent p-1 rounded">
                  {order.deliveryAddress}
                </p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border-t-2 border-dashed border-border pt-3 print:pt-2">
            <h3 className="text-center text-sm mb-2 print:mb-1 font-bold">ITEMS</h3>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs">
                  <div className="flex-1 pr-2">
                    <p className="text-foreground whitespace-normal break-words font-medium">
                      {item.service.name}
                    </p>
                    {item.isWeightPending ? (
                      <p className="font-bold">** WEIGHT TBD **</p>
                    ) : (
                      <>
                        <p className="text-muted-foreground">
                          {item.quantity} {item.service.unit} × Rs. {item.service.price}
                        </p>
                        <p className="text-foreground whitespace-nowrap font-medium">
                          Rs. {item.quantity * item.service.price}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t-2 border-dashed border-border pt-3 print:pt-2">
            <div className="flex justify-between text-base font-bold">
              <span>SUBTOTAL:</span>
              <span className="whitespace-nowrap">
                Rs. {slipTotal}
                {hasPendingItems && " (+ TBD)"}
              </span>
            </div>
            
            {order.advancePayment && order.advancePayment > 0 && (
                <div className="flex justify-between text-sm mt-1 print:mt-0">
                    <span className="text-muted-foreground print:text-black">ADVANCE PAID:</span>
                    <span className="text-green-600 print:text-black font-medium whitespace-nowrap">
                        - Rs. {order.advancePayment}
                    </span>
                </div>
            )}
            
            {remainingBalance > 0 && (
                <div className="flex justify-between text-base font-bold mt-2 print:mt-1 border-t border-dashed print:border-black pt-2 print:pt-1">
                    <span className="text-red-600 print:text-black">DUE:</span>
                    <span className="text-red-600 print:text-black whitespace-nowrap">
                        Rs. {remainingBalance}
                    </span>
                </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="border-t border-dashed border-border pt-3 print:pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="text-foreground uppercase">
                {order.paymentMethod || 'CASH'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Payment Status:</span>
              <span className="uppercase font-bold">
                {order.paymentStatus}
              </span>
            </div>
            {order.paymentStatus !== 'paid' && order.paymentMethod === 'cash' && order.status !== 'cancelled' && remainingBalance > 0 && (
              <div className="bg-orange-100 print:bg-transparent p-2 mt-2 rounded text-center border border-orange-300 print:border-black print:border-2">
                <p className="text-orange-900 print:text-black font-bold text-sm">
                  COLLECT: Rs. {remainingBalance}
                  {hasPendingItems && " (+ TBD)"}
                </p>
              </div>
            )}
          </div>

          <div className="text-center text-xs text-muted-foreground pt-3 print:pt-2 border-t border-dashed border-border">
            <p>Thank you for your order!</p>
            <p className="mt-1">Visit Mughal Atta Chakki again</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4 print:hidden">
          <Button onClick={handleWhatsAppShare} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            <MessageCircle className="h-4 w-4 mr-2" />
            Send Invoice on WhatsApp
          </Button>
          
          <Button onClick={handlePrint} className="flex-1 bg-primary">
            <Printer className="h-4 w-4 mr-2" />
            Print Slip
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}