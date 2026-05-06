import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Auth state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('shopvault_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Cart state (fetched from API)
  const [cart, setCart] = useState([]);

  // Orders state (fetched from API)
  const [orders, setOrders] = useState([]);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(false);

  // Persist user to localStorage for page refresh persistence
  useEffect(() => {
    if (user) {
      localStorage.setItem('shopvault_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('shopvault_user');
    }
  }, [user]);

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

  // ============================================
  // FETCH DATA ON LOGIN
  // ============================================
  const fetchCart = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getCart();
      setCart(data.cart);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  }, [user]);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getOrders();
      setOrders(data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  }, [user]);

  // Load cart and orders when user logs in
  useEffect(() => {
    if (user) {
      fetchCart();
      fetchOrders();
    } else {
      setCart([]);
      setOrders([]);
    }
  }, [user, fetchCart, fetchOrders]);

  // Verify token on mount (in case it expired while away)
  useEffect(() => {
    const token = localStorage.getItem('shopvault_token');
    if (token && user) {
      api.getMe().catch(() => {
        // Token invalid — force logout
        setUser(null);
        api.logout();
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================
  // AUTH FUNCTIONS
  // ============================================
  const login = async (email, password) => {
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      addToast(data.message || `Welcome back, ${data.user.name}!`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const data = await api.register(name, email, password);
      setUser(data.user);
      addToast(data.message || `Welcome to ShopVault, ${data.user.name}!`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    setOrders([]);
    api.logout();
    addToast('You have been logged out');
  };

  // ============================================
  // CART FUNCTIONS
  // ============================================
  const addToCart = async (product, quantity = 1, selectedColor = null) => {
    try {
      await api.addToCart(product.id, quantity, selectedColor);
      await fetchCart(); // Re-fetch to get updated cart from server
      addToast(`${product.name} added to cart`);
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await api.removeCartItem(cartItemId);
      setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  const updateCartQuantity = async (cartItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    try {
      await api.updateCartItem(cartItemId, quantity);
      setCart(prev => prev.map(item =>
        item.cartItemId === cartItemId
          ? { ...item, quantity }
          : item
      ));
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  const clearCart = async () => {
    try {
      await api.clearCart();
      setCart([]);
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ============================================
  // ORDER FUNCTIONS
  // ============================================
  const placeOrder = async (shippingInfo) => {
    try {
      const data = await api.placeOrder(shippingInfo);
      setCart([]); // Clear local cart
      setOrders(prev => [data.order, ...prev]); // Add new order to top
      addToast('Order placed successfully! 🎉');
      return data.order;
    } catch (error) {
      addToast(error.message, 'error');
      throw error;
    }
  };

  // ============================================
  // SUPPORT FUNCTIONS
  // ============================================
  const submitTicket = async (subject, category, message, orderId = null) => {
    try {
      const data = await api.createTicket(subject, category, message, orderId);
      addToast(data.message || "Support ticket submitted! We'll get back to you soon.");
      return { success: true, ticket: data.ticket };
    } catch (error) {
      addToast(error.message, 'error');
      return { success: false, error: error.message };
    }
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
    fetchOrders,
    toasts,
    addToast,
    removeToast,
    submitTicket,
    loading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
