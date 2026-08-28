import React, { useState } from 'react';
import { INITIAL_TEAMS, ADMIN_USERS, UserSession } from '../types';
import { soundEngine } from '../soundEngine';
import { Shield, Lock, Crown, Users, ChevronRight, Search, Sparkles } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (session: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'team' | 'admin'>('team');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(INITIAL_TEAMS[0].id);
  const [selectedAdminId, setSelectedAdminId] = useState<string>(ADMIN_USERS[0].id);
  const [adminPin, setAdminPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTeams = INITIAL_TEAMS.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.players.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (mode === 'team') {
      const team = INITIAL_TEAMS.find(t => t.id === selectedTeamId);
      if (!team) return;

      soundEngine.playBell();
      if ('vibrate' in navigator) {
        try { navigator.vibrate(50); } catch {}
      }
      onLogin({
        type: 'team',
        id: team.id,
        name: team.name
      });
    } else {
      // Secret Admin PIN validation: "2026"
      if (adminPin.trim() !== '2026') {
        setPinError(true);
        soundEngine.playTick();
        if ('vibrate' in navigator) {
          try { navigator.vibrate([100, 50, 100]); } catch {}
        }
        return;
      }

      const admin = ADMIN_USERS.find(a => a.id === selectedAdminId);
      if (!admin) return;

      soundEngine.playVictory();
      onLogin({
        type: 'admin',
        id: admin.id,
        name: admin.name
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 castle-gradient-bg animate-fade-in relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#8c1424]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-6 left-10 w-60 h-60 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Castle Header */}
      <div className="text-center pt-4 pb-2 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full wax-seal mb-2 sm:mb-3 shadow-2xl animate-flicker">
          <span className="text-2xl sm:text-3xl filter drop-shadow">🗡️</span>
        </div>

        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-[#d4af37] block mb-1">
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
              onClick={() => {
                setMode('team');
                setPinError(false);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'team'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b38b27] text-black shadow-lg'
                  : 'text-[#9e9585] hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Deltager-Hold
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('admin');
                setPinError(false);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'admin'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b38b27] text-black shadow-lg'
                  : 'text-[#9e9585] hover:text-white'
              }`}
            >
              <Crown className="w-4 h-4" />
              Vært (Admin)
            </button>
          </div>

          {mode === 'team' ? (
            /* ======================================================== */
            /* 👥 PARTICIPANT TEAM SELECTOR WITH CARDS                  */
            /* ======================================================== */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-[#d4af37] uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#d4af37]" />
                  Vælg Dit Hold (1-klik)
                </label>
                <span className="text-[10px] text-[#9e9585]">
                  14 Hold på Slottet
                </span>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9585]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Søg efter fornavn..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-[#9e9585]/50 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Scrollable Visual Card Grid of Teams */}
              <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {filteredTeams.map((team, idx) => {
                  const isSelected = selectedTeamId === team.id;
                  const firstNames = team.players.map(p => p.trim().split(' ')[0]).join(' & ');

                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#380a10] to-[#20060a] border-[#ff3855] shadow-lg text-white scale-[1.01]'
                          : 'bg-[#181522] border-white/10 hover:border-[#d4af37]/40 text-[#e6dfd1]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${isSelected ? 'bg-[#ff3855] text-white' : 'bg-black/40 text-[#9e9585]'}`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs font-black tracking-wide truncate">
                            {firstNames}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#9e9585] block truncate mt-0.5 ml-7">
                          {team.name}
                        </span>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#c41e3a] text-white shadow-md">
                            Valgt ✓
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#9e9585]/40" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => handleLoginSubmit()}
                className="w-full mt-3 py-3.5 rounded-2xl btn-gold text-xs sm:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl cursor-pointer"
              >
                <span>Træd Ind På Slottet</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* ======================================================== */
            /* 👑 HOST (ADMIN) SELECTOR & PIN PAD                       */
            /* ======================================================== */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                <label className="block text-xs font-black text-[#c5bca8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-[#d4af37]" />
                  Hemmelig Vært-PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={10}
                  value={adminPin}
                  onChange={(e) => {
                    setAdminPin(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="••••"
                  className="w-full p-3.5 rounded-2xl bg-black/60 border border-white/10 text-center tracking-[0.4em] text-base font-black text-white placeholder:text-[#9e9585]/40 focus:outline-none focus:border-[#d4af37]"
                />
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
