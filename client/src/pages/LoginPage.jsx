import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Login failed.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/40">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">Access portal</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Sign in to your account</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="Email"
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-0"
        />
        <input
          type="password"
          required
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="Password"
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-0"
        />
        <button type="submit" className="w-full rounded-full bg-emerald-500 px-4 py-3 font-semibold text-slate-950">
          Login
        </button>
      </form>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <Link to="/forgot-password" className="text-emerald-400">Forgot password?</Link>
        <Link to="/register" className="text-emerald-400">Create an account</Link>
      </div>
    </div>
  );
};

export default LoginPage;
