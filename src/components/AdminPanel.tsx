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
  Clock,
  LogOut,
  AlertOctagon,
  Gamepad2,
  Sliders,
  ShieldCheck,
  Coffee,
  Mail,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface AdminPanelProps {
  gameState: GameState;
  adminName: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ gameState, adminName }) => {
  const [activeHub, setActiveHub] = useState<'live' | 'traitors' | 'sound' | 'setup'>('live');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('Besked fra Slottets Værter');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSound, setBroadcastSound] = useState<SoundType>('bell');

  // Morning reveal selection
  const [morningMurderTargetId, setMorningMurderTargetId] = useState<string>('auto');

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
    if (activeHub === 'traitors') {
      spyChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState.traitorChat.length, activeHub]);

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
      title: 'Våbenskjold Uddelt!',
      message: 'Et hold har vundet slottets beskyttende våbenskjold for den kommende nat!',
      sound: 'shield' as SoundType
    }
  ];

  // Soundboard items
  const soundboardButtons: Array<{ label: string; sound: SoundType; icon: string; desc: string }> = [
    { label: 'Tordenbrag', sound: 'thunder', icon: '⚡', desc: 'Dyb buldrende torden' },
    { label: 'Hjertebanken', sound: 'heartbeat', icon: '🩸', desc: 'Accelererende puls' },
    { label: 'Knivstik & Hvin', sound: 'knife', icon: '🗡️', desc: 'Skærende klinge' },
    { label: 'Kirkeklokke', sound: 'bell', icon: '🔔', desc: 'Gotisk slotsklokke' },
    { label: 'Dødsgong', sound: 'gong', icon: '💥', desc: 'Dommedags-sub-bas' },
    { label: 'Spøgelses-Drone', sound: 'drone', icon: '👻', desc: 'Dissonant gys' },
    { label: 'Slots-Alarm', sound: 'alarm', icon: '🚨', desc: 'Presserende sirene' },
    { label: 'Våbenskjold', sound: 'shield', icon: '🛡️', desc: 'Tung gylden klokkeklang' },
  ];

  const traitorsCount = gameState.teams.filter(t => t.role === 'traitor').length;
  const loyalsCount = gameState.teams.filter(t => t.role === 'loyal').length;
  const livingTeams = gameState.teams.filter(t => t.isAlive);
  const deadTeams = gameState.teams.filter(t => !t.isAlive);
  const pendingMurders = gameState.murderProposals.filter(p => p.status === 'pending');
  const hasPendingRecruitment = gameState.recruitment && gameState.recruitment.status === 'pending_admin';

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

  const handleToggleShield = (teamId: string) => {
    socket.emit('admin:toggle_shield', { teamId });
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

  const handleForceLogoutAll = () => {
    if (confirm('🚨 VIGTIGT: Dette vil TVINGE LOGOUT PÅ ALLE ENHEDER (både deltagere og værter) med det samme! Hvis nogen deltagere er kommet ind på værtslogin, bliver de smidt ud til login-skærmen.\n\nVil du fortsætte?')) {
      soundEngine.playGong();
      socket.emit('admin:force_logout_all');
    }
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

  const handleStartMorningReveal = () => {
    if (morningMurderTargetId === 'none') {
      socket.emit('admin:start_morning_reveal', { noMurder: true });
    } else if (morningMurderTargetId === 'auto') {
      socket.emit('admin:start_morning_reveal', {});
    } else {
      socket.emit('admin:start_morning_reveal', { murderedTeamId: morningMurderTargetId });
    }
  };

  const handleHandleRecruitment = (action: 'approved' | 'rejected') => {
    socket.emit('admin:handle_recruitment_proposal', { action });
  };

  const handleResetGame = () => {
    if (confirm('ADVARSEL: Dette nulstiller hele spillet, alle stemmer, chats og roller. Er du helt sikker?')) {
      socket.emit('admin:reset_game');
    }
  };

  return (
    <div className="w-full space-y-4 pb-20">
      {/* Top Host Header */}
      <div className="rounded-3xl border-2 border-[#d4af37] bg-gradient-to-r from-[#2a2010] via-[#1a140d] to-[#2a2010] p-4 shadow-2xl gold-glow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#d4af37] text-black shadow-md">
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

        <div className="flex items-center gap-2">
          <button
            onClick={handleForceLogoutAll}
            className="px-3 py-2 rounded-xl bg-[#520d17] border border-[#ff3855] text-[#ff8095] hover:bg-[#8c1424] text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-md active:scale-95 cursor-pointer"
            title="Tving logout på alle enheder"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-[#ff4d6d]" />
            Log Alle Ud 🚨
          </button>
        </div>
      </div>

      {/* 4 Master Hub Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveHub('live')}
          className={`p-3 rounded-2xl border font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeHub === 'live'
              ? 'bg-gradient-to-r from-[#d4af37] to-[#b38b27] text-black shadow-lg border-[#f6db7e]'
              : 'bg-[#181522] border-white/10 text-[#c5bca8] hover:bg-[#232030]'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Spilstyring</span>
          {gameState.voteSession.isActive && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />}
        </button>

        <button
          onClick={() => setActiveHub('traitors')}
          className={`relative p-3 rounded-2xl border font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeHub === 'traitors'
              ? 'bg-gradient-to-r from-[#c41e3a] to-[#8c1424] text-white shadow-lg border-[#ff3855]'
              : 'bg-[#220d13] border-[#c41e3a]/40 text-[#ff8095] hover:bg-[#2e090e]'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Forrædere</span>
          {(pendingMurders.length > 0 || hasPendingRecruitment) && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] animate-pulse font-black">
              {pendingMurders.length + (hasPendingRecruitment ? 1 : 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveHub('sound')}
          className={`p-3 rounded-2xl border font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeHub === 'sound'
              ? 'bg-gradient-to-r from-[#d4af37] to-[#b38b27] text-black shadow-lg border-[#f6db7e]'
              : 'bg-[#181522] border-white/10 text-[#c5bca8] hover:bg-[#232030]'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>Lyd & Beskeder</span>
        </button>

        <button
          onClick={() => setActiveHub('setup')}
          className={`p-3 rounded-2xl border font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeHub === 'setup'
              ? 'bg-gradient-to-r from-[#d4af37] to-[#b38b27] text-black shadow-lg border-[#f6db7e]'
              : 'bg-[#181522] border-white/10 text-[#c5bca8] hover:bg-[#232030]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Opsætning & QR</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 🎮 HUB 1: LIVE SPILSTYRING                                */}
      {/* ========================================================= */}
      {activeHub === 'live' && (
        <div className="space-y-4">
          {/* Interactive Morning Reveal Trigger Card */}
          <div className="p-4 rounded-3xl border border-[#d4af37]/40 bg-[#191522] space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#f6db7e] flex items-center gap-2">
                <Coffee className="w-4 h-4 text-[#d4af37]" />
                Morgensamling (Hvem Overlevede Natten?)
              </h3>
              {gameState.morningReveal?.isActive && (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-yellow-950 text-yellow-300 border border-yellow-700 animate-pulse">
                  Aktiv på mobiler ☕
                </span>
              )}
            </div>

            <p className="text-[11px] text-[#c5bca8]">
              Vælg hvem der blev myrdet i nat, og start morgensamlingen for alle deltagere på én gang:
            </p>

            <div className="space-y-2">
              <select
                value={morningMurderTargetId}
                onChange={(e) => setMorningMurderTargetId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/60 border border-[#d4af37]/30 text-xs text-white"
              >
                <option value="auto">-- Automatisk (Seneste godkendte mord i nat) --</option>
                <option value="none">🛡️ Ingen blev myrdet i nat (Skjold / Fredelig nat)</option>
                {gameState.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    ☠️ {t.name} {!t.isAlive && '(Allerede markeret død)'}
                  </option>
                ))}
              </select>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleStartMorningReveal}
                  className="flex-1 py-3 rounded-2xl btn-gold text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Coffee className="w-4 h-4" />
                  Udsend Morgensamling til Alle Telefoner
                </button>

                {gameState.morningReveal?.isActive && (
                  <button
                    onClick={() => socket.emit('admin:end_morning_reveal')}
                    className="px-4 py-3 rounded-2xl bg-black/60 border border-white/20 text-xs font-bold text-[#c5bca8] hover:text-white"
                  >
                    Luk For Alle
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Voting Controller */}
          <div className="p-4 rounded-3xl border border-[#d4af37]/35 bg-[#16141e] space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#f6db7e] flex items-center gap-2">
                <Vote className="w-4 h-4 text-[#d4af37]" />
                Digital Forvisning (Rundbordssamling)
              </h3>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${gameState.voteSession.isActive ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse' : 'bg-black/50 text-gray-400'}`}>
                {gameState.voteSession.isActive ? 'I Gang 🔴' : 'Afsluttet'}
              </span>
            </div>

            {!gameState.voteSession.isActive ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-[#c5bca8] mb-1">Rundens Navn:</label>
                  <input
                    type="text"
                    value={voteTitle}
                    onChange={(e) => setVoteTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                  />
                </div>

                <button
                  onClick={handleStartVote}
                  className="w-full py-3 rounded-2xl btn-gold text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer"
                >
                  Start Rundbordsafstemning
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-[#380a10] border border-[#c41e3a] text-xs text-red-200 flex items-center justify-between">
                  <span>Deltagerne afgiver stemmer på det cirkulære rundbord.</span>
                  <span className="font-black text-white">{Object.keys(gameState.voteSession.votes || {}).length} / {livingTeams.length} stemt</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
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

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleEndVote}
                    className="flex-1 py-3 rounded-2xl btn-crimson text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer"
                  >
                    Afslut Afstemning & Forvis Taber
                  </button>
                  <button
                    onClick={() => socket.emit('admin:reset_vote')}
                    className="px-4 py-3 rounded-2xl bg-black/50 border border-white/10 text-xs text-[#c5bca8]"
                  >
                    Annuller
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Partner Swap Controller */}
          <div className="p-4 rounded-3xl border border-[#d4af37]/35 bg-[#16141e] space-y-3 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#f6db7e] flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#d4af37]" />
              Partnerbytte (Først-til-mølle)
            </h3>

            {!gameState.partnerSwap.isActive && !gameState.partnerSwap.winnerTeamId ? (
              <button
                onClick={handleStartPartnerSwap}
                className="w-full py-3 rounded-2xl btn-gold text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer"
              >
                Udløs 2,5 Minutters Partnerbytte
              </button>
            ) : (
              <div className="space-y-3">
                {gameState.partnerSwap.winnerTeamId ? (
                  <div className="p-4 rounded-2xl bg-[#2a2416] border border-[#d4af37] text-xs">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#f6db7e] block">
                      Vinder: {gameState.partnerSwap.winnerTeamName}
                    </span>

                    <form onSubmit={handleConfirmPartnerSwap} className="mt-3 pt-2.5 border-t border-[#d4af37]/30 space-y-2.5">
                      <div>
                        <label className="block text-[11px] text-[#c5bca8] mb-1">Spiller der udskiftes:</label>
                        <select
                          value={swapPlayerToReplace}
                          onChange={(e) => setSwapPlayerToReplace(e.target.value)}
                          required
                          className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                        >
                          <option value="">-- Vælg spiller --</option>
                          {gameState.teams.find(t => t.id === gameState.partnerSwap.winnerTeamId)?.players.map((p, i) => (
                            <option key={i} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#c5bca8] mb-1">Ny spiller (fra et dødt hold):</label>
                        <input
                          type="text"
                          value={swapNewPlayerName}
                          onChange={(e) => setSwapNewPlayerName(e.target.value)}
                          placeholder="F.eks. Tobias Terney"
                          required
                          className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white"
                        />
                      </div>

                      <button type="submit" className="w-full py-2.5 rounded-xl btn-gold text-xs font-black uppercase tracking-wider">
                        Bekræft Bytte
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-yellow-950/60 border border-yellow-700/50 text-xs text-yellow-300">
                    ⏳ Nedtælling i gang! Venter på første hold...
                  </div>
                )}

                <button
                  onClick={() => socket.emit('admin:reset_partner_swap')}
                  className="w-full py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-[#9e9585]"
                >
                  Nulstil Partnerbytte
                </button>
              </div>
            )}
          </div>

          {/* Quick Team Status List (Alive / Dead / Shield) */}
          <div className="p-4 rounded-3xl border border-white/10 bg-[#16141e] space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#f6db7e] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#f6db7e]" />
              Holdstatus & Våbenskjold ({livingTeams.length} Levende / {deadTeams.length} Døde)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {gameState.teams.map((team) => (
                <div
                  key={team.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                    team.isAlive ? 'bg-[#181622] border-white/10' : 'bg-[#1f0d11] border-red-900/40 opacity-75'
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <span className={`text-xs font-bold block truncate ${team.isAlive ? 'text-white' : 'text-gray-400 line-through'}`}>
                      {team.name}
                    </span>
                    <span className="text-[10px] text-[#9e9585]">
                      {team.role === 'traitor' ? '🗡️ Forræder' : '🛡️ Loyal'} {team.hasShield && '• (🛡️ Skjold Aktivt)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {team.isAlive && (
                      <button
                        onClick={() => handleToggleShield(team.id)}
                        className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          team.hasShield
                            ? 'bg-[#d4af37] text-black shadow-md'
                            : 'bg-black/50 text-[#9e9585] border border-white/10 hover:text-white'
                        }`}
                        title={team.hasShield ? 'Fjern Våbenskjold' : 'Tildel Våbenskjold'}
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleAlive(team)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-colors cursor-pointer ${
                        team.isAlive ? 'bg-red-950 border border-red-800 text-red-300' : 'bg-green-950 border border-green-800 text-green-300'
                      }`}
                    >
                      {team.isAlive ? 'Dræb' : 'Genopliv'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🗡️ HUB 2: FORRÆDERE & MORD                                 */}
      {/* ========================================================= */}
      {activeHub === 'traitors' && (
        <div className="space-y-4">
          {/* Recruitment Proposal Authorization Card */}
          {gameState.recruitment && gameState.recruitment.status === 'pending_admin' && (
            <div className="p-4 rounded-3xl border-2 border-[#d4af37] bg-gradient-to-r from-[#2a1d08] via-[#3d2a0b] to-[#2a1d08] space-y-2 shadow-2xl gold-glow animate-pulse">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#f6db7e]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#f6db7e]">
                  Vært-Godkendelse Påkrævet: Rekruttering
                </h4>
              </div>
              <p className="text-xs text-white">
                Forræderne anmoder om tilladelse til at sende et hemmeligt rekrutterings-brev til: <strong className="text-[#f6db7e]">{gameState.recruitment.targetTeamName}</strong>.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleHandleRecruitment('approved')}
                  className="flex-1 py-2.5 rounded-xl btn-gold text-black text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  Godkend & Send Brev 💌
                </button>
                <button
                  onClick={() => handleHandleRecruitment('rejected')}
                  className="flex-1 py-2.5 rounded-xl bg-black/60 border border-white/20 text-xs font-bold text-[#c5bca8] hover:text-white uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Afvis Rekruttering
                </button>
              </div>
            </div>
          )}

          {gameState.recruitment && gameState.recruitment.status === 'dispatched' && (
            <div className="p-3 rounded-2xl bg-[#2a1d08] border border-[#d4af37]/50 text-xs text-[#f6db7e] flex items-center justify-between">
              <span>💌 Brev sendt til <strong>{gameState.recruitment.targetTeamName}</strong>. Afventer svar...</span>
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
            </div>
          )}

          {/* Role Assignments Section */}
          <div className="p-4 rounded-3xl border border-[#d4af37]/35 bg-[#15131d] space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#f6db7e] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#d4af37]" />
                  Rolletildeling (3 Forrædere & 11 Loyale)
                </h3>
                <p className="text-[10px] text-[#9e9585]">
                  Status: <strong className="text-red-400">{traitorsCount} Forrædere</strong> og <strong className="text-yellow-400">{loyalsCount} Loyale</strong>
                </p>
              </div>

              <button
                onClick={handleRandomizeRoles}
                className="px-3.5 py-2 rounded-xl btn-gold text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Tilfældig (1-klik)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {gameState.teams.map((team, idx) => {
                const isTraitor = team.role === 'traitor';
                return (
                  <div
                    key={team.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      isTraitor ? 'bg-[#2a090e] border-[#c41e3a]/60 text-white' : 'bg-[#181622] border-white/10 text-[#c5bca8]'
                    }`}
                  >
                    <span className="truncate pr-2 font-semibold">
                      {idx + 1}. {team.players.map(p => p.trim().split(' ')[0]).join(' & ')}
                    </span>
                    <button
                      onClick={() => handleToggleRole(team.id, team.role)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                        isTraitor ? 'bg-[#c41e3a] text-white shadow-sm' : 'bg-black/50 text-[#f6db7e] border border-[#d4af37]/30'
                      }`}
                    >
                      {isTraitor ? '🗡️ Forræder' : '🛡️ Loyal'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Murder Proposals Queue */}
          {gameState.murderProposals.length > 0 && (
            <div className="p-4 rounded-3xl border border-[#c41e3a]/60 bg-[#1e0a0f] space-y-2.5 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#ff8095] flex items-center gap-2">
                <Skull className="w-4 h-4 text-[#ff4d6d]" />
                Indkomne Mord-anmodninger
              </h3>

              {gameState.murderProposals.slice().reverse().map((prop) => (
                <div
                  key={prop.id}
                  className="p-3 rounded-2xl bg-black/50 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">Mål: {prop.targetTeamName}</span>
                    <span className="text-[10px] text-[#9e9585]">Foreslået af: {prop.proposedByTeamName} {prop.notes && `("${prop.notes}")`}</span>
                  </div>

                  {prop.status === 'pending' ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => socket.emit('admin:handle_murder_proposal', { proposalId: prop.id, action: 'approved' })}
                        className="px-3 py-1.5 rounded-xl btn-crimson text-xs font-black uppercase shadow-md cursor-pointer"
                      >
                        ☠️ Godkend Mord
                      </button>
                      <button
                        onClick={() => socket.emit('admin:handle_murder_proposal', { proposalId: prop.id, action: 'rejected' })}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
                      >
                        Afvis
                      </button>
                    </div>
                  ) : (
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${prop.status === 'approved' ? 'bg-red-950 text-red-300' : prop.status === 'blocked_by_shield' ? 'bg-yellow-950 text-yellow-300 border border-yellow-700' : 'bg-zinc-900 text-zinc-400'}`}>
                      {prop.status === 'approved' ? 'Godkendt & Død' : prop.status === 'blocked_by_shield' ? '🛡️ Blokeret af Våbenskjold' : 'Afvist'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Traitor Live Spy Chat */}
          <div className="p-4 rounded-3xl border border-[#c41e3a]/60 bg-gradient-to-b from-[#2e090e] via-[#1a060a] to-[#0a0406] shadow-2xl crimson-glow space-y-3">
            <div className="flex items-center justify-between border-b border-[#c41e3a]/30 pb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#ff4d6d]" />
                <h3 className="text-xs font-black font-gothic text-white uppercase tracking-wider">
                  Forræder-Spion (Live Chat)
                </h3>
              </div>
              <span className="text-[10px] text-[#ff8095]">Hemmelig overvågning</span>
            </div>

            <div className="h-[280px] overflow-y-auto space-y-2 p-3 rounded-2xl bg-black/60 border border-red-950/60 text-xs scrollbar-thin">
              {gameState.traitorChat.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.senderId === 'admin' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] text-[#9e9585] mb-0.5 px-1 font-semibold">{msg.senderName}</span>
                  <div className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${msg.senderId === 'admin' ? 'bg-[#d4af37] text-black font-bold' : msg.isSystem ? 'bg-[#380a10] text-[#fce8e8] italic' : 'bg-[#2a0e14] text-[#fce8e8] border border-white/5'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={spyChatBottomRef} />
            </div>

            <form onSubmit={handleSendSpyMessage} className="flex gap-2">
              <input
                type="text"
                value={spyMessageInput}
                onChange={(e) => setSpyMessageInput(e.target.value)}
                placeholder="Skriv en hemmelig besked som Vært..."
                className="flex-1 p-2.5 rounded-xl bg-black/50 border border-red-900/50 text-xs text-white focus:outline-none"
              />
              <button type="submit" disabled={!spyMessageInput.trim()} className="px-4 py-2.5 rounded-xl btn-gold text-black text-xs font-black uppercase">
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 📢 HUB 3: LYD & BROADCAST                                 */}
      {/* ========================================================= */}
      {activeHub === 'sound' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl border border-[#d4af37]/35 bg-[#16131f] space-y-3 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#f6db7e] flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#d4af37]" />
              Værtens Live Lydpult (Afspiller på alle mobiler)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {soundboardButtons.map((btn) => (
                <button
                  key={btn.sound}
                  onClick={() => handleTriggerSound(btn.sound)}
                  className="p-3 rounded-2xl border border-white/10 bg-gradient-to-b from-[#221d2d] to-[#121018] hover:border-[#d4af37] active:scale-95 transition-all text-left shadow-lg cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl">{btn.icon}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/50 text-[#f6db7e]">
                      AFSPIL
                    </span>
                  </div>
                  <span className="text-xs font-black text-white block truncate">{btn.label}</span>
                  <span className="text-[9px] text-[#9e9585] block truncate">{btn.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="p-4 rounded-3xl border border-[#c41e3a]/40 bg-[#19090d] space-y-3 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#ff8095] flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-[#ff3855]" />
              Udsend Fuldskærms-Pop-up Alarm
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              {broadcastTemplates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setBroadcastTitle(tpl.title);
                    setBroadcastMessage(tpl.message);
                    setBroadcastSound(tpl.sound);
                  }}
                  className="p-2 rounded-xl bg-black/40 border border-white/10 text-left text-xs text-[#c5bca8] hover:border-[#d4af37]/50"
                >
                  <strong className="text-[#f6db7e] block">{tpl.title}</strong>
                  <span className="text-[10px] text-[#9e9585] truncate block">{tpl.message}</span>
                </button>
              ))}
            </div>

            <div>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Overskrift..."
                className="w-full p-2.5 rounded-xl bg-black/50 border border-red-900/50 text-xs text-white mb-2"
              />
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={2}
                placeholder="Besked til alle telefoner..."
                className="w-full p-2.5 rounded-xl bg-black/50 border border-red-900/50 text-xs text-white"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={!broadcastMessage.trim()}
                className="flex-1 py-3 rounded-2xl btn-crimson text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Udsend Alarm Nu!
              </button>
              {gameState.activeBroadcast && (
                <button
                  type="button"
                  onClick={() => socket.emit('admin:clear_broadcast')}
                  className="px-4 py-3 rounded-2xl bg-black/60 border border-white/20 text-xs text-[#c5bca8]"
                >
                  Luk
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* ⚙️ HUB 4: SLOTTETS SETUP                                  */}
      {/* ========================================================= */}
      {activeHub === 'setup' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl border border-[#d4af37]/35 bg-[#16141e] text-center space-y-3 shadow-xl">
            <div className="inline-block p-3 rounded-2xl bg-[#d4af37]/20 text-[#f6db7e]">
              <QrCode className="w-8 h-8" />
            </div>

            <h3 className="text-base font-black font-gothic text-white">
              Scan & Åbn på Telefoner
            </h3>
            <p className="text-xs text-[#c5bca8] max-w-sm mx-auto">
              Lad deltagerne scanne denne QR-kode for at åbne appen direkte på mobilen:
            </p>

            {qrDataUrl && (
              <div className="p-4 bg-white rounded-3xl inline-block shadow-2xl">
                <img src={qrDataUrl} alt="QR Code til Forræder App" className="w-52 h-52 mx-auto" />
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 inline-block text-xs font-mono text-[#f6db7e]">
              {serverUrl}
            </div>
          </div>

          <div className="p-4 rounded-3xl border border-red-950 bg-[#180a0e] flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black text-red-300 uppercase block">Nulstil Alt Spildata</span>
              <span className="text-[10px] text-[#9e9585]">Sletter alle stemmer, chats og starter forfra</span>
            </div>

            <button
              onClick={handleResetGame}
              className="px-4 py-2.5 rounded-xl bg-red-950 border border-red-800 text-red-300 text-xs font-black uppercase hover:bg-red-900 transition-colors"
            >
              Nulstil Spil
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
