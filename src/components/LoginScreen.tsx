import React, { useState } from 'react';
import { Team, ADMIN_USERS, UserSession } from '../types';
import { socket } from '../socket';
import { soundEngine } from '../soundEngine';
import { Shield, Lock, Crown, Users, ChevronRight, Search, PlusCircle, UserCheck, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  teams?: Team[];
  onLogin: (session: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ teams = [], onLogin }) => {
  const safeTeams = Array.isArray(teams) ? teams : [];
  const [mode, setMode] = useState<'create' | 'choose' | 'admin'>('create');
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [selectedAdminId, setSelectedAdminId] = useState<string>(ADMIN_USERS[0]?.id || 'admin-julius');
  const [adminPin, setAdminPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const filteredTeams = safeTeams.filter(t => 
    (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.players || []).some(p => (p || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 1. Create and Register New Team Dynamically
  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTeamName.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    soundEngine.playBell();
    if ('vibrate' in navigator) {
      try { navigator.vibrate(50); } catch {}
    }

    socket.emit('team:register', { name: trimmed }, (res: { success: boolean; team: Team }) => {
      setIsSubmitting(false);
      if (res?.success && res.team) {
        onLogin({
          type: 'team',
          id: res.team.id,
          name: res.team.name
        });
      }
    });

    setTimeout(() => {
      setIsSubmitting(false);
    }, 1200);
  };

  // 2. Select Existing Registered Team
  const handleSelectExistingTeam = (team: Team) => {
    soundEngine.playBell();
    if ('vibrate' in navigator) {
      try { navigator.vibrate(50); } catch {}
    }
    onLogin({
      type: 'team',
      id: team.id,
      name: team.name
    });
  };

  // 3. Admin Login
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPin = adminPin.trim();

    if (cleanedPin !== '2026') {
      setPinError(true);
      soundEngine.playTick();
      if ('vibrate' in navigator) {
        try { navigator.vibrate([100, 50, 100]); } catch {}
      }
      return;
    }

    const admin = ADMIN_USERS.find(a => a.id === selectedAdminId) || ADMIN_USERS[0];
    if (!admin) return;

    soundEngine.playVictory();
    onLogin({
      type: 'admin',
      id: admin.id,
      name: admin.name
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-3.5 sm:p-6 castle-gradient-bg animate-fade-in relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#8c1424]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-6 left-10 w-60 h-60 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Castle Header */}
      <div className="text-center pt-3 sm:pt-4 pb-2 relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full wax-seal mb-2 shadow-2xl animate-flicker">
          <span className="text-xl sm:text-3xl filter drop-shadow">🗡️</span>
        </div>

        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-[#d4af37] block mb-0.5">
          Det Store Reality-Spil
        </span>

        <h1 className="text-3xl sm:text-5xl font-black font-gothic-dec text-transparent bg-clip-text bg-gradient-to-b from-[#fcf1c8] via-[#d4af37] to-[#85661a] drop-shadow-md">
          FORRÆDER
        </h1>

        <p className="text-xs text-[#c5bca8] italic mt-1 max-w-xs mx-auto">
          "Hvem kan du stole på bag slottets lukkede døre?"
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto relative z-10">
        <div className="castle-card rounded-3xl p-4 sm:p-6 shadow-2xl border border-[#d4af37]/40 backdrop-blur-xl">
          {/* Mode Switcher */}
          <div className="flex p-1 rounded-2xl bg-black/60 border border-white/10 mb-4">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                mode === 'create'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b38b27] text-black shadow-lg'
                  : 'text-[#9e9585] hover:text-white'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nyt Hold</span>
            </button>

            {safeTeams.length > 0 && (
              <button
                type="button"
                onClick={() => setMode('choose')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  mode === 'choose'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b38b27] text-black shadow-lg'
                    : 'text-[#9e9585] hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Vælg ({safeTeams.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMode('admin');
                setPinError(false);
                setAdminPin('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                mode === 'admin'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b38b27] text-black shadow-lg'
                  : 'text-[#9e9585] hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Vært</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* ✍️ TAB 1: OPRET NYT HOLD DYNAMISK                         */}
          {/* ======================================================== */}
          {mode === 'create' && (
            <form onSubmit={handleCreateTeamSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-[#d4af37] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-[#d4af37]" />
                  Skriv Jeres Holdnavn / Spillernavne
                </label>
                <p className="text-[11px] text-[#9e9585] mb-2">
                  I kan være 1, 2 eller flere på holdet. Skriv f.eks. jeres fornavne:
                </p>

                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="F.eks. Sofie & Kasper eller Hold Rød"
                  required
                  autoFocus
                  className="w-full p-3.5 rounded-2xl bg-black/60 border border-[#d4af37]/40 text-sm sm:text-base font-bold text-white placeholder:text-[#9e9585]/40 focus:outline-none focus:border-[#d4af37] shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={!newTeamName.trim() || isSubmitting}
                className="w-full mt-2 py-3.5 rounded-2xl btn-gold text-xs sm:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl cursor-pointer disabled:opacity-50"
              >
                <span>Tilmeld & Træd Ind På Slottet</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {safeTeams.length > 0 && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setMode('choose')}
                    className="text-[11px] text-[#f6db7e] hover:underline cursor-pointer"
                  >
                    Er dit hold allerede oprettet? Tryk her for at logge ind &rarr;
                  </button>
                </div>
              )}
            </form>
          )}

          {/* ======================================================== */}
          {/* 👥 TAB 2: VÆLG EKSISTERENDE TILMELDT HOLD                 */}
          {/* ======================================================== */}
          {mode === 'choose' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#d4af37]" />
                  Vælg Dit Tilmeldte Hold
                </label>
                <span className="text-[10px] text-[#9e9585]">
                  {safeTeams.length} Tilmeldte
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9585]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Søg i tilmeldte hold..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-[#9e9585]/50 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {filteredTeams.map((team, idx) => {
                  const firstNames = (team.players || []).map(p => (p || '').trim().split(' ')[0]).join(' & ');

                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => handleSelectExistingTeam(team)}
                      className="w-full p-3 rounded-2xl border border-white/10 bg-[#181522] hover:border-[#d4af37]/60 text-[#e6dfd1] hover:text-white transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="min-w-0 pr-2 text-left">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-black/50 text-[#9e9585] text-[10px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-black tracking-wide truncate">
                            {team.name}
                          </span>
                        </div>
                        {(team.players || []).length > 1 && (
                          <span className="text-[10px] text-[#9e9585] block truncate mt-0.5 ml-7">
                            {firstNames}
                          </span>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-[#d4af37]" />
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setMode('create')}
                className="w-full py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-[#c5bca8] hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Opret et andet hold</span>
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* 👑 TAB 3: VÆRT (ADMIN) LOGIN                             */}
          {/* ======================================================== */}
          {mode === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#d4af37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-[#d4af37]" />
                  Vælg Vært
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ADMIN_USERS.map((admin) => {
                    const isSelected = selectedAdminId === admin.id;
                    return (
                      <button
                        key={admin.id}
                        type="button"
                        onClick={() => setSelectedAdminId(admin.id)}
                        className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#2a2010] border-[#d4af37] text-[#f6db7e] shadow-lg'
                            : 'bg-[#181522] border-white/10 text-[#9e9585]'
                        }`}
                      >
                        {admin.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-[#c5bca8] uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-[#d4af37]" />
                    Hemmelig Vært-PIN
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[10px] text-[#f6db7e] flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPin ? 'Skjul' : 'Vis kode'}</span>
                  </button>
                </label>

                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      setPinError(false);
                    }}
                    placeholder="Indtast 4 cifre..."
                    className="w-full p-3.5 rounded-2xl bg-black/60 border border-white/15 text-center tracking-[0.3em] text-lg font-black text-white focus:outline-none focus:border-[#d4af37] shadow-inner"
                  />
                </div>

                {pinError && (
                  <p className="text-[11px] text-[#ff6b81] mt-1.5 font-bold text-center animate-shake">
                    Forkert PIN-kode. Adgang nægtet.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-3.5 rounded-2xl btn-gold text-xs sm:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl cursor-pointer"
              >
                <span>Log ind som Vært</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center pb-2 text-[10px] text-[#9e9585]/60 relative z-10">
        Forræder Reality Event • Julius Tuxen & Karoline Weeke
      </div>
    </div>
  );
};
