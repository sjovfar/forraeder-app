import React, { useEffect } from 'react';
import { BroadcastEvent } from '../types';
import { soundEngine } from '../soundEngine';
import { Bell, Volume2, AlertTriangle, Flame, Check } from 'lucide-react';

interface BroadcastOverlayProps {
  broadcast: BroadcastEvent | null;
  onDismiss: () => void;
}

export const BroadcastOverlay: React.FC<BroadcastOverlayProps> = ({ broadcast, onDismiss }) => {
  useEffect(() => {
    if (broadcast) {
      soundEngine.playBySoundType(broadcast.soundType);
      // Attempt device vibration if supported on Android
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200, 100, 400]);
        } catch {
          // Ignore if vibration fails
        }
      }
    }
  }, [broadcast?.id]);

  if (!broadcast) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-[#c41e3a] bg-gradient-to-b from-[#2e090e] via-[#1a060a] to-[#0d0406] p-6 text-center shadow-2xl crimson-glow animate-pulse-intense">
        {/* Animated ambient flames/torch */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff3855] to-transparent" />
        
        {/* Icon & Title */}
        <div className="flex justify-center mb-4">
          <div className="relative w-20 h-20 rounded-full bg-[#4a0d15] border-2 border-[#ff3855] flex items-center justify-center text-[#f6db7e] shadow-xl">
            <Flame className="w-10 h-10 text-[#ff4d6d] animate-bounce" />
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-[#8c1424] rounded-full border border-white/20">
              <Volume2 className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-[#4a0d15] border border-[#ff3855]/40 text-[10px] font-black uppercase tracking-widest text-[#ff8095] mb-2">
          Slots-Kundgørelse
        </span>

        <h2 className="text-2xl sm:text-3xl font-black font-gothic text-white drop-shadow-md tracking-wide">
          {broadcast.title}
        </h2>

        {/* Message body */}
        <div className="my-5 p-4 rounded-xl bg-black/40 border border-red-950/60 shadow-inner">
          <p className="text-base sm:text-lg text-[#fce8e8] font-medium leading-relaxed italic">
            "{broadcast.message}"
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-[#c5bca8]/70 border-t border-red-900/30 pt-3 mb-5">
          <span>Afsender: <strong className="text-[#f6db7e]">{broadcast.sender}</strong></span>
          <span>{new Date(broadcast.timestamp).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="w-full py-3.5 rounded-xl btn-crimson text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
        >
          <Check className="w-5 h-5" />
          Jeg har forstået beskeden
        </button>
      </div>
    </div>
  );
};
