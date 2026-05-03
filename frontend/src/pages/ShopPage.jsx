import { useState } from 'react';
import { products, categories } from '../data/products';
import { useApp } from '../context/AppContext';
import { Search, Star, ShoppingCart, Filter, Sparkles } from 'lucide-react';
import './ShopPage.css';

export default function ShopPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [buyingProduct, setBuyingProduct] = useState(null);
  const [buyForm, setBuyForm] = useState({ color: '', quantity: 1 });
  const { addToCart } = useApp();

  const filtered = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  const handleBuyClick = (product) => {
    setBuyingProduct(product);
    setBuyForm({ color: product.colors[0], quantity: 1 });
  };

  const handleAddToCart = () => {
    if (!buyingProduct) return;
    addToCart(buyingProduct, buyForm.quantity, buyForm.color);
    setBuyingProduct(null);
  };

  return (
    <div className="shop-page">
      {/* Hero Section */}
      <section className="shop-hero">
        <div className="shop-hero-glow" />
        <div className="container">
          <div className="shop-hero-content">
            <div className="shop-hero-badge">
              <Sparkles size={14} />
              <span>New Arrivals</span>
            </div>
            <h1 className="shop-hero-title">
              Explore Our <span className="gradient-text">Collection</span>
            </h1>
            <p className="shop-hero-subtitle">
              Discover premium tech products crafted for the modern lifestyle
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="shop-filters">
        <div className="container">
          <div className="shop-filters-bar">
            <div className="shop-search">
              <Search size={18} className="shop-search-icon" />
              <input
                id="shop-search"
                type="text"
                className="form-input shop-search-input"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="shop-filter-group">
              <div className="shop-categories">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`shop-category-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="shop-sort">
                <Filter size={16} />
                <select
                  id="shop-sort"
                  className="form-input form-select shop-sort-select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low → High</option>
                  <option value="price-high">Price: High → Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="shop-products">
        <div className="container">
          {filtered.length === 0 ? (
            <div className="shop-empty">
              <span className="shop-empty-icon">🔍</span>
              <h3>No products found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="product-grid stagger-children">
              {filtered.map(product => (
                <div key={product.id} className="product-card card" id={`product-${product.id}`}>
                  <div className="product-card-image">
                    <span className="product-emoji">{product.emoji}</span>
                    <span className="product-category-badge badge badge-primary">{product.category}</span>
                  </div>
                  <div className="product-card-body">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-desc">{product.description}</p>
                    <div className="product-meta">
                      <div className="product-rating">
                        <Star size={14} fill="var(--color-warning)" stroke="var(--color-warning)" />
                        <span>{product.rating}</span>
                        <span className="product-reviews">({product.reviews.toLocaleString()})</span>
                      </div>
                      <div className="product-colors">
                        {product.colors.slice(0, 3).map(c => (
                          <span key={c} className="product-color-dot" title={c} />
                        ))}
                        {product.colors.length > 3 && (
                          <span className="product-color-more">+{product.colors.length - 3}</span>
                        )}
                      </div>
                    </div>
                    <div className="product-features">
                      {product.features.slice(0, 2).map(f => (
                        <span key={f} className="product-feature-tag">{f}</span>
                      ))}
                    </div>
                    <div className="product-card-footer">
                      <div className="product-price">
                        <span className="product-price-currency">$</span>
                        <span className="product-price-value">{product.price.toFixed(2)}</span>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleBuyClick(product)}
                        id={`buy-${product.id}`}
                      >
                        <ShoppingCart size={14} />
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Buy Modal */}
      {buyingProduct && (
        <div className="modal-overlay" onClick={() => setBuyingProduct(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="buy-modal">
              <div className="buy-modal-header">
                <span className="buy-modal-emoji">{buyingProduct.emoji}</span>
                <div>
                  <h3>{buyingProduct.name}</h3>
                  <p className="buy-modal-price">${buyingProduct.price.toFixed(2)}</p>
                </div>
              </div>

              <div className="buy-modal-form">
                <div className="form-group">
                  <label className="form-label">Select Color *</label>
                  <div className="buy-color-options">
                    {buyingProduct.colors.map(color => (
                      <button
                        key={color}
                        className={`buy-color-option ${buyForm.color === color ? 'active' : ''}`}
                        onClick={() => setBuyForm(prev => ({ ...prev, color }))}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="buy-quantity">Quantity *</label>
                  <div className="buy-quantity">
                    <button
                      className="buy-quantity-btn"
                      onClick={() => setBuyForm(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                    >
                      −
                    </button>
                    <input
                      id="buy-quantity"
                      type="number"
                      className="form-input buy-quantity-input"
                      value={buyForm.quantity}
                      min="1"
                      max="10"
                      onChange={e => setBuyForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                    />
                    <button
                      className="buy-quantity-btn"
                      onClick={() => setBuyForm(prev => ({ ...prev, quantity: Math.min(10, prev.quantity + 1) }))}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="buy-modal-total">
                  <span>Total</span>
                  <span className="gradient-text" style={{ fontWeight: 700, fontSize: 'var(--font-size-xl)' }}>
                    ${(buyingProduct.price * buyForm.quantity).toFixed(2)}
                  </span>
                </div>

                <div className="buy-modal-actions">
                  <button className="btn btn-secondary" onClick={() => setBuyingProduct(null)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleAddToCart}>
                    <ShoppingCart size={16} />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
