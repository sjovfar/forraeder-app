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
  Eye, 
  RotateCw, 
  ListFilter,
  Sparkles,
  HeartCrack
} from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [inspectSeatId, setInspectSeatId] = useState<string | null>(null);

  const livingTeams = teams.filter(t => t.isAlive);
  const totalVotesCast = Object.keys(voteSession.votes || {}).length;
  const myVote = currentTeam ? voteSession.votes?.[currentTeam.id] : null;

  // Calculate votes counts per team
  const voteCounts: Record<string, number> = {};
  const votersForTeam: Record<string, string[]> = {};

  Object.values(voteSession.votes || {}).forEach((v: VoteRecord) => {
    voteCounts[v.targetTeamId] = (voteCounts[v.targetTeamId] || 0) + 1;
    if (!votersForTeam[v.targetTeamId]) {
      votersForTeam[v.targetTeamId] = [];
    }
    votersForTeam[v.targetTeamId].push(v.voterTeamName);
  });

  const handleCastVote = (targetId: string) => {
    if (!currentTeam || !currentTeam.isAlive || !voteSession.isActive) return;
    if (targetId === currentTeam.id) return; // Cannot vote for yourself

    const target = teams.find(t => t.id === targetId);
    if (!target || !target.isAlive) return;

    soundEngine.playHeartbeat(3);
    socket.emit('vote:cast', {
      voterTeamId: currentTeam.id,
      voterTeamName: currentTeam.name,
      targetTeamId: target.id,
      targetTeamName: target.name
    });
    setSelectedTargetId(target.id);
  };

  const eliminatedTeam = voteSession.eliminatedTeamId 
    ? teams.find(t => t.id === voteSession.eliminatedTeamId) 
    : null;

  // 14 seat positions calculation for the circular roundtable (SVG coordinates: center 250, 250, radius 180)
  const centerX = 250;
  const centerY = 250;
  const tableRadius = 135;
  const seatRadius = 188;
  const numSeats = teams.length;

  const seatCoordinates = teams.map((team, idx) => {
    // Start from top (-90 deg) and distribute clockwise
    const angle = ((idx * (360 / numSeats)) - 90) * (Math.PI / 180);
    const x = centerX + seatRadius * Math.cos(angle);
    const y = centerY + seatRadius * Math.sin(angle);
    const tableEdgeX = centerX + tableRadius * Math.cos(angle);
    const tableEdgeY = centerY + tableRadius * Math.sin(angle);

    return {
      team,
      idx,
      x,
      y,
      tableEdgeX,
      tableEdgeY,
      angle
    };
  });

  return (
    <div className="w-full space-y-4">
      {/* Header card with gothic flame & stats */}
      <div className="rounded-2xl border border-[#d4af37]/40 bg-gradient-to-b from-[#241a2a] via-[#14101b] to-[#0a090e] p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8c1424] to-[#4a050d] border border-[#ff3855]/60 flex items-center justify-center text-[#f6db7e] shadow-lg">
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
              🏰 Rundbord
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
            <span className={`w-2 h-2 rounded-full ${voteSession.isActive ? 'bg-red-500 animate-ping' : 'bg-gray-500'}`} />
            {voteSession.isActive ? 'Afstemning i gang • Stemmer er åbne' : 'Rundbordet er i dvale'}
          </span>
          <span className="font-bold text-[#f6db7e]">
            {totalVotesCast} / {livingTeams.length} har stemt
          </span>
        </div>
      </div>

      {/* Concluded Result Card */}
      {voteSession.isConcluded && eliminatedTeam && (
        <div className="p-5 rounded-2xl border-2 border-[#c41e3a] bg-gradient-to-b from-[#380a10] to-[#140508] crimson-glow text-center animate-scale-up">
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
        <div className="rounded-3xl border border-[#d4af37]/30 bg-gradient-to-b from-[#181322] via-[#0e0c15] to-[#07060a] p-2 sm:p-4 shadow-2xl relative overflow-hidden">
          {/* Ambient castle glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)] pointer-events-none" />

          {/* SVG Circular Stage */}
          <div className="relative w-full max-w-[460px] mx-auto aspect-square">
            <svg
              viewBox="0 0 500 500"
              className="w-full h-full select-none"
            >
              <defs>
                {/* Wood table radial gradient */}
                <radialGradient id="tableGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3d2112" />
                  <stop offset="60%" stopColor="#24130a" />
                  <stop offset="90%" stopColor="#150a04" />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity="0.8" />
                </radialGradient>

                {/* Center Fire Pit Gradient */}
                <radialGradient id="firePit" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ff4d4d" />
                  <stop offset="40%" stopColor="#c41e3a" />
                  <stop offset="80%" stopColor="#380a10" />
                  <stop offset="100%" stopColor="#140608" />
                </radialGradient>

                {/* Arrow markers for vote beams */}
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

              {/* Grand Wood Roundtable Surface */}
              <circle
                cx={centerX}
                cy={centerY}
                r={tableRadius}
                fill="url(#tableGradient)"
                stroke="#d4af37"
                strokeWidth="3.5"
                className="filter drop-shadow-2xl"
              />

              {/* Table Inner Ring with Gold Runes */}
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
                r="45"
                fill="url(#firePit)"
                stroke="#ff3855"
                strokeWidth="2"
                className="animate-pulse"
              />

              {/* Center Table Crest & Info */}
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

              {/* ====================================================== */}
              {/* VOTE BEAMS (Lines connecting voters to their targets) */}
              {/* ====================================================== */}
              {Object.values(voteSession.votes || {}).map((vote: VoteRecord) => {
                const voterSeat = seatCoordinates.find(s => s.team.id === vote.voterTeamId);
                const targetSeat = seatCoordinates.find(s => s.team.id === vote.targetTeamId);
                if (!voterSeat || !targetSeat) return null;

                const isMyVote = currentTeam && vote.voterTeamId === currentTeam.id;

                return (
                  <g key={`${vote.voterTeamId}-${vote.targetTeamId}`}>
                    {/* Beam glow */}
                    <line
                      x1={voterSeat.tableEdgeX}
                      y1={voterSeat.tableEdgeY}
                      x2={targetSeat.tableEdgeX}
                      y2={targetSeat.tableEdgeY}
                      stroke={isMyVote ? '#f6db7e' : '#ff3855'}
                      strokeWidth={isMyVote ? '3' : '1.8'}
                      strokeOpacity={isMyVote ? '0.95' : '0.65'}
                      strokeDasharray={isMyVote ? 'none' : '4 3'}
                      markerEnd={isMyVote ? 'url(#myVoteArrow)' : 'url(#voteArrow)'}
                    />
                  </g>
                );
              })}

              {/* ====================================================== */}
              {/* 14 SEATS AROUND THE ROUNDTABLE                         */}
              {/* ====================================================== */}
              {seatCoordinates.map(({ team, idx, x, y }) => {
                const count = voteCounts[team.id] || 0;
                const isSelected = myVote?.targetTeamId === team.id;
                const isMe = currentTeam && team.id === currentTeam.id;
                const isInspected = inspectSeatId === team.id;

                // Seat dimensions
                const seatR = isMe ? 22 : 18;

                return (
                  <g
                    key={team.id}
                    className="cursor-pointer transition-transform duration-200 hover:scale-110"
                    onClick={() => {
                      setInspectSeatId(team.id);
                      if (voteSession.isActive && currentTeam && currentTeam.isAlive && !isMe) {
                        handleCastVote(team.id);
                      }
                    }}
                  >
                    {/* Pulsing selection aura */}
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

                    {/* Seat circle */}
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

                    {/* Seat Label (Team Number or Icon) */}
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
                      fontSize={isMe ? '12' : '10'}
                      fontWeight="900"
                    >
                      {!team.isAlive ? '☠️' : isMe ? 'DIG' : `${idx + 1}`}
                    </text>

                    {/* Vote Count Badge on Seat (if targeted) */}
                    {count > 0 && (
                      <g transform={`translate(${x + 10}, ${y - 12})`}>
                        <circle
                          cx="0"
                          cy="0"
                          r="9"
                          fill="#c41e3a"
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

          {/* Helper caption below table */}
          <div className="mt-2 text-center text-[11px] text-[#9e9585]">
            💡 <strong className="text-[#f6db7e]">Tip:</strong> Tryk direkte på en stol ved bordet for at pege på holdet eller se hvem der stemmer på dem!
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 📋 VIEW 2: LIST VIEW (ALTERNATIVE STEMMETAVLE)            */}
      {/* ========================================================== */}
      {viewMode === 'list' && (
        <div className="rounded-2xl border border-white/10 bg-[#121118] p-4 space-y-2">
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
                onClick={() => setInspectSeatId(team.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
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

      {/* Selected / Inspected Seat Card Drawer */}
      {inspectSeatId && (
        <div className="p-4 rounded-2xl border-2 border-[#d4af37]/60 bg-gradient-to-b from-[#201a2c] to-[#0f0e15] shadow-xl flex items-center justify-between gap-3 animate-fade-in">
          {(() => {
            const inspectedTeam = teams.find(t => t.id === inspectSeatId);
            if (!inspectedTeam) return null;
            const count = voteCounts[inspectedTeam.id] || 0;
            const voters = votersForTeam[inspectedTeam.id] || [];
            const isMe = currentTeam && inspectedTeam.id === currentTeam.id;
            const isSelected = myVote?.targetTeamId === inspectedTeam.id;

            return (
              <>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37] block">
                    Valgt Plads ved Rundbordet
                  </span>
                  <h4 className="text-sm font-black font-gothic text-white truncate">
                    {inspectedTeam.name}
                  </h4>
                  <p className="text-[11px] text-[#9e9585]">
                    {count} {count === 1 ? 'stemme modtaget' : 'stemmer modtaget'}
                    {voters.length > 0 && ` (${voters.join(', ')})`}
                  </p>
                </div>

                {voteSession.isActive && currentTeam && currentTeam.isAlive && !isMe && (
                  <button
                    onClick={() => handleCastVote(inspectedTeam.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-green-700 text-white'
                        : 'btn-crimson'
                    }`}
                  >
                    {isSelected ? '✓ Din Stemme' : 'Stem på dette hold'}
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
