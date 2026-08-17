import React, { useState } from 'react';
import { VoteSession, Team, VoteRecord } from '../types';
import { socket } from '../socket';
import { soundEngine } from '../soundEngine';
import { CheckCircle2, AlertCircle, Users, Flame, Skull, ShieldAlert } from 'lucide-react';

interface VotingRoomProps {
  voteSession: VoteSession;
  teams: Team[];
  currentTeam: Team | null;
  isAdmin: boolean;
}

export const VotingRoom: React.FC<VotingRoomProps> = ({
  voteSession,
  teams,
  currentTeam,
  isAdmin
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const livingTeams = teams.filter(t => t.isAlive);
  const deadTeams = teams.filter(t => !t.isAlive);

  // Calculate live vote counts
  const voteCounts: Record<string, number> = {};
  const votersForTeam: Record<string, string[]> = {};

  Object.values(voteSession.votes || {}).forEach((v: VoteRecord) => {
    voteCounts[v.targetTeamId] = (voteCounts[v.targetTeamId] || 0) + 1;
    if (!votersForTeam[v.targetTeamId]) {
      votersForTeam[v.targetTeamId] = [];
    }
    votersForTeam[v.targetTeamId].push(v.voterTeamName);
  });

  const totalVotesCast = Object.keys(voteSession.votes || {}).length;
  const myVote = currentTeam ? voteSession.votes?.[currentTeam.id] : null;

  const handleCastVote = (targetId: string) => {
    if (!currentTeam || !currentTeam.isAlive || !voteSession.isActive) return;
    const target = teams.find(t => t.id === targetId);
    if (!target) return;

    soundEngine.playTick();
    setIsSubmitting(true);
    socket.emit('vote:cast', {
      voterTeamId: currentTeam.id,
      voterTeamName: currentTeam.name,
      targetTeamId: target.id,
      targetTeamName: target.name
    });
    setTimeout(() => setIsSubmitting(false), 300);
  };

  const eliminatedTeam = voteSession.eliminatedTeamId 
    ? teams.find(t => t.id === voteSession.eliminatedTeamId) 
    : null;

  return (
    <div className="w-full space-y-4">
      {/* Header card */}
      <div className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-b from-[#1f1926] to-[#0e0d14] p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-3 mb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">
              Slottets Rundbord
            </span>
            <h2 className="text-xl font-black font-gothic text-white">
              {voteSession.title}
            </h2>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-[#9e9585] block">Afgivne Stemmer</span>
            <span className="text-sm font-black text-[#f6db7e]">
              {totalVotesCast} / {livingTeams.length}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#c5bca8] leading-relaxed">
          {voteSession.isActive ? (
            'Afstemningen er i fuld gang! Stemmeafgivelsen er åben og transparent. Alle deltagere kan se hvem du peger på i realtid.'
          ) : voteSession.isConcluded ? (
            'Rundbordsafstemningen er afsluttet.'
          ) : (
            'Værterne har ikke åbnet for stemmeafgivelse endnu. Vær klar når klokken ringer!'
          )}
        </p>
      </div>

      {/* Concluded Result Card */}
      {voteSession.isConcluded && eliminatedTeam && (
        <div className="p-5 rounded-2xl border-2 border-[#c41e3a] bg-gradient-to-b from-[#380a10] to-[#140508] crimson-glow text-center">
          <div className="w-14 h-14 rounded-full bg-[#520d17] border border-[#c41e3a] flex items-center justify-center text-[#ff4d6d] mx-auto mb-2 shadow-lg">
            <Skull className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#ff8095]">
            Forvist af Slottets Råd
          </span>
          <h3 className="text-2xl font-black font-gothic text-white mt-1">
            {eliminatedTeam.name}
          </h3>
          <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-black/60 border border-[#d4af37]/40 text-xs font-black text-[#f6db7e]">
            Afsløret Rolle: {eliminatedTeam.role === 'traitor' ? '🗡️ FORRÆDER' : '🛡️ LOYAL'}
          </div>
        </div>
      )}

      {/* My Vote Selection (If voter is alive and voting is active) */}
      {voteSession.isActive && currentTeam && currentTeam.isAlive && (
        <div className="rounded-2xl border border-[#d4af37]/40 bg-[#16141e] p-4 shadow-md">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#d4af37] mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#d4af37]" />
            Afgiv eller Ændr Din Stemme
          </h3>
          <p className="text-[11px] text-[#9e9585] mb-3">
            Vælg det hold, du ønsker forvist fra slottet:
          </p>

          <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
            {livingTeams.map((team) => {
              const isSelected = myVote?.targetTeamId === team.id;
              const isSelf = team.id === currentTeam.id;

              return (
                <button
                  key={team.id}
                  onClick={() => handleCastVote(team.id)}
                  disabled={isSelf}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#380a10] border-[#ff3855] text-white shadow-md'
                      : isSelf
                      ? 'opacity-40 bg-black/20 border-white/5 cursor-not-allowed text-[#9e9585]'
                      : 'bg-[#1e1b26] border-white/10 hover:border-[#d4af37]/50 text-[#e6dfd1]'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-bold block truncate">
                      {team.name} {isSelf && '(Dit eget hold)'}
                    </span>
                    <span className="text-[10px] text-[#9e9585]">
                      {team.players.join(' & ')}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-[11px] font-black text-[#ff8095] shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valgt</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Vote Tally & Who Voted For Whom (Non-anonymous!) */}
      <div className="rounded-2xl border border-white/10 bg-[#121118] p-4 shadow-md">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#f6db7e] mb-3 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-[#f6db7e]" />
          Live Stemmetavle (Gennemsigtig Tælling)
        </h3>

        <div className="space-y-3">
          {livingTeams.map((team) => {
            const count = voteCounts[team.id] || 0;
            const voters = votersForTeam[team.id] || [];
            const percentage = livingTeams.length > 0 ? (count / livingTeams.length) * 100 : 0;

            return (
              <div
                key={team.id}
                className={`p-3 rounded-xl border transition-colors ${
                  count > 0 ? 'bg-[#1b1722] border-[#d4af37]/30' : 'bg-black/20 border-white/5 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white truncate max-w-[200px]">
                    {team.name}
                  </span>
                  <span className="text-xs font-black text-[#f6db7e] shrink-0">
                    {count} {count === 1 ? 'stemme' : 'stemmer'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-[#d4af37] to-[#ff3855] transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Who Voted Badge List */}
                {voters.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[10px] text-[#9e9585] mr-1">Stemmer fra:</span>
                    {voters.map((voter, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#380a10]/80 border border-[#c41e3a]/40 text-[#fce8e8]"
                      >
                        {voter}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
