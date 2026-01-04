import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';

export function PrintExpenseReport({ expenses, dateRangeLabel, open, onClose }) {
  const handlePrint = () => window.print();
  
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Calculate summary by category
  const categorySummary = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

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
            #printable-report {
              display: block !important;
              visibility: visible !important;
              width: 100%;
            }
            .print\\:hidden { display: none !important; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; }
            th { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
            .summary-box { border: 2px solid #000; padding: 10px; margin-top: 20px; page-break-inside: avoid; }
          `}
        </style>

        <DialogHeader className="print:hidden">
          <DialogTitle>Print Expense Report</DialogTitle>
        </DialogHeader>

        <div id="printable-report" className="font-mono text-sm p-4 print:p-0">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">GRISTMILL'S DIGITAL KHATA</h2>
            <h3 className="text-lg font-semibold mt-1">Expense Report</h3>
            <p className="text-sm text-muted-foreground print:text-black font-medium mt-1">
              Period: {dateRangeLabel}
            </p>
            <p className="text-xs text-muted-foreground print:text-black mt-1">
              Generated on: {new Date().toLocaleString()}
            </p>
          </div>

          {/* Detailed Table */}
          <div className="mb-6">
            <h4 className="font-bold mb-2 border-b border-black pb-1">DETAILED EXPENSES</h4>
            <table className="w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Recorded By</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">No expenses found for this period.</td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{format(new Date(expense.date), 'dd/MM/yyyy HH:mm')}</td>
                      <td>{expense.category}</td>
                      <td>{expense.description || '-'}</td>
                      <td>{expense.recordedBy}</td>
                      <td className="text-right">{expense.amount.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Section */}
          <div className="summary-box bg-gray-50 print:bg-transparent">
            <h4 className="font-bold mb-3 text-base border-b border-black pb-2">SUMMARY REPORT</h4>
            
            <div className="flex justify-between items-start">
              <div className="w-1/2 pr-4">
                <h5 className="font-bold text-xs mb-2 uppercase underline">By Category</h5>
                <ul className="text-xs space-y-1">
                  {Object.entries(categorySummary).map(([cat, amt]) => (
                    <li key={cat} className="flex justify-between">
                      <span>{cat}:</span>
                      <span className="font-medium">Rs. {amt.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="w-1/2 pl-4 border-l border-black flex flex-col justify-center items-end">
                <p className="text-sm font-bold">TOTAL EXPENDITURE</p>
                <p className="text-2xl font-bold mt-1">Rs. {totalAmount.toLocaleString()}</p>
                <p className="text-xs mt-1 italic">Total entries: {expenses.length}</p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-4 border-t border-black text-xs flex justify-between">
            <span>Accountant Signature: ____________________</span>
            <span>Owner Signature: ____________________</span>
          </div>
        </div>

        <div className="flex gap-2 mt-6 print:hidden">
          <Button onClick={handlePrint} className="flex-1 bg-primary">
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}