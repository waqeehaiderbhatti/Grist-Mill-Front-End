import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

// Mock credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@gristmill.com',
  password: 'admin123',
};

// Mock customer storage
const MOCK_CUSTOMERS = {
  '0300-1234567': { password: 'customer123', name: 'Demo Customer' }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auth_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [deliveryPersonnel, setDeliveryPersonnel] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('delivery_personnel');
      return saved ? JSON.parse(saved).map((p) => ({
        ...p,
        createdAt: new Date(p.createdAt)
      })) : [
        {
          id: 'delivery-1',
          name: 'Bilal Ahmed',
          email: 'bilal@gristmill.com',
          phone: '0300-1111111',
          password: 'delivery123',
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 'delivery-2',
          name: 'Usman Ali',
          email: 'usman@gristmill.com',
          phone: '0321-2222222',
          password: 'delivery123',
          isActive: true,
          createdAt: new Date(),
        },
      ];
    }
    return [];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('delivery_personnel', JSON.stringify(deliveryPersonnel));
  }, [deliveryPersonnel]);

  const login = async (emailOrPhone, password, role) => {
    // Admin login
    if (role === 'admin') {
      if (emailOrPhone === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const adminUser = {
          id: 'admin-1',
          name: 'Admin',
          username: 'admin',
          email: ADMIN_CREDENTIALS.email,
          role: 'admin',
        };
        setUser(adminUser);
        return true;
      }
    }
    
    // Delivery login
    if (role === 'delivery') {
      const deliveryUser = deliveryPersonnel.find(
        p => p.email === emailOrPhone && p.password === password && p.isActive
      );
      if (deliveryUser) {
        const user = {
          id: deliveryUser.id,
          name: deliveryUser.name,
          username: deliveryUser.email,
          email: deliveryUser.email,
          role: 'delivery',
          phone: deliveryUser.phone,
        };
        setUser(user);
        return true;
      }
    }
    
    // Customer login - using phone number
    if (role === 'customer') {
      // Check our mock customer list
      const customer = MOCK_CUSTOMERS[emailOrPhone];
      if (customer && customer.password === password) {
        const customerUser = {
          id: `customer-${emailOrPhone}`,
          name: customer.name,
          username: emailOrPhone, // phone number
          email: '', // optional for customers
          role: 'customer',
          phone: emailOrPhone,
        };
        setUser(customerUser);
        return true;
      }

      // Fallback for demo: accept any valid phone number if not in mock list
      if (!customer && emailOrPhone.match(/^(03\d{2}-?\d{7})$/)) {
        const customerUser = {
          id: `customer-${Date.now()}`,
          name: 'Demo Customer',
          username: emailOrPhone, // phone number
          email: '', // optional for customers
          role: 'customer',
          phone: emailOrPhone,
        };
        setUser(customerUser);
        return true;
      }
    }
    
    return false;
  };

  // New signup function
  const signup = async (name, phone, password) => {
    // In a real app, you'd check localStorage or a database
    if (MOCK_CUSTOMERS[phone]) {
      return false; // User already exists
    }
    
    // Create new user in our mock database
    MOCK_CUSTOMERS[phone] = { name, password };
    
    // In a real app, you'd also save this to localStorage or DB
    // localStorage.setItem('mock_customers', JSON.stringify(MOCK_CUSTOMERS));

    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const addDeliveryPersonnel = (personnel) => {
    const newPersonnel = {
      ...personnel,
      id: `delivery-${Date.now()}`,
      createdAt: new Date(),
    };
    setDeliveryPersonnel(prev => [...prev, newPersonnel]);
  };

  const updateDeliveryPersonnel = (id, updates) => {
    setDeliveryPersonnel(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deleteDeliveryPersonnel = (id) => {
    setDeliveryPersonnel(prev => prev.filter(p => p.id !== id));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup, 
        logout,
        isAuthenticated: !!user,
        deliveryPersonnel,
        addDeliveryPersonnel,
        updateDeliveryPersonnel,
        deleteDeliveryPersonnel,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}