import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const HelpPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Help - lolli</title>
        <meta name="description" content="Help and FAQ for lolli streaming" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0a0a" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="flex items-center h-14">
              <Link href="/dashboard" className="p-2 -ml-2 hover:bg-white/5 rounded-xl transition-all text-white/60 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-lg font-semibold ml-2">Help & FAQ</h1>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <a href="#browser" className="bg-[#161616] hover:bg-[#1a1a1a] rounded-2xl p-4 transition-all group">
              <div className="text-2xl mb-2">🛡️</div>
              <p className="text-sm font-medium text-white/80 group-hover:text-white">SmartScreen</p>
            </a>
            <a href="#adblocker" className="bg-[#161616] hover:bg-[#1a1a1a] rounded-2xl p-4 transition-all group">
              <div className="text-2xl mb-2">🚫</div>
              <p className="text-sm font-medium text-white/80 group-hover:text-white">Ad Blocker</p>
            </a>
            <a href="#troubleshoot" className="bg-[#161616] hover:bg-[#1a1a1a] rounded-2xl p-4 transition-all group">
              <div className="text-2xl mb-2">🔧</div>
              <p className="text-sm font-medium text-white/80 group-hover:text-white">Troubleshoot</p>
            </a>
          </div>

          {/* SmartScreen Section */}
          <section id="browser" className="bg-[#161616] rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              Microsoft SmartScreen Warnings
            </h2>
            <div className="space-y-4 text-sm text-white/70">
              <p>
                Microsoft Defender SmartScreen may block streaming sites. This is Windows security, not an ad.
              </p>
              
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <p className="text-green-400 font-medium mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Best Solution: Use Firefox or Brave
                </p>
                <p className="text-white/50 text-xs mb-3">These browsers don&apos;t use SmartScreen and work without warnings.</p>
                <div className="flex gap-2">
                  <a href="https://www.mozilla.org/firefox/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#FF7139] hover:bg-[#E65A2C] text-white rounded-lg text-xs font-medium transition-colors">
                    Get Firefox
                  </a>
                  <a href="https://brave.com/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#FB542B] hover:bg-[#E04A27] text-white rounded-lg text-xs font-medium transition-colors">
                    Get Brave
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06]">
                <p className="text-white/80 font-medium mb-3">Or disable SmartScreen in Edge:</p>
                <ol className="list-decimal list-inside space-y-2 text-white/50">
                  <li>Edge → Menu (⋯) → Settings</li>
                  <li>Privacy, search, and services → Security</li>
                  <li>Turn OFF &quot;Microsoft Defender SmartScreen&quot;</li>
                </ol>
              </div>

              <div className="pt-4 border-t border-white/[0.06]">
                <p className="text-white/80 font-medium mb-3">Or disable in Windows:</p>
                <ol className="list-decimal list-inside space-y-2 text-white/50">
                  <li>Win+I → Privacy &amp; Security → Windows Security</li>
                  <li>App &amp; browser control → Reputation-based protection</li>
                  <li>Turn OFF all SmartScreen options</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Ad Blocker Section */}
          <section id="adblocker" className="bg-[#161616] rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">🚫</span>
              Recommended Ad Blockers
            </h2>
            <div className="space-y-4 text-sm text-white/70">
              <p>
                For the best streaming experience, install uBlock Origin to block intrusive ads and pop-ups.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 transition-colors"
                >
                  <span className="text-lg">🌐</span>
                  Chrome / Edge
                </a>
                <a
                  href="https://addons.mozilla.org/firefox/addon/ublock-origin/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 transition-colors"
                >
                  <span className="text-lg">🦊</span>
                  Firefox
                </a>
              </div>
            </div>
          </section>

          {/* Troubleshooting Section */}
          <section id="troubleshoot" className="bg-[#161616] rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">🔧</span>
              Troubleshooting
            </h2>
            <div className="space-y-6 text-sm">
              {/* Stream not loading */}
              <div>
                <h3 className="font-medium text-white/90 mb-2">Stream not loading?</h3>
                <ul className="space-y-2 text-white/50">
                  <li className="flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    Try a different stream link from the dropdown
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    Disable your VPN temporarily
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    Clear browser cache and cookies
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    Try a different browser
                  </li>
                </ul>
              </div>

              {/* Black screen */}
              <div>
                <h3 className="font-medium text-white/90 mb-2">Black screen with audio?</h3>
                <ul className="space-y-2 text-white/50">
                  <li className="flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    Try clicking the play button on the video
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    Disable hardware acceleration in browser settings
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    Update your graphics drivers
                  </li>
                </ul>
              </div>

              {/* Buffering */}
              <div>
                <h3 className="font-medium text-white/90 mb-2">Constant buffering?</h3>
                <ul className="space-y-2 text-white/50">
                  <li className="flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    Lower the stream quality if available
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    Close other tabs and applications
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    Connect via ethernet instead of WiFi
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    Try at off-peak hours
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="bg-[#161616] rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">ℹ️</span>
              About lolli
            </h2>
            <div className="text-sm text-white/50 space-y-3">
              <p>
                lolli aggregates live sports streams from multiple sources for easy access. 
                We don&apos;t host any content - all streams are provided by third-party services.
              </p>
              <p>
                Primary source: DaddyLive • Fallback: TotalSportek
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] mt-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 text-center">
            <Link href="/dashboard" className="text-white/40 text-sm hover:text-white/60 transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HelpPage;
