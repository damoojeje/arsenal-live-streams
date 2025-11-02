import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getSourceManager } from '../src/services/sourceManager';

interface SourceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: string;
  responseTime?: number;
  errorCount: number;
  successCount: number;
  uptime: number;
}

const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [sourceHealth, setSourceHealth] = useState<SourceHealth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Simple password check (client-side only - for basic protection)
  const ADMIN_PASSWORD = 'lolli2025'; // Change this to a secure password

  useEffect(() => {
    // Check if already authenticated in session
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
      checkSourceHealth();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setAuthError('');
      checkSourceHealth();
    } else {
      setAuthError('Invalid password');
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
      const daddyLiveData = await daddyLiveResponse.json();
      const daddyLiveHealth: SourceHealth = {
        name: 'DaddyLive (Primary)',
        status: daddyLiveResponse.ok && daddyLiveData.length > 0 ? 'healthy' : 'degraded',
        lastCheck: new Date().toLocaleTimeString(),
        responseTime: daddyLiveTime,
        errorCount: daddyLiveResponse.ok ? 0 : 1,
        successCount: daddyLiveResponse.ok ? 1 : 0,
        uptime: daddyLiveResponse.ok ? 100 : 0
      };

      // Check TotalSportek
      const totalSportekStart = Date.now();
      const totalSportekResponse = await fetch('/api/totalsportek/matches', { cache: 'no-store' });
      const totalSportekTime = Date.now() - totalSportekStart;
      const totalSportekData = totalSportekResponse.ok ? await totalSportekResponse.json() : [];
      const totalSportekHealth: SourceHealth = {
        name: 'TotalSportek7 (Fallback)',
        status: totalSportekResponse.ok && totalSportekData.length > 0 ? 'healthy' : 'degraded',
        lastCheck: new Date().toLocaleTimeString(),
        responseTime: totalSportekTime,
        errorCount: totalSportekResponse.ok ? 0 : 1,
        successCount: totalSportekResponse.ok ? 1 : 0,
        uptime: totalSportekResponse.ok ? 100 : 0
      };

      setSourceHealth([daddyLiveHealth, totalSportekHealth]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error checking source health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-300';
      case 'degraded': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'down': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'degraded':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Admin Login - Lolli Live Streams</title>
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Enter password to access</p>
            </div>

            <form onSubmit={handleLogin} className="bg-white rounded-lg shadow-xl p-8 space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-arsenalRed focus:border-transparent"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                {authError && (
                  <p className="mt-2 text-sm text-red-600">{authError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-arsenalRed to-red-600 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-arsenalRed focus:ring-offset-2"
              >
                Login
              </button>
            </form>

            <div className="text-center">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Lolli Live Streams</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">System health monitoring and configuration</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* Source Health Monitoring */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Source Health Status</h2>
              <div className="flex items-center space-x-4">
                {lastUpdate && (
                  <span className="text-sm text-gray-500">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={checkSourceHealth}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-arsenalRed to-red-600 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-arsenalRed focus:ring-offset-2 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Checking...' : '🔄 Refresh'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sourceHealth.map((source, index) => (
                <div key={index} className={`border-2 rounded-lg p-6 ${getStatusColor(source.status)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{source.name}</h3>
                    {getStatusIcon(source.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <span className="capitalize">{source.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Response Time:</span>
                      <span>{source.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Uptime:</span>
                      <span>{source.uptime}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Last Check:</span>
                      <span>{source.lastCheck}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Sources</h3>
              <p className="text-4xl font-bold text-green-600">
                {sourceHealth.filter(s => s.status === 'healthy').length}/{sourceHealth.length}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Response Time</h3>
              <p className="text-4xl font-bold text-blue-600">
                {sourceHealth.length > 0
                  ? Math.round(sourceHealth.reduce((sum, s) => sum + (s.responseTime || 0), 0) / sourceHealth.length)
                  : 0}
                <span className="text-lg">ms</span>
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">System Status</h3>
              <p className="text-4xl font-bold text-green-600">✓ Operational</p>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">System Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-medium text-gray-700">Version:</span>
                <span className="text-gray-600">v3.0 (Lolli)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-medium text-gray-700">Primary Source:</span>
                <span className="text-gray-600">DaddyLive API</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-medium text-gray-700">Fallback Source:</span>
                <span className="text-gray-600">TotalSportek7</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-medium text-gray-700">Cache Duration:</span>
                <span className="text-gray-600">60 seconds</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
