import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Layers, Cog, Activity, Bell, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot reach the server. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-root">
      {/* ===== Left: cinematic hero ===== */}
      <div
        className="login-hero"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(6,12,26,0.93), rgba(7,44,56,0.78)), url('/login-bg.jpg'), linear-gradient(135deg, #071326, #0b3a44 55%, #0d9488)",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="orb o1" /><div className="orb o2" /><div className="orb o3" />
        <Cog className="hero-gear" size={520} strokeWidth={1} />

        <div className="hero-top">
          <div className="hero-brand">
            <div className="brand-logo"><Layers size={22} /></div> PaperMill
          </div>
        </div>

        <div className="hero-mid">
          <h1 className="hero-title">Smarter paper<br />production, <em>every shift.</em></h1>
          <p className="hero-text">
            One control room for machines, production, quality, maintenance and waste — with live alerts that tell you what needs attention before it costs you.
          </p>
          <div className="hero-feature"><span className="ic"><Activity size={18} /></span> Real-time production &amp; efficiency tracking</div>
          <div className="hero-feature"><span className="ic"><Bell size={18} /></span> Rule-based smart alerts and overdue maintenance</div>
          <div className="hero-feature"><span className="ic"><ShieldCheck size={18} /></span> Secure role-based access for every team member</div>
        </div>

        <div className="hero-bottom hero-stats">
          <div><b>6</b><small>Modules</small></div>
          <div><b>3</b><small>User roles</small></div>
          <div><b>Live</b><small>Dashboard</small></div>
        </div>
      </div>

      {/* ===== Right: sign-in card ===== */}
      <div className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-logo"><Layers size={26} /></div>
          <h2>Welcome back</h2>
          <p className="sub">Sign in to your PaperMill account</p>

          {error && <div className="login-error"><AlertCircle size={18} /> {error}</div>}

          <div className="field">
            <Mail className="lead" size={18} />
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          </div>
          <div className="field">
            <Lock className="lead" size={18} />
            <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            <button type="button" className="eye" onClick={() => setShowPw(!showPw)} aria-label="Show or hide password">
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" className="login-btn" disabled={submitting}>
            {submitting ? <><Loader2 size={18} className="spin" /> Signing in...</> : <>Sign in <ArrowRight size={18} /></>}
          </button>

          <p className="login-foot">Authorised personnel only · Sessions expire after 8 hours</p>
        </form>
      </div>
    </div>
  );
}

export default Login;