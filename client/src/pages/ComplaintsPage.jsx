import { useEffect, useState } from 'react';
import api from '../services/api';

const ComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Roads & Infrastructure',
    department: '',
    city: '',
    area: '',
  });

  useEffect(() => {
    api.get('/complaints').then((response) => setComplaints(response.data?.complaints || [])).catch(() => setComplaints([]));
  }, []);

  useEffect(() => {
    api.get('/departments').then((response) => {
      const list = response.data?.departments || [];
      setDepartments(list);
      if (list.length > 0) {
        setForm((prev) => ({ ...prev, department: list[0]._id }));
      }
    }).catch(() => setDepartments([]));
  }, []);

 const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title || !form.description || !form.category || !form.department || !form.city || !form.area) {
      alert('Please fill in title, description, category, department, city, and area.');
      return;
    }

    await api.post('/complaints', form);
    const response = await api.get('/complaints');
    setComplaints(response.data?.complaints || []);
    setForm((prev) => ({
      title: '',
      description: '',
      category: 'Roads & Infrastructure',
      department: prev.department,
      city: '',
      area: '',
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this complaint? This cannot be undone.')) return;
    try {
      await api.delete(`/complaints/${id}`);
      const response = await api.get('/complaints');
      setComplaints(response.data?.complaints || []);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete complaint');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/40">
        <h1 className="text-3xl font-semibold text-white">Submit a new complaint</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            required
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Subject"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
          />
          <textarea
            required
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Describe the issue"
            rows="4"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
              placeholder="City"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
            />
            <input
              required
              value={form.area}
              onChange={(event) => setForm({ ...form, area: event.target.value })}
              placeholder="Area / Locality"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <select
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
            >
              <option>Water Supply</option>
              <option>Electricity</option>
              <option>Roads & Infrastructure</option>
              <option>Sanitation</option>
              <option>Public Safety</option>
              <option>Health</option>
              <option>Education</option>
              <option>Corruption</option>
              <option>Other</option>
            </select>

            <select
              value={form.department}
              onChange={(event) => setForm({ ...form, department: event.target.value })}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
            >
              {departments.length === 0 && <option value="">No departments found</option>}
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="rounded-full bg-emerald-500 px-4 py-3 font-semibold text-slate-950">
            Submit complaint
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/40">
        <h2 className="text-2xl font-semibold text-white">Recent complaints</h2>
        <div className="mt-4 space-y-3">
          {complaints.length === 0 ? (
            <p className="text-slate-400">No complaints yet.</p>
          ) : (
            complaints.map((complaint) => (
              <div key={complaint._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">{complaint.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                      {complaint.status || 'Pending'}
                    </span>
                    {complaint.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => handleDelete(complaint._id)}
                        className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-400">{complaint.description}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default ComplaintsPage;