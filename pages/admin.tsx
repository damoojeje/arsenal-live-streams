import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface SourceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: string;
  responseTime?: number;
  matchCount: number;
}

const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [sourceHealth, setSourceHealth] = useState<SourceHealth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
      checkSourceHealth();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const response = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_authenticated', 'true');
        checkSourceHealth();
      } else {
        setAuthError(data.message || 'Invalid password');
      }
    } catch (error) {
      setAuthError('Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setPassword('');
  };

  const checkSourceHealth = async () => {
    setIsLoading(true);
    try {
      // Check DaddyLive
      const daddyLiveStart = Date.now();
      const daddyLiveResponse = await fetch('/api/matches', { cache: 'no-store' });
      const daddyLiveTime = Date.now() - daddyLiveStart;
      const daddyLiveData = daddyLiveResponse.ok ? await daddyLiveResponse.json() : [];
      
      // Check TotalSportek
      const totalSportekStart = Date.now();
      const totalSportekResponse = await fetch('/api/totalsportek/matches', { cache: 'no-store' });
      const totalSportekTime = Date.now() - totalSportekStart;
      const totalSportekData = totalSportekResponse.ok ? await totalSportekResponse.json() : [];

      setSourceHealth([
        {
          name: 'DaddyLive',
          status: daddyLiveResponse.ok && daddyLiveData.length > 0 ? 'healthy' : daddyLiveResponse.ok ? 'degraded' : 'down',
          lastCheck: new Date().toLocaleTimeString(),
          responseTime: daddyLiveTime,
          matchCount: daddyLiveData.length || 0
        },
        {
          name: 'TotalSportek',
          status: totalSportekResponse.ok && totalSportekData.length > 0 ? 'healthy' : totalSportekResponse.ok ? 'degraded' : 'down',
          lastCheck: new Date().toLocaleTimeString(),
          responseTime: totalSportekTime,
          matchCount: totalSportekData.length || 0
        }
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error checking source health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-amber-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-white/20';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/10 border-green-500/20';
      case 'degraded': return 'bg-amber-500/10 border-amber-500/20';
      case 'down': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-white/5 border-white/10';
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Admin Login - lolli</title>
          <meta name="theme-color" content="#0a0a0a" />
        </Head>

        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
          <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-2xl shadow-red-500/30 mb-4">
                <span className="text-white font-bold text-2xl">L</span>
              </div>
              <h1 className="text-2xl font-semibold text-white">Admin Access</h1>
              <p className="text-white/40 text-sm mt-1">Enter password to continue</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#161616] border border-white/[0.08] rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 transition-all"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>

              {authError && (
                <p className="text-red-400 text-sm text-center">{authError}</p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-2xl font-semibold transition-all duration-200 shadow-lg shadow-red-500/25 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <Link href="/dashboard" className="text-white/40 text-sm hover:text-white/60 transition-colors">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Admin Dashboard
  return (
    <>
      <Head>
        <title>Admin Dashboard - lolli</title>
        <meta name="theme-color" content="#0a0a0a" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="p-2 -ml-2 hover:bg-white/5 rounded-xl transition-all text-white/60 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="text-lg font-semibold">Admin Panel</h1>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Source Health Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Source Health</h2>
                {lastUpdate && (
                  <p className="text-white/40 text-sm mt-1">
                    Last checked: {lastUpdate.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <button
                onClick={checkSourceHealth}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-white/10 disabled:text-white/40 rounded-xl text-sm font-medium transition-all shadow-lg shadow-red-500/25 disabled:shadow-none"
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? 'Checking...' : 'Refresh'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sourceHealth.map((source, idx) => (
                <div 
                  key={idx} 
                  className={`p-6 rounded-2xl border ${getStatusBg(source.status)} transition-all`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(source.status)}`} />
                      <h3 className="font-semibold text-lg">{source.name}</h3>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full uppercase ${
                      source.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
                      source.status === 'degraded' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {source.status}
                    </span>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/40">Response Time</span>
                      <span className="text-white/80 font-medium">{source.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Matches Found</span>
                      <span className="text-white/80 font-medium">{source.matchCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Last Check</span>
                      <span className="text-white/80 font-medium">{source.lastCheck}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Stats */}
          <section>
            <h2 className="text-xl font-semibold mb-6">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#161616] rounded-2xl p-6">
                <p className="text-white/40 text-sm mb-1">Active Sources</p>
                <p className="text-3xl font-bold text-green-400">
                  {sourceHealth.filter(s => s.status === 'healthy').length}
                  <span className="text-white/20 text-lg font-normal">/{sourceHealth.length}</span>
                </p>
              </div>
              <div className="bg-[#161616] rounded-2xl p-6">
                <p className="text-white/40 text-sm mb-1">Avg Response</p>
                <p className="text-3xl font-bold text-white">
                  {sourceHealth.length > 0
                    ? Math.round(sourceHealth.reduce((sum, s) => sum + (s.responseTime || 0), 0) / sourceHealth.length)
                    : 0}
                  <span className="text-white/20 text-lg font-normal">ms</span>
                </p>
              </div>
              <div className="bg-[#161616] rounded-2xl p-6">
                <p className="text-white/40 text-sm mb-1">Total Matches</p>
                <p className="text-3xl font-bold text-white">
                  {sourceHealth.reduce((sum, s) => sum + s.matchCount, 0)}
                </p>
              </div>
            </div>
          </section>

          {/* System Info */}
          <section>
            <h2 className="text-xl font-semibold mb-6">System</h2>
            <div className="bg-[#161616] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between py-2 border-b border-white/[0.06]">
                <span className="text-white/40">Version</span>
                <span className="text-white/80 font-medium">v3.0 (lolli)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.06]">
                <span className="text-white/40">Primary Source</span>
                <span className="text-white/80 font-medium">DaddyLive API</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.06]">
                <span className="text-white/40">Fallback Source</span>
                <span className="text-white/80 font-medium">TotalSportek</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-white/40">Cache Duration</span>
                <span className="text-white/80 font-medium">60 seconds</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
