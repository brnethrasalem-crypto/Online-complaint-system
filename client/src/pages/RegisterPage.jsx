import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'User' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await register(form);
    navigate('/login');
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/40">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">Join us</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Create your citizen account</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Full name"
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
        />
        <input
          type="email"
          required
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="Email"
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
        />
        <input
          type="tel"
          required
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
          placeholder="Phone number (10 digits, starting 6-9)"
          pattern="[6-9][0-9]{9}"
          title="Enter a valid 10-digit Indian phone number starting with 6-9"
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
        />
        <input
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="Password (min 8 characters)"
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
        />
        <select
          value={form.role}
          onChange={(event) => setForm({ ...form, role: event.target.value })}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
        >
          <option value="User">Citizen</option>
          <option value="Officer">Officer</option>
        </select>
        <button type="submit" className="w-full rounded-full bg-emerald-500 px-4 py-3 font-semibold text-slate-950">
          Register
        </button>
      </form>

      <p className="text-sm text-slate-400">
        Already have an account? <Link to="/login" className="text-emerald-400">Sign in</Link>
      </p>
    </div>
  );
};

export default RegisterPage;