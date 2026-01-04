import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function ManageServices() {
  const [services, setServices] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [trackInventory, setTrackInventory] = useState(false);
  const [inventory, setInventory] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    unit: 'kg',
    description: '',
    imageUrl: '',
    category: 'wheat' 
  });

  useEffect(() => {
    loadServices();
    loadInventory();
  }, []);

  const loadServices = () => {
    const stored = localStorage.getItem('services');
    if (stored) {
      setServices(JSON.parse(stored));
    }
  };

  const loadInventory = () => {
    const stored = localStorage.getItem('inventory');
    if (stored) {
      setInventory(JSON.parse(stored));
    }
  };

  const saveServices = (updatedServices) => {
    localStorage.setItem('services', JSON.stringify(updatedServices));
    setServices(updatedServices);
  };

  const saveInventory = (updatedInventory) => {
    localStorage.setItem('inventory', JSON.stringify(updatedInventory));
    setInventory(updatedInventory);
  };

  const handleAdd = () => {
    if (!formData.name || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newService = {
      id: Date.now().toString(),
      name: formData.name,
      price: parseFloat(formData.price),
      unit: formData.unit,
      description: formData.description,
      imageUrl: formData.imageUrl,
      category: formData.category
    };

    const updatedServices = [...services, newService];
    saveServices(updatedServices);
    
    if (trackInventory) {
      const newInventoryItem = {
        id: newService.id,
        productName: newService.name,
        currentStock: 0,
        unit: newService.unit,
        minStockLevel: 10,
        maxStockLevel: 100,
        lastUpdated: new Date()
      };
      saveInventory([...inventory, newInventoryItem]);
    }
    
    resetForm();
    setIsAdding(false);
    toast.success('Service added successfully!');
  };

  const handleEdit = (service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      price: service.price.toString(),
      unit: service.unit,
      description: service.description || '',
      imageUrl: service.imageUrl || '',
      category: service.category || 'wheat'
    });
    const isTracked = inventory.some(item => item.id === service.id);
    setTrackInventory(isTracked);
  };

  const handleUpdate = () => {
    if (!formData.name || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    let updatedInventory = [...inventory];

    const updatedServices = services.map(s =>
      s.id === editingId
        ? {
            ...s,
            name: formData.name,
            price: parseFloat(formData.price),
            unit: formData.unit,
            description: formData.description,
            imageUrl: formData.imageUrl,
            category: formData.category
          }
        : s
    );

    saveServices(updatedServices);
    
    const existingInvItem = inventory.find(item => item.id === editingId);

    if (trackInventory) {
      if (existingInvItem) {
        updatedInventory = inventory.map(item =>
          item.id === editingId
            ? { ...item, productName: formData.name, unit: formData.unit }
            : item
        );
      } else {
        const newInventoryItem = {
          id: editingId,
          productName: formData.name,
          currentStock: 0,
          unit: formData.unit,
          minStockLevel: 10,
          maxStockLevel: 100,
          lastUpdated: new Date()
        };
        updatedInventory = [...inventory, newInventoryItem];
      }
    } else {
      if (existingInvItem) {
        updatedInventory = inventory.filter(item => item.id !== editingId);
      }
    }
    saveInventory(updatedInventory);

    setEditingId(null);
    resetForm();
    toast.success('Service updated successfully!');
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this service?')) {
      const updatedServices = services.filter(s => s.id !== id);
      saveServices(updatedServices);
      
      const updatedInventory = inventory.filter(item => item.id !== id);
      saveInventory(updatedInventory);

      toast.success('Service deleted successfully!');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', unit: 'kg', description: '', imageUrl: '', category: 'wheat' });
    setTrackInventory(false); 
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Manage Services</h1>
          <p className="text-muted-foreground">Add, edit, or remove services from your catalog</p>
        </div>
        {!isAdding && !editingId && (
          <Button onClick={() => setIsAdding(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add New Service
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <Card className="p-6">
          <h2 className="mb-4">{editingId ? 'Edit Service' : 'Add New Service'}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Wheat Grinding"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="price">Price (Rs) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 10"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">Unit</Label>
                <select
                  id="unit"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="kg">kg</option>
                  <option value="bag">bag</option>
                  <option value="pack">pack</option>
                  <option value="piece">piece</option>
                  <option value="trip">trip</option>
                </select>
              </div>
              
              {/* --- UPDATED: Category Selector with New Options --- */}
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wheat">Wheat & Flour</SelectItem>
                    <SelectItem value="rice">Rice Products</SelectItem>
                    <SelectItem value="gram">Gram & Pulses</SelectItem>
                    <SelectItem value="spices">Spices</SelectItem>
                    <SelectItem value="cotton">Cotton & Quilts</SelectItem>
                    <SelectItem value="service">Convenience Services</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* ----------------------------- */}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the service"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a URL for the service image.
              </p>
              {formData.imageUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-border w-full max-w-xs">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="trackInventory"
                checked={trackInventory}
                onCheckedChange={(checked) => setTrackInventory(checked)}
              />
              <Label htmlFor="trackInventory">
                Track stock for this service in Inventory Management
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={editingId ? handleUpdate : handleAdd}
                size="lg"
              >
                <Save className="h-5 w-5 mr-2" />
                {editingId ? 'Update Service' : 'Add Service'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="lg"
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Services List */}
      <div className="space-y-4">
        {services.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No services available. Add your first service!</p>
          </Card>
        ) : (
          services.map((service) => (
            <Card key={service.id} className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {service.imageUrl && (
                  <div className="w-full sm:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="mb-2">{service.name}</h3>
                  <p className="text-muted-foreground mb-2">
                    {service.description || 'No description provided'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      Rs. {service.price} per {service.unit}
                    </span>
                    {/* Show Category Badge */}
                    <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm capitalize">
                      {service.category || 'Uncategorized'}
                    </span>
                    
                    {inventory.some(i => i.id === service.id) ? (
                      <span className="bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-xs">
                        ✓ Inventory Tracked
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs">
                        ✗ No Inventory
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 self-start">
                  <Button
                    onClick={() => handleEdit(service)}
                    variant="outline"
                    size="sm"
                    disabled={isAdding || editingId !== null}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(service.id)}
                    variant="outline"
                    size="sm"
                    disabled={isAdding || editingId !== null}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}