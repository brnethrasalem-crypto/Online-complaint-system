const faqs = [
  {
    question: 'How do I submit a complaint?',
    answer: 'Register an account, sign in, and use the complaints screen to create a new report with location, category, and optional attachments.',
  },
  {
    question: 'Can I track progress?',
    answer: 'Yes. Each complaint shows a timeline and live status updates so you can monitor every change from submission to resolution.',
  },
  {
    question: 'Who handles my grievance?',
    answer: 'Officers and administrators receive the case based on the assigned department and priority, and the system notifies them automatically.',
  },
];

const FAQPage = () => (
  <div className="mx-auto max-w-4xl space-y-6 rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/40">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">Help Center</p>
      <h1 className="mt-2 text-3xl font-semibold text-white">Frequently asked questions</h1>
    </div>

    <div className="space-y-4">
      {faqs.map((item) => (
        <div key={item.question} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <h2 className="text-lg font-semibold text-white">{item.question}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{item.answer}</p>
        </div>
      ))}
    </div>
  </div>
);

export default FAQPage;
