import React, { useState, useEffect } from 'react';
import { GameState, Team, RoleType, EliminationReason, SoundType } from '../types';
import { socket } from '../socket';
import { soundEngine } from '../soundEngine';
import QRCode from 'qrcode';
import {
  Crown,
  Shield,
  Skull,
  Radio,
  Vote,
  ArrowRightLeft,
  QrCode,
  RotateCcw,
  Sparkles,
  Volume2,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Flame,
  UserCheck,
  Edit2
} from 'lucide-react';

interface AdminPanelProps {
  gameState: GameState;
  adminName: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ gameState, adminName }) => {
  const [activeTab, setActiveTab] = useState<
    'roles' | 'status' | 'broadcast' | 'vote' | 'murder' | 'partner' | 'qr'
  >('roles');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('Besked fra Slottets Værter');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSound, setBroadcastSound] = useState<SoundType>('bell');

  // Voting state
  const [voteTitle, setVoteTitle] = useState(`Rundbordssamling #${gameState.voteSession.roundNumber}`);
  const [eliminateHighest, setEliminateHighest] = useState(true);
  const [manualEliminateId, setManualEliminateId] = useState('');

  // Partner swap state
  const [swapPlayerToReplace, setSwapPlayerToReplace] = useState('');
  const [swapNewPlayerName, setSwapNewPlayerName] = useState('');
  const [swapFromDeadTeam, setSwapFromDeadTeam] = useState('');

  // QR code state
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>(window.location.origin);

  useEffect(() => {
    fetch('/api/info')
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          setServerUrl(data.url);
          QRCode.toDataURL(data.url, { width: 280, margin: 2 })
            .then(url => setQrDataUrl(url))
            .catch(err => console.error(err));
        }
      })
      .catch(() => {
        QRCode.toDataURL(window.location.origin, { width: 280, margin: 2 })
          .then(url => setQrDataUrl(url))
          .catch(err => console.error(err));
      });
  }, []);

  // Quick broadcast templates
  const broadcastTemplates = [
    {
      title: 'Der er sket et mord!',
      message: 'Der er fundet et lig på slottet. Alle bedes samles i slyngelstuen omgående.',
      sound: 'gong' as SoundType
    },
    {
      title: 'Rundbordssamling!',
      message: 'Det er tid til forvisning. Træd ind i Riddersalen og indtag jeres pladser.',
      sound: 'bell' as SoundType
    },
    {
      title: 'Slots-Udfordring!',
      message: 'En ny udfordring venter i slotsgården. Mød op klar til dyst.',
      sound: 'alarm' as SoundType
    },
    {
      title: 'Partnerbytte er udløst!',
      message: 'Partnerbyttet er aktiveret! Første hold på knappen vinder.',
      sound: 'victory' as SoundType
    }
  ];

  // Helper counters
  const traitorsCount = gameState.teams.filter(t => t.role === 'traitor').length;
  const loyalsCount = gameState.teams.filter(t => t.role === 'loyal').length;
  const livingTeams = gameState.teams.filter(t => t.isAlive);
  const deadTeams = gameState.teams.filter(t => !t.isAlive);
  const pendingMurders = gameState.murderProposals.filter(p => p.status === 'pending');

  const handleRandomizeRoles = () => {
    if (confirm('Er du sikker på, at du vil tildele 3 tilfældige Forrædere og 11 Loyale?')) {
      socket.emit('admin:set_roles', { randomize: true });
    }
  };

  const handleToggleRole = (teamId: string, currentRole: RoleType) => {
    const nextRole: RoleType = currentRole === 'traitor' ? 'loyal' : 'traitor';
    const assignments: Record<string, RoleType> = {};
    assignments[teamId] = nextRole;
    socket.emit('admin:set_roles', { assignments });
  };

  const handleToggleAlive = (team: Team) => {
    socket.emit('admin:set_status', {
      teamId: team.id,
      isAlive: !team.isAlive,
      reason: !team.isAlive ? 'manual' : undefined
    });
  };

  const handleSendBroadcast = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!broadcastMessage.trim()) return;

    socket.emit('admin:broadcast', {
      title: broadcastTitle.trim() || 'Slots-Besked',
      message: broadcastMessage.trim(),
      soundType: broadcastSound,
      sender: adminName
    });

    setBroadcastMessage('');
  };

  const handleStartVote = () => {
    socket.emit('admin:start_vote', {
      title: voteTitle.trim() || `Rundbordssamling #${gameState.voteSession.roundNumber}`
    });
  };

  const handleEndVote = () => {
    socket.emit('admin:end_vote', {
      eliminateHighestVoted: eliminateHighest,
      manualEliminatedTeamId: manualEliminateId || undefined
    });
    setManualEliminateId('');
  };

  const handleStartPartnerSwap = () => {
    socket.emit('admin:start_partner_swap', { durationSeconds: 150 });
  };

  const handleConfirmPartnerSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameState.partnerSwap.winnerTeamId || !swapPlayerToReplace || !swapNewPlayerName) return;

    socket.emit('admin:confirm_partner_swap', {
      winningTeamId: gameState.partnerSwap.winnerTeamId,
      playerToReplace: swapPlayerToReplace,
      newPlayerName: swapNewPlayerName,
      fromDeadTeamName: swapFromDeadTeam || 'Elimineret hold'
    });

    setSwapPlayerToReplace('');
    setSwapNewPlayerName('');
    setSwapFromDeadTeam('');
  };

  const handleResetGame = () => {
    if (confirm('ADVARSEL: Dette nulstiller hele spillet, alle stemmer, chats og roller. Er du helt sikker?')) {
      socket.emit('admin:reset_game');
    }
  };

  return (
    <div className="w-full space-y-4 pb-20">
      {/* Admin Top Banner */}
      <div className="rounded-2xl border-2 border-[#d4af37] bg-gradient-to-r from-[#2a2010] via-[#1a140d] to-[#2a2010] p-4 shadow-2xl gold-glow flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#d4af37] text-black shadow-md">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#f6db7e]">
              Værtspanel • Julius & Karoline
            </span>
            <h1 className="text-xl font-black font-gothic text-white">
              Slottets Kontrolrum
            </h1>
          </div>
        </div>

        <button
          onClick={handleResetGame}
          className="px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-[11px] font-bold hover:bg-red-900 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Nulstil Spil
        </button>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-3 py-2 rounded-xl font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 ${
            activeTab === 'roles'
              ? 'bg-[#d4af37] text-black shadow-md'
              : 'bg-[#181622] text-[#c5bca8] hover:bg-[#232030]'
          }`}
        >
          <Shield className="w-4 h-4" />
          Roller ({traitorsCount}/3)
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`px-3 py-2 rounded-xl font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 ${
            activeTab === 'status'
              ? 'bg-[#d4af37] text-black shadow-md'
              : 'bg-[#181622] text-[#c5bca8] hover:bg-[#232030]'
          }`}
        >
          <Users className="w-4 h-4" />
          Hold ({livingTeams.length} Levende)
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-3 py-2 rounded-xl font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 ${
            activeTab === 'broadcast'
              ? 'bg-[#d4af37] text-black shadow-md'
              : 'bg-[#181622] text-[#c5bca8] hover:bg-[#232030]'
          }`}
        >
          <Radio className="w-4 h-4" />
          Broadcast
        </button>

        <button
          onClick={() => setActiveTab('vote')}
          className={`px-3 py-2 rounded-xl font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 ${
            activeTab === 'vote'
              ? 'bg-[#d4af37] text-black shadow-md'
              : 'bg-[#181622] text-[#c5bca8] hover:bg-[#232030]'
          }`}
        >
          <Vote className="w-4 h-4" />
          Afstemning {gameState.voteSession.isActive && '🔴'}
        </button>

        <button
          onClick={() => setActiveTab('murder')}
          className={`relative px-3 py-2 rounded-xl font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 ${
            activeTab === 'murder'
              ? 'bg-[#d4af37] text-black shadow-md'
              : 'bg-[#181622] text-[#c5bca8] hover:bg-[#232030]'
          }`}
        >
          <Skull className="w-4 h-4" />
          Mord-anmodning
          {pendingMurders.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('partner')}
          className={`px-3 py-2 rounded-xl font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 ${
            activeTab === 'partner'
              ? 'bg-[#d4af37] text-black shadow-md'
              : 'bg-[#181622] text-[#c5bca8] hover:bg-[#232030]'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Partnerbytte
        </button>

        <button
          onClick={() => setActiveTab('qr')}
          className={`px-3 py-2 rounded-xl font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 ${
            activeTab === 'qr'
              ? 'bg-[#d4af37] text-black shadow-md'
              : 'bg-[#181622] text-[#c5bca8] hover:bg-[#232030]'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Mobil QR
        </button>
      </div>

      {/* TAB 1: ROLES MANAGEMENT */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-[#d4af37]/30 bg-[#15131d] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black font-gothic text-[#f6db7e]">
                Rolletildeling (3 Forrædere & 11 Loyale)
              </h3>
              <p className="text-xs text-[#9e9585] mt-0.5">
                Aktuel status: <strong className="text-red-400">{traitorsCount} Forrædere</strong> og{' '}
                <strong className="text-yellow-400">{loyalsCount} Loyale</strong>
              </p>
            </div>

            <button
              onClick={handleRandomizeRoles}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl btn-gold text-xs font-black uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Tildel Tilfældigt (1-klik)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {gameState.teams.map((team, idx) => {
              const isTraitor = team.role === 'traitor';
              return (
                <div
                  key={team.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                    isTraitor
                      ? 'bg-[#2a090e] border-[#c41e3a]/60'
                      : 'bg-[#181622] border-white/10'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-bold text-white block truncate">
                      {idx + 1}. {team.name}
                    </span>
                    <span className="text-[10px] text-[#9e9585]">
                      {team.players.join(' & ')}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleRole(team.id, team.role)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      isTraitor
                        ? 'bg-[#c41e3a] text-white shadow-md'
                        : 'bg-[#2b271d] text-[#f6db7e] border border-[#d4af37]/40'
                    }`}
                  >
                    {isTraitor ? '🗡️ Forræder' : '🛡️ Loyal'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TEAMS STATUS (ALIVE / DEAD / REASONS) */}
      {activeTab === 'status' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-[#c5bca8]">
            Marker hold som Levende eller Død, og indstil om deres sande rolle skal være afsløret for alle på slottet.
          </div>

          <div className="grid grid-cols-1 gap-2">
            {gameState.teams.map((team) => (
              <div
                key={team.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  team.isAlive
                    ? 'bg-[#181622] border-white/10'
                    : 'bg-[#1f0d11] border-red-900/50 opacity-85'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {team.name}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        team.isAlive
                          ? 'bg-green-950 text-green-400 border border-green-700/50'
                          : 'bg-red-950 text-red-400 border border-red-700/50'
                      }`}
                    >
                      {team.isAlive ? 'Levende' : 'Død'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9e9585]">
                    Rolle: {team.role === 'traitor' ? 'Forræder' : 'Loyal'} {team.roleRevealed && '• (Offentligt Afsløret)'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleToggleAlive(team)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      team.isAlive
                        ? 'bg-red-950/80 border border-red-700 text-red-300 hover:bg-red-900'
                        : 'bg-green-950/80 border border-green-700 text-green-300 hover:bg-green-900'
                    }`}
                  >
                    {team.isAlive ? 'Marker som Død' : 'Genopliv'}
                  </button>

                  {!team.isAlive && (
                    <button
                      onClick={() => {
                        socket.emit('admin:set_status', {
                          teamId: team.id,
                          isAlive: false,
                          roleRevealed: !team.roleRevealed
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/20 text-[11px] text-[#f6db7e] hover:bg-black transition-colors"
                    >
                      {team.roleRevealed ? 'Skjul Rolle' : 'Afslør Rolle'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BROADCAST SYSTEM */}
      {activeTab === 'broadcast' && (
        <div className="space-y-4">
          {/* Quick Templates */}
          <div>
            <span className="text-xs font-bold text-[#f6db7e] uppercase tracking-wider block mb-2">
              Hurtige Slots-Skabeloner:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {broadcastTemplates.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setBroadcastTitle(tpl.title);
                    setBroadcastMessage(tpl.message);
                    setBroadcastSound(tpl.sound);
                  }}
                  className="p-2.5 rounded-xl bg-[#1a1724] border border-white/10 text-left hover:border-[#d4af37]/50 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-[#f6db7e] block">
                    {tpl.title}
                  </span>
                  <span className="text-[11px] text-[#9e9585] truncate block">
                    {tpl.message}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Broadcast Form */}
          <form onSubmit={handleSendBroadcast} className="p-4 rounded-2xl border border-[#c41e3a]/40 bg-[#19090d] space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#ff8095] flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-[#ff3855]" />
              Send Fuldskærms-Besked til Alle Telefoner
            </h3>

            <div>
              <label className="block text-[11px] text-[#c5bca8] mb-1">Overskrift:</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/50 border border-red-900/50 text-xs text-white focus:outline-none focus:border-[#ff3855]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#c5bca8] mb-1">Besked til deltagere:</label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={3}
                placeholder="F.eks. 'Der er sket et mord, vi mødes i slyngelstuen...'"
                className="w-full p-2.5 rounded-xl bg-black/50 border border-red-900/50 text-xs text-white focus:outline-none focus:border-[#ff3855]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#c5bca8] mb-1">Slots-Lydalarm:</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                {(['bell', 'gong', 'alarm', 'whisper', 'victory'] as SoundType[]).map((snd) => (
                  <button
                    key={snd}
                    type="button"
                    onClick={() => {
                      setBroadcastSound(snd);
                      soundEngine.playBySoundType(snd);
                    }}
                    className={`p-2 rounded-lg border text-center font-bold capitalize transition-colors cursor-pointer ${
                      broadcastSound === snd
                        ? 'bg-[#c41e3a] text-white border-[#ff3855]'
                        : 'bg-black/40 border-white/10 text-[#c5bca8] hover:bg-black/60'
                    }`}
                  >
                    {snd === 'bell' ? '🔔 Klokke' : snd === 'gong' ? '💥 Gong' : snd === 'alarm' ? '🚨 Alarm' : snd === 'whisper' ? '👻 Hvisken' : '🎺 Fanfare'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={!broadcastMessage.trim()}
                className="flex-1 py-3 rounded-xl btn-crimson text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Udsend Fuldskærms-Broadcast Nu!
              </button>

              {gameState.activeBroadcast && (
                <button
                  type="button"
                  onClick={() => socket.emit('admin:clear_broadcast')}
                  className="px-4 py-3 rounded-xl bg-black/60 border border-white/20 text-xs font-bold text-[#c5bca8] hover:text-white transition-colors"
                >
                  Luk Aktiv Besked
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: VOTING CONTROLLER */}
      {activeTab === 'vote' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-[#d4af37]/30 bg-[#16141e] space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#f6db7e] flex items-center gap-1.5">
              <Vote className="w-4 h-4 text-[#d4af37]" />
              Digital Afstemning (Forvisning)
            </h3>

            {!gameState.voteSession.isActive ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-[#c5bca8] mb-1">Rundens Titel:</label>
                  <input
                    type="text"
                    value={voteTitle}
                    onChange={(e) => setVoteTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                  />
                </div>

                <button
                  onClick={handleStartVote}
                  className="w-full py-3 rounded-xl btn-gold text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer"
                >
                  Start Rundbordsafstemning
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#380a10] border border-[#c41e3a] text-xs text-red-200">
                  🔴 Afstemning er i gang! Deltagerne afgiver stemmer på deres telefoner.
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="elim-highest"
                      checked={eliminateHighest}
                      onChange={(e) => setEliminateHighest(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="elim-highest" className="text-[#e6dfd1] font-medium">
                      Eliminér automatisk holdet med flest stemmer og afslør deres rolle
                    </label>
                  </div>

                  {!eliminateHighest && (
                    <div>
                      <label className="block text-[11px] text-[#9e9585] mb-1">Eller vælg manuelt hold til forvisning:</label>
                      <select
                        value={manualEliminateId}
                        onChange={(e) => setManualEliminateId(e.target.value)}
                        className="w-full p-2 rounded-lg bg-[#221f2d] border border-white/10 text-xs text-white"
                      >
                        <option value="">-- Vælg hold --</option>
                        {livingTeams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleEndVote}
                    className="flex-1 py-3 rounded-xl btn-crimson text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer"
                  >
                    Afslut Afstemning & Forvis Taber
                  </button>
                  <button
                    onClick={() => socket.emit('admin:reset_vote')}
                    className="px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-xs text-[#c5bca8]"
                  >
                    Annuller
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: MURDER APPROVALS */}
      {activeTab === 'murder' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-[#2e090e] border border-[#c41e3a]/40 text-xs text-[#ff8095]">
            Her modtager du anmodninger om mord fra forrædernes hemmelige konklave. Når du godkender, dør holdet straks på slottet.
          </div>

          {gameState.murderProposals.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-black/30 border border-white/5 text-xs text-[#9e9585]">
              Ingen mord-anmodninger modtaget endnu.
            </div>
          ) : (
            <div className="space-y-2">
              {gameState.murderProposals.slice().reverse().map((proposal) => (
                <div
                  key={proposal.id}
                  className="p-4 rounded-xl border border-white/10 bg-[#161219] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Skull className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-bold text-white">
                        Mål: {proposal.targetTeamName}
                      </span>
                    </div>
                    <p className="text-xs text-[#9e9585] mt-1">
                      Foreslået af: <strong className="text-[#f6db7e]">{proposal.proposedByTeamName}</strong>
                      {proposal.notes && ` • Note: "${proposal.notes}"`}
                    </p>
                    <span className="text-[10px] text-[#9e9585]/70">
                      Tidspunkt: {new Date(proposal.timestamp).toLocaleTimeString('da-DK')}
                    </span>
                  </div>

                  {proposal.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => socket.emit('admin:handle_murder_proposal', { proposalId: proposal.id, action: 'approved' })}
                        className="px-3.5 py-2 rounded-xl btn-crimson text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
                      >
                        ☠️ Godkend Mord
                      </button>
                      <button
                        onClick={() => socket.emit('admin:handle_murder_proposal', { proposalId: proposal.id, action: 'rejected' })}
                        className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-zinc-700"
                      >
                        Afvis
                      </button>
                    </div>
                  ) : (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      proposal.status === 'approved' ? 'bg-red-950 text-red-300 border border-red-700' : 'bg-zinc-900 text-zinc-400'
                    }`}>
                      {proposal.status === 'approved' ? 'Godkendt & Død' : 'Afvist'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PARTNER SWAP CONTROLLER */}
      {activeTab === 'partner' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-[#d4af37]/30 bg-[#16141e] space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#f6db7e] flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-[#d4af37]" />
              Partnerbytte (Først-til-mølle 2,5 minutter)
            </h3>

            {!gameState.partnerSwap.isActive && !gameState.partnerSwap.winnerTeamId ? (
              <div>
                <p className="text-xs text-[#c5bca8] mb-3">
                  Når du starter partnerbyttet, vises en pulserende knap og en 2,5 minutters nedtælling på alle levende holds telefoner. Første klik låser retten!
                </p>
                <button
                  onClick={handleStartPartnerSwap}
                  className="w-full py-3.5 rounded-xl btn-gold text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer"
                >
                  Udløs Partnerbytte-Nedtælling Nu
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {gameState.partnerSwap.winnerTeamId ? (
                  <div className="p-4 rounded-xl bg-[#2a2416] border border-[#d4af37] text-xs">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#f6db7e] block">
                      Først på knappen:
                    </span>
                    <h4 className="text-lg font-black font-gothic text-white mt-0.5">
                      {gameState.partnerSwap.winnerTeamName}
                    </h4>

                    {/* Execution Form */}
                    <form onSubmit={handleConfirmPartnerSwap} className="mt-4 pt-3 border-t border-[#d4af37]/30 space-y-3">
                      <span className="text-xs font-bold text-[#f6db7e] block">
                        Gennemfør Partnerbyttet:
                      </span>

                      <div>
                        <label className="block text-[11px] text-[#c5bca8] mb-1">
                          Hvilken spiller på vinderholdet skal skiftes ud?
                        </label>
                        <select
                          value={swapPlayerToReplace}
                          onChange={(e) => setSwapPlayerToReplace(e.target.value)}
                          required
                          className="w-full p-2.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white"
                        >
                          <option value="">-- Vælg spiller der udskiftes --</option>
                          {gameState.teams
                            .find(t => t.id === gameState.partnerSwap.winnerTeamId)
                            ?.players.map((p, i) => (
                              <option key={i} value={p}>{p}</option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#c5bca8] mb-1">
                          Navn på ny spiller (fra et dødt hold):
                        </label>
                        <input
                          type="text"
                          value={swapNewPlayerName}
                          onChange={(e) => setSwapNewPlayerName(e.target.value)}
                          placeholder="F.eks. Tobias Terney"
                          required
                          className="w-full p-2.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#c5bca8] mb-1">
                          Fra hvilket dødt hold?
                        </label>
                        <select
                          value={swapFromDeadTeam}
                          onChange={(e) => setSwapFromDeadTeam(e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-black/50 border border-white/10 text-xs text-white"
                        >
                          <option value="">-- Vælg oprindeligt hold --</option>
                          {deadTeams.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl btn-gold text-xs font-black uppercase tracking-wider"
                      >
                        Bekræft & Opdater Holdnavn
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-yellow-950/60 border border-yellow-700/50 text-xs text-yellow-300">
                    ⏳ Nedtælling i gang! Venter på første hold der trykker...
                  </div>
                )}

                <button
                  onClick={() => socket.emit('admin:reset_partner_swap')}
                  className="w-full py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-[#9e9585] hover:text-white"
                >
                  Nulstil Partnerbytte
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: MOBILE QR CODE */}
      {activeTab === 'qr' && (
        <div className="p-6 rounded-2xl border border-[#d4af37]/30 bg-[#16141e] text-center space-y-4">
          <div className="inline-block p-3 rounded-full bg-[#d4af37]/20 text-[#f6db7e] mb-1">
            <QrCode className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-black font-gothic text-white">
            Scan & Åbn på Telefoner
          </h3>
          <p className="text-xs text-[#c5bca8] max-w-sm mx-auto">
            Sørg for, at deltagernes telefoner er forbundet til samme WiFi-netværk på slottet, og scan QR-koden med mobilens kamera:
          </p>

          {qrDataUrl && (
            <div className="p-4 bg-white rounded-2xl inline-block shadow-2xl">
              <img src={qrDataUrl} alt="QR Code til Forræder App" className="w-56 h-56 mx-auto" />
            </div>
          )}

          <div className="p-3 rounded-xl bg-black/40 border border-white/10 inline-block text-xs font-mono text-[#f6db7e]">
            {serverUrl}
          </div>
        </div>
      )}
    </div>
  );
};
