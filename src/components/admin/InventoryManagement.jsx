import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { 
  Package, 
  Plus, 
  Minus, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Edit3,
  History,
  CheckCircle,
  Printer,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../lib/AuthContext';
import { PrintRestockList } from './PrintRestockList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function InventoryManagement() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [updateType, setUpdateType] = useState('add');
  const [updateQuantity, setUpdateQuantity] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');

  // --- NEW: Filters ---
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  // --------------------

  useEffect(() => {
    loadAndSyncInventory(); 
    loadTransactions();
  }, []);

  const loadAndSyncInventory = () => {
    const services = JSON.parse(localStorage.getItem('services') || '[]');
    const oldInventory = JSON.parse(localStorage.getItem('inventory') || '[]');

    let newInventory = [];
    let inventoryWasUpdated = false;

    for (const service of services) {
      // --- MODIFIED: Skip non-stockable services ---
      if (service.category === 'service') continue; 
      // ---------------------------------------------

      const matchingInventoryItem = oldInventory.find(item => item.id === service.id);

      if (matchingInventoryItem) {
        if (matchingInventoryItem.productName !== service.name || matchingInventoryItem.unit !== service.unit) {
          inventoryWasUpdated = true;
          newInventory.push({
            ...matchingInventoryItem, 
            productName: service.name,
            unit: service.unit,
            lastUpdated: new Date() 
          });
        } else {
          newInventory.push(matchingInventoryItem);
        }
      } else {
        inventoryWasUpdated = true;
        const newInventoryItem = {
          id: service.id,
          productName: service.name,
          currentStock: 0,
          unit: service.unit,
          minStockLevel: 10,
          maxStockLevel: 100,
          lastUpdated: new Date()
        };
        newInventory.push(newInventoryItem);
      }
    }
    
    if (oldInventory.length !== newInventory.length) {
        inventoryWasUpdated = true;
    }

    if (inventoryWasUpdated) {
      localStorage.setItem('inventory', JSON.stringify(newInventory));
      setInventory(newInventory);
    } else {
      setInventory(oldInventory);
    }
  };

  const loadTransactions = () => {
    const stored = localStorage.getItem('inventoryTransactions');
    if (stored) {
      setTransactions(JSON.parse(stored));
    }
  };

  const handleUpdateStock = () => {
    if (!selectedProduct || !updateQuantity) {
      toast.error('Please enter quantity');
      return;
    }

    const quantity = parseFloat(updateQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid positive number');
      return;
    }

    const previousStock = selectedProduct.currentStock;
    let newStock = previousStock;

    if (updateType === 'add') {
      newStock = previousStock + quantity;
    } else if (updateType === 'remove') {
      newStock = Math.max(0, previousStock - quantity);
    } else if (updateType === 'adjust') {
      newStock = quantity;
    }

    const updatedInventory = inventory.map(item => 
      item.id === selectedProduct.id 
        ? { ...item, currentStock: newStock, lastUpdated: new Date() }
        : item
    );
    
    localStorage.setItem('inventory', JSON.stringify(updatedInventory));
    setInventory(updatedInventory);

    const transaction = {
      id: `TXN${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.productName,
      type: updateType,
      quantity,
      previousStock,
      newStock,
      notes: updateNotes,
      createdAt: new Date(),
      createdBy: user?.name || 'Admin'
    };

    const updatedTransactions = [transaction, ...transactions];
    localStorage.setItem('inventoryTransactions', JSON.stringify(updatedTransactions));
    setTransactions(updatedTransactions);

    toast.success('Inventory updated successfully');
    setShowUpdateDialog(false);
    setUpdateQuantity('');
    setUpdateNotes('');
    setSelectedProduct(null);
  };

  const openUpdateDialog = (product, type) => {
    setSelectedProduct(product);
    setUpdateType(type);
    setShowUpdateDialog(true);
  };

  const getStockStatus = (item) => {
    if (item.currentStock <= item.minStockLevel) {
      return { label: 'Low Stock', color: 'bg-red-500 text-white' };
    } else if (item.maxStockLevel && item.currentStock >= item.maxStockLevel) {
      return { label: 'Full Stock', color: 'bg-blue-500 text-white' };
    } else if (item.currentStock <= item.minStockLevel * 1.5) {
      return { label: 'Medium Stock', color: 'bg-yellow-500 text-white' };
    } else {
      return { label: 'Good Stock', color: 'bg-green-500 text-white' };
    }
  };

  const handlePrintRestockList = () => {
    const lowStockItems = inventory.filter(item => item.currentStock <= item.minStockLevel);
    if (lowStockItems.length === 0) {
      toast.info('All items are well stocked!');
      return;
    }
    setShowPrintDialog(true);
  };

  // --- NEW: Filter Logic ---
  const services = JSON.parse(localStorage.getItem('services') || '[]');
  
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    if (categoryFilter !== 'all') {
      const service = services.find(s => s.id === item.id);
      matchesCategory = service?.category === categoryFilter;
    }

    return matchesSearch && matchesCategory;
  });
  // -------------------------

  const lowStockCount = inventory.filter(item => item.currentStock <= item.minStockLevel).length;
  const productTransactions = selectedProduct 
    ? transactions.filter(t => t.productId === selectedProduct.id)
    : [];

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground mb-2">Inventory Management</h1>
          <p className="text-muted-foreground">Track and manage stock levels for your products</p>
        </div>
        
        <Button variant="outline" onClick={handlePrintRestockList}>
          <Printer className="h-4 w-4 mr-2" />
          Print Restock List
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl mt-1">{inventory.length}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl mt-1">{lowStockCount}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Well Stocked</p>
              <p className="text-2xl mt-1">
                {inventory.filter(item => item.currentStock > item.minStockLevel).length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recent Transactions</p>
              <p className="text-2xl mt-1">{transactions.length}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <History className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* --- NEW: Filters --- */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="wheat">Wheat & Flour</SelectItem>
                <SelectItem value="rice">Rice Products</SelectItem>
                <SelectItem value="gram">Gram & Pulses</SelectItem>
                <SelectItem value="spices">Spices</SelectItem>
                <SelectItem value="cotton">Cotton & Quilts</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
      {/* ------------------- */}

      {/* Inventory Table */}
      {filteredInventory.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No matching products found.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Product Name</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min Level</TableHead>
                <TableHead>Max Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => {
                const status = getStockStatus(item);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{item.productName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-lg">
                        {item.currentStock} {item.unit}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {item.minStockLevel} {item.unit}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {item.maxStockLevel || '-'} {item.maxStockLevel ? item.unit : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.lastUpdated).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openUpdateDialog(item, 'add')}
                          className="text-green-600 hover:bg-green-50"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openUpdateDialog(item, 'remove')}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Minus className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProduct(item);
                            setShowHistoryDialog(true);
                          }}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Update Stock Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {updateType === 'add' ? 'Add Stock' : updateType === 'remove' ? 'Remove Stock' : 'Adjust Stock'}
            </DialogTitle>
            <DialogDescription>
              Update inventory for {selectedProduct?.productName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-2xl">
                {selectedProduct?.currentStock} {selectedProduct?.unit}
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                {updateType === 'adjust' ? 'New Stock Level' : 'Quantity'} ({selectedProduct?.unit})
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={updateQuantity}
                onChange={(e) => setUpdateQuantity(e.target.value)}
                placeholder={updateType === 'adjust' ? 'Enter new stock level' : 'Enter quantity'}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="Add any notes about this transaction..."
                rows={3}
              />
            </div>

            {updateQuantity && selectedProduct && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">New Stock Level</p>
                <p className="text-xl">
                  {updateType === 'add'
                    ? selectedProduct.currentStock + (parseFloat(updateQuantity) || 0)
                    : updateType === 'remove'
                    ? Math.max(0, selectedProduct.currentStock - (parseFloat(updateQuantity) || 0))
                    : (parseFloat(updateQuantity) || 0)}{' '}
                  {selectedProduct.unit}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleUpdateStock} className="flex-1">
                Update Inventory
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpdateDialog(false);
                  setUpdateQuantity('');
                  setUpdateNotes('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction History - {selectedProduct?.productName}</DialogTitle>
            <DialogDescription>
              View all stock movements for this product
            </DialogDescription>
          </DialogHeader>

          {productTransactions.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {productTransactions.map((txn) => (
                <Card key={txn.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        txn.type === 'add' ? 'bg-green-100' : 
                        txn.type === 'remove' ? 'bg-red-100' : 
                        'bg-blue-100'
                      }`}>
                        {txn.type === 'add' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : txn.type === 'remove' ? (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        ) : (
                          <Edit3 className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={
                            txn.type === 'add' ? 'bg-green-500' :
                            txn.type === 'remove' ? 'bg-red-500' :
                            'bg-blue-500'
                          }>
                            {txn.type === 'add' ? 'Stock Added' :
                             txn.type === 'remove' ? 'Stock Removed' :
                             'Stock Adjusted'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            by {txn.createdBy}
                          </span>
                        </div>
                        <p className="text-sm">
                          {txn.previousStock} {selectedProduct?.unit} → {txn.newStock} {selectedProduct?.unit}
                          <span className="text-muted-foreground ml-2">
                            ({txn.type === 'add' ? '+' : txn.type === 'remove' ? '-' : ''}{txn.quantity} {selectedProduct?.unit})
                          </span>
                        </p>
                        {txn.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Note: {txn.notes}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(txn.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PrintRestockList 
        items={inventory.filter(item => item.currentStock <= item.minStockLevel)}
        open={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
      />
    </div>
  );
}