import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Printer } from 'lucide-react';

export function PrintRestockList({ items, open, onClose }) {
  const handlePrint = () => window.print();
  const date = new Date().toLocaleDateString('en-GB');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[800px] w-full overflow-x-auto print:max-w-none print:w-full print:h-auto print:overflow-visible print:p-0 print:border-0 print:shadow-none print:block"
        hideCloseButton
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4; margin: 15mm; }
            body { background: white; visibility: visible; }
            body > * { display: none !important; }
            body > [data-radix-portal] {
              display: block !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            [data-radix-portal] > [data-state] {
               background: none !important;
               position: static !important;
               padding: 0 !important;
               border: none !important;
               transform: none !important;
            }
            #printable-restock {
              display: block !important;
              visibility: visible !important;
              width: 100%;
            }
            .print\\:hidden { display: none !important; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
          `}
        </style>

        <DialogHeader className="print:hidden">
          <DialogTitle>Print Restock List</DialogTitle>
        </DialogHeader>

        <div id="printable-restock" className="font-mono text-sm p-4 print:p-0">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">GRISTMILL'S</h2>
            <h3 className="text-lg font-semibold mt-1">Restock Requirement List</h3>
            <p className="text-sm text-muted-foreground print:text-black">Generated on: {date}</p>
          </div>

          <table className="w-full mb-6">
            <thead>
              <tr>
                <th className="font-bold">#</th>
                <th className="font-bold">Item Name</th>
                <th className="font-bold">Current Stock</th>
                <th className="font-bold">Min Level</th>
                <th className="font-bold">Required Qty (+Buffer)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const required = Math.max(0, item.minStockLevel - item.currentStock + 20); // Suggest buying 20 units above min
                return (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.productName}</td>
                    <td className="text-red-600 print:text-black font-medium">{item.currentStock} {item.unit}</td>
                    <td>{item.minStockLevel} {item.unit}</td>
                    <td className="font-bold">{required} {item.unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-8 border-t pt-4 print:border-black">
            <div className="flex justify-between">
              <span>Authorized Signature: ____________________</span>
              <span>Date: ____________________</span>
            </div>
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