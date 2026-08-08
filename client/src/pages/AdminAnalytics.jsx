import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';
import MapHeatmap from './MapHeatmap';

const AdminAnalytics = () => {
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [targetComplaint, setTargetComplaint] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState('');

  useEffect(() => {
    api.get('/admin/overview').then((res) => {
      setComplaints(res.data?.complaints || []);
      setUsers(res.data?.users || []);
      setOfficers(res.data?.officers || []);
    });
  }, []);

  const monthlyTrends = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => ({ name: month, complaints: Math.max(0, Math.floor(Math.random() * 30) + 8) }));
  }, []);

  const statusDistribution = useMemo(() => (
    ['Submitted', 'In Review', 'Action Taken', 'Resolved'].map((status) => ({ name: status, value: complaints.filter((item) => item.status === status).length || 5 }))
  ), [complaints]);

  const deptWorkload = useMemo(() => (
    ['Infrastructure', 'Sanitation', 'Water', 'Transport'].map((department) => ({ name: department, value: complaints.filter((item) => item.category === department).length || Math.floor(Math.random() * 10) + 3 }))
  ), [complaints]);

  const handleAssignOfficer = async () => {
    if (!targetComplaint || !selectedOfficer) return;
    await api.patch(`/admin/complaints/${targetComplaint._id}/assign`, { officerId: selectedOfficer });
    setAssignmentModal(false);
  };

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Admin analytics</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Command center</h1>
        <p className="mt-3 text-slate-400">Monitor workload, manage users and officers, and assign complaints instantly.</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/30">
            <h2 className="text-xl font-semibold text-white">Monthly trend</h2>
            <LineChart width={640} height={280} data={monthlyTrends} className="mt-4">
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3a47" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="complaints" stroke="#34d399" strokeWidth={3} />
            </LineChart>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/30">
              <h2 className="text-xl font-semibold text-white">Status distribution</h2>
              <PieChart width={320} height={260} className="mt-4">
                <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} fill="#34d399" />
                <Tooltip />
              </PieChart>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/30">
              <h2 className="text-xl font-semibold text-white">Department workload</h2>
              <BarChart width={320} height={260} data={deptWorkload} className="mt-4">
                <CartesianGrid strokeDasharray="3 3" stroke="#2e3a47" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="value" fill="#34d399" />
              </BarChart>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/30">
          <h2 className="text-xl font-semibold text-white">Management tables</h2>
          <div className="mt-6 space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Users</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm text-slate-200">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-3">Name</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 4).map((userItem) => (
                      <tr key={userItem._id} className="border-b border-slate-800">
                        <td className="py-3">{userItem.name}</td>
                        <td>{userItem.email}</td>
                        <td>{userItem.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Officers</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm text-slate-200">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-3">Officer</th>
                      <th>Department</th>
                      <th>Assigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officers.slice(0, 4).map((officer) => (
                      <tr key={officer._id} className="border-b border-slate-800">
                        <td className="py-3">{officer.name}</td>
                        <td>{officer.department || 'General'}</td>
                        <td>{officer.assignedCount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/30">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Quick assignment</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Assign a complaint</h2>
          </div>
          <button className="rounded-full border border-emerald-500 px-4 py-2 text-sm text-emerald-400" onClick={() => setAssignmentModal(true)}>
            Open modal
          </button>
        </div>
      </div>

      <MapHeatmap />

      {assignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-semibold text-white">Assign complaint to officer</h3>
              <button type="button" className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300" onClick={() => setAssignmentModal(false)}>
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <select value={selectedOfficer} onChange={(event) => setSelectedOfficer(event.target.value)} className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100">
                <option value="">Select officer</option>
                {officers.map((officer) => (
                  <option key={officer._id} value={officer._id}>{officer.name} — {officer.department}</option>
                ))}
              </select>
              <div className="grid gap-4 sm:grid-cols-2">
                {complaints.slice(0, 4).map((complaint) => (
                  <button key={complaint._id} type="button" onClick={() => setTargetComplaint(complaint)} className={`w-full rounded-3xl border px-4 py-4 text-left ${targetComplaint?._id === complaint._id ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-800 bg-slate-950'}`}>
                    <p className="font-semibold text-white">{complaint.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{complaint.category}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" className="rounded-full border border-slate-700 px-4 py-3 text-sm text-slate-300" onClick={() => setAssignmentModal(false)}>
                Cancel
              </button>
              <button type="button" className="rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950" onClick={handleAssignOfficer}>
                Assign officer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
