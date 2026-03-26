import React, { useEffect, useRef, useState } from 'react';

interface AuthModalProps {
  open: boolean;
  mode: 'signin' | 'signup';
  onClose: () => void;
  onModeChange: (mode: 'signin' | 'signup') => void;
  onSubmit: (data: { email: string; password: string; fullName?: string }) => Promise<void>;
  onGoogleSignIn: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, mode, onClose, onModeChange, onSubmit, onGoogleSignIn }) => {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    firstInputRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSubmitting(false);
    // Keep entered values across mode toggles, but clear on open.
    setPassword('');
  }, [open, mode]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-white/40 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white/80 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-8 relative"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-neutral-400 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded-full"
          aria-label="Close authentication modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-8">
          <h3 className="font-serif text-5xl text-neutral-900">
            {mode === 'signup' ? 'Get Started' : 'Welcome Back'}
          </h3>
          <p className="mt-2 text-neutral-500">
            {mode === 'signup'
              ? 'Create your account to start trying on looks.'
              : 'Sign in to continue your virtual styling journey.'}
          </p>
        </div>

        <button
          onClick={onGoogleSignIn}
          className="w-full border border-neutral-200 bg-white/70 rounded-xl py-3 text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-white active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          type="button"
        >
          Continue with Google
        </button>

        <div className="space-y-5">
          {mode === 'signup' && (
            <label className="block">
              <span className="block text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 font-semibold">Full Name</span>
              <input
                ref={firstInputRef}
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-neutral-50 rounded-xl px-4 py-3 border-b border-neutral-200 outline-none text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-900/10"
              />
            </label>
          )}
          <label className="block">
            <span className="block text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 font-semibold">Email</span>
            <input
              ref={mode === 'signin' ? firstInputRef : undefined}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-50 rounded-xl px-4 py-3 border-b border-neutral-200 outline-none text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-900/10"
            />
          </label>
          <label className="block">
            <span className="block text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-2 font-semibold">Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-50 rounded-xl px-4 py-3 border-b border-neutral-200 outline-none text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-900/10"
            />
          </label>
        </div>

        {error && (
          <div className="text-[11px] text-red-500 mt-2 px-2 text-center" role="alert">
            {error}
          </div>
        )}

        <button
          onClick={async () => {
            setError(null);
            setSubmitting(true);
            try {
              await onSubmit({ email, password, fullName: mode === 'signup' ? fullName : undefined });
            } catch (e: any) {
              setError(e?.message || 'Authentication failed. Please try again.');
            } finally {
              setSubmitting(false);
            }
          }}
          disabled={submitting || !email || !password || (mode === 'signup' && !fullName)}
          className="w-full mt-7 bg-neutral-900 text-white rounded-xl py-3.5 text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-black active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
          type="button"
        >
          {submitting ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
        </button>

        <p className="mt-6 text-center text-neutral-500">
          {mode === 'signup' ? 'Already have an account?' : 'Don’t have an account?'}{' '}
          <button
            onClick={() => onModeChange(mode === 'signup' ? 'signin' : 'signup')}
            className="text-neutral-900 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded-sm"
          >
            {mode === 'signup' ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
