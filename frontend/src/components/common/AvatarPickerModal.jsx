import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BASE_AVATARS, ACCESSORIES, BG_GRADIENTS, parseAvatar, serializeAvatar } from '../../data/avatars';
import UserAvatar from './UserAvatar';
import { X, Check, Shuffle, Sparkles, User, Palette, Glasses, Flame } from 'lucide-react';

const AvatarPickerModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();

  // Initialize with user's current avatar configuration
  const initialConfig = parseAvatar(user?.avatar, user?.gender || 'male');
  const [selectedBase, setSelectedBase] = useState(initialConfig.base);
  const [selectedAccessory, setSelectedAccessory] = useState(initialConfig.accessory);
  const [selectedBg, setSelectedBg] = useState(initialConfig.bg);

  const [activeTab, setActiveTab] = useState('character'); // 'character' | 'accessories' | 'background'
  const [accessoryCategory, setAccessoryCategory] = useState('All');
  const [genderFilter, setGenderFilter] = useState(
    initialConfig.base.startsWith('female') || user?.gender === 'female' ? 'female' : 'male'
  );
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

  const accessoryCategories = ['All', 'Streetwear', 'Cyber', 'Anime', 'Gaming', 'Jewelry', 'Headwear', 'Eyewear'];
  const filteredAccessories = accessoryCategory === 'All'
    ? ACCESSORIES
    : ACCESSORIES.filter((a) => a.category === accessoryCategory || a.id === 'none');

  const currentBaseObj = BASE_AVATARS.find((b) => b.id === selectedBase) || BASE_AVATARS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-rose-500 to-indigo-600 text-white rounded-xl shadow-md">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                Maangas Avatar Studio <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 font-bold">PRO</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Piliin ang iyong anime/streetwear character, accessories at cyber background
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
        <div className="p-5 md:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Live Preview Box */}
          <div className="relative overflow-hidden flex flex-col items-center justify-center p-5 bg-gradient-to-b from-slate-100/90 to-slate-200/50 dark:from-slate-900/90 dark:to-slate-950/80 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="relative">
              <UserAvatar
                avatarConfig={currentConfig}
                size="2xl"
                className="ring-4 ring-white/60 dark:ring-slate-700/60 shadow-2xl scale-105"
              />
            </div>

            <div className="mt-3.5 text-center">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {currentBaseObj.name}
              </h3>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 tracking-wide uppercase">
                ⚡ {currentBaseObj.tag}
              </p>
            </div>

            <button
              onClick={handleRandomize}
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Shuffle className="w-3.5 h-3.5 text-rose-500" />
              <span>Randomize Look</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-850 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('character')}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'character'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Character Base</span>
            </button>
            <button
              onClick={() => setActiveTab('accessories')}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'accessories'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Glasses className="w-3.5 h-3.5" />
              <span>Accessories ({ACCESSORIES.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'background'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Backgrounds</span>
            </button>
          </div>

          {/* TAB 1: CHARACTER BASE */}
          {activeTab === 'character' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Pumili ng Maangas na Estilo ({filteredBases.length})
                </span>
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5">
                  <button
                    onClick={() => {
                      setGenderFilter('male');
                      setSelectedBase('male-wolf');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      genderFilter === 'male'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    👨 Male (8 Cuts)
                  </button>
                  <button
                    onClick={() => {
                      setGenderFilter('female');
                      setSelectedBase('female-wolf');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      genderFilter === 'female'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    👩 Female (8 Cuts)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {filteredBases.map((b) => {
                  const isSelected = selectedBase === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBase(b.id)}
                      className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 ring-2 ring-blue-500/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <UserAvatar
                        avatarConfig={{ base: b.id, accessory: 'none', bg: selectedBg }}
                        size="md"
                        className="mb-2"
                      />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate w-full">
                        {b.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate w-full font-medium">
                        {b.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ACCESSORIES */}
          {activeTab === 'accessories' && (
            <div className="space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {accessoryCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAccessoryCategory(cat)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      accessoryCategory === cat
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {filteredAccessories.map((acc) => {
                  const isSelected = selectedAccessory === acc.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => setSelectedAccessory(acc.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 ring-2 ring-rose-500/40 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="text-2xl shrink-0">{acc.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs text-slate-800 dark:text-slate-200 font-bold block truncate">
                          {acc.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {acc.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: BACKGROUND GRADIENTS */}
          {activeTab === 'background' && (
            <div className="space-y-4">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Cyber & Street Theme Palettes
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
                          ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/40 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full shadow-md border-2 border-white/50 shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${g.from}, ${g.via}, ${g.to})`,
                        }}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                          {g.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate font-medium">
                          Atmospheric Glow
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
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
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
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
