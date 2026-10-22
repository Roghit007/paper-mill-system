import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

// Replaces the ugly browser alert() popups with modern toast messages.
// Every existing alert('...') in your pages now shows as a toast automatically.
function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const original = window.alert;
    window.alert = (message) => {
      const text = String(message);
      const type = /error|fail|cannot|invalid|denied|not allowed|too many/i.test(text) ? 'error' : 'success';
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, text, type }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4800);
    };
    return () => { window.alert = original; };
  }, []);

  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}>
          {t.type === 'error' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

export default ToastHost;