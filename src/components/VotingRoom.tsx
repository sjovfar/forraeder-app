import React, { useState } from 'react';
import { VoteSession, Team, VoteRecord } from '../types';
import { socket } from '../socket';
import { soundEngine } from '../soundEngine';
import { 
  CheckCircle2, 
  Users, 
  Flame, 
  Skull, 
  ShieldAlert, 
  X, 
  AlertTriangle,
  Sparkles,
  Trophy
} from 'lucide-react';

interface VotingRoomProps {
  voteSession: VoteSession;
  teams: Team[];
  currentTeam: Team | null;
  isAdmin: boolean;
}

// Helper to extract clean first names (e.g. "Nicolai & Tobias")
function getTeamFirstNames(team: Team): string {
  if (!team.players || team.players.length === 0) {
    return team.name.split('/')[0].trim();
  }
  return team.players.map(p => p.trim().split(' ')[0]).join(' & ');
}

export const VotingRoom: React.FC<VotingRoomProps> = ({
  voteSession,
  teams,
  currentTeam,
  isAdmin
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
  const [confirmTargetTeam, setConfirmTargetTeam] = useState<Team | null>(null);

  const livingTeams = teams.filter(t => t.isAlive);
  const totalVotesCast = Object.keys(voteSession.votes || {}).length;
  const myVote = currentTeam ? voteSession.votes?.[currentTeam.id] : null;

  // Calculate votes counts per team and find leader
  const voteCounts: Record<string, number> = {};
  const votersForTeam: Record<string, string[]> = {};
  let highestVoteCount = 0;
  let leaderTeamId: string | null = null;

  Object.values(voteSession.votes || {}).forEach((v: VoteRecord) => {
    voteCounts[v.targetTeamId] = (voteCounts[v.targetTeamId] || 0) + 1;
    if (!votersForTeam[v.targetTeamId]) {
      votersForTeam[v.targetTeamId] = [];
    }
    votersForTeam[v.targetTeamId].push(v.voterTeamName);

    if (voteCounts[v.targetTeamId] > highestVoteCount) {
      highestVoteCount = voteCounts[v.targetTeamId];
      leaderTeamId = v.targetTeamId;
    }
  });

  const handleOpenConfirm = (team: Team) => {
    if (!currentTeam || !currentTeam.isAlive || !voteSession.isActive) return;
    if (team.id === currentTeam.id) return; // Cannot vote for yourself
    if (!team.isAlive) return;

    soundEngine.playTick();
    if ('vibrate' in navigator) {
      try { navigator.vibrate(30); } catch {}
    }
    setConfirmTargetTeam(team);
  };

  const handleExecuteVote = () => {
    if (!confirmTargetTeam || !currentTeam) return;

    soundEngine.playHeartbeat(3);
    if ('vibrate' in navigator) {
      try { navigator.vibrate([40, 60, 80]); } catch {}
    }

    socket.emit('vote:cast', {
      voterTeamId: currentTeam.id,
      voterTeamName: currentTeam.name,
      targetTeamId: confirmTargetTeam.id,
      targetTeamName: confirmTargetTeam.name
    });

    setConfirmTargetTeam(null);
  };

  const eliminatedTeam = voteSession.eliminatedTeamId 
    ? teams.find(t => t.id === voteSession.eliminatedTeamId) 
    : null;

  // 14 seat positions calculation for the circular roundtable (SVG dimensions: 580 x 580)
  const centerX = 290;
  const centerY = 290;
  const tableRadius = 145;
  const seatRadius = 205;
  const labelRadius = 245;
  const numSeats = teams.length;

  const seatCoordinates = teams.map((team, idx) => {
    const angle = ((idx * (360 / numSeats)) - 90) * (Math.PI / 180);
    const x = centerX + seatRadius * Math.cos(angle);
    const y = centerY + seatRadius * Math.sin(angle);
    const tableEdgeX = centerX + tableRadius * Math.cos(angle);
    const tableEdgeY = centerY + tableRadius * Math.sin(angle);
    const labelX = centerX + labelRadius * Math.cos(angle);
    const labelY = centerY + labelRadius * Math.sin(angle);

    const firstNames = getTeamFirstNames(team);

    return {
      team,
      idx,
      x,
      y,
      tableEdgeX,
      tableEdgeY,
      labelX,
      labelY,
      angle,
      firstNames
    };
  });

  return (
    <div className="w-full space-y-4">
      {/* Header card with gothic flame & stats */}
      <div className="rounded-3xl border border-[#d4af37]/40 bg-gradient-to-b from-[#241a2a] via-[#14101b] to-[#0a090e] p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8c1424] to-[#4a050d] border border-[#ff3855]/60 flex items-center justify-center text-[#f6db7e] shadow-lg">
              <Flame className="w-6 h-6 text-[#ff6b81] animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37] block">
                Det Hellige Råd
              </span>
              <h2 className="text-lg sm:text-xl font-black font-gothic text-white">
                {voteSession.title}
              </h2>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                viewMode === 'table'
                  ? 'bg-[#d4af37] text-black shadow-md'
                  : 'text-[#9e9585] hover:text-white'
              }`}
            >
              🏰 Bord
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                viewMode === 'list'
                  ? 'bg-[#d4af37] text-black shadow-md'
                  : 'text-[#9e9585] hover:text-white'
              }`}
            >
              📋 Liste
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#c5bca8]">
          <span className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${voteSession.isActive ? 'bg-red-500 animate-ping' : 'bg-gray-500'}`} />
            {voteSession.isActive ? 'Afstemning i gang • Åben stemmeafgivelse' : 'Rundbordet er i dvale'}
          </span>
          <span className="font-bold text-[#f6db7e]">
            {totalVotesCast} / {livingTeams.length} har stemt
          </span>
        </div>
      </div>

      {/* Concluded Result Card */}
      {voteSession.isConcluded && eliminatedTeam && (
        <div className="p-5 rounded-3xl border-2 border-[#c41e3a] bg-gradient-to-b from-[#380a10] to-[#140508] crimson-glow text-center animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-[#520d17] border-2 border-[#ff3855] flex items-center justify-center text-[#ff4d6d] mx-auto mb-2 shadow-2xl animate-pulse">
            <Skull className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#ff8095]">
            Forvist af Slottets Råd
          </span>
          <h3 className="text-2xl font-black font-gothic text-white mt-1">
            {eliminatedTeam.name}
          </h3>
          <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-black/70 border border-[#d4af37] text-xs font-black text-[#f6db7e] shadow-md">
            Afsløret Sandhed: {eliminatedTeam.role === 'traitor' ? '🗡️ FORRÆDER' : '🛡️ LOYAL'}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 🏰 VIEW 1: CIRCULAR ROUNDTABLE (RIDDERSALENS RUNDBORD)    */}
      {/* ========================================================== */}
      {viewMode === 'table' && (
        <div className="rounded-3xl border border-[#d4af37]/30 bg-gradient-to-b from-[#181322] via-[#0e0c15] to-[#07060a] p-1 sm:p-3 shadow-2xl relative overflow-hidden">
          <div className="relative w-full max-w-[520px] mx-auto aspect-square">
            <svg viewBox="0 0 580 580" className="w-full h-full select-none">
              <defs>
                <radialGradient id="tableGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3d2112" />
                  <stop offset="60%" stopColor="#24130a" />
                  <stop offset="90%" stopColor="#150a04" />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity="0.8" />
                </radialGradient>

                <radialGradient id="firePit" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ff4d4d" />
                  <stop offset="40%" stopColor="#c41e3a" />
                  <stop offset="80%" stopColor="#380a10" />
                  <stop offset="100%" stopColor="#140608" />
                </radialGradient>

                <marker
                  id="voteArrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#ff3855" />
                </marker>

                <marker
                  id="myVoteArrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f6db7e" />
                </marker>
              </defs>

              {/* Roundtable Surface */}
              <circle
                cx={centerX}
                cy={centerY}
                r={tableRadius}
                fill="url(#tableGradient)"
                stroke="#d4af37"
                strokeWidth="3.5"
                className="filter drop-shadow-2xl"
              />

              <circle
                cx={centerX}
                cy={centerY}
                r={tableRadius - 15}
                fill="none"
                stroke="#d4af37"
                strokeWidth="1"
                strokeDasharray="4 6"
                opacity="0.5"
              />

              {/* Center Fire Pit */}
              <circle
                cx={centerX}
                cy={centerY}
                r="46"
                fill="url(#firePit)"
                stroke="#ff3855"
                strokeWidth="2"
                className="animate-pulse"
              />

              <g className="pointer-events-none">
                <text
                  x={centerX}
                  y={centerY - 10}
                  textAnchor="middle"
                  fill="#f6db7e"
                  fontSize="16"
                  fontWeight="900"
                  className="font-gothic"
                >
                  🗡️ RÅDET
                </text>
                <text
                  x={centerX}
                  y={centerY + 12}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="800"
                >
                  {totalVotesCast} / {livingTeams.length}
                </text>
                <text
                  x={centerX}
                  y={centerY + 25}
                  textAnchor="middle"
                  fill="#ff8095"
                  fontSize="9"
                  fontWeight="700"
                  letterSpacing="0.05em"
                >
                  STEMMER
                </text>
              </g>

              {/* VOTE BEAMS */}
              {Object.values(voteSession.votes || {}).map((vote: VoteRecord) => {
                const voterSeat = seatCoordinates.find(s => s.team.id === vote.voterTeamId);
                const targetSeat = seatCoordinates.find(s => s.team.id === vote.targetTeamId);
                if (!voterSeat || !targetSeat) return null;

                const isMyVote = currentTeam && vote.voterTeamId === currentTeam.id;

                return (
                  <g key={`${vote.voterTeamId}-${vote.targetTeamId}`}>
                    <line
                      x1={voterSeat.tableEdgeX}
                      y1={voterSeat.tableEdgeY}
                      x2={targetSeat.tableEdgeX}
                      y2={targetSeat.tableEdgeY}
                      stroke={isMyVote ? '#f6db7e' : '#ff3855'}
                      strokeWidth={isMyVote ? '3.2' : '1.8'}
                      strokeOpacity={isMyVote ? '1' : '0.65'}
                      strokeDasharray={isMyVote ? 'none' : '4 3'}
                      markerEnd={isMyVote ? 'url(#myVoteArrow)' : 'url(#voteArrow)'}
                    />
                  </g>
                );
              })}

              {/* 14 SEATS AROUND THE TABLE */}
              {seatCoordinates.map(({ team, idx, x, y, labelX, labelY, firstNames }) => {
                const count = voteCounts[team.id] || 0;
                const isSelected = myVote?.targetTeamId === team.id;
                const isMe = currentTeam && team.id === currentTeam.id;
                const isLeader = leaderTeamId === team.id && count > 1;

                const seatR = isMe ? 22 : 18;

                return (
                  <g
                    key={team.id}
                    className="cursor-pointer transition-transform duration-200"
                    onClick={() => handleOpenConfirm(team)}
                  >
                    {/* Active Selection Ring */}
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r={seatR + 8}
                        fill="none"
                        stroke="#ff3855"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                        className="animate-spin"
                        style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '6s' }}
                      />
                    )}

                    {/* Seat Circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={seatR}
                      fill={
                        !team.isAlive
                          ? '#1c090c'
                          : isMe
                          ? '#3d2e0a'
                          : isSelected
                          ? '#4a0d15'
                          : '#171420'
                      }
                      stroke={
                        !team.isAlive
                          ? '#521017'
                          : isMe
                          ? '#f6db7e'
                          : isSelected
                          ? '#ff3855'
                          : count > 0
                          ? '#d4af37'
                          : 'rgba(255,255,255,0.2)'
                      }
                      strokeWidth={isMe || isSelected ? '3' : '1.5'}
                      className="filter drop-shadow-md"
                    />

                    {/* Number / Label */}
                    <text
                      x={x}
                      y={y + 4}
                      textAnchor="middle"
                      fill={
                        !team.isAlive
                          ? '#7a2228'
                          : isMe
                          ? '#f6db7e'
                          : isSelected
                          ? '#ff6b81'
                          : '#e6dfd1'
                      }
                      fontSize={isMe ? '11' : '10'}
                      fontWeight="900"
                    >
                      {!team.isAlive ? '☠️' : isMe ? 'DIG' : `${idx + 1}`}
                    </text>

                    {/* First Names Label */}
                    <text
                      x={labelX}
                      y={labelY + 3}
                      textAnchor="middle"
                      fill={
                        !team.isAlive
                          ? '#662226'
                          : isMe
                          ? '#f6db7e'
                          : isSelected
                          ? '#ff8095'
                          : count > 0
                          ? '#fce8e8'
                          : '#a89f8d'
                      }
                      fontSize="9"
                      fontWeight="800"
                      className="tracking-tight"
                      style={{
                        paintOrder: 'stroke',
                        stroke: '#08070b',
                        strokeWidth: '2.8px',
                        strokeLinejoin: 'round'
                      }}
                    >
                      {firstNames}
                    </text>

                    {/* Vote Count Badge */}
                    {count > 0 && (
                      <g transform={`translate(${x + 11}, ${y - 12})`}>
                        <circle
                          cx="0"
                          cy="0"
                          r="9"
                          fill={isLeader ? '#ff3855' : '#c41e3a'}
                          stroke="#ffffff"
                          strokeWidth="1.2"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="900"
                        >
                          {count}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-1 text-center text-[11px] text-[#9e9585]">
            💡 <strong className="text-[#f6db7e]">Tip:</strong> Tryk på en stol for at stemme på holdet.
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 📋 VIEW 2: LIST VIEW                                      */}
      {/* ========================================================== */}
      {viewMode === 'list' && (
        <div className="rounded-3xl border border-white/10 bg-[#121118] p-4 space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#f6db7e] mb-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#f6db7e]" />
            Åben Stemmetavle
          </h3>

          {livingTeams.map((team) => {
            const count = voteCounts[team.id] || 0;
            const voters = votersForTeam[team.id] || [];
            const percentage = livingTeams.length > 0 ? (count / livingTeams.length) * 100 : 0;
            const isMe = currentTeam && team.id === currentTeam.id;

            return (
              <div
                key={team.id}
                onClick={() => handleOpenConfirm(team)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  count > 0
                    ? 'bg-[#1e1724] border-[#d4af37]/40'
                    : 'bg-black/20 border-white/5 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white truncate max-w-[200px]">
                    {team.name} {isMe && '(Dig)'}
                  </span>
                  <span className="text-xs font-black text-[#f6db7e]">
                    {count} {count === 1 ? 'stemme' : 'stemmer'}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#d4af37] to-[#ff3855] transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {voters.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[9px] text-[#9e9585]">Stemmer fra:</span>
                    {voters.map((voter, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#380a10] border border-[#c41e3a]/50 text-[#fce8e8]"
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
      )}

      {/* ========================================================== */}
      {/* 🛑 CONFIRMATION BOTTOM SHEET MODAL                         */}
      {/* ========================================================== */}
      {confirmTargetTeam && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-5 rounded-3xl border-2 border-[#ff3855] bg-gradient-to-b from-[#2a090e] to-[#120508] shadow-2xl text-center crimson-glow animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-[#520d17] border border-[#ff3855] flex items-center justify-center text-[#ff4d6d] mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-[#ff8095]">
              Bekræft Forvisnings-Stemme
            </span>

            <h3 className="text-lg font-black font-gothic text-white mt-1 mb-1">
              {confirmTargetTeam.name}
            </h3>

            <p className="text-xs text-[#e6dfd1]/80 max-w-xs mx-auto mb-4">
              Er du sikker på, at du vil pege på dette hold til forvisning fra slottet?
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setConfirmTargetTeam(null)}
                className="flex-1 py-3 rounded-xl bg-black/60 border border-white/20 text-xs font-bold text-[#c5bca8] hover:text-white"
              >
                Annuller
              </button>
              <button
                onClick={handleExecuteVote}
                className="flex-1 py-3 rounded-xl btn-crimson text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Bekræft Min Stemme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
