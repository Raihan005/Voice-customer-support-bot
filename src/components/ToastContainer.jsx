import { useApp } from '../context/AppContext';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />;
      case 'error': return <AlertCircle size={18} style={{ color: 'var(--color-error)' }} />;
      default: return <Info size={18} style={{ color: 'var(--color-primary)' }} />;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {getIcon(toast.type)}
          <span style={{ flex: 1, fontSize: 'var(--font-size-sm)' }}>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{ color: 'var(--color-text-muted)', padding: '4px' }}
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
