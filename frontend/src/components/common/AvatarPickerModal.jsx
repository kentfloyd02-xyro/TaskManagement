import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BASE_AVATARS, ACCESSORIES, BG_GRADIENTS, parseAvatar, serializeAvatar } from '../../data/avatars';
import UserAvatar from './UserAvatar';
import { X, Check, Shuffle, Sparkles, User, Palette, Glasses } from 'lucide-react';

const AvatarPickerModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();

  // Initialize with user's current avatar configuration
  const initialConfig = parseAvatar(user?.avatar, user?.gender || 'male');
  const [selectedBase, setSelectedBase] = useState(initialConfig.base);
  const [selectedAccessory, setSelectedAccessory] = useState(initialConfig.accessory);
  const [selectedBg, setSelectedBg] = useState(initialConfig.bg);

  const [activeTab, setActiveTab] = useState('character'); // 'character' | 'accessories' | 'background'
  const [genderFilter, setGenderFilter] = useState(user?.gender === 'female' ? 'female' : 'male');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentConfig = {
    base: selectedBase,
    accessory: selectedAccessory,
    bg: selectedBg,
  };

  const handleRandomize = () => {
    const pool = BASE_AVATARS.filter((b) => b.gender === genderFilter);
    const randomBase = pool[Math.floor(Math.random() * pool.length)].id;
    const randomAccessory = ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)].id;
    const randomBg = BG_GRADIENTS[Math.floor(Math.random() * BG_GRADIENTS.length)].id;

    setSelectedBase(randomBase);
    setSelectedAccessory(randomAccessory);
    setSelectedBg(randomBg);
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const avatarString = serializeAvatar(currentConfig);
      await updateProfile({ avatar: avatarString });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update avatar:', err);
      alert('May problemang naganap habang sine-save ang avatar.');
    } finally {
      setSaving(false);
    }
  };

  const filteredBases = BASE_AVATARS.filter((b) => b.gender === genderFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Customize Your Avatar</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Piliin ang iyong estilo, accessories at tema</p>
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
          {/* Live Preview Box */}
          <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-slate-50 to-slate-100/60 dark:from-slate-800/40 dark:to-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <UserAvatar avatarConfig={currentConfig} size="2xl" className="ring-4 ring-white dark:ring-slate-800 shadow-xl" />
            <div className="mt-3 text-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{user?.name || 'Student'}</h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {BASE_AVATARS.find((b) => b.id === selectedBase)?.tag || 'Academic Explorer'}
              </p>
            </div>
            <button
              onClick={handleRandomize}
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Randomize Look</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('character')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'character'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Mukha & Buhok</span>
            </button>
            <button
              onClick={() => setActiveTab('accessories')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'accessories'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Glasses className="w-3.5 h-3.5" />
              <span>Accessories</span>
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'background'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Background</span>
            </button>
          </div>

          {/* TAB 1: CHARACTER BASE */}
          {activeTab === 'character' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pumili ng Karakter</span>
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5">
                  <button
                    onClick={() => {
                      setGenderFilter('male');
                      setSelectedBase('male-1');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      genderFilter === 'male'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    👨 Male
                  </button>
                  <button
                    onClick={() => {
                      setGenderFilter('female');
                      setSelectedBase('female-1');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      genderFilter === 'female'
                        ? 'bg-pink-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    👩 Female
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {filteredBases.map((b) => {
                  const isSelected = selectedBase === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBase(b.id)}
                      className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/30'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <UserAvatar
                        avatarConfig={{ base: b.id, accessory: 'none', bg: selectedBg }}
                        size="lg"
                        className="mb-2"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate w-full">
                        {b.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate w-full">{b.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ACCESSORIES */}
          {activeTab === 'accessories' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Accessories & Props
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ACCESSORIES.map((acc) => {
                  const isSelected = selectedAccessory === acc.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => setSelectedAccessory(acc.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/30 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="text-2xl">{acc.icon}</span>
                      <span className="text-xs text-slate-800 dark:text-slate-200 font-semibold">{acc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: BACKGROUND GRADIENTS */}
          {activeTab === 'background' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Background Theme Colors
              </span>
              <div className="grid grid-cols-2 gap-3">
                {BG_GRADIENTS.map((g) => {
                  const isSelected = selectedBg === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedBg(g.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/30'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full shadow-inner border border-white/40 shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${g.from}, ${g.via}, ${g.to})`,
                        }}
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{g.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            type="button"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? (
              <span>Saving...</span>
            ) : savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Save Avatar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarPickerModal;
