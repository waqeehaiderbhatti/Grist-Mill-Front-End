import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

// Helper to calculate total
const calculateTotal = (items) => {
  return items.reduce((sum, item) => {
    // Don't include items in total if weight is still pending
    if (item.isWeightPending) {
      return sum;
    }
    return sum + item.service.price * item.quantity;
  }, 0);
};

export function UpdateWeightModal({ order, open, onClose, onOrderUpdated }) {
  const [itemQuantities, setItemQuantities] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Populate state when modal opens
  useEffect(() => {
    if (order) {
      const initialQuantities = {};
      order.items.forEach(item => {
        if (item.isWeightPending) {
          initialQuantities[item.service.id] = ''; 
        } else {
          initialQuantities[item.service.id] = String(item.quantity);
        }
      });
      setItemQuantities(initialQuantities);
    }
  }, [order]);

  const handleQuantityChange = (serviceId, value) => {
    setItemQuantities(prev => ({
      ...prev,
      [serviceId]: value,
    }));
  };

  const handleSave = () => {
    if (!order) return;
    setIsSaving(true);

    let hasInvalidEntry = false;

    // Create the updated list of items
    const updatedItems = order.items.map(item => {
      // Find the new quantity from our state
      const newQuantityStr = itemQuantities[item.service.id];
      
      // If this item was pending, we MUST have a valid new quantity
      if (item.isWeightPending) {
        const newQuantity = parseFloat(newQuantityStr);
        if (isNaN(newQuantity) || newQuantity <= 0) {
          toast.error(`Please enter a valid weight for ${item.service.name}`);
          hasInvalidEntry = true;
          return item; // return original item on error
        }
        // Valid update: set quantity and mark as no longer pending
        return {
          ...item,
          quantity: newQuantity,
          isWeightPending: false,
        };
      }
      
      return item;
    });

    if (hasInvalidEntry) {
      setIsSaving(false);
      return;
    }

    // Recalculate the total price based on the *new* item list
    const newTotal = calculateTotal(updatedItems);

    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    const updatedOrders = allOrders.map(o =>
      o.id === order.id
        ? {
            ...o,
            items: updatedItems, 
            total: newTotal,      
            updatedAt: new Date(),
          }
        : o
    );

    localStorage.setItem('orders', JSON.stringify(updatedOrders));

    setTimeout(() => {
      setIsSaving(false);
      toast.success('Order weight and price updated!');
      onOrderUpdated(); 
      onClose();
    }, 500);
  };

  const pendingItems = order?.items.filter(item => item.isWeightPending) || [];
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Order Weight</DialogTitle>
          <DialogDescription>
            Enter the measured weight for items in order #{order?.id}. The total price will be recalculated.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {pendingItems.length > 0 ? (
            pendingItems.map(item => (
              <div key={item.service.id} className="space-y-2">
                <Label htmlFor={`weight-${item.service.id}`}>
                  {item.service.name} (Price: Rs. {item.service.price}/{item.service.unit})
                </Label>
                <Input
                  id={`weight-${item.service.id}`}
                  type="number"
                  placeholder={`Enter weight in ${item.service.unit}`}
                  value={itemQuantities[item.service.id] || ''}
                  onChange={(e) => handleQuantityChange(item.service.id, e.target.value)}
                  min="0.1"
                  step="0.01"
                />
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center">No pending items found in this order.</p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave} 
            disabled={isSaving || pendingItems.length === 0}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Weight
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}