import { useEffect, useMemo, useState } from 'react';
import { FaFileUpload, FaMicrophone, FaPaperPlane } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import html2pdf from 'html2pdf.js';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const statusSteps = ['Submitted', 'In Review', 'Action Taken', 'Resolved'];

const statCards = [
  { title: 'Open Complaints', value: 8, accent: 'from-emerald-500 to-teal-500' },
  { title: 'In Progress', value: 4, accent: 'from-cyan-500 to-blue-500' },
  { title: 'Overdue', value: 2, accent: 'from-amber-500 to-orange-500' },
  { title: 'Resolved', value: 15, accent: 'from-slate-500 to-slate-700' },
];

const UserDashboard = () => {
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [category, setCategory] = useState('Roads & Infrastructure');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const { socket, notifications } = useSocket();

  useEffect(() => {
    api.get('/complaints').then((res) => setComplaints(res.data?.complaints || []));
  }, []);

  useEffect(() => {
    api.get('/departments').then((res) => {
      const list = res.data?.departments || [];
      setDepartments(list);
      if (list.length > 0) setDepartment(list[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('receive-message', (msg) => setMessages((prev) => [...prev, msg]));
    return () => socket.off('receive-message');
  }, [socket]);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    if (selected.type.startsWith('image/')) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      if (dropped.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(dropped));
      } else {
        setPreviewUrl('');
      }
    }
  };

  const handleVoiceCapture = async () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setComplaintText((current) => `${current} ${transcript}`.trim());
    };
    recognition.start();
  };

  const handleSubmitComplaint = async (event) => {
    event.preventDefault();

    if (!title || !complaintText || !category || !department || !city || !area) {
      alert('Please fill in title, description, category, department, city, and area.');
      return;
    }

    const payload = new FormData();
    payload.append('title', title);
    payload.append('description', complaintText);
    payload.append('category', category);
    payload.append('department', department);
    payload.append('city', city);
    payload.append('area', area);
    if (file) {
      if (file.type.startsWith('image/')) {
        payload.append('images', file);
      } else {
        payload.append('documents', file);
      }
    }

    await api.post('/complaints', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const response = await api.get('/complaints');
    setComplaints(response.data?.complaints || []);
    setFile(null);
    setPreviewUrl('');
    setComplaintText('');
    setTitle('');
    setCity('');
    setArea('');
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

  const downloadReceipt = () => {
    if (!selectedComplaint) return;
    const element = document.getElementById('receipt-card');
    html2pdf().from(element).save(`complaint-${selectedComplaint._id}-receipt.pdf`);
  };

  const selectedStatusIndex = useMemo(() => {
    if (!selectedComplaint) return 0;
    return statusSteps.indexOf(selectedComplaint.status || 'Submitted');
  }, [selectedComplaint]);

  return (
    <div className="page-fade-in space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="hover-lift rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/30">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">User Dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Your complaint overview</h1>
            <p className="mt-3 text-slate-400">
              Track upcoming actions, view assigned officers, and submit new complaints with AI guidance.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <div key={card.title} className={`hover-lift rounded-3xl border border-slate-800 p-6 bg-gradient-to-br ${card.accent} text-slate-950`}>
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-900/80">{card.title}</p>
                <p className="mt-4 text-4xl font-semibold">{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hover-lift rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/30">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Submit a complaint</p>
          <form onSubmit={handleSubmitComplaint} className="mt-6 space-y-5">
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Complaint title"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 transition focus:scale-[1.01]"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="City"
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 transition focus:scale-[1.01]"
              />
              <input
                type="text"
                value={area}
                onChange={(event) => setArea(event.target.value)}
                placeholder="Area / Locality"
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 transition focus:scale-[1.01]"
              />
            </div>

            <div
              className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/80 p-6 text-center transition hover:border-emerald-500 hover:bg-slate-950"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <p className="text-sm text-slate-400">Drag & drop your photo or document here, or choose a file</p>
              <input type="file" accept="image/*,application/pdf" className="mt-4 w-full" onChange={handleFileChange} />
              {previewUrl && <img src={previewUrl} alt="preview" className="mx-auto mt-4 max-h-40 rounded-2xl object-contain transition hover:scale-105" />}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <select className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 transition focus:scale-[1.01]" value={category} onChange={(event) => setCategory(event.target.value)}>
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

              <select className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 transition focus:scale-[1.01]" value={department} onChange={(event) => setDepartment(event.target.value)}>
                {departments.length === 0 && <option value="">No departments found</option>}
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleVoiceCapture}
              className="btn-press w-full rounded-2xl border border-emerald-500 px-4 py-3 text-emerald-400 transition hover:scale-[1.02] hover:bg-emerald-500/10 active:scale-95"
            >
              <FaMicrophone className="inline-flex mr-2" /> Voice to text
            </button>

            <textarea
              rows="5"
              value={complaintText}
              onChange={(event) => setComplaintText(event.target.value)}
              placeholder="Describe the issue in detail..."
              className="w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-slate-100 transition focus:scale-[1.005]"
            />

            <button
              type="submit"
              className="btn-press inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95"
            >
              <FaFileUpload /> Submit complaint
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="hover-lift rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Recent Complaints</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Your latest reports</h2>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="btn-press rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:scale-105 hover:border-emerald-400 hover:text-emerald-300 active:scale-95"
            >
              Open live chat
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {complaints.length === 0 ? (
              <p className="text-slate-400">No complaints found yet.</p>
            ) : (
              complaints.slice(0, 4).map((item) => (
                <div
                  key={item._id}
                  className="hover-lift w-full rounded-3xl border border-slate-800 bg-slate-950 p-4 text-left transition hover:border-emerald-400"
                >
                  <button type="button" onClick={() => setSelectedComplaint(item)} className="w-full text-left">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{item.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-300">{item.status || 'Submitted'}</span>
                      </div>
                    </div>
                  </button>
                  {item.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="btn-press mt-3 rounded-full border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-400 transition hover:scale-105 hover:bg-red-500/10 active:scale-95"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="hover-lift rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/30">
          {selectedComplaint ? (
            <div id="receipt-card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Complaint details</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">{selectedComplaint.title}</h2>
                </div>
                <div className="rounded-3xl bg-slate-950 p-4 transition hover:scale-105">
                  <QRCodeSVG value={selectedComplaint._id} size={90} />
                </div>
              </div>

              <p className="mt-4 text-slate-400">{selectedComplaint.description}</p>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Progress</p>
                  <div className="mt-4 flex gap-2">
                    {statusSteps.map((step, index) => (
                      <div key={step} className="flex-1 text-center">
                        <div className={`mx-auto mb-2 h-3 w-3 rounded-full transition-all duration-300 ${index <= selectedStatusIndex ? 'bg-emerald-400 scale-110' : 'bg-slate-700'}`} />
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="hover-lift rounded-3xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Department</p>
                    <p className="mt-2 text-lg font-semibold text-white">{selectedComplaint.category}</p>
                  </div>
                  <div className="hover-lift rounded-3xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Submitted</p>
                    <p className="mt-2 text-lg font-semibold text-white">{new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={downloadReceipt}
                className="btn-press mt-6 inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95"
              >
                Download receipt
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-center">
              <p className="text-slate-400">Select a complaint to view detailed tracking, QR receipt, and download options.</p>
            </div>
          )}
        </div>
      </section>

      {chatOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 p-4 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]">
          <div className="mx-auto flex h-full max-w-3xl flex-col rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Live chat</p>
                <h3 className="text-xl font-semibold text-white">Support conversation</h3>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="btn-press rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:scale-105 hover:border-red-400 hover:text-red-300 active:scale-95"
              >
                Close
              </button>
            </div>

            <div className="mb-4 flex-1 rounded-3xl border border-slate-800 bg-slate-950 p-4 overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={index} className={`mb-3 rounded-3xl p-4 transition hover:scale-[1.01] ${msg.senderId === 'officer' ? 'bg-slate-800 text-slate-100' : 'bg-emerald-500/10 text-slate-100'}`}>
                  <p className="text-sm text-slate-300">{msg.message}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">{msg.senderId === 'officer' ? 'Officer' : 'You'}</p>
                </div>
              ))}
            </div>

            <form className="flex gap-3" onSubmit={(event) => {
              event.preventDefault();
              if (!messageText || !socket) return;
              socket.emit('send-message', { room: selectedComplaint?._id || 'global', senderId: 'user', message: messageText });
              setMessages((prev) => [...prev, { senderId: 'user', message: messageText }]);
              setMessageText('');
            }}>
              <input
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 transition focus:scale-[1.01]"
              />
              <button
                type="submit"
                className="btn-press rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-110 active:scale-90"
              >
                <FaPaperPlane />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;