import React, { useState, useEffect, useRef } from 'react';
import { GameState, Team, RoleType, EliminationReason, SoundType, ChatMessage } from '../types';
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
  Eye,
  Send,
  Flame,
  Zap,
  Heart,
  Bell,
  Clock
} from 'lucide-react';

interface AdminPanelProps {
  gameState: GameState;
  adminName: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ gameState, adminName }) => {
  const [activeTab, setActiveTab] = useState<
    'roles' | 'status' | 'broadcast' | 'vote' | 'murder' | 'spy' | 'soundboard' | 'partner' | 'qr'
  >('roles');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('Besked fra Slottets Værter');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSound, setBroadcastSound] = useState<SoundType>('bell');

  // Spy chat state
  const [spyMessageInput, setSpyMessageInput] = useState('');
  const spyChatBottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (activeTab === 'spy') {
      spyChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState.traitorChat.length, activeTab]);

  // Quick broadcast templates
  const broadcastTemplates = [
    {
      title: 'Der er sket et mord!',
      message: 'Der er fundet et lig på slottet. Alle bedes samles i slyngelstuen omgående.',
      sound: 'knife' as SoundType
    },
    {
      title: 'Rundbordssamling!',
      message: 'Det er tid til forvisning. Træd ind i Riddersalen og indtag jeres pladser.',
      sound: 'bell' as SoundType
    },
    {
      title: 'Torden over Slottet!',
      message: 'Mørket falder på, og slottets porte lukkes. Forræderne vågner...',
      sound: 'thunder' as SoundType
    },
    {
      title: 'Hjertebanken før dommen!',
      message: 'Rådets afgørelse er truffet. Hvem forlader slottet i vanære?',
      sound: 'heartbeat' as SoundType
    },
    {
      title: 'Partnerbytte er udløst!',
      message: 'Partnerbyttet er aktiveret! Første hold på knappen vinder.',
      sound: 'victory' as SoundType
    }
  ];

  // Soundboard items
  const soundboardButtons: Array<{ label: string; sound: SoundType; icon: string; desc: string }> = [
    { label: 'Tordenbrag', sound: 'thunder', icon: '⚡', desc: 'Dyb buldrende lynnedslag' },
    { label: 'Hjertebanken', sound: 'heartbeat', icon: '🩸', desc: 'Accelererende intens puls' },
    { label: 'Knivstik & Hvin', sound: 'knife', icon: '🗡️', desc: 'Skærende klinge og gys' },
    { label: 'Kirkeklokke', sound: 'bell', icon: '🔔', desc: 'Dyb gotisk slotsklokke' },
    { label: 'Dødsgong', sound: 'gong', icon: '💥', desc: 'Tung dommedags-sub-bas' },
    { label: 'Spøgelses-Drone', sound: 'drone', icon: '👻', desc: 'Uhyggelig dissonant stemning' },
    { label: 'Slots-Alarm', sound: 'alarm', icon: '🚨', desc: 'Presserende slots-sirene' },
    { label: 'Sejrsfanfare', sound: 'victory', icon: '🎺', desc: 'Kongelig triumf-akkord' },
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

  const handleTriggerSound = (sound: SoundType) => {
    soundEngine.playBySoundType(sound);
    socket.emit('admin:play_sound', { soundType: sound });
  };

  const handleSendSpyMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spyMessageInput.trim()) return;

    socket.emit('traitor:send_message', {
      senderId: 'admin',
      senderName: `👑 Vært (${adminName.split(' ')[0]})`,
      text: spyMessageInput.trim()
    });

    setSpyMessageInput('');
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
          Nulstil
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
          onClick={() => setActiveTab('spy')}
          className={`relative px-3 py-2 rounded-xl font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 ${
            activeTab === 'spy'
              ? 'bg-[#8c1424] text-white shadow-md'
              : 'bg-[#220d13] text-[#ff8095] border border-[#c41e3a]/40 hover:bg-[#2e090e]'
          }`}
        >
          <Eye className="w-4 h-4 text-[#ff4d6d]" />
          Forræder-Spion 👁️
        </button>

        <button
          onClick={() => setActiveTab('soundboard')}
          className={`px-3 py-2 rounded-xl font-bold uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 ${
            activeTab === 'soundboard'
              ? 'bg-[#d4af37] text-black shadow-md'
              : 'bg-[#181622] text-[#c5bca8] hover:bg-[#232030]'
          }`}
        >
          <Volume2 className="w-4 h-4 text-[#f6db7e]" />
          Lydpult 🎛️
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
          Hold ({livingTeams.length})
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
          Mord
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

      {/* ========================================================= */}
      {/* TAB: FORRÆDER-SPION (LIVE OVERVÅGNING AF FORRÆDER-CHAT)  */}
      {/* ========================================================= */}
      {activeTab === 'spy' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-[#c41e3a]/60 bg-gradient-to-b from-[#2e090e] via-[#1a060a] to-[#0a0406] shadow-2xl crimson-glow">
            <div className="flex items-center justify-between border-b border-[#c41e3a]/30 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#520d17] border border-[#ff3855] text-[#ff8095]">
                  <Eye className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-gothic text-white">
                    Forræder-Spion (Live Overvågning)
                  </h3>
                  <p className="text-[10px] text-[#ff8095]">
                    Du ser alt, hvad forræderne skriver og planlægger i realtid.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#9e9585] block">Aktive Forrædere:</span>
                <span className="text-xs font-black text-[#f6db7e]">
                  {gameState.teams.filter(t => t.role === 'traitor').map(t => t.players[0]).join(', ') || 'Ingen tildelt'}
                </span>
              </div>
            </div>

            {/* Traitor Live Chat Feed */}
            <div className="h-[340px] overflow-y-auto space-y-2 p-3 rounded-xl bg-black/60 border border-red-950/60 text-xs">
              {gameState.traitorChat.map((msg: ChatMessage) => {
                const isHost = msg.senderId === 'admin';
                const isSys = msg.isSystem;

                if (isSys) {
                  return (
                    <div
                      key={msg.id}
                      className="p-2 rounded-lg bg-[#380a10]/80 border border-[#c41e3a]/40 text-center text-[11px] text-[#fce8e8] italic my-1"
                    >
                      {msg.text}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isHost ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-[#9e9585] mb-0.5 px-1">
                      {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div
                      className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                        isHost
                          ? 'bg-gradient-to-r from-[#85661a] to-[#d4af37] text-black font-semibold rounded-br-none shadow-md'
                          : 'bg-[#2a0e14] border border-[#ff3855]/30 text-[#fce8e8] rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={spyChatBottomRef} />
            </div>

            {/* Host inject message form */}
            <form onSubmit={handleSendSpyMessage} className="mt-3 flex gap-2">
              <input
                type="text"
                value={spyMessageInput}
                onChange={(e) => setSpyMessageInput(e.target.value)}
                placeholder="Skriv en besked til forrædernes chat som Vært..."
                className="flex-1 p-2.5 rounded-xl bg-black/50 border border-red-900/50 text-xs text-white placeholder:text-[#9e9585]/60 focus:outline-none focus:border-[#ff3855]"
              />
              <button
                type="submit"
                disabled={!spyMessageInput.trim()}
                className="px-4 py-2.5 rounded-xl btn-gold text-black text-xs font-black uppercase tracking-wider shrink-0 disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: LIVE LYDPULT (HOST SOUNDBOARD)                      */}
      {/* ========================================================= */}
      {activeTab === 'soundboard' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-[#d4af37]/40 bg-[#16131f] space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div>
                <h3 className="text-sm font-black font-gothic text-[#f6db7e] flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#d4af37]" />
                  Værtens Live Lydpult
                </h3>
                <p className="text-[11px] text-[#9e9585]">
                  Tryk på en knap for at afspille lydeffekten øjeblikkeligt på <strong>alle tilsluttede telefoner</strong> på slottet!
                </p>
              </div>
            </div>

            {/* Soundboard grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {soundboardButtons.map((btn) => (
                <button
                  key={btn.sound}
                  onClick={() => handleTriggerSound(btn.sound)}
                  className="p-3.5 rounded-xl border border-white/10 bg-gradient-to-b from-[#221d2d] to-[#121018] hover:border-[#d4af37] active:scale-95 transition-all text-left flex flex-col justify-between shadow-lg group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl filter drop-shadow">{btn.icon}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/50 text-[#f6db7e] group-hover:bg-[#d4af37] group-hover:text-black transition-colors">
                      AFSPIL 🔊
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">
                      {btn.label}
                    </span>
                    <span className="text-[10px] text-[#9e9585] block mt-0.5">
                      {btn.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: ROLES MANAGEMENT                                     */}
      {/* ========================================================= */}
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

      {/* TAB: TEAMS STATUS */}
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

      {/* TAB: BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="space-y-4">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                {(['knife', 'heartbeat', 'thunder', 'bell', 'gong', 'alarm', 'drone', 'victory'] as SoundType[]).map((snd) => (
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
                    {snd === 'knife' ? '🗡️ Knivstik' : snd === 'heartbeat' ? '🩸 Hjerte' : snd === 'thunder' ? '⚡ Torden' : snd === 'bell' ? '🔔 Klokke' : snd === 'gong' ? '💥 Gong' : snd === 'drone' ? '👻 Drone' : snd === 'alarm' ? '🚨 Alarm' : '🎺 Fanfare'}
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

      {/* TAB: VOTING */}
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
                  🔴 Afstemning er i gang! Deltagerne ser det cirkulære rundbord og afgiver stemmer.
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

      {/* TAB: MURDER */}
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

      {/* TAB: PARTNER SWAP */}
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

      {/* TAB: MOBILE QR CODE */}
      {activeTab === 'qr' && (
        <div className="p-6 rounded-2xl border border-[#d4af37]/30 bg-[#16141e] text-center space-y-4">
          <div className="inline-block p-3 rounded-full bg-[#d4af37]/20 text-[#f6db7e] mb-1">
            <QrCode className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-black font-gothic text-white">
            Scan & Åbn på Telefoner
          </h3>
          <p className="text-xs text-[#c5bca8] max-w-sm mx-auto">
            Scan QR-koden med mobilens kamera for at åbne appen direkte:
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
