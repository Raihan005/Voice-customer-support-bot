import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Headset, Send, MessageCircle, Phone, Mail, Clock, HelpCircle, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import './SupportPage.css';

const faqItems = [
  {
    q: "How long does shipping take?",
    a: "Standard shipping takes 5-7 business days. Express shipping (available at checkout) delivers within 2-3 business days. Free shipping is available on orders over $100."
  },
  {
    q: "What is your return policy?",
    a: "We offer a 30-day hassle-free return policy. Items must be in their original packaging and unused condition. Refunds are processed within 5 business days of receiving the returned item."
  },
  {
    q: "How do I track my order?",
    a: "You can track your order from the Profile page under Order History. Once your order ships, you'll receive an email with tracking information."
  },
  {
    q: "Do you offer international shipping?",
    a: "Yes! We ship to over 50 countries worldwide. International shipping rates and delivery times vary by location and are calculated at checkout."
  },
  {
    q: "Can I cancel or modify my order?",
    a: "Orders can be cancelled or modified within 1 hour of placing them. After that, the order enters processing and cannot be changed. Contact our support team for assistance."
  },
];

export default function SupportPage() {
  const { user, addToast, submitSupportTicket } = useApp();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [form, setForm] = useState({
    subject: '',
    category: 'general',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      addToast('Please fill in all fields', 'error');
      return;
    }
    setSending(true);
    const result = await submitSupportTicket(form.subject, form.category, form.message);
    setSending(false);
    if (result.success) {
      setSubmitted(true);
      addToast('Support ticket submitted! We\'ll get back to you soon.');
    } else {
      addToast('Failed to submit ticket. Please try again.', 'error');
    }
  };

  const resetForm = () => {
    setForm({ subject: '', category: 'general', message: '' });
    setSubmitted(false);
  };

  return (
    <div className="support-page">
      <div className="container">
        {/* Hero */}
        <div className="support-hero animate-fade-in-up">
          <div className="support-hero-glow" />
          <div className="support-hero-icon">
            <Headset size={48} />
          </div>
          <h1>How can we <span className="gradient-text">help you?</span></h1>
          <p>Our support team is here 24/7 to assist you with any questions or concerns.</p>
        </div>

        {/* Contact Cards */}
        <div className="support-channels stagger-children">
          <div className="support-channel card">
            <div className="support-channel-icon">
              <MessageCircle size={24} />
            </div>
            <h3>Live Chat</h3>
            <p>Chat with our team in real-time for instant support</p>
            <span className="badge badge-success">Available Now</span>
          </div>
          <div className="support-channel card">
            <div className="support-channel-icon">
              <Mail size={24} />
            </div>
            <h3>Email Support</h3>
            <p>Send us a detailed message and we'll respond within 24hrs</p>
            <span className="support-channel-detail">support@shopvault.com</span>
          </div>
          <div className="support-channel card">
            <div className="support-channel-icon">
              <Phone size={24} />
            </div>
            <h3>Phone Support</h3>
            <p>Speak directly with a support representative</p>
            <span className="support-channel-detail">+1 (800) 555-SHOP</span>
          </div>
          <div className="support-channel card">
            <div className="support-channel-icon">
              <Clock size={24} />
            </div>
            <h3>Business Hours</h3>
            <p>We're available around the clock for your convenience</p>
            <span className="badge badge-primary">24/7 Support</span>
          </div>
        </div>

        <div className="support-grid">
          {/* FAQ Section */}
          <div className="support-faq animate-fade-in-up">
            <h2>
              <HelpCircle size={22} />
              Frequently Asked Questions
            </h2>
            <div className="faq-list">
              {faqItems.map((faq, i) => (
                <div
                  key={i}
                  className={`faq-item card ${expandedFaq === i ? 'expanded' : ''}`}
                >
                  <button
                    className="faq-question"
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  >
                    <span>{faq.q}</span>
                    {expandedFaq === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  {expandedFaq === i && (
                    <div className="faq-answer animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="support-form-section animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h2>
              <Send size={22} />
              Send us a message
            </h2>

            {submitted ? (
              <div className="support-success card-glass animate-scale-in">
                <div className="support-success-icon">
                  <CheckCircle size={48} />
                </div>
                <h3>Ticket Submitted!</h3>
                <p>Thank you for reaching out, {user?.name}. Our team will review your message and get back to you within 24 hours.</p>
                <button className="btn btn-primary" onClick={resetForm}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form className="support-form card-glass" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="support-category">Category</label>
                  <select
                    id="support-category"
                    className="form-input form-select"
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  >
                    <option value="general">General Inquiry</option>
                    <option value="order">Order Issue</option>
                    <option value="return">Return / Refund</option>
                    <option value="product">Product Question</option>
                    <option value="technical">Technical Support</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="support-subject">Subject *</label>
                  <input
                    id="support-subject"
                    className="form-input"
                    type="text"
                    placeholder="Brief description of your issue"
                    value={form.subject}
                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="support-message">Message *</label>
                  <textarea
                    id="support-message"
                    className="form-input form-textarea"
                    placeholder="Please describe your issue in detail. Include any order numbers, product names, or relevant information..."
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-full"
                  disabled={sending}
                >
                  {sending ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Ticket
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
