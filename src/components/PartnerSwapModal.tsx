import React, { useState, useEffect } from 'react';
import { PartnerSwapSession, Team } from '../types';
import { socket } from '../socket';
import { soundEngine } from '../soundEngine';
import { Sparkles, Timer, Trophy, Lock, Users, AlertCircle, ArrowRightLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PartnerSwapModalProps {
  partnerSwap: PartnerSwapSession;
  currentTeam: Team | null;
  isAdmin: boolean;
  onClose?: () => void;
}

export const PartnerSwapModal: React.FC<PartnerSwapModalProps> = ({
  partnerSwap,
  currentTeam,
  isAdmin,
  onClose
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasClaimed, setHasClaimed] = useState<boolean>(false);

  useEffect(() => {
    if (!partnerSwap.isActive && !partnerSwap.winnerTeamId) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((partnerSwap.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 5 && remaining > 0 && partnerSwap.isActive) {
        soundEngine.playTick();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [partnerSwap.expiresAt, partnerSwap.isActive, partnerSwap.winnerTeamId]);

  // Trigger celebration if current team won
  useEffect(() => {
    if (partnerSwap.winnerTeamId && currentTeam && partnerSwap.winnerTeamId === currentTeam.id) {
      soundEngine.playVictory();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [partnerSwap.winnerTeamId, currentTeam?.id]);

  const handleClaim = () => {
    if (!currentTeam || !currentTeam.isAlive || !partnerSwap.isActive || partnerSwap.winnerTeamId) return;
    setHasClaimed(true);
    socket.emit('partner_swap:claim', {
      teamId: currentTeam.id,
      teamName: currentTeam.name
    });
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const isWinner = currentTeam && partnerSwap.winnerTeamId === currentTeam.id;
  const isLocked = !partnerSwap.isActive || !!partnerSwap.winnerTeamId;

  return (
    <div className="w-full rounded-2xl border-2 border-[#d4af37]/60 bg-gradient-to-b from-[#221c2e] via-[#15121f] to-[#0d0c14] p-5 shadow-2xl gold-glow overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#d4af37]/20 text-[#f6db7e]">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black font-gothic text-white">
              Partnerbytte (Først-til-Mølle)
            </h3>
            <p className="text-[11px] text-[#9e9585]">
              Byt en makker ud med en deltager fra et dødt hold
            </p>
          </div>
        </div>

        {partnerSwap.isActive && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#380a10] border border-[#c41e3a] text-xs font-black text-[#ff8095] animate-pulse">
            <Timer className="w-3.5 h-3.5" />
            <span>{formattedTime}</span>
          </div>
        )}
      </div>

      {/* Winner Display State */}
      {partnerSwap.winnerTeamId ? (
        <div className="text-center py-5 px-4 rounded-xl bg-black/40 border border-[#d4af37]/30 my-2">
          <div className="inline-flex p-3 rounded-full bg-[#423617] border border-[#d4af37] text-[#f6db7e] mb-3">
            <Trophy className="w-8 h-8 animate-bounce" />
          </div>
          
          <span className="block text-[11px] font-black uppercase tracking-widest text-[#f6db7e]">
            Vinder af Partnerbyttet!
          </span>

          <h2 className="text-xl sm:text-2xl font-black font-gothic text-white mt-1 mb-2">
            {partnerSwap.winnerTeamName}
          </h2>

          <p className="text-xs text-[#c5bca8] max-w-xs mx-auto">
            {isWinner ? (
              <span className="text-[#f6db7e] font-bold">
                🎉 I var allerhurtigst på knappen! Værterne (Julius & Karoline) kontakter jer nu for at gennemføre jeres partnerbytte.
              </span>
            ) : (
              'Dette hold var hurtigst på knappen og har sikret sig retten til partnerbytte hos værterne.'
            )}
          </p>

          {partnerSwap.isCompleted && partnerSwap.swappedDetails && (
            <div className="mt-4 p-3 rounded-lg bg-[#2a2416] border border-[#d4af37]/50 text-xs text-[#fce8e8]">
              <strong className="text-[#f6db7e] block mb-1">Gennemført Bytte:</strong>
              <span>
                {partnerSwap.swappedDetails.originalPlayer} er udskiftet med{' '}
                <strong className="text-[#f6db7e]">{partnerSwap.swappedDetails.newPlayer}</strong> (fra {partnerSwap.swappedDetails.fromDeadTeamName})
              </span>
            </div>
          )}
        </div>
      ) : partnerSwap.isActive ? (
        /* Active Timer & Big Button State */
        <div className="text-center py-4">
          <div className="mb-4">
            <div className="text-4xl font-black font-gothic text-[#f6db7e] tracking-wider drop-shadow-md">
              {formattedTime}
            </div>
            <p className="text-xs text-[#c5bca8] mt-1">
              Tiden rinder ud! Den første til at trykke vinder partnerbyttet.
            </p>
          </div>

          {currentTeam && currentTeam.isAlive ? (
            <button
              onClick={handleClaim}
              disabled={isLocked || hasClaimed}
              className="w-full py-6 rounded-2xl btn-gold text-lg sm:text-xl font-black uppercase tracking-wider shadow-2xl animate-pulse-intense flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                TRYK HER NU!
                <Sparkles className="w-6 h-6" />
              </span>
              <span className="text-[11px] font-normal tracking-normal text-black/80">
                Først til mølle vinder partnerbyttet
              </span>
            </button>
          ) : currentTeam && !currentTeam.isAlive ? (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 text-xs text-red-300">
              <Lock className="w-5 h-5 mx-auto mb-1 text-red-400" />
              Jeres hold er elimineret og kan ikke deltage i kapløbet. En deltager fra jeres hold kan dog blive valgt af vinderen!
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-[#9e9585]">
              Værtsvisning: Nedtællingen er i gang på alle levende holds skærme.
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-xs text-[#9e9585]">
          Intet aktivt partnerbytte i øjeblikket. Værterne starter det når udfordringen begynder.
        </div>
      )}
    </div>
  );
};
