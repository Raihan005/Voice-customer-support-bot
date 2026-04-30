import { useApp } from '../context/AppContext';
import { User, Package, Clock, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, orders } = useApp();
  const location = useLocation();
  const [expandedOrder, setExpandedOrder] = useState(
    location.state?.newOrder || null
  );

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing': return 'badge-warning';
      case 'Shipped': return 'badge-primary';
      case 'Delivered': return 'badge-success';
      default: return 'badge-primary';
    }
  };

  return (
    <div className="profile-page">
      <div className="container">
        {/* Profile Header */}
        <div className="profile-header animate-fade-in-up">
          <div className="profile-header-bg" />
          <div className="profile-avatar-large">
            <span>{user?.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div className="profile-info">
            <h1>{user?.name}</h1>
            <p className="profile-email">{user?.email}</p>
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-value">{orders.length}</span>
                <span className="profile-stat-label">Orders</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">
                  ${orders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}
                </span>
                <span className="profile-stat-label">Total Spent</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value">
                  {orders.reduce((sum, o) => sum + o.items.length, 0)}
                </span>
                <span className="profile-stat-label">Items Bought</span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="profile-orders animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="profile-section-header">
            <h2>
              <Package size={22} />
              Order History
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="orders-empty card-glass">
              <Clock size={48} strokeWidth={1} />
              <h3>No orders yet</h3>
              <p>Your order history will appear here once you make a purchase.</p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div
                  key={order.id}
                  className={`order-card card ${expandedOrder === order.id ? 'expanded' : ''}`}
                >
                  <button
                    className="order-card-header"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <div className="order-header-left">
                      <span className="order-id">{order.id}</span>
                      <span className={`badge ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="order-header-right">
                      <div className="order-header-meta">
                        <span className="order-date">
                          <Calendar size={14} />
                          {formatDate(order.date)}
                        </span>
                        <span className="order-total">${order.total.toFixed(2)}</span>
                      </div>
                      {expandedOrder === order.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {expandedOrder === order.id && (
                    <div className="order-details animate-fade-in">
                      <div className="order-items">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="order-item">
                            <span className="order-item-emoji">{item.emoji}</span>
                            <div className="order-item-info">
                              <span className="order-item-name">{item.name}</span>
                              {item.selectedColor && (
                                <span className="order-item-color">{item.selectedColor}</span>
                              )}
                            </div>
                            <span className="order-item-qty">x{item.quantity}</span>
                            <span className="order-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="order-shipping">
                        <h4>Shipped to</h4>
                        <p>{order.shipping.fullName}</p>
                        <p>{order.shipping.address}</p>
                        <p>{order.shipping.city}, {order.shipping.state} {order.shipping.zip}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
