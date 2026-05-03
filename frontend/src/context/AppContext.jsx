import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Auth state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('shopvault_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Cart state
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('shopvault_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Orders state
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('shopvault_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Persist state
  useEffect(() => {
    if (user) localStorage.setItem('shopvault_user', JSON.stringify(user));
    else localStorage.removeItem('shopvault_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('shopvault_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('shopvault_orders', JSON.stringify(orders));
  }, [orders]);

  // Toast helpers
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth functions
  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('shopvault_users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      setUser({ name: found.name, email: found.email });
      addToast(`Welcome back, ${found.name}!`);
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const signup = (name, email, password) => {
    const users = JSON.parse(localStorage.getItem('shopvault_users') || '[]');
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'An account with this email already exists' };
    }
    users.push({ name, email, password });
    localStorage.setItem('shopvault_users', JSON.stringify(users));
    setUser({ name, email });
    addToast(`Welcome to ShopVault, ${name}!`);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    addToast('You have been logged out');
  };

  // Cart functions
  const addToCart = (product, quantity = 1, selectedColor = null) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        item => item.id === product.id && item.selectedColor === selectedColor
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { ...product, quantity, selectedColor }];
    });
    addToast(`${product.name} added to cart`);
  };

  const removeFromCart = (productId, selectedColor) => {
    setCart(prev => prev.filter(
      item => !(item.id === productId && item.selectedColor === selectedColor)
    ));
  };

  const updateCartQuantity = (productId, selectedColor, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedColor);
      return;
    }
    setCart(prev => prev.map(item =>
      item.id === productId && item.selectedColor === selectedColor
        ? { ...item, quantity }
        : item
    ));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Order functions
  const placeOrder = (shippingInfo) => {
    const order = {
      id: `SV-${Date.now().toString(36).toUpperCase()}`,
      items: [...cart],
      total: cartTotal,
      shipping: shippingInfo,
      status: 'Processing',
      date: new Date().toISOString(),
    };
    setOrders(prev => [order, ...prev]);
    clearCart();
    addToast('Order placed successfully! 🎉');
    return order;
  };

  const value = {
    user,
    login,
    signup,
    logout,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartTotal,
    cartCount,
    orders,
    placeOrder,
    toasts,
    addToast,
    removeToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
