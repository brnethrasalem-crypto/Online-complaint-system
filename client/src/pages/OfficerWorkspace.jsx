import { useEffect, useState } from 'react';
import { FaCheckCircle, FaUpload } from 'react-icons/fa';
import api from '../services/api';

const OfficerWorkspace = () => {
  const [assigned, setAssigned] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [notes, setNotes] = useState('');
  const [resolutionFile, setResolutionFile] = useState(null);

  useEffect(() => {
    api.get('/complaints/assigned').then((res) => setAssigned(res.data?.complaints || []));
  }, []);

  const selectedComplaint = assigned.find((item) => item._id === selectedId) || assigned[0] || null;

  const handleStatusChange = async (event) => {
    if (!selectedComplaint) return;
    await api.patch(`/complaints/${selectedComplaint._id}/status`, { status: event.target.value });
    setAssigned((current) => current.map((item) => item._id === selectedComplaint._id ? { ...item, status: event.target.value } : item));
  };

  const handleNotesUpload = async () => {
    if (!selectedComplaint) return;
    await api.post(`/complaints/${selectedComplaint._id}/notes`, { notes });
    setNotes('');
  };

  const handleResolutionFile = (event) => {
    const file = event.target.files?.[0];
    setResolutionFile(file);
  };

  const handleUploadResolution = async () => {
    if (!selectedComplaint || !resolutionFile) return;
    const payload = new FormData();
    payload.append('resolutionPhoto', resolutionFile);
    await api.post(`/complaints/${selectedComplaint._id}/resolution`, payload);
    setResolutionFile(null);
  };

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Officer workspace</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Assigned complaint queue</h1>
        <p className="mt-3 text-slate-400">Manage your workload, update statuses, and attach evidence from the field.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/30">
          <h2 className="text-xl font-semibold text-white">Assigned tickets</h2>
          <div className="mt-4 space-y-3">
            {assigned.length === 0 ? (
              <p className="text-slate-400">No assigned complaints at this time.</p>
            ) : (
              assigned.map((complaint) => (
                <button
                  key={complaint._id}
                  type="button"
                  onClick={() => setSelectedId(complaint._id)}
                  className={`w-full rounded-3xl border px-4 py-4 text-left transition ${selectedId === complaint._id ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-800 bg-slate-950'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{complaint.title}</p>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">{complaint.status || 'Submitted'}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{complaint.description.slice(0, 80)}...</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/30">
          {selectedComplaint ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Selected case</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">{selectedComplaint.title}</h2>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">{selectedComplaint.category}</span>
              </div>

              <div className="mt-8 space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Update status</p>
                  <select value={selectedComplaint.status || 'Submitted'} onChange={handleStatusChange} className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100">
                    <option>Submitted</option>
                    <option>In Review</option>
                    <option>Action Taken</option>
                    <option>Resolved</option>
                  </select>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Field notes</p>
                  <textarea rows="5" value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-4 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100" placeholder="Capture work notes and observations..." />
                  <button type="button" onClick={handleNotesUpload} className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950">
                    <FaUpload /> Save notes
                  </button>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Resolution evidence</p>
                  <input type="file" accept="image/*" onChange={handleResolutionFile} className="mt-4 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100" />
                  <button type="button" onClick={handleUploadResolution} className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950">
                    <FaCheckCircle /> Upload photo
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-slate-400">
              <p>Select an assigned complaint to update its status, attach notes, and upload resolution images.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficerWorkspace;
