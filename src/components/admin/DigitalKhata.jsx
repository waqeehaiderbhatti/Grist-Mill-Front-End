import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Textarea } from '../ui/textarea';
import { Trash2, Plus, Calendar as CalendarIcon, Wallet, TrendingDown, Printer } from 'lucide-react'; 
import { toast } from 'sonner';
import { useAuth } from '../../lib/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '../ui/utils';
import { PrintExpenseReport } from './PrintExpenseReport'; 

const EXPENSE_CATEGORIES = [
  "Wheat bought today",
  "Rice bought today",
  "Cotton bought today",
  "Utility Bills",
  "Maintenance",
  "Others"
];

export function DigitalKhata() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // --- NEW: Date Filter & Print State ---
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [showPrintReport, setShowPrintReport] = useState(false);
  // --------------------------------------

  // Load expenses on mount
  useEffect(() => {
    const stored = localStorage.getItem('expenses');
    if (stored) {
      setExpenses(JSON.parse(stored));
    }
  }, []);

  // Save expenses whenever they change
  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const handleAddExpense = () => {
    if (!amount || !category) {
      toast.error('Please enter amount and category');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    const newExpense = {
      id: `EXP${Date.now()}`,
      date: new Date().toISOString(),
      category,
      amount: numAmount,
      description,
      recordedBy: user?.name || 'Admin'
    };

    setExpenses([newExpense, ...expenses]);
    setAmount('');
    setCategory('');
    setDescription('');
    setIsAdding(false);
    toast.success('Expense recorded successfully');
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setExpenses(expenses.filter(e => e.id !== id));
      toast.success('Entry deleted');
    }
  };

  // --- MODIFIED: Filter Logic ---
  const filteredExpenses = expenses.filter(e => {
    if (!dateRange || !dateRange.from) return true;
    const expenseDate = new Date(e.date);
    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    
    if (expenseDate < fromDate) return false;
    
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      if (expenseDate > toDate) return false;
    }
    
    return true;
  });
  // ------------------------------

  const today = new Date().toDateString();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const dailyTotal = expenses
    .filter(e => new Date(e.date).toDateString() === today)
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyTotal = expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const getPeriodLabel = () => {
    if (dateRange?.from) {
      if (dateRange.to) {
        return `${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`;
      }
      return format(dateRange.from, 'dd MMM yyyy');
    }
    return 'All Time';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-2">Digital Khata</h1>
          <p className="text-muted-foreground">Track daily expenditures and purchases</p>
        </div>
        <div className="flex gap-2">
           {/* --- NEW: Print Report Button --- */}
           <Button variant="outline" onClick={() => setShowPrintReport(true)}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
          {/* ------------------------------- */}
          <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"}>
            {isAdding ? 'Cancel' : <><Plus className="h-4 w-4 mr-2" /> Add New Expense</>}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-800 font-medium">Today's Expenditure</p>
              <h2 className="text-3xl font-bold text-orange-900 mt-2">
                Rs. {dailyTotal.toLocaleString()}
              </h2>
            </div>
            <div className="h-12 w-12 bg-orange-200 rounded-full flex items-center justify-center">
              <Wallet className="h-6 w-6 text-orange-700" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-800 font-medium">This Month's Total</p>
              <h2 className="text-3xl font-bold text-blue-900 mt-2">
                Rs. {monthlyTotal.toLocaleString()}
              </h2>
            </div>
            <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-blue-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* Add Expense Form */}
      {isAdding && (
        <Card className="p-6 border-primary/20 shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Record New Expense
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="amount">Amount (Rs)</Label>
              <Input 
                id="amount" 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description / Note (Optional)</Label>
              <Textarea 
                id="description" 
                placeholder="Additional details..." 
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleAddExpense} size="lg" className="w-full md:w-auto">
              Save Record
            </Button>
          </div>
        </Card>
      )}

      {/* Expenses List with Filter */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-semibold">Expense Records</h3>
          
          {/* --- NEW: Date Picker --- */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  size="sm"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
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
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            {dateRange && (
              <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)}>
                Clear
              </Button>
            )}
          </div>
          {/* ------------------------ */}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No expenses found for the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {new Date(expense.date).toLocaleDateString()} <br/>
                      <span className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {expense.description || '-'}
                    </TableCell>
                    <TableCell className="text-sm">{expense.recordedBy}</TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      Rs. {expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Footer Total for Filtered View */}
        {filteredExpenses.length > 0 && (
          <div className="p-4 border-t bg-muted/10 flex justify-end items-center gap-4">
            <span className="text-muted-foreground font-medium">Total for period:</span>
            <span className="text-xl font-bold text-foreground">
              Rs. {filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
            </span>
          </div>
        )}
      </Card>

      {/* --- NEW: Print Dialog Component --- */}
      <PrintExpenseReport 
        expenses={filteredExpenses}
        dateRangeLabel={getPeriodLabel()}
        open={showPrintReport}
        onClose={() => setShowPrintReport(false)}
      />
      {/* ----------------------------------- */}
    </div>
  );
}