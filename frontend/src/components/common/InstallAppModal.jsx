import React, { useState } from 'react';
import { X, Smartphone, Monitor, Apple, Download, CheckCircle2, ExternalLink } from 'lucide-react';

const InstallAppModal = ({ isOpen, onClose, promptInstall, canPrompt }) => {
  const [activeTab, setActiveTab] = useState('android'); // 'android' | 'pc' | 'ios'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600/5 to-indigo-600/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/25">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Install Student Planner</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PWA Gabay para sa Android, PC, at iPhone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Direct Prompt (If browser supports it right now) */}
          {canPrompt && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-sm">Handa na ang One-Click Install!</p>
                <p className="text-xs text-blue-100">Pindutin para lumabas ang opisyal na prompt.</p>
              </div>
              <button
                onClick={() => {
                  promptInstall();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-white text-blue-600 hover:bg-blue-50 text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                Install Ngayon
              </button>
            </div>
          )}

          {/* Device Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android</span>
            </button>
            <button
              onClick={() => setActiveTab('pc')}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'pc'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>PC / Laptop</span>
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Apple className="w-4 h-4" />
              <span>iPhone / iOS</span>
            </button>
          </div>

          {/* TAB 1: ANDROID GUIDE */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                💡 <span className="font-bold">Paraan sa Google Chrome sa Android:</span> Hindi na kailangan dumaan sa Google Play Store!
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">I-tap ang Three Dots (⋮)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Pindutin ang tatlong tuldok sa kanang-itaas na sulok ng Chrome browser.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Piliin ang "Install App" o "Add to Home screen"</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Hanapin ang menu item na may icon ng download o bahay.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Kumpirmahin ang "Install"</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Awtomatikong lalabas ang official icon ng Student Planner sa home screen at app drawer ng iyong phone!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PC / LAPTOP GUIDE */}
          {activeTab === 'pc' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                💡 <span className="font-bold">Para sa Chrome o Edge sa Windows/Mac:</span> Gagana ito bilang standalone desktop application na p'wedeng i-pin sa Taskbar!
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Tingnan ang Address Bar (URL Bar)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Sa dulong kanan ng URL bar, hanapin ang icon na may computer screen at down arrow ⊕ ("Install Student Planner").
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">O Gamitin ang Browser Menu (⋮)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Pindutin ang tatlong tuldok sa browser → piliin ang <span className="font-bold">"Save and share"</span> (o "Apps") → i-click ang <span className="font-bold">"Install Student Planner"</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">I-click ang "Install"</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Maaari mo na itong buksan direkta mula sa Desktop shortcut o Windows Start Menu!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IPHONE / IOS GUIDE */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                💡 <span className="font-bold">Para sa Safari sa iPhone / iPad:</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Buksan sa Safari</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Siguraduhing Safari ang gamit mong browser sa iyong iPhone.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">I-tap ang Share Button (⎋)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Pindutin ang parisukat na may arrow pataas sa ibaba ng screen.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Piliin ang "Add to Home Screen" (+)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Mag-scroll sa listahan at pindutin ang "Add to Home Screen" sabay tap ng "Add" sa kanang-itaas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            Naiintindihan Ko Na
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallAppModal;
