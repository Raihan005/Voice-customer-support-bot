import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Mail, Lock, User, ArrowRight, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import './AuthPage.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useApp();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simple validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (!isLogin && !formData.name) {
      setError('Please enter your name');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    let result;
    if (isLogin) {
      result = await login(formData.email, formData.password);
    } else {
      result = await signup(formData.name, formData.email, formData.password);
    }

    if (result.success) {
      navigate('/shop');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      {/* Decorative Background */}
      <div className="auth-bg">
        <div className="auth-bg-orb auth-bg-orb-1" />
        <div className="auth-bg-orb auth-bg-orb-2" />
        <div className="auth-bg-orb auth-bg-orb-3" />
        <div className="auth-bg-grid" />
      </div>

      <div className="auth-container">
        {/* Left Panel — Branding */}
        <div className="auth-branding">
          <div className="auth-branding-content">
            <Link to="/" className="auth-logo">
              <ShoppingBag size={36} />
              <span>ShopVault</span>
            </Link>
            <h1 className="auth-tagline">
              Discover the future of <span className="gradient-text">premium shopping</span>
            </h1>
            <p className="auth-subtitle">
              Curated tech products, seamless checkout, and an experience that feels like the future.
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <span className="auth-feature-icon">🚀</span>
                <span>Lightning-fast delivery</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">🔒</span>
                <span>Secure payments</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">💎</span>
                <span>Premium quality guarantee</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <h2>{isLogin ? 'Welcome back' : 'Create account'}</h2>
              <p>{isLogin ? 'Sign in to your account to continue' : 'Get started with your free account'}</p>
            </div>

            {/* Tab Switcher */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => { setIsLogin(true); setError(''); }}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => { setIsLogin(false); setError(''); }}
              >
                Sign Up
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="form-group animate-fade-in-up">
                  <label className="form-label" htmlFor="auth-name">Full Name</label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <input
                      id="auth-name"
                      className="form-input"
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="auth-email">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="auth-email"
                    className="form-input"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="auth-password">Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="auth-password"
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="auth-error animate-fade-in">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="spinner" />
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="auth-footer-text">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                className="auth-switch-link"
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
