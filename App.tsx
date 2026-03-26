
import React, { useState, useEffect, useRef } from 'react';
import { AppStatus, ImageState, ProfileMeasurements } from './types';
import { extractProductImage, imageUrlToBase64 } from './services/extractionService';
import { generateTryOnImage } from './services/geminiService';
import Uploader from './components/Uploader';
import ComparisonSlider from './components/ComparisonSlider';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';

const LOADING_MESSAGES = [
  "Reading fabric textures...",
  "Analyzing silhouette...",
  "Simulating fabric physics...",
  "Rendering highlights...",
  "Applying final lighting...",
];

const RECOMMENDED_LOOKS = [
  {
    title: 'Urban Streetwear Hoodie',
    brand: 'Urbanfit',
    price: '$89.99',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Classic Denim Jacket',
    brand: 'Denim Co',
    price: '$129.99',
    image:
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Minimalist White Tee',
    brand: 'Essential',
    price: '$39.99',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Vintage Leather Bomber',
    brand: 'Heritage',
    price: '$159.99',
    image:
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80',
  },
];

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [authLoading, setAuthLoading] = useState(true);
  const [authUser, setAuthUser] = useState<{ id: number; email: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState<ProfileMeasurements>({
    height: 170,
    weight: 70,
    chest: 95,
    waist: 80,
    inseam: 80,
  });
  const [images, setImages] = useState<ImageState>({
    original: null,
    product: null,
    generated: null
  });
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadIdx, setLoadIdx] = useState(0);
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const refreshAuth = async () => {
    try {
      setAuthLoading(true);
      const resp = await fetch('/api/auth/me', { credentials: 'include' });
      if (!resp.ok) {
        setAuthUser(null);
        return;
      }
      const payload = (await resp.json()) as { id: number; email: string };
      setAuthUser(payload);
    } catch {
      setAuthUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setShowAuthModal(false);
    setShowProfileModal(false);
    setAuthUser(null);
    reset();
  };

  const handleGoogleSignIn = () => {
    // Uses backend OAuth endpoint; browser will be redirected to Google, then back.
    window.location.href = '/api/auth/google';
  };

  // Cycle through loading messages
  useEffect(() => {
    let interval: any;
    if (status === AppStatus.GENERATING) {
      interval = setInterval(() => {
        setLoadIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Scroll to error if it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  const handleFetchProduct = async () => {
    if (!url) return;
    setStatus(AppStatus.EXTRACTING);
    setError(null);
    
    try {
      const result = await extractProductImage(url);
      if (result.imageUrl) {
        setImages(prev => ({ ...prev, product: result.imageUrl }));
        setStatus(AppStatus.IDLE);
      } else {
        setError(result.error || 'Retailers often block scrapers. Please upload a screenshot manually.');
        setStatus(AppStatus.ERROR);
      }
    } catch (err) {
      setError('Connection error. Amazon or other retailers might be blocking the request. Use manual upload.');
      setStatus(AppStatus.ERROR);
    }
  };

  const handleManualGarmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => ({ ...prev, product: reader.result as string }));
        setStatus(AppStatus.IDLE);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!images.original || !images.product) return;
    
    setStatus(AppStatus.GENERATING);
    setError(null);

    try {
      // Ensure garment image is processed as base64
      let garmentData = images.product;
      if (!garmentData.startsWith('data:')) {
        const base64 = await imageUrlToBase64(garmentData);
        garmentData = `data:image/png;base64,${base64}`;
      }

      const result = await generateTryOnImage(images.original, garmentData);
      
      setImages(prev => ({ ...prev, generated: result }));
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error("App: Generation Error", err);
      setError(err.message || 'Generation failed. Check your API key and network.');
      setStatus(AppStatus.ERROR);
    }
  };

  const reset = () => {
    setImages({ original: null, product: null, generated: null });
    setStatus(AppStatus.IDLE);
    setUrl('');
    setError(null);
  };

  const handleDownload = () => {
    if (!images.generated) return;
    const link = document.createElement('a');
    link.href = images.generated;
    link.download = 'virtualfit-ai-result.png';
    link.click();
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-20 selection:bg-neutral-900 selection:text-white">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-semibold">VirtualFit AI</span>
          </div>
          <div className="flex items-center gap-6">
            {authUser ? (
              <>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded-md"
                >
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded-md"
                >
                  Logout
                </button>
                <button
                  onClick={reset}
                  className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded-md"
                >
                  Reset Session
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                  className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded-md"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                  className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded-md"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-14">
        {authLoading ? (
          <div className="py-24 text-center">
            <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-semibold">Loading</div>
          </div>
        ) : !authUser ? (
          <header className="text-center mb-14 space-y-5">
            <div className="inline-block text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-semibold">
              VirtualFit AI
            </div>
            <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] text-neutral-900">
              Editorial Try-On
            </h1>
            <p className="text-neutral-500 max-w-2xl mx-auto">
              Sign in or create an account to drop your photo, visualize a garment, and save your look.
            </p>
            <div className="flex justify-center gap-3 pt-3">
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                className="bg-neutral-900 text-white px-6 py-3 rounded-xl text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-black active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30"
              >
                Create Account
              </button>
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="bg-white text-neutral-700 px-6 py-3 rounded-xl text-[10px] uppercase tracking-[0.2em] font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:text-neutral-900 active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
              >
                Sign In
              </button>
            </div>
            <div className="pt-4">
              <button
                onClick={handleGoogleSignIn}
                className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded-md"
              >
                Continue with Google
              </button>
            </div>
          </header>
        ) : (
          <>
            <header className="text-center mb-14 space-y-5">
              <div className="inline-block text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-semibold">
                AI Styling Studio
              </div>
              <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] text-neutral-900">
                Try-On Studio
              </h1>
              <p className="text-neutral-500 max-w-2xl mx-auto">
                Upload your portrait, add any garment by link or image, and preview your final look with editorial clarity.
              </p>
            </header>

            {status === AppStatus.SUCCESS && images.generated && images.original ? (
              <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in zoom-in duration-700">
                <ComparisonSlider before={images.original} after={images.generated} />
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleDownload}
                    className="bg-neutral-900 hover:bg-black text-white px-8 py-4 rounded-xl text-sm uppercase tracking-[0.2em] font-medium active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30"
                  >
                    Download Result
                  </button>
                  <button
                    onClick={reset}
                    className="bg-white text-neutral-700 px-8 py-4 rounded-xl text-sm uppercase tracking-[0.2em] font-medium shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:text-neutral-900 active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                  >
                    Try Another Outfit
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[340px,1fr] gap-8 max-w-6xl mx-auto">
                <section className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                    <h2 className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-semibold mb-3">Your Photo</h2>
                    <Uploader
                      label="Clear front-facing portrait"
                      preview={images.original}
                      onUpload={(b) => setImages(p => ({ ...p, original: b }))}
                    />
                  </div>

              <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
                <h2 className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-semibold">Garment</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste Amazon, Zara, etc link"
                    className="flex-1 bg-neutral-50 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 border-b border-neutral-200 outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <button
                    onClick={handleFetchProduct}
                    disabled={!url || status === AppStatus.EXTRACTING}
                    className="bg-neutral-900 text-white px-5 rounded-xl text-[10px] uppercase tracking-[0.2em] font-semibold disabled:opacity-40 active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30"
                  >
                    {status === AppStatus.EXTRACTING ? 'Fetching' : 'Fetch'}
                  </button>
                </div>

                <button
                  onClick={() => garmentInputRef.current?.click()}
                  className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 rounded-md"
                >
                  Or Upload Garment Image
                </button>

                <input
                  type="file"
                  ref={garmentInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleManualGarmentUpload}
                />

                <div className="relative w-full aspect-square rounded-2xl bg-neutral-100 flex items-center justify-center overflow-hidden">
                  {images.product ? (
                    <img
                      src={images.product}
                      alt="Product"
                      className="w-full h-full object-contain p-6 animate-in fade-in zoom-in duration-500"
                    />
                  ) : (
                    <div className="text-center text-neutral-400 p-8 space-y-3">
                      <svg className="w-8 h-8 mx-auto text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 10-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em]">Awaiting Garment</p>
                    </div>
                  )}
                </div>
                </div>
                </section>

            <section className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-semibold mb-3">Your Virtual Try-On</h2>
              <div className="rounded-2xl bg-neutral-100 min-h-[520px] overflow-hidden flex items-center justify-center">
                {images.generated ? (
                  <img src={images.generated} alt="Generated Try-on" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-neutral-400 space-y-3 p-10">
                    <svg className="w-8 h-8 mx-auto text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em]">Your generated result appears here</p>
                  </div>
                )}
              </div>

              <button
                disabled={!images.original || !images.product || status === AppStatus.GENERATING}
                onClick={handleGenerate}
                className={`
                  w-full mt-5 rounded-xl px-6 py-4 text-sm uppercase tracking-[0.2em] font-medium transition-all
                  ${images.original && images.product
                    ? 'bg-neutral-900 text-white hover:bg-black active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}
                `}
              >
                {status === AppStatus.GENERATING ? LOADING_MESSAGES[loadIdx] : 'Visualize This Fit'}
              </button>
            </section>
              </div>
            )}

            {error && (
              <div ref={errorRef} className="mt-10 p-5 bg-white rounded-2xl text-[11px] uppercase tracking-[0.2em] text-red-500 max-w-3xl mx-auto shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                {error}
              </div>
            )}

            <section className="mt-16">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h3 className="font-serif text-4xl text-neutral-900">Complete the Look</h3>
                  <p className="text-neutral-500 mt-2">Personalized recommendations curated for your silhouette.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {RECOMMENDED_LOOKS.map((item) => (
                  <article key={item.title} className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                    <img src={item.image} alt={item.title} className="w-full h-64 object-cover" />
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-neutral-900 font-medium">{item.title}</h4>
                          <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mt-1">{item.brand}</p>
                        </div>
                        <p className="text-sm text-neutral-900">{item.price}</p>
                      </div>
                      <button className="w-full bg-neutral-900 text-white rounded-xl py-3 text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-black active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30">
                        Try This On
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <AuthModal
        open={showAuthModal}
        mode={authMode}
        onClose={() => setShowAuthModal(false)}
        onModeChange={setAuthMode}
        onGoogleSignIn={handleGoogleSignIn}
        onSubmit={async (data) => {
          const endpoint = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';
          const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email: data.email, password: data.password }),
          });

          const payload = await resp.json().catch(() => null);
          if (!resp.ok) {
            throw new Error(payload?.error || 'Authentication failed. Please try again.');
          }

          setShowAuthModal(false);
          setShowProfileModal(false);
          await refreshAuth();
        }}
      />

      <ProfileModal
        open={showProfileModal}
        profile={profile}
        onClose={() => setShowProfileModal(false)}
        onChange={setProfile}
      />
    </div>
  );
};

export default App;
