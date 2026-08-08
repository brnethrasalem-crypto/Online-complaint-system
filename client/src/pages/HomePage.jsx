import { Link } from 'react-router-dom';

const highlights = [
  'Instant complaint creation',
  'Live status tracking',
  'Officer assignment and SLA visibility',
  'AI-assisted triage insights',
];

const HomePage = () => (
  <div className="space-y-10">
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/70 p-8 shadow-2xl shadow-emerald-950/30">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
            Citizens first, resolution first
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Report civic issues and track them in real time.
            </h1>
            <p className="max-w-2xl text-lg text-slate-300">
              CivicGrievance unifies complaint reporting, officer workflow, SLA monitoring, and transparent updates in one secure platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className="rounded-full bg-emerald-500 px-5 py-3 font-semibold text-slate-950">
              Register now
            </Link>
            <Link to="/faq" className="rounded-full border border-slate-700 px-5 py-3 font-semibold text-slate-200">
              View FAQ
            </Link>
          </div>
        </div>

      </div>
    </section>

    <section className="grid gap-6 md:grid-cols-3">
      {[
        ['Fast intake', 'Capture issues with media attachments and detailed descriptions.'],
        ['Transparent updates', 'Stay informed through live notifications and status timelines.'],
        ['Accountable action', 'Officers and admins can assign, prioritize, and resolve work efficiently.'],
      ].map(([title, body]) => (
        <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
        </div>
      ))}
    </section>
  </div>
);

export default HomePage;
