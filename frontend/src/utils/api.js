const API_BASE = 'http://localhost:3001/api';

/**
 * Centralized API client for ShopVault backend.
 * Auto-attaches JWT token from localStorage.
 * Auto-handles 401 (expired/invalid token).
 */
class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    return localStorage.getItem('shopvault_token');
  }

  setToken(token) {
    localStorage.setItem('shopvault_token', token);
  }

  removeToken() {
    localStorage.removeItem('shopvault_token');
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 — token expired or invalid
      if (response.status === 401) {
        this.removeToken();
        localStorage.removeItem('shopvault_user');
        // Force reload to go back to login
        window.location.href = '/';
        throw new Error('Session expired. Please login again.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to the server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  // ============================================
  // AUTH
  // ============================================
  async register(name, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.removeToken();
    localStorage.removeItem('shopvault_user');
  }

  // ============================================
  // PRODUCTS
  // ============================================
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.sort) query.set('sort', params.sort);
    const qs = query.toString();
    return this.request(`/products${qs ? `?${qs}` : ''}`);
  }

  async getCategories() {
    return this.request('/products/categories');
  }

  // Admin product CRUD
  async createProduct(product) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id, updates) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // CART
  // ============================================
  async getCart() {
    return this.request('/cart');
  }

  async addToCart(productId, quantity = 1, selectedColor = null) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, selectedColor }),
    });
  }

  async updateCartItem(cartItemId, quantity) {
    return this.request(`/cart/${cartItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeCartItem(cartItemId) {
    return this.request(`/cart/${cartItemId}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request('/cart', {
      method: 'DELETE',
    });
  }

  // ============================================
  // ORDERS
  // ============================================
  async getOrders() {
    return this.request('/orders');
  }

  async placeOrder(shipping) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({ shipping }),
    });
  }

  // ============================================
  // SUPPORT
  // ============================================
  async getTickets() {
    return this.request('/support');
  }

  async createTicket(subject, category, message, orderId = null) {
    return this.request('/support', {
      method: 'POST',
      body: JSON.stringify({ subject, category, message, orderId }),
    });
  }
}

const api = new ApiClient();
export default api;
