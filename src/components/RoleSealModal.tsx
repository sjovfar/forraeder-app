import React, { useState } from 'react';
import { RoleType } from '../types';
import { soundEngine } from '../soundEngine';
import { Shield, Skull, EyeOff, X, Sparkles, Heart } from 'lucide-react';

interface RoleSealModalProps {
  role: RoleType;
  teamName: string;
  onClose: () => void;
}

export const RoleSealModal: React.FC<RoleSealModalProps> = ({ role, teamName, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);

  const handleBreakSeal = () => {
    if (!isOpen && !isBreaking) {
      setIsBreaking(true);
      // Play intense accelerating heartbeat before revealing
      soundEngine.playHeartbeat(5);

      setTimeout(() => {
        setIsBreaking(false);
        setIsOpen(true);
        if (role === 'traitor') {
          soundEngine.playKnife();
        } else {
          soundEngine.playVictory();
        }
      }, 1400);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const isTraitor = role === 'traitor';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-[#d4af37]/40 bg-gradient-to-b from-[#1e1927] to-[#0b0a10] p-6 text-center shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#d4af37]/60 hover:text-[#d4af37] transition-colors"
          aria-label="Luk"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <span className="text-[11px] font-semibold tracking-widest text-[#d4af37] uppercase">
            Fortrolig Slotsakt
          </span>
          <h3 className="text-xl font-bold font-gothic text-white mt-1">
            {teamName}
          </h3>
          <p className="text-xs text-[#9e9585] mt-0.5">
            Hold skærmen skjult for andre deltagere
          </p>
        </div>

        {!isOpen ? (
          /* Sealed Envelope View */
          <div className="my-6 py-6 px-4 rounded-xl border border-[#d4af37]/20 bg-[#14121a] flex flex-col items-center">
            <p className="text-xs text-[#c5bca8] italic mb-6">
              "Dit sande tilhørsforhold på slottet er forseglet herunder..."
            </p>

            {/* Pulsing Wax Seal */}
            <button
              onClick={handleBreakSeal}
              disabled={isBreaking}
              className="group relative flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95"
            >
              <div className={`w-24 h-24 rounded-full wax-seal flex items-center justify-center shadow-2xl transition-all duration-300 ${isBreaking ? 'scale-110 ring-4 ring-red-500 animate-ping' : 'group-hover:scale-105'}`}>
                <span className="text-3xl filter drop-shadow">🗡️</span>
              </div>
              <div className="absolute -bottom-3 px-3 py-1 bg-[#2a070c] border border-[#c41e3a]/60 rounded-full text-[10px] font-bold text-[#f6db7e] tracking-wider uppercase shadow-md animate-pulse">
                {isBreaking ? 'Bryder Seglet...' : 'Bryd Seglet'}
              </div>
            </button>

            <p className="text-[11px] text-[#9e9585] mt-8">
              {isBreaking ? 'Hjertet banker...' : 'Tryk på voksseglet for at afsløre din rolle'}
            </p>
          </div>
        ) : (
          /* Revealed Role Card */
          <div
            className={`my-4 p-6 rounded-xl border text-center transition-all duration-500 animate-scale-up ${
              isTraitor
                ? 'bg-gradient-to-b from-[#380a10] to-[#170508] border-[#c41e3a]/60 crimson-glow'
                : 'bg-gradient-to-b from-[#2a2416] to-[#12100a] border-[#d4af37]/60 gold-glow'
            }`}
          >
            <div className="flex justify-center mb-3">
              {isTraitor ? (
                <div className="w-16 h-16 rounded-full bg-[#520d17] border border-[#c41e3a] flex items-center justify-center text-[#ff4d6d] shadow-lg">
                  <Skull className="w-8 h-8 animate-pulse" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#423617] border border-[#d4af37] flex items-center justify-center text-[#f6db7e] shadow-lg">
                  <Shield className="w-8 h-8" />
                </div>
              )}
            </div>

            <span
              className={`text-xs font-black tracking-widest uppercase ${
                isTraitor ? 'text-[#ff6b81]' : 'text-[#f6db7e]'
              }`}
            >
              Din Hemmelige Rolle
            </span>

            <h2
              className={`text-3xl font-black font-gothic mt-1 mb-3 ${
                isTraitor ? 'text-[#ff3855] drop-shadow' : 'text-[#f0cb54] drop-shadow'
              }`}
            >
              {role === 'unassigned' ? 'IKKE TILDELT ENDNU' : isTraitor ? 'FORRÆDER' : 'LOYAL'}
            </h2>

            <p className="text-xs text-[#e6dfd1]/90 leading-relaxed mb-4">
              {role === 'unassigned' ? (
                'Værterne har endnu ikke tildelt roller til denne runde. Vent venligst.'
              ) : isTraitor ? (
                'Du opererer i mørket. Dit mål er at eliminere de loyale én efter én uden at blive opdaget. Samarbejd med de andre forrædere i det hemmelige konklave.'
              ) : (
                'Du er slottets loyale beskytter. Dit mål er at gennemskue forrædernes løgne og forvise dem ved det daglige rundbordsmøde.'
              )}
            </p>

            <button
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-semibold text-[#c5bca8] hover:text-white transition-colors"
            >
              <EyeOff className="w-4 h-4" />
              Skjul rolle igen
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-2 py-2.5 rounded-lg btn-dark text-xs font-bold uppercase tracking-wider"
        >
          Fortsæt til Slottet
        </button>
      </div>
    </div>
  );
};
