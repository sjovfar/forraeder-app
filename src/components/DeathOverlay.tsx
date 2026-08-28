import React, { useEffect } from 'react';
import { Team } from '../types';
import { soundEngine } from '../soundEngine';
import { Skull, AlertTriangle, Flame, ShieldAlert, X } from 'lucide-react';

interface DeathOverlayProps {
  team: Team;
  onDismiss: () => void;
}

export const DeathOverlay: React.FC<DeathOverlayProps> = ({ team, onDismiss }) => {
  const isMurder = team.eliminationReason === 'murder';
  const isBanishment = team.eliminationReason === 'banishment';

  useEffect(() => {
    // Play dramatic horror death sound & haptics
    soundEngine.playKnife();
    setTimeout(() => {
      soundEngine.playGong();
    }, 400);

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([100, 80, 200, 100, 400]);
      } catch {}
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-[#ff3855] bg-gradient-to-b from-[#380a10] via-[#1a0508] to-[#0a0304] p-6 text-center shadow-2xl crimson-glow animate-pulse-intense">
        {/* Pulsing skull icon */}
        <div className="w-20 h-20 rounded-full bg-[#520d17] border-2 border-[#ff3855] flex items-center justify-center text-[#ff4d6d] mx-auto mb-4 shadow-2xl animate-bounce">
          <Skull className="w-10 h-10" />
        </div>

        <span className="inline-block px-3.5 py-1 rounded-full bg-[#4a0d15] border border-[#ff3855]/70 text-[11px] font-black uppercase tracking-widest text-[#ff8095] mb-2 shadow-md">
          {isBanishment ? 'Forvist fra Riddersalen' : 'Slottets Dødsattest'}
        </span>

        <h1 className="text-2xl sm:text-3xl font-black font-gothic text-white drop-shadow-md mb-2">
          {isBanishment ? 'DU ER BLEVET FORVIST!' : 'DU ER BLEVET SLÅET IHJEL! ☠️'}
        </h1>

        <div className="my-4 p-4 rounded-2xl bg-black/60 border border-red-950/80 text-xs text-[#fce8e8] leading-relaxed italic space-y-2">
          {isMurder ? (
            <>
              <p className="font-semibold text-red-300">
                "I nattens mulm og mørke har forræderne listet sig ind og udpeget jer som deres offer..."
              </p>
              <p>
                Jeres tid som levende på slottet er forbi. I må ikke længere deltage i afstemninger eller afsløre hemmeligheder for de overlevende.
              </p>
            </>
          ) : isBanishment ? (
            <>
              <p className="font-semibold text-yellow-300">
                "Slottets Råd har talt ved det store rundbord..."
              </p>
              <p>
                Flertallet pegede på jer, og I er blevet forvist fra slottet i vanære.
              </p>
            </>
          ) : (
            <p>
              Jeres hold er blevet elimineret fra slottets reality-spil.
            </p>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="w-full mt-4 py-3.5 rounded-2xl btn-crimson text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl cursor-pointer active:scale-95"
        >
          <Skull className="w-4 h-4" />
          Accepter Din Skæbne ☠️
        </button>
      </div>
    </div>
  );
};
