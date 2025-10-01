import React, { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
}

interface Provider {
  id: string;
  name: string;
  description: string;
  adFree: boolean;
  status: 'stable' | 'experimental' | 'beta';
  icon: string;
}

const providers: Provider[] = [
  {
    id: 'daddylive',
    name: 'DaddyLive',
    description: 'Primary streaming source (dlhd.dad mirror)',
    adFree: false,
    status: 'stable',
    icon: '📺'
  },
  {
    id: 'madtitan',
    name: 'Alternative Mirror',
    description: 'Backup DaddyLive mirror (daddylive.me) for when primary is down',
    adFree: false,
    status: 'stable',
    icon: '⚡'
  }
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, selectedProvider, onProviderChange }) => {
  const handleProviderSelect = (providerId: string) => {
    onProviderChange(providerId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-arsenalRed to-red-700 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Stream Providers</h2>
            <p className="text-sm text-red-100 mt-1">Choose your preferred source</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Providers List */}
        <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleProviderSelect(provider.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedProvider === provider.id
                  ? 'border-arsenalRed bg-red-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{provider.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <span>{provider.name}</span>
                      {selectedProvider === provider.id && (
                        <svg className="w-5 h-5 text-arsenalRed" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {provider.adFree && (
                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                          AD-FREE
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        provider.status === 'stable'
                          ? 'bg-blue-100 text-blue-700'
                          : provider.status === 'experimental'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {provider.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                {provider.description}
              </p>
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="text-xs text-gray-500 space-y-1">
            <p className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span><strong>Stable:</strong> Fully tested and reliable</span>
            </p>
            <p className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span><strong>Experimental:</strong> May have issues</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
