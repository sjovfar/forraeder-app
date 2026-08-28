import React, { useState } from 'react';
import { GameState, Team, UserSession } from '../types';
import { RoleSealModal } from './RoleSealModal';
import { VotingRoom } from './VotingRoom';
import { TraitorConclave } from './TraitorConclave';
import { PartnerSwapModal } from './PartnerSwapModal';
import { DetectiveNotesModal } from './DetectiveNotesModal';
import {
  Shield,
  Skull,
  Users,
  Vote,
  ArrowRightLeft,
  Eye,
  LogOut,
  Sparkles,
  Lock,
  Flame,
  CheckCircle2,
  BookOpen,
  Coins,
  ShieldCheck
} from 'lucide-react';

interface ParticipantDashboardProps {
  session: UserSession;
  gameState: GameState;
  onLogout: () => void;
}

export const ParticipantDashboard: React.FC<ParticipantDashboardProps> = ({
  session,
  gameState,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vote' | 'conclave' | 'swap'>('overview');
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [showNotesModal, setShowNotesModal] = useState<boolean>(false);
  const [overviewFilter, setOverviewFilter] = useState<'all' | 'alive' | 'dead'>('all');

  const currentTeam = gameState.teams.find(t => t.id === session.id) || null;
  const isTraitor = currentTeam?.role === 'traitor';
  const isAlive = currentTeam?.isAlive ?? true;
  const hasShield = currentTeam?.hasShield ?? false;

  const livingTeams = gameState.teams.filter(t => t.isAlive);
  const deadTeams = gameState.teams.filter(t => !t.isAlive);

  const filteredTeams = gameState.teams.filter(t => {
    if (overviewFilter === 'alive') return t.isAlive;
    if (overviewFilter === 'dead') return !t.isAlive;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col justify-between castle-gradient-bg pb-24 text-[#e6dfd1] antialiased">
      {/* Role Reveal Modal */}
      {showRoleModal && currentTeam && (
        <RoleSealModal
          role={currentTeam.role}
          teamName={currentTeam.name}
          onClose={() => setShowRoleModal(false)}
        />
      )}

      {/* Detective Notes Modal */}
      {showNotesModal && currentTeam && (
        <DetectiveNotesModal
          teams={gameState.teams}
          currentTeam={currentTeam}
          onClose={() => setShowNotesModal(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="w-full max-w-md mx-auto p-4 space-y-4 pt-safe">
        {/* Treasury Prize Pool Bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#2a2010] via-[#1a140d] to-[#2a2010] border border-[#d4af37]/40 shadow-lg">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#f6db7e] animate-pulse" />
            <div>
              <span className="text-[9px] uppercase font-black tracking-widest text-[#d4af37] block">
                Slottets Skatkammer
              </span>
              <span className="text-xs font-black text-white">
                {gameState.silverBars} Sølvbarrer indsamlet
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowNotesModal(true)}
            className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/15 text-xs font-bold text-[#f6db7e] hover:border-[#d4af37] flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Noter 📝</span>
          </button>
        </div>

        {/* Top Status Header */}
        <div className="castle-card rounded-3xl p-4 border border-[#d4af37]/35 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full wax-seal flex items-center justify-center text-sm shadow-md">
                🗡️
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37] block">
                  Slottets Deltager
                </span>
                <h1 className="text-sm sm:text-base font-black font-gothic text-white truncate max-w-[190px]">
                  {currentTeam ? currentTeam.name : session.name}
                </h1>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-black/40 text-[#9e9585] hover:text-white border border-white/5 transition-colors"
              title="Log ud"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                  isAlive
                    ? 'bg-green-950/80 text-green-400 border border-green-700/50 shadow-sm'
                    : 'bg-red-950/90 text-red-400 border border-red-700/60 animate-pulse'
                }`}
              >
                {isAlive ? '🟢 Levende' : '☠️ Elimineret'}
              </span>

              {/* Shield Badge */}
              {hasShield && isAlive && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#3d2e0a] border border-[#d4af37] text-[#f6db7e] flex items-center gap-1 shadow-md animate-pulse">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#f6db7e]" />
                  <span>Skjold</span>
                </span>
              )}
            </div>

            {/* Secret role button */}
            <button
              onClick={() => setShowRoleModal(true)}
              className="px-3.5 py-1.5 rounded-xl btn-dark border border-[#d4af37]/40 text-xs font-bold text-[#f6db7e] flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Hemmelig Rolle</span>
            </button>
          </div>
        </div>

        {/* Dynamic Contextual Action Banner */}
        {gameState.voteSession.isActive && activeTab !== 'vote' && (
          <button
            onClick={() => setActiveTab('vote')}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#380a10] via-[#520d17] to-[#380a10] border-2 border-[#ff3855] text-white flex items-center justify-between shadow-xl animate-pulse-intense cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#c41e3a] text-white shadow-md">
                <Vote className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xs font-black block">RUNDBORDET ER SAMLET!</span>
                <span className="text-[10px] text-[#ff8095]">Tryk her for at afgive din stemme nu</span>
              </div>
            </div>
            <span className="text-xs font-black text-[#f6db7e] bg-black/40 px-2.5 py-1 rounded-lg">Gå til &rarr;</span>
          </button>
        )}

        {gameState.partnerSwap.isActive && !gameState.partnerSwap.winnerTeamId && activeTab !== 'swap' && (
          <button
            onClick={() => setActiveTab('swap')}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#2a2416] via-[#4a3b16] to-[#2a2416] border-2 border-[#d4af37] text-white flex items-center justify-between shadow-xl animate-pulse-intense cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#d4af37] text-black shadow-md">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xs font-black block text-[#f6db7e]">PARTNERBYTTE AKTIVERET!</span>
                <span className="text-[10px] text-[#e6dfd1]">Tiden rinder ud – Først på knappen vinder</span>
              </div>
            </div>
            <span className="text-xs font-black text-black bg-[#d4af37] px-2.5 py-1 rounded-lg">Tryk her &rarr;</span>
          </button>
        )}

        {/* ========================================================= */}
        {/* TAB: CASTLE OVERVIEW (DELTAGERREGISTER)                  */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-xs font-black font-gothic text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#d4af37]" />
                Deltagerregister
              </h2>

              <div className="flex gap-1 text-[10px]">
                <button
                  onClick={() => setOverviewFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    overviewFilter === 'all'
                      ? 'bg-[#d4af37] text-black shadow-sm'
                      : 'bg-black/40 text-[#9e9585]'
                  }`}
                >
                  Alle ({gameState.teams.length})
                </button>
                <button
                  onClick={() => setOverviewFilter('alive')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    overviewFilter === 'alive'
                      ? 'bg-green-700 text-white shadow-sm'
                      : 'bg-black/40 text-[#9e9585]'
                  }`}
                >
                  Levende ({livingTeams.length})
                </button>
                <button
                  onClick={() => setOverviewFilter('dead')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    overviewFilter === 'dead'
                      ? 'bg-red-800 text-white shadow-sm'
                      : 'bg-black/40 text-[#9e9585]'
                  }`}
                >
                  Døde ({deadTeams.length})
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {filteredTeams.map((team, idx) => {
                const isMe = currentTeam && team.id === currentTeam.id;
                const firstNames = team.players.map(p => p.trim().split(' ')[0]).join(' & ');

                return (
                  <div
                    key={team.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isMe
                        ? 'bg-gradient-to-r from-[#2a2012] to-[#1a1622] border-[#d4af37] shadow-md'
                        : team.isAlive
                        ? 'bg-[#15131c] border-white/10'
                        : 'bg-[#180a0e] border-red-950/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-black truncate ${team.isAlive ? 'text-white' : 'text-gray-400 line-through'}`}>
                            {firstNames}
                          </span>
                          {isMe && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#d4af37] text-black">
                              DIG
                            </span>
                          )}
                          {team.hasShield && team.isAlive && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#3d2e0a] text-[#f6db7e] border border-[#d4af37]/40">
                              🛡️ Skjold
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#9e9585] block truncate mt-0.5">
                          {team.name}
                        </span>
                      </div>

                      <div className="shrink-0 text-right">
                        {team.isAlive ? (
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-green-950/70 border border-green-700/40 text-green-400">
                            Levende
                          </span>
                        ) : (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-950 border border-red-800 text-red-400">
                              ☠️ Død
                            </span>
                            {team.roleRevealed && (
                              <span className="text-[9px] font-bold text-[#f6db7e]">
                                {team.role === 'traitor' ? '🗡️ Forræder' : '🛡️ Loyal'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: VOTING */}
        {activeTab === 'vote' && (
          <VotingRoom
            voteSession={gameState.voteSession}
            teams={gameState.teams}
            currentTeam={currentTeam}
            isAdmin={false}
          />
        )}

        {/* TAB: TRAITOR CONCLAVE */}
        {activeTab === 'conclave' && (
          isTraitor ? (
            <TraitorConclave
              traitorChat={gameState.traitorChat}
              murderProposals={gameState.murderProposals}
              teams={gameState.teams}
              currentTeam={currentTeam}
              isAdmin={false}
            />
          ) : (
            <div className="rounded-3xl border border-red-950/80 bg-gradient-to-b from-[#1c080c] to-[#0d0406] p-8 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-black/60 border border-red-900/50 flex items-center justify-center text-red-500 mx-auto mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black font-gothic text-white mb-2">
                Adgang Nægtet: Forrædernes Kammer
              </h3>
              <p className="text-xs text-[#9e9585] max-w-xs mx-auto leading-relaxed">
                Kun de hemmeligt udvalgte forrædere har nøglen til dette mørke rum. De loyale må blive i riddersalen.
              </p>
            </div>
          )
        )}

        {/* TAB: PARTNER SWAP */}
        {activeTab === 'swap' && (
          <PartnerSwapModal
            partnerSwap={gameState.partnerSwap}
            currentTeam={currentTeam}
            isAdmin={false}
          />
        )}
      </div>

      {/* Bottom Fixed Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0e0d14]/95 backdrop-blur-lg border-t border-[#d4af37]/25 px-2 py-2 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'overview' ? 'text-[#d4af37]' : 'text-[#9e9585] hover:text-[#e6dfd1]'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Oversigt</span>
          </button>

          <button
            onClick={() => setActiveTab('vote')}
            className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'vote' ? 'text-[#d4af37]' : 'text-[#9e9585] hover:text-[#e6dfd1]'
            }`}
          >
            <Vote className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Rundbord</span>
            {gameState.voteSession.isActive && (
              <span className="absolute top-1 right-2 w-2.5 h-2.5 rounded-full bg-[#ff3855] animate-ping" />
            )}
          </button>

          {isTraitor && (
            <button
              onClick={() => setActiveTab('conclave')}
              className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'conclave' ? 'text-[#ff3855]' : 'text-[#9e9585] hover:text-[#ff8095]'
              }`}
            >
              <Skull className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Mordstue</span>
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#ff3855]" />
            </button>
          )}

          <button
            onClick={() => setActiveTab('swap')}
            className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'swap' ? 'text-[#d4af37]' : 'text-[#9e9585] hover:text-[#e6dfd1]'
            }`}
          >
            <ArrowRightLeft className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Partnerbytte</span>
            {gameState.partnerSwap.isActive && !gameState.partnerSwap.winnerTeamId && (
              <span className="absolute top-1 right-2 w-2.5 h-2.5 rounded-full bg-[#f6db7e] animate-ping" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
