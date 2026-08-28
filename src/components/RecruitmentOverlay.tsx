import React, { useEffect } from 'react';
import { RecruitmentSession } from '../types';
import { socket } from '../socket';
import { soundEngine } from '../soundEngine';
import { Mail, Skull, Shield, Flame, Check, X } from 'lucide-react';

interface RecruitmentOverlayProps {
  recruitment: RecruitmentSession;
  teamId: string;
}

export const RecruitmentOverlay: React.FC<RecruitmentOverlayProps> = ({ recruitment, teamId }) => {
  useEffect(() => {
    soundEngine.playHeartbeat(5);
    if ('vibrate' in navigator) {
      try { navigator.vibrate([100, 50, 200, 50, 300]); } catch {}
    }
  }, []);

  const handleRespond = (accept: boolean) => {
    if (accept) {
      soundEngine.playKnife();
    } else {
      soundEngine.playShield();
    }
    socket.emit('team:respond_recruitment', { teamId, accept });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-[#ff3855] bg-gradient-to-b from-[#2e090e] via-[#1a060a] to-[#0d0406] p-6 text-center shadow-2xl crimson-glow animate-pulse-intense">
        <div className="w-16 h-16 rounded-full bg-[#520d17] border-2 border-[#ff3855] flex items-center justify-center text-[#ff4d6d] mx-auto mb-3 shadow-xl">
          <Mail className="w-8 h-8 animate-bounce" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-[#4a0d15] border border-[#ff3855]/60 text-[10px] font-black uppercase tracking-widest text-[#ff8095] mb-2">
          Hemmelig Natskrivelse
        </span>

        <h2 className="text-2xl font-black font-gothic text-white drop-shadow mb-2">
          TILBUD OM REKRUTTERING!
        </h2>

        <div className="my-4 p-4 rounded-2xl bg-black/60 border border-red-950 text-xs text-[#fce8e8] leading-relaxed italic space-y-2">
          <p>
            "Et forseglet pergamentbrev er blevet skubbet ind under jeres dør i nattens mulm og mørke..."
          </p>
          <p className="font-bold text-[#f6db7e]">
            Slottets forrædere tilbyder jer en plads i deres hemmelige konklave. Hvad vælger I?
          </p>
        </div>

        <div className="flex flex-col gap-2.5 mt-5">
          <button
            onClick={() => handleRespond(true)}
            className="w-full py-3.5 rounded-2xl btn-crimson text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl cursor-pointer"
          >
            <Skull className="w-4 h-4" />
            Accepter & Bliv Forræder 🩸
          </button>

          <button
            onClick={() => handleRespond(false)}
            className="w-full py-3 rounded-2xl bg-black/60 border border-white/20 text-xs font-bold text-[#c5bca8] hover:text-white uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            Afvis & Forbliv Loyal 🛡️
          </button>
        </div>
      </div>
    </div>
  );
};
