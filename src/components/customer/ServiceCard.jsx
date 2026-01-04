import { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useCart } from '../../lib/CartContext';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { motion } from 'framer-motion';

// Animation variants for the card
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function ServiceCard({ service }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const [stock, setStock] = useState(Infinity); 

  useEffect(() => {
    const allInventory = JSON.parse(localStorage.getItem('inventory') || '[]');
    const item = allInventory.find(i => i.id === service.id);
    if (item) {
      setStock(item.currentStock);
    }
  }, [service.id]);

  const isWheatGrinding = service.id === '1';
  const isOutOfStock = stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error("This item is out of stock.");
      return;
    }
    addToCart(service, quantity, false); 
    toast.success(`Added ${quantity} ${service.unit} of ${service.name} to cart`);
    setQuantity(1);
  };

  const handleAddPickupRequest = () => {
    addToCart(service, 1, true); 
    toast.success('Wheat pickup request added to cart. Weight will be confirmed at the shop.');
  };

  return (
    <motion.div
      variants={cardVariants} 
      whileHover={{ y: -5 }} 
      className="h-full"
    >
      <Card className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow h-full">
        {service.imageUrl && (
          <div className="relative w-full h-48 sm:h-52 md:h-56 overflow-hidden bg-muted">
            <ImageWithFallback
              src={service.imageUrl}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div className="flex-1">
            <h3 className="text-foreground mb-1">{service.name}</h3>
            {service.description && (
              <p className="text-muted-foreground text-sm mb-2">{service.description}</p>
            )}
            <p className="text-primary">
              Rs. {service.price} / {service.unit}
            </p>
          </div>
          
          {isWheatGrinding ? (
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleAddPickupRequest}
              >
                Add Pickup Request
              </Button>
              <p className="text-xs text-muted-foreground text-center">-- OR --</p>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center border border-border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 sm:w-12 text-center text-sm sm:text-base">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isOutOfStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground text-sm sm:text-base"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center border border-border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isOutOfStock}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 sm:w-12 text-center text-sm sm:text-base">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={isOutOfStock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                className="flex-1 bg-success hover:bg-success/90 text-success-foreground text-sm sm:text-base"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}