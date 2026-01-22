"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone, Monitor, Apple, X, Share } from "lucide-react";

// Define the custom event interface for PWA installation
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  // Fix 1: Replaced <any> with proper interface
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check device type
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(isStandalone);

    // Listen for install prompt (Android/Desktop)
    // Fix 2: Replaced (e: any) with (e: Event) and added type assertion
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowModal(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = () => {
    setShowModal(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
      setShowModal(false);
    }
    setDeferredPrompt(null);
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Download Button - Always Visible */}
      <button
        onClick={handleInstallClick}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-[#E85D2A] hover:bg-[#d14f1f] text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <Download className="w-5 h-5" />
        <span className="hidden sm:inline">Download PTL App</span>
        <span className="sm:hidden">Download App</span>
      </button>

      {/* Install Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#E85D2A] to-[#B84A21] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Download className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Download PTL App</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              
              {/* iOS Instructions */}
              {isIOS && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <Apple className="w-8 h-8 text-gray-800" />
                    <div>
                      <p className="font-semibold text-gray-900">iPhone / iPad</p>
                      <p className="text-sm text-gray-600">Follow steps below</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="w-7 h-7 bg-[#E85D2A] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Tap Share Button</p>
                        <p className="text-sm text-gray-600">
                          Tap the <Share className="w-4 h-4 inline mx-1" /> icon at the bottom of Safari
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="w-7 h-7 bg-[#E85D2A] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Scroll Down</p>
                        <p className="text-sm text-gray-600">Find and tap <strong>&quot;Add to Home Screen&quot;</strong></p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="w-7 h-7 bg-[#E85D2A] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Tap &quot;Add&quot;</p>
                        <p className="text-sm text-gray-600">PTL app icon will appear on your home screen</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              )}

              {/* Android Instructions */}
              {isAndroid && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <Smartphone className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Android Phone</p>
                      <p className="text-sm text-gray-600">One-tap install</p>
                    </div>
                  </div>

                  {deferredPrompt ? (
                    <>
                      <p className="text-gray-600 text-sm">
                        Click the button below to install PTL app on your Android phone. 
                        It will appear on your home screen just like other apps.
                      </p>
                      <button
                        onClick={handleInstall}
                        className="w-full py-4 bg-[#E85D2A] hover:bg-[#d14f1f] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Install Now
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-gray-600 text-sm">
                        Tap the menu button (3 dots) in Chrome and select &quot;Add to Home Screen&quot;
                      </p>
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                        <div className="w-7 h-7 bg-[#E85D2A] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          1
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Tap ⋮ menu (top right)</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                        <div className="w-7 h-7 bg-[#E85D2A] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          2
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Tap &quot;Add to Home Screen&quot;</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                        <div className="w-7 h-7 bg-[#E85D2A] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          3
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Tap &quot;Add&quot;</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowModal(false)}
                        className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-colors"
                      >
                        Got it!
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Desktop Instructions */}
              {!isIOS && !isAndroid && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <Monitor className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Desktop / Laptop</p>
                      <p className="text-sm text-gray-600">Chrome, Edge, Brave</p>
                    </div>
                  </div>

                  {deferredPrompt ? (
                    <>
                      <p className="text-gray-600 text-sm">
                        Click the button below to install PTL as a desktop app. 
                        It will open in its own window just like a native application.
                      </p>
                      <button
                        onClick={handleInstall}
                        className="w-full py-4 bg-[#E85D2A] hover:bg-[#d14f1f] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Install PTL App
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-gray-600 text-sm">
                        Look for the install icon in your browser&apos;s address bar, or use the menu:
                      </p>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="w-7 h-7 bg-[#E85D2A] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          1
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Click ⋮ menu (top right of browser)</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="w-7 h-7 bg-[#E85D2A] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          2
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Click &quot;Install PTL&quot; or &quot;Install App&quot;</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowModal(false)}
                        className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-colors"
                      >
                        Got it!
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Benefits */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  ✓ Works offline &nbsp; ✓ Fast loading &nbsp; ✓ No app store needed
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}