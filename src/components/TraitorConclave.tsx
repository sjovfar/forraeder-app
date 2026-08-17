import React, { useState, useRef, useEffect } from 'react';
import { Team, ChatMessage, MurderProposal } from '../types';
import { socket } from '../socket';
import { soundEngine } from '../soundEngine';
import { Skull, Send, Flame, ShieldAlert, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

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

    const senderName = isAdmin ? 'Vært (Slottets Øje)' : currentTeam ? currentTeam.name : 'Ukendt Forræder';
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

    soundEngine.playGong();
    setIsSubmittingProposal(true);

    const proposerName = currentTeam ? currentTeam.name : 'Forræder-Rådet';
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
    setTimeout(() => setIsSubmittingProposal(false), 500);
  };

  return (
    <div className="w-full space-y-4">
      {/* Conclave Atmosphere Banner */}
      <div className="rounded-2xl border border-[#c41e3a]/50 bg-gradient-to-b from-[#380a10] via-[#20060a] to-[#0d0406] p-5 shadow-2xl crimson-glow relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#c41e3a]/30 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#520d17] border border-[#ff3855] text-[#ff6b81]">
              <Skull className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black font-gothic text-white flex items-center gap-1.5">
                Forrædernes Konklave
              </h2>
              <p className="text-[10px] text-[#ff8095] tracking-wider uppercase">
                Lukket Kammer • Kun Forrædere & Værter
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#9e9585] block">Aktive Forrædere</span>
            <span className="text-xs font-black text-[#f6db7e]">
              {traitors.filter(t => t.isAlive).length} / 3 i live
            </span>
          </div>
        </div>

        <p className="text-xs text-[#e6dfd1]/80 leading-relaxed italic">
          "I ly af nattens mulm og mørke planlægger forræderne deres næste træk. De loyale aner intet."
        </p>
      </div>

      {/* Dedicated Murder UI: Vælg hold til eliminering */}
      <div className="rounded-2xl border border-[#c41e3a]/40 bg-[#16080b] p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-[#ff3855]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#ff8095]">
            Vælg Hold til Nattens Mord
          </h3>
        </div>

        <form onSubmit={handleProposeMurder} className="space-y-3">
          <div>
            <label className="block text-[11px] text-[#c5bca8] mb-1 font-medium">
              Vælg et levende hold som forrædernes mord-offer:
            </label>
            <select
              value={targetTeamId}
              onChange={(e) => setTargetTeamId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#260c10] border border-[#ff3855]/40 text-xs text-white focus:outline-none focus:border-[#ff3855]"
            >
              <option value="">-- Vælg mål fra listen --</option>
              {livingLoyals.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="text"
              value={assassinationNote}
              onChange={(e) => setAssassinationNote(e.target.value)}
              placeholder="Valgfri note til værterne (f.eks. 'Gift i slyngelstuen')"
              className="w-full p-2.5 rounded-xl bg-[#260c10] border border-white/10 text-xs text-white placeholder:text-[#9e9585]/60 focus:outline-none focus:border-[#ff3855]"
            />
          </div>

          <button
            type="submit"
            disabled={!targetTeamId || isSubmittingProposal}
            className="w-full py-3 rounded-xl btn-crimson text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Skull className="w-4 h-4" />
            Send Mord-anmodning til Slottets Værter
          </button>
        </form>

        {/* Live Proposal Status Feed */}
        {murderProposals.length > 0 && (
          <div className="mt-4 pt-3 border-t border-red-950/60 space-y-2">
            <span className="text-[10px] font-bold text-[#9e9585] uppercase tracking-wider block">
              Seneste Mordanmodninger:
            </span>
            {murderProposals.slice(-3).reverse().map((prop) => (
              <div
                key={prop.id}
                className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-bold text-white block truncate">
                    Mål: {prop.targetTeamName}
                  </span>
                  <span className="text-[10px] text-[#9e9585]">
                    Foreslået af: {prop.proposedByTeamName}
                  </span>
                </div>

                <div className="shrink-0">
                  {prop.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-950/60 border border-yellow-600/40 text-[10px] font-bold text-yellow-400">
                      <Clock className="w-3 h-3" /> Afventer Vært
                    </span>
                  )}
                  {prop.status === 'approved' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/80 border border-red-600/60 text-[10px] font-bold text-red-300">
                      <CheckCircle className="w-3 h-3 text-red-400" /> Eksekveret!
                    </span>
                  )}
                  {prop.status === 'rejected' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-[10px] font-bold text-zinc-400">
                      <XCircle className="w-3 h-3" /> Afvist
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Secret Chat Feed */}
      <div className="rounded-2xl border border-white/10 bg-[#100e16] p-4 shadow-xl flex flex-col h-[320px]">
        <div className="border-b border-white/10 pb-2 mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#f6db7e] uppercase tracking-wider">
            Forrædernes Hemmelige Chat
          </span>
          <span className="text-[10px] text-[#9e9585]">
            Krypteret forbindelse
          </span>
        </div>

        {/* Message stream */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
          {traitorChat.map((msg) => {
            const isMe = currentTeam && msg.senderId === currentTeam.id;
            const isSys = msg.isSystem;

            if (isSys) {
              return (
                <div
                  key={msg.id}
                  className="p-2 rounded-lg bg-[#2e090e]/80 border border-[#c41e3a]/30 text-center text-[11px] text-[#fce8e8] italic my-1"
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
                <span className="text-[10px] text-[#9e9585] mb-0.5 px-1">
                  {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div
                  className={`p-2.5 rounded-2xl max-w-[82%] leading-relaxed ${
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
        <form onSubmit={handleSendMessage} className="mt-3 pt-2 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Skriv hemmeligt til forræderne..."
            className="flex-1 p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-[#9e9585]/60 focus:outline-none focus:border-[#d4af37]"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl btn-gold text-black shrink-0 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
