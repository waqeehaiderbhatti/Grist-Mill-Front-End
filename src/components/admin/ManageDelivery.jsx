import { useState } from 'react';
import { Plus, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';

export function ManageDelivery() {
  const { deliveryPersonnel, addDeliveryPersonnel, updateDeliveryPersonnel, deleteDeliveryPersonnel } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
    });
  };

  const handleAddPersonnel = (e) => {
    e.preventDefault();
    
    // Validate email uniqueness
    if (deliveryPersonnel.some(p => p.email === formData.email)) {
      toast.error('Email already exists');
      return;
    }

    addDeliveryPersonnel({
      ...formData,
      isActive: true,
    });
    
    toast.success('Delivery personnel added successfully');
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditClick = (personnel) => {
    setEditingPersonnel(personnel);
    setFormData({
      name: personnel.name,
      email: personnel.email,
      phone: personnel.phone,
      password: personnel.password,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePersonnel = (e) => {
    e.preventDefault();
    if (!editingPersonnel) return;

    // Validate email uniqueness (excluding current personnel)
    if (deliveryPersonnel.some(p => p.email === formData.email && p.id !== editingPersonnel.id)) {
      toast.error('Email already exists');
      return;
    }

    updateDeliveryPersonnel(editingPersonnel.id, formData);
    toast.success('Delivery personnel updated successfully');
    setIsEditDialogOpen(false);
    setEditingPersonnel(null);
    resetForm();
  };

  const handleToggleActive = (personnel) => {
    updateDeliveryPersonnel(personnel.id, {
      isActive: !personnel.isActive,
    });
    toast.success(
      personnel.isActive
        ? 'Personnel deactivated'
        : 'Personnel activated'
    );
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this delivery personnel?')) {
      deleteDeliveryPersonnel(id);
      toast.success('Delivery personnel deleted');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground">Manage Delivery Personnel</h2>
          <p className="text-sm text-muted-foreground">
            Add and manage delivery team members
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Personnel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Team</CardTitle>
          <CardDescription>
            {deliveryPersonnel.length} {deliveryPersonnel.length === 1 ? 'person' : 'people'} in the team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deliveryPersonnel.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No delivery personnel added yet.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Personnel
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryPersonnel.map((personnel) => (
                  <TableRow key={personnel.id}>
                    <TableCell>{personnel.name}</TableCell>
                    <TableCell>{personnel.email}</TableCell>
                    <TableCell>{personnel.phone}</TableCell>
                    <TableCell>
                      {personnel.isActive ? (
                        <Badge className="bg-success text-success-foreground">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(personnel)}
                          title={personnel.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {personnel.isActive ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(personnel)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(personnel.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Personnel Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Delivery Personnel</DialogTitle>
            <DialogDescription>
              Add a new member to your delivery team. They'll receive login credentials to access the delivery panel.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPersonnel}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Full Name</Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">Email</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@gristmill.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone Number</Label>
                <Input
                  id="add-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-password">Password</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a password"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Add Personnel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Personnel Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Delivery Personnel</DialogTitle>
            <DialogDescription>
              Update personnel information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePersonnel}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Password</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingPersonnel(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Update Personnel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}