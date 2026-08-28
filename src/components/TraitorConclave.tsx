import React, { useState, useRef, useEffect } from 'react';
import { Team, ChatMessage, MurderProposal } from '../types';
import { socket } from '../socket';
import { soundEngine } from '../soundEngine';
import { Skull, Send, Flame, Clock, CheckCircle, XCircle, Plus, Mail, Shield } from 'lucide-react';

interface TraitorConclaveProps {
  traitorChat: ChatMessage[];
  murderProposals: MurderProposal[];
  teams: Team[];
  currentTeam: Team | null;
  isAdmin: boolean;
}

export const TraitorConclave: React.FC<TraitorConclaveProps> = ({
  traitorChat,
  murderProposals,
  teams,
  currentTeam,
  isAdmin
}) => {
  const [inputText, setInputText] = useState('');
  const [targetTeamId, setTargetTeamId] = useState('');
  const [assassinationNote, setAssassinationNote] = useState('');
  const [showMurderModal, setShowMurderModal] = useState(false);
  const [showRecruitModal, setShowRecruitModal] = useState(false);
  const [recruitTargetId, setRecruitTargetId] = useState('');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const livingLoyals = teams.filter(t => t.isAlive && (t.role === 'loyal' || t.role === 'unassigned' || isAdmin));
  const traitors = teams.filter(t => t.role === 'traitor');

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [traitorChat.length]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const senderName = isAdmin ? 'Vært (Slottets Øje)' : currentTeam ? currentTeam.name.split('/')[0].trim() : 'Forræder';
    const senderId = isAdmin ? 'admin' : currentTeam ? currentTeam.id : 'anon';

    socket.emit('traitor:send_message', {
      senderId,
      senderName,
      text: inputText.trim()
    });

    setInputText('');
  };

  const handleProposeMurder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTeamId) return;

    const targetTeam = teams.find(t => t.id === targetTeamId);
    if (!targetTeam) return;

    soundEngine.playKnife();
    if ('vibrate' in navigator) {
      try { navigator.vibrate([80, 50, 150]); } catch {}
    }
    setIsSubmittingProposal(true);

    const proposerName = currentTeam ? currentTeam.name.split('/')[0].trim() : 'Forræder-Rådet';
    const proposerId = currentTeam ? currentTeam.id : 'traitor-group';

    socket.emit('traitor:propose_murder', {
      proposedByTeamId: proposerId,
      proposedByTeamName: proposerName,
      targetTeamId: targetTeam.id,
      targetTeamName: targetTeam.name,
      notes: assassinationNote.trim() || undefined
    });

    setTargetTeamId('');
    setAssassinationNote('');
    setShowMurderModal(false);
    setTimeout(() => setIsSubmittingProposal(false), 500);
  };

  const handleProposeRecruitment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruitTargetId) return;

    soundEngine.playWhisper();
    socket.emit('traitor:propose_recruitment', { targetTeamId: recruitTargetId });
    setRecruitTargetId('');
    setShowRecruitModal(false);
  };

  return (
    <div className="w-full space-y-3">
      {/* Conclave Atmosphere Banner */}
      <div className="rounded-3xl border border-[#c41e3a]/50 bg-gradient-to-b from-[#380a10] via-[#20060a] to-[#0d0406] p-4 shadow-2xl crimson-glow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-[#520d17] border border-[#ff3855] text-[#ff6b81]">
            <Skull className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black font-gothic text-white">
              Forrædernes Konklave
            </h2>
            <p className="text-[10px] text-[#ff8095] tracking-wider uppercase">
              Lukket Mødestue • {traitors.filter(t => t.isAlive).length} forrædere i live
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowRecruitModal(true)}
            className="px-3 py-2 rounded-xl bg-[#2a1d08] border border-[#d4af37]/60 text-xs font-black text-[#f6db7e] uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            Rekrutter 💌
          </button>

          <button
            onClick={() => setShowMurderModal(true)}
            className="px-3 py-2 rounded-xl btn-crimson text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-[#ff8095]" />
            Vælg Mord 🗡️
          </button>
        </div>
      </div>

      {/* Secret Chat & Action Feed */}
      <div className="rounded-3xl border border-white/10 bg-[#100e16] p-3.5 shadow-xl flex flex-col h-[400px]">
        {/* Message stream */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs scrollbar-thin">
          {traitorChat.map((msg) => {
            const isMe = currentTeam && msg.senderId === currentTeam.id;
            const isSys = msg.isSystem;

            if (isSys) {
              return (
                <div
                  key={msg.id}
                  className="p-2.5 rounded-2xl bg-[#2e090e]/90 border border-[#c41e3a]/40 text-center text-[11px] text-[#fce8e8] italic my-1 shadow-inner"
                >
                  {msg.text}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-[#9e9585] mb-0.5 px-1 font-semibold">
                  {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-[#8c1424] to-[#c41e3a] text-white rounded-br-none shadow-md'
                      : 'bg-[#221f2d] border border-white/10 text-[#e6dfd1] rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="mt-2.5 pt-2 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Skriv hemmeligt til forræderne..."
            className="flex-1 p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-[#9e9585]/60 focus:outline-none focus:border-[#ff3855]"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl btn-crimson text-white shrink-0 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Murder Selector Modal Sheet */}
      {showMurderModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-5 rounded-3xl border-2 border-[#c41e3a] bg-gradient-to-b from-[#2e090e] to-[#120508] shadow-2xl crimson-glow animate-slide-up">
            <div className="flex items-center justify-between border-b border-red-900/40 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Skull className="w-5 h-5 text-[#ff4d6d]" />
                <h3 className="text-sm font-black font-gothic text-white">
                  Vælg Nattens Mord-Offer
                </h3>
              </div>
              <button
                onClick={() => setShowMurderModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProposeMurder} className="space-y-3">
              <div>
                <label className="block text-[11px] text-[#c5bca8] mb-1 font-medium">
                  Vælg et levende hold som offer:
                </label>
                <select
                  value={targetTeamId}
                  onChange={(e) => setTargetTeamId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#200a0e] border border-[#ff3855]/40 text-xs text-white focus:outline-none focus:border-[#ff3855]"
                >
                  <option value="">-- Vælg hold --</option>
                  {livingLoyals.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} {team.hasShield && '(🛡️ Har Skjold)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="text"
                  value={assassinationNote}
                  onChange={(e) => setAssassinationNote(e.target.value)}
                  placeholder="Valgfri note til værterne (f.eks. 'Gift i vinen')"
                  className="w-full p-2.5 rounded-xl bg-[#200a0e] border border-white/10 text-xs text-white placeholder:text-[#9e9585]/60 focus:outline-none focus:border-[#ff3855]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMurderModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-[#c5bca8]"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={!targetTeamId || isSubmittingProposal}
                  className="flex-1 py-2.5 rounded-xl btn-crimson text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-40"
                >
                  <Skull className="w-4 h-4" />
                  Send Mord-anmodning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recruitment Modal Sheet */}
      {showRecruitModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-5 rounded-3xl border-2 border-[#d4af37] bg-gradient-to-b from-[#2a1d08] to-[#120b02] shadow-2xl gold-glow animate-slide-up">
            <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#f6db7e]" />
                <h3 className="text-sm font-black font-gothic text-white">
                  Send Rekrutterings-Brev 💌
                </h3>
              </div>
              <button
                onClick={() => setShowRecruitModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#e6dfd1]/80 mb-3 leading-relaxed">
              Vælg et loyalt hold. De modtager et hemmeligt tilbud på deres telefon om at slutte sig til forræderne.
            </p>

            <form onSubmit={handleProposeRecruitment} className="space-y-3">
              <div>
                <select
                  value={recruitTargetId}
                  onChange={(e) => setRecruitTargetId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/50 border border-[#d4af37]/40 text-xs text-white"
                >
                  <option value="">-- Vælg loyalt hold der skal rekrutteres --</option>
                  {livingLoyals.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecruitModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-[#c5bca8]"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  disabled={!recruitTargetId}
                  className="flex-1 py-2.5 rounded-xl btn-gold text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-40"
                >
                  <Mail className="w-4 h-4" />
                  Send Rekruttering
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
