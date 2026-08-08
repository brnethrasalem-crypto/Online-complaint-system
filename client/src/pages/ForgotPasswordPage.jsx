const ForgotPasswordPage = () => (
  <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/40">
    <h1 className="text-3xl font-semibold text-white">Recover your account</h1>
    <p className="mt-3 text-slate-400">
      Password reset instructions will be sent to your email address if an account exists.
    </p>
    <form className="mt-6 space-y-4">
      <input
        type="email"
        placeholder="Email"
        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100"
      />
      <button type="submit" className="rounded-full bg-emerald-500 px-4 py-3 font-semibold text-slate-950">
        Send reset link
      </button>
    </form>
  </div>
);

export default ForgotPasswordPage;
