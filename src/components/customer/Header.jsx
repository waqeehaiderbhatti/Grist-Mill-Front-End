import { ShoppingCart, Wheat, Package, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useCart } from '../../lib/CartContext';
import { useAuth } from '../../lib/AuthContext';
import { LanguageToggle } from '../LanguageToggle';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export function Header() {
  const { getTotalItems } = useCart();
  const { user } = useAuth();
  const { t } = useTranslation();
  const itemCount = getTotalItems();
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState("Apni Chakki");

  useEffect(() => {
    const loadSettings = () => {
      const stored = localStorage.getItem('storeSettings');
      if (stored) {
        const settings = JSON.parse(stored);
        if (settings.storeName) setStoreName(settings.storeName);
      }
    };
    loadSettings();
    window.addEventListener('storage', loadSettings);
    return () => window.removeEventListener('storage', loadSettings);
  }, []);

  const handleCartClick = (e) => {
    if (!user) {
      e.preventDefault();
      toast.info(t('Please log in or sign up to proceed to checkout.'));
      navigate('/login/customer', { state: { from: { pathname: '/checkout' } } });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-sm">
            <Wheat className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">
            {t(storeName)}
          </span>
        </Link>

        {/* Right-side Actions */}
        <div className="flex items-center gap-2">
          <LanguageToggle />

          <Button variant="ghost" size="sm" asChild className="flex">
            <Link to="/track-order">
              <Package className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">{t('Track Order')}</span>
            </Link>
          </Button>

          {user && (
            <Button variant="ghost" size="sm" asChild className="flex">
              <Link to="/account">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">{t('Account')}</span>
              </Link>
            </Button>
          )}

          <Link to="/checkout" className="relative" onClick={handleCartClick}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-success text-success-foreground text-[10px] font-bold">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}