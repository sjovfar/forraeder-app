import React from 'react';
import { MorningRevealSession, Team } from '../types';
import { soundEngine } from '../soundEngine';
import { Coffee, Skull, Users, X, Flame, AlertOctagon } from 'lucide-react';

interface MorningRevealOverlayProps {
  morningReveal: MorningRevealSession;
  teams: Team[];
  onDismiss: () => void;
}

export const MorningRevealOverlay: React.FC<MorningRevealOverlayProps> = ({
  morningReveal,
  teams,
  onDismiss
}) => {
  const livingTeams = teams.filter(t => t.isAlive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl border-2 border-[#d4af37] bg-gradient-to-b from-[#1c1825] via-[#100d16] to-[#08070b] shadow-2xl text-center gold-glow scrollbar-thin">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-full bg-[#2a2214] border-2 border-[#d4af37] flex items-center justify-center text-[#f6db7e] shadow-xl">
            <Coffee className="w-8 h-8" />
          </div>
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-[#2a2214] border border-[#d4af37]/60 text-[10px] font-black uppercase tracking-widest text-[#f6db7e] mb-1">
          Morgensamling på Slottet
        </span>

        <h2 className="text-2xl font-black font-gothic text-white drop-shadow mb-2">
          Hvem Overlevede Natten?
        </h2>

        <p className="text-xs text-[#c5bca8] italic max-w-xs mx-auto mb-4">
          "Solen står op over slottets tårne. Deltagerne samles i morgenstuen – men én stol står tom..."
        </p>

        {/* Murdered Team Announcement Card */}
        {morningReveal.murderedTeamName ? (
          <div className="my-4 p-4 rounded-2xl border-2 border-[#c41e3a] bg-gradient-to-b from-[#380a10] to-[#170508] crimson-glow text-center animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-[#520d17] border border-[#ff3855] flex items-center justify-center text-[#ff4d6d] mx-auto mb-2 shadow-lg">
              <Skull className="w-6 h-6 animate-pulse" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-[#ff8095] block">
              Slottets Offer i Nat
            </span>

            <h3 className="text-xl font-black font-gothic text-white mt-0.5">
              {morningReveal.murderedTeamName}
            </h3>

            <p className="text-[11px] text-[#fce8e8]/80 mt-1">
              Blev myrdet af forræderne i nattens mørke og deltager ikke længere i spillet.
            </p>
          </div>
        ) : (
          <div className="my-4 p-4 rounded-2xl border border-green-700/60 bg-green-950/40 text-xs text-green-300">
            🛡️ Ingen blev myrdet i nat! Slottets våbenskjold reddede det udvalgte offer.
          </div>
        )}

        {/* Living Survivors Present at Breakfast */}
        <div className="text-left mt-4 border-t border-white/10 pt-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#f6db7e] block mb-2">
            Til Stede ved Morgenbordet ({livingTeams.length} Hold):
          </span>

          <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
            {livingTeams.map((team) => (
              <div
                key={team.id}
                className="p-2 rounded-xl bg-black/40 border border-white/5 truncate flex items-center gap-1.5 text-[#e6dfd1]"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <span className="truncate font-semibold text-[11px]">{team.name.split('/')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="w-full mt-5 py-3 rounded-2xl btn-gold text-xs font-black uppercase tracking-wider shadow-lg"
        >
          Fortsæt til Dagens Udfordringer
        </button>
      </div>
    </div>
  );
};
