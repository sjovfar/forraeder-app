import React, { useState } from 'react';
import { INITIAL_TEAMS, ADMIN_USERS, UserSession } from '../types';
import { soundEngine } from '../soundEngine';
import { Shield, Key, Sparkles, ChevronRight, Lock, Crown, Users } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (session: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'team' | 'admin'>('team');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(INITIAL_TEAMS[0].id);
  const [selectedAdminId, setSelectedAdminId] = useState<string>(ADMIN_USERS[0].id);
  const [adminPin, setAdminPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'team') {
      const team = INITIAL_TEAMS.find(t => t.id === selectedTeamId);
      if (!team) return;

      soundEngine.playBell();
      onLogin({
        type: 'team',
        id: team.id,
        name: team.name
      });
    } else {
      // Admin login validation (PIN default '1234' or empty for fast entry)
      if (adminPin.trim() !== '1234' && adminPin.trim() !== '') {
        setPinError(true);
        soundEngine.playTick();
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
      {/* Background atmospheric ambient lights */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#8c1424]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Crest */}
      <div className="text-center pt-8 pb-4 relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full wax-seal mb-4 shadow-2xl animate-flicker">
          <span className="text-3xl filter drop-shadow">🗡️</span>
        </div>

        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#d4af37] block mb-1">
          Det Store Reality-Spil
        </span>

        <h1 className="text-4xl sm:text-5xl font-black font-gothic-dec text-transparent bg-clip-text bg-gradient-to-b from-[#fcf1c8] via-[#d4af37] to-[#85661a] drop-shadow-md">
          FORRÆDER
        </h1>

        <p className="text-xs text-[#c5bca8] italic mt-2 max-w-xs mx-auto">
          "Hvem kan du stole på bag slottets lukkede døre?"
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-sm mx-auto my-auto relative z-10">
        <div className="castle-card rounded-2xl p-6 shadow-2xl border border-[#d4af37]/40 backdrop-blur-xl">
          {/* Mode Switcher */}
          <div className="flex p-1 rounded-xl bg-black/50 border border-white/10 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('team');
                setPinError(false);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'team'
                  ? 'bg-[#d4af37] text-black shadow-md'
                  : 'text-[#9e9585] hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Deltager-Hold
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('admin');
                setPinError(false);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'admin'
                  ? 'bg-[#d4af37] text-black shadow-md'
                  : 'text-[#9e9585] hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              Vært (Admin)
            </button>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {mode === 'team' ? (
              /* Participant Dropdown */
              <div>
                <label className="block text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Vælg Dit Hold
                </label>
                <div className="relative">
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-[#1a1724] border border-[#d4af37]/30 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all appearance-none cursor-pointer pr-10"
                  >
                    {INITIAL_TEAMS.map((team, idx) => (
                      <option key={team.id} value={team.id} className="bg-[#14121a] py-2">
                        {idx + 1}. {team.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#d4af37]">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
                <p className="text-[10px] text-[#9e9585] mt-1.5">
                  Ingen adgangskode påkrævet. Vælg jeres hold og træd ind.
                </p>
              </div>
            ) : (
              /* Admin Selector */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    Vælg Vært
                  </label>
                  <div className="relative">
                    <select
                      value={selectedAdminId}
                      onChange={(e) => setSelectedAdminId(e.target.value)}
                      className="w-full p-3 rounded-xl bg-[#1a1724] border border-[#d4af37]/30 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#d4af37] transition-all appearance-none cursor-pointer pr-10"
                    >
                      {ADMIN_USERS.map((admin) => (
                        <option key={admin.id} value={admin.id} className="bg-[#14121a]">
                          {admin.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#d4af37]">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#c5bca8] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
                    Vært-PIN (Kode: 1234)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      setPinError(false);
                    }}
                    placeholder="Indtast 1234"
                    className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-[#9e9585]/50 focus:outline-none focus:border-[#d4af37]"
                  />
                  {pinError && (
                    <p className="text-[11px] text-[#ff6b81] mt-1 font-semibold">
                      Forkert PIN. Brug standardkoden: 1234
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              className="w-full mt-4 py-3.5 rounded-xl btn-gold text-xs sm:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl cursor-pointer"
            >
              <span>Træd Ind På Slottet</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center pb-4 text-[10px] text-[#9e9585]/60 relative z-10">
        Forræder Reality Event • Julius Tuxen & Karoline Weeke
      </div>
    </div>
  );
};
