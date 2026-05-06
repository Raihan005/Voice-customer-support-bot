import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, MapPin, CreditCard, Package } from 'lucide-react';
import './CartPage.css';

export default function CartPage() {
  const { cart, removeFromCart, updateCartQuantity, cartTotal, placeOrder, user } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState('cart'); // cart | shipping | confirm
  const [shipping, setShipping] = useState({
    fullName: user?.name || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});

  const shippingCost = cartTotal > 100 ? 0 : 9.99;
  const tax = cartTotal * 0.08;
  const total = cartTotal + shippingCost + tax;

  const validateShipping = () => {
    const errs = {};
    if (!shipping.fullName.trim()) errs.fullName = 'Required';
    if (!shipping.address.trim()) errs.address = 'Required';
    if (!shipping.city.trim()) errs.city = 'Required';
    if (!shipping.state.trim()) errs.state = 'Required';
    if (!shipping.zip.trim()) errs.zip = 'Required';
    if (!shipping.phone.trim()) errs.phone = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (validateShipping()) {
      setStep('confirm');
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const order = await placeOrder(shipping);
      navigate('/profile', { state: { showOrders: true, newOrder: order.id } });
    } catch (error) {
      // Error handled by context toast
    }
  };

  if (cart.length === 0 && step === 'cart') {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty animate-fade-in-up">
            <div className="cart-empty-icon">
              <ShoppingBag size={64} strokeWidth={1} />
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any items yet. Start exploring!</p>
            <Link to="/shop" className="btn btn-primary btn-lg">
              <ShoppingBag size={18} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        {/* Progress Steps */}
        <div className="cart-steps">
          {['cart', 'shipping', 'confirm'].map((s, i) => (
            <div key={s} className={`cart-step ${step === s ? 'active' : ''} ${['cart','shipping','confirm'].indexOf(step) > i ? 'completed' : ''}`}>
              <div className="cart-step-circle">
                {['cart','shipping','confirm'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              <span className="cart-step-label">{s === 'cart' ? 'Cart' : s === 'shipping' ? 'Shipping' : 'Confirm'}</span>
            </div>
          ))}
          <div className="cart-steps-line">
            <div className="cart-steps-progress" style={{ width: step === 'cart' ? '0%' : step === 'shipping' ? '50%' : '100%' }} />
          </div>
        </div>

        {/* Step: Cart */}
        {step === 'cart' && (
          <div className="cart-layout animate-fade-in">
            <div className="cart-items">
              <h2 className="cart-section-title">
                <ShoppingBag size={20} />
                Shopping Cart ({cart.length} items)
              </h2>
              {cart.map(item => (
                <div key={item.cartItemId} className="cart-item card">
                  <div className="cart-item-image">
                    <span className="cart-item-emoji">{item.emoji}</span>
                  </div>
                  <div className="cart-item-info">
                    <h4 className="cart-item-name">{item.name}</h4>
                    {item.selectedColor && (
                      <span className="cart-item-color">Color: {item.selectedColor}</span>
                    )}
                    <div className="cart-item-quantity">
                      <button
                        className="buy-quantity-btn"
                        onClick={() => updateCartQuantity(item.cartItemId, item.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="cart-item-qty">{item.quantity}</span>
                      <button
                        className="buy-quantity-btn"
                        onClick={() => updateCartQuantity(item.cartItemId, item.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-right">
                    <span className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                    <button
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.cartItemId)}
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary card-glass">
              <h3 className="cart-summary-title">Order Summary</h3>
              <div className="cart-summary-rows">
                <div className="cart-summary-row">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? <span className="text-success">FREE</span> : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Est. Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="cart-summary-divider" />
                <div className="cart-summary-row cart-summary-total">
                  <span>Total</span>
                  <span className="gradient-text">${total.toFixed(2)}</span>
                </div>
              </div>
              {cartTotal < 100 && (
                <div className="cart-free-shipping">
                  <Package size={14} />
                  Add ${(100 - cartTotal).toFixed(2)} more for free shipping!
                </div>
              )}
              <button className="btn btn-primary btn-lg btn-full" onClick={() => setStep('shipping')}>
                Proceed to Shipping
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step: Shipping */}
        {step === 'shipping' && (
          <div className="cart-shipping animate-fade-in">
            <div className="cart-shipping-form card-glass">
              <h2 className="cart-section-title">
                <MapPin size={20} />
                Shipping Information
              </h2>
              <form className="shipping-form" onSubmit={handleShippingSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="ship-name">Full Name *</label>
                  <input id="ship-name" className={`form-input ${errors.fullName ? 'error' : ''}`} value={shipping.fullName} onChange={e => setShipping(p => ({...p, fullName: e.target.value}))} placeholder="John Doe" />
                  {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ship-address">Street Address *</label>
                  <input id="ship-address" className={`form-input ${errors.address ? 'error' : ''}`} value={shipping.address} onChange={e => setShipping(p => ({...p, address: e.target.value}))} placeholder="123 Main St, Apt 4" />
                  {errors.address && <span className="form-error">{errors.address}</span>}
                </div>
                <div className="shipping-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="ship-city">City *</label>
                    <input id="ship-city" className={`form-input ${errors.city ? 'error' : ''}`} value={shipping.city} onChange={e => setShipping(p => ({...p, city: e.target.value}))} placeholder="New York" />
                    {errors.city && <span className="form-error">{errors.city}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ship-state">State *</label>
                    <input id="ship-state" className={`form-input ${errors.state ? 'error' : ''}`} value={shipping.state} onChange={e => setShipping(p => ({...p, state: e.target.value}))} placeholder="NY" />
                    {errors.state && <span className="form-error">{errors.state}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ship-zip">ZIP Code *</label>
                    <input id="ship-zip" className={`form-input ${errors.zip ? 'error' : ''}`} value={shipping.zip} onChange={e => setShipping(p => ({...p, zip: e.target.value}))} placeholder="10001" />
                    {errors.zip && <span className="form-error">{errors.zip}</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ship-phone">Phone Number *</label>
                  <input id="ship-phone" className={`form-input ${errors.phone ? 'error' : ''}`} value={shipping.phone} onChange={e => setShipping(p => ({...p, phone: e.target.value}))} placeholder="+1 (555) 000-0000" />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>
                <div className="shipping-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setStep('cart')}>
                    Back to Cart
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Continue to Review
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="cart-confirm animate-fade-in">
            <div className="cart-confirm-content card-glass">
              <h2 className="cart-section-title">
                <CreditCard size={20} />
                Review & Confirm Order
              </h2>

              <div className="confirm-section">
                <h4>Shipping To</h4>
                <p>{shipping.fullName}</p>
                <p>{shipping.address}</p>
                <p>{shipping.city}, {shipping.state} {shipping.zip}</p>
                <p>{shipping.phone}</p>
              </div>

              <div className="confirm-section">
                <h4>Items ({cart.length})</h4>
                {cart.map(item => (
                  <div key={item.cartItemId} className="confirm-item">
                    <span>{item.emoji} {item.name}</span>
                    <span>x{item.quantity} — ${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="confirm-totals">
                <div className="cart-summary-row">
                  <span>Subtotal</span><span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Shipping</span><span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Tax</span><span>${tax.toFixed(2)}</span>
                </div>
                <div className="cart-summary-divider" />
                <div className="cart-summary-row cart-summary-total">
                  <span>Total</span>
                  <span className="gradient-text">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="shipping-actions">
                <button className="btn btn-secondary" onClick={() => setStep('shipping')}>
                  Back
                </button>
                <button className="btn btn-primary btn-lg" onClick={handlePlaceOrder}>
                  🎉 Place Order — ${total.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
