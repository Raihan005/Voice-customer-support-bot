import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Auth state
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Cart state (stays in localStorage — client-side concern)
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('shopvault_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Orders state
  const [orders, setOrders] = useState([]);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('shopvault_cart', JSON.stringify(cart));
  }, [cart]);

  // ──────────────────────────────────────────────
  // Auth: Listen for session changes
  // ──────────────────────────────────────────────
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      } else {
        setAuthLoading(false);
      }
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setUser(null);
          setOrders([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile from profiles table
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser({ id: data.id, name: data.name, email: data.email });
      // Also fetch orders when profile loads
      await fetchOrders();
    } catch (err) {
      console.error('Error fetching profile:', err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  // Toast helpers
  // ──────────────────────────────────────────────
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

  // ──────────────────────────────────────────────
  // Auth functions
  // ──────────────────────────────────────────────
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Profile will be fetched by onAuthStateChange listener
    const profile = await supabase
      .from('profiles')
      .select('name')
      .eq('id', data.user.id)
      .single();

    addToast(`Welcome back, ${profile.data?.name || 'User'}!`);
    return { success: true };
  };

  const signup = async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // Passed to the handle_new_user trigger via raw_user_meta_data
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // If email confirmation is disabled, user is immediately logged in
    // The onAuthStateChange listener will fetch the profile
    addToast(`Welcome to ShopVault, ${name}!`);
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCart([]);
    setOrders([]);
    addToast('You have been logged out');
  };

  // ──────────────────────────────────────────────
  // Cart functions (unchanged — stays client-side)
  // ──────────────────────────────────────────────
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

  // ──────────────────────────────────────────────
  // Order functions
  // ──────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Transform to match the existing frontend shape
      const transformed = (ordersData || []).map(order => ({
        id: order.id.substring(0, 8).toUpperCase(),
        rawId: order.id,
        items: (order.order_items || []).map(item => ({
          id: item.product_id,
          name: item.product_name,
          emoji: item.product_emoji,
          price: Number(item.price_at_purchase),
          quantity: item.quantity,
          selectedColor: item.selected_color,
        })),
        total: Number(order.total),
        shipping: order.shipping,
        status: order.status,
        date: order.created_at,
      }));

      setOrders(transformed);
    } catch (err) {
      console.error('Error fetching orders:', err.message);
    }
  }, []);

  const placeOrder = async (shippingInfo) => {
    if (!user) return null;

    try {
      // 1. Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: cartTotal,
          shipping: shippingInfo,
          status: 'Processing',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        product_name: item.name,
        product_emoji: item.emoji,
        quantity: item.quantity,
        selected_color: item.selectedColor,
        price_at_purchase: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Clear cart and refresh orders
      clearCart();
      await fetchOrders();

      const order = {
        id: orderData.id.substring(0, 8).toUpperCase(),
        rawId: orderData.id,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          emoji: item.emoji,
          price: item.price,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
        })),
        total: cartTotal,
        shipping: shippingInfo,
        status: 'Processing',
        date: orderData.created_at,
      };

      addToast('Order placed successfully! 🎉');
      return order;
    } catch (err) {
      console.error('Error placing order:', err.message);
      addToast('Failed to place order. Please try again.', 'error');
      return null;
    }
  };

  // ──────────────────────────────────────────────
  // Support ticket
  // ──────────────────────────────────────────────
  const submitSupportTicket = async (subject, category, message) => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject,
          category,
          message,
        });

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error submitting ticket:', err.message);
      return { success: false, error: err.message };
    }
  };

  const value = {
    user,
    authLoading,
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
    submitSupportTicket,
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
