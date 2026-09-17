import express from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { 
  GameState, 
  INITIAL_TEAMS, 
  Team, 
  VoteRecord, 
  MurderProposal, 
  ChatMessage, 
  BroadcastEvent,
  RoleType,
  EliminationReason,
  SoundType,
  RecruitmentSession,
  MorningRevealSession
} from '../src/types.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const DB_FILE = path.join(process.cwd(), 'gamestate.json');

function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (netList) {
      for (const net of netList) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIpAddress();

function createDefaultState(): GameState {
  const teams: Team[] = INITIAL_TEAMS.map((t) => ({
    id: t.id,
    name: t.name,
    players: t.players,
    role: 'unassigned',
    isAlive: true,
    hasShield: false,
    roleRevealed: false
  }));

  return {
    teams,
    voteSession: {
      isActive: false,
      roundNumber: 1,
      title: 'Rundbordssamling #1',
      startedAt: 0,
      votes: {},
      isConcluded: false
    },
    recruitment: null,
    morningReveal: null,
    murderProposals: [],
    traitorChat: [
      {
        id: 'msg-init',
        senderId: 'system',
        senderName: 'Slottets Tavshed',
        text: 'Forrædernes konklave er åben. Her planlægges nattens ugerninger og rekruttering i hemmelighed.',
        timestamp: Date.now(),
        isSystem: true
      }
    ],
    activeBroadcast: null,
    gameStarted: false,
    lastUpdated: Date.now()
  };
}

let gameState: GameState = createDefaultState();

try {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const loaded = JSON.parse(data);
    gameState = {
      ...createDefaultState(),
      ...loaded,
      teams: (loaded.teams || []).map((t: Team) => ({
        ...t,
        hasShield: !!t.hasShield
      }))
    };
    console.log('🏰 Game state loaded successfully from disk.');
  } else {
    saveState();
  }
} catch (e) {
  console.error('Error loading game state, using default:', e);
}

function saveState() {
  try {
    gameState.lastUpdated = Date.now();
    fs.writeFileSync(DB_FILE, JSON.stringify(gameState, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save game state to disk:', e);
  }
}

function broadcastState() {
  saveState();
  io.emit('state_update', gameState);
}

// REST endpoints
app.get('/api/info', (_req, res) => {
  res.json({
    localIp,
    port: process.env.PORT || 3001,
    url: `http://${localIp}:${process.env.PORT || 3001}`,
    lastUpdated: gameState.lastUpdated
  });
});

app.get('/api/state', (_req, res) => {
  res.json(gameState);
});

// Serve frontend static build if dist directory exists
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Socket.IO real-time handlers
io.on('connection', (socket: Socket) => {
  socket.emit('state_update', gameState);

  socket.on('admin:play_sound', (data: { soundType: SoundType }) => {
    io.emit('trigger_sound', { soundType: data.soundType });
  });

  socket.on('admin:force_logout_all', () => {
    console.log('🚨 Admin triggered FORCE LOGOUT on all connected clients.');
    io.emit('force_logout', { message: 'Slottets Værter har nulstillet alle login-sessioner.' });
  });

  // 1. DYNAMIC TEAM REGISTRATION
  socket.on('team:register', (data: { name: string; players?: string[] }, callback?: (res: { success: boolean; team: Team }) => void) => {
    const trimmedName = (data.name || '').trim();
    if (!trimmedName) return;

    // Check if team already exists (case-insensitive)
    const existing = gameState.teams.find(t => t.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      if (callback) callback({ success: true, team: existing });
      return;
    }

    const parsedPlayers = data.players && data.players.length > 0 
      ? data.players 
      : trimmedName.includes('/') 
      ? trimmedName.split('/').map(p => p.trim()).filter(Boolean)
      : trimmedName.includes('&')
      ? trimmedName.split('&').map(p => p.trim()).filter(Boolean)
      : [trimmedName];

    const newTeam: Team = {
      id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmedName,
      players: parsedPlayers,
      role: 'unassigned',
      isAlive: true,
      hasShield: false,
      roleRevealed: false
    };

    gameState.teams.push(newTeam);
    broadcastState();

    if (callback) {
      callback({ success: true, team: newTeam });
    }
  });

  // ADMIN: Delete a team
  socket.on('admin:delete_team', (data: { teamId: string }) => {
    gameState.teams = gameState.teams.filter(t => t.id !== data.teamId);
    broadcastState();
  });

  // ADMIN: Clear all teams to start completely fresh
  socket.on('admin:clear_all_teams', () => {
    gameState.teams = [];
    broadcastState();
  });

  // 2. ADMIN: Toggle Shield on Team
  socket.on('admin:toggle_shield', (data: { teamId: string; hasShield?: boolean }) => {
    gameState.teams = gameState.teams.map(t => {
      if (t.id === data.teamId) {
        const nextShield = data.hasShield !== undefined ? data.hasShield : !t.hasShield;
        return { ...t, hasShield: nextShield };
      }
      return t;
    });
    io.emit('trigger_sound', { soundType: 'shield' });
    broadcastState();
  });

  // 3. ADMIN: Morning Reveal Sequence
  socket.on('admin:start_morning_reveal', (data?: { murderedTeamId?: string; noMurder?: boolean }) => {
    let murderedId = data?.murderedTeamId;
    let murderedName: string | undefined = undefined;
    let isNoMurder = data?.noMurder || false;

    if (murderedId) {
      const team = gameState.teams.find(t => t.id === murderedId);
      if (team) {
        murderedName = team.name;
        team.isAlive = false;
        team.eliminationReason = 'murder';
        team.eliminatedAt = team.eliminatedAt || Date.now();
      }
    } else if (!isNoMurder) {
      const deadMurders = gameState.teams.filter(t => !t.isAlive && t.eliminationReason === 'murder');
      if (deadMurders.length > 0) {
        const latest = deadMurders[deadMurders.length - 1];
        murderedId = latest.id;
        murderedName = latest.name;
      } else {
        isNoMurder = true;
      }
    }

    const living = gameState.teams.filter(t => t.isAlive).map(t => t.id);

    gameState.morningReveal = {
      isActive: true,
      murderedTeamId: murderedId,
      murderedTeamName: murderedName,
      noMurder: isNoMurder,
      revealedTeamIds: living,
      timestamp: Date.now(),
      isConcluded: false
    };

    io.emit('trigger_sound', { soundType: 'bell' });
    broadcastState();
  });

  socket.on('admin:end_morning_reveal', () => {
    gameState.morningReveal = null;
    broadcastState();
  });

  // 4. RECRUITMENT: Propose (Traitors) -> Approve/Reject (Host) -> Respond (Target Team)
  socket.on('traitor:propose_recruitment', (data: { targetTeamId: string }) => {
    const target = gameState.teams.find(t => t.id === data.targetTeamId);
    if (!target || !target.isAlive) return;

    gameState.recruitment = {
      id: `rec-${Date.now()}`,
      isActive: false,
      targetTeamId: target.id,
      targetTeamName: target.name,
      proposedByTeamName: 'Forræder-Konklavet',
      status: 'pending_admin',
      timestamp: Date.now()
    };

    gameState.traitorChat.push({
      id: `rec-prop-${Date.now()}`,
      senderId: 'system',
      senderName: 'Forræder-Mødet',
      text: `💌 Forræderne har anmodet værterne om at sende et rekrutterings-brev til ${target.name}. Venter på værternes godkendelse...`,
      timestamp: Date.now(),
      isSystem: true
    });

    broadcastState();
  });

  socket.on('admin:handle_recruitment_proposal', (data: { action: 'approved' | 'rejected' }) => {
    if (!gameState.recruitment) return;

    if (data.action === 'approved') {
      gameState.recruitment.status = 'dispatched';
      gameState.recruitment.isActive = true;

      gameState.traitorChat.push({
        id: `rec-app-${Date.now()}`,
        senderId: 'system',
        senderName: 'Slottets Værter',
        text: `👑 Værterne har GODKENDT rekrutteringen! Pergamentbrevet er blevet leveret til ${gameState.recruitment.targetTeamName} i natten.`,
        timestamp: Date.now(),
        isSystem: true
      });

      io.emit('trigger_sound', { soundType: 'whisper' });
    } else {
      gameState.recruitment.status = 'rejected_by_admin';
      gameState.recruitment.isActive = false;

      gameState.traitorChat.push({
        id: `rec-rej-${Date.now()}`,
        senderId: 'system',
        senderName: 'Slottets Værter',
        text: `🛡️ Værterne AFVISTE rekrutteringen af ${gameState.recruitment.targetTeamName}.`,
        timestamp: Date.now(),
        isSystem: true
      });
    }

    broadcastState();
  });

  socket.on('team:respond_recruitment', (data: { teamId: string; accept: boolean }) => {
    if (!gameState.recruitment || gameState.recruitment.targetTeamId !== data.teamId) return;

    if (data.accept) {
      gameState.recruitment.status = 'accepted';
      gameState.recruitment.isActive = false;

      gameState.teams = gameState.teams.map(t => {
        if (t.id === data.teamId) {
          return { ...t, role: 'traitor' };
        }
        return t;
      });

      gameState.traitorChat.push({
        id: `rec-acc-${Date.now()}`,
        senderId: 'system',
        senderName: 'Slottets Tavshed',
        text: `🩸 ${gameState.recruitment.targetTeamName} har ACCEPTERET og er nu optaget som FORRÆDER! Byd jeres nye allierede velkommen.`,
        timestamp: Date.now(),
        isSystem: true
      });

      io.emit('trigger_sound', { soundType: 'knife' });
    } else {
      gameState.recruitment.status = 'rejected';
      gameState.recruitment.isActive = false;

      gameState.traitorChat.push({
        id: `rec-rej-${Date.now()}`,
        senderId: 'system',
        senderName: 'Slottets Tavshed',
        text: `🛡️ ${gameState.recruitment.targetTeamName} har AFVIST rekrutteringen og forbliver loyal.`,
        timestamp: Date.now(),
        isSystem: true
      });
    }

    broadcastState();
  });

  // 5. ADMIN: Set Roles
  socket.on('admin:set_roles', (data: { assignments?: Record<string, RoleType>; randomize?: boolean; traitorCount?: number }) => {
    if (data.randomize) {
      const teamIds = gameState.teams.map(t => t.id);
      const totalTeams = teamIds.length;
      const count = data.traitorCount || (totalTeams >= 16 ? 4 : totalTeams >= 8 ? 3 : 2);

      const shuffled = [...teamIds].sort(() => 0.5 - Math.random());
      const traitorIds = new Set(shuffled.slice(0, count));

      gameState.teams = gameState.teams.map(t => ({
        ...t,
        role: traitorIds.has(t.id) ? 'traitor' : 'loyal'
      }));
    } else if (data.assignments) {
      gameState.teams = gameState.teams.map(t => ({
        ...t,
        role: data.assignments?.[t.id] || t.role
      }));
    }
    gameState.gameStarted = true;
    broadcastState();
  });

  // 6. ADMIN: Set Team Status
  socket.on('admin:set_status', (data: { 
    teamId: string; 
    isAlive: boolean; 
    reason?: EliminationReason; 
    roleRevealed?: boolean;
    hasShield?: boolean;
    customPlayerNames?: string[];
  }) => {
    gameState.teams = gameState.teams.map(t => {
      if (t.id === data.teamId) {
        return {
          ...t,
          isAlive: data.isAlive,
          hasShield: data.hasShield !== undefined ? data.hasShield : t.hasShield,
          eliminatedAt: !data.isAlive ? (t.eliminatedAt || Date.now()) : undefined,
          eliminationReason: !data.isAlive ? (data.reason || 'manual') : undefined,
          roleRevealed: data.roleRevealed !== undefined ? data.roleRevealed : t.roleRevealed,
          players: data.customPlayerNames || t.players,
          name: data.customPlayerNames ? data.customPlayerNames.join(' / ') : t.name
        };
      }
      return t;
    });
    broadcastState();
  });

  // 7. ADMIN: Broadcast Alert
  socket.on('admin:broadcast', (data: { title: string; message: string; soundType: any; sender?: string }) => {
    const broadcastEvent: BroadcastEvent = {
      id: `bc-${Date.now()}`,
      title: data.title || 'Besked fra Værterne',
      message: data.message,
      soundType: data.soundType || 'bell',
      timestamp: Date.now(),
      sender: data.sender || 'Julius & Karoline'
    };
    gameState.activeBroadcast = broadcastEvent;
    broadcastState();
  });

  socket.on('admin:clear_broadcast', () => {
    gameState.activeBroadcast = null;
    broadcastState();
  });

  // 8. ADMIN & VOTING
  socket.on('admin:start_vote', (data: { title?: string; roundNumber?: number }) => {
    gameState.voteSession = {
      isActive: true,
      roundNumber: data.roundNumber || gameState.voteSession.roundNumber,
      title: data.title || `Rundbordssamling #${gameState.voteSession.roundNumber}`,
      startedAt: Date.now(),
      votes: {},
      isConcluded: false
    };
    broadcastState();
  });

  socket.on('vote:cast', (data: { voterTeamId: string; voterTeamName: string; targetTeamId: string; targetTeamName: string }) => {
    if (!gameState.voteSession.isActive || gameState.voteSession.isConcluded) return;

    const voter = gameState.teams.find(t => t.id === data.voterTeamId);
    if (!voter || !voter.isAlive) return;

    const record: VoteRecord = {
      voterTeamId: data.voterTeamId,
      voterTeamName: data.voterTeamName,
      targetTeamId: data.targetTeamId,
      targetTeamName: data.targetTeamName,
      timestamp: Date.now()
    };

    gameState.voteSession.votes[data.voterTeamId] = record;
    broadcastState();
  });

  socket.on('admin:end_vote', (data: { eliminateHighestVoted?: boolean; manualEliminatedTeamId?: string }) => {
    if (!gameState.voteSession.isActive) return;

    let targetToEliminate: string | undefined = data.manualEliminatedTeamId;

    if (data.eliminateHighestVoted && !targetToEliminate) {
      const counts: Record<string, number> = {};
      Object.values(gameState.voteSession.votes).forEach((v: VoteRecord) => {
        counts[v.targetTeamId] = (counts[v.targetTeamId] || 0) + 1;
      });

      let highestCount = -1;
      let highestTeamId: string | undefined;
      for (const [teamId, count] of Object.entries(counts)) {
        if (count > highestCount) {
          highestCount = count;
          highestTeamId = teamId;
        }
      }
      targetToEliminate = highestTeamId;
    }

    if (targetToEliminate) {
      gameState.voteSession.eliminatedTeamId = targetToEliminate;
      gameState.teams = gameState.teams.map(t => {
        if (t.id === targetToEliminate) {
          return {
            ...t,
            isAlive: false,
            eliminatedAt: Date.now(),
            eliminationReason: 'banishment',
            roleRevealed: true
          };
        }
        return t;
      });
    }

    gameState.voteSession.isActive = false;
    gameState.voteSession.isConcluded = true;
    gameState.voteSession.roundNumber += 1;
    broadcastState();
  });

  socket.on('admin:reset_vote', () => {
    gameState.voteSession = {
      isActive: false,
      roundNumber: gameState.voteSession.roundNumber,
      title: `Rundbordssamling #${gameState.voteSession.roundNumber}`,
      startedAt: 0,
      votes: {},
      isConcluded: false
    };
    broadcastState();
  });

  // 9. TRAITOR CONCLAVE & MURDER (WITH SHIELD PROTECTION)
  socket.on('traitor:send_message', (data: { senderId: string; senderName: string; text: string }) => {
    const msg: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      senderId: data.senderId,
      senderName: data.senderName,
      text: data.text,
      timestamp: Date.now()
    };
    gameState.traitorChat.push(msg);
    broadcastState();
  });

  socket.on('traitor:propose_murder', (data: { proposedByTeamId: string; proposedByTeamName: string; targetTeamId: string; targetTeamName: string; notes?: string }) => {
    const proposal: MurderProposal = {
      id: `prop-${Date.now()}`,
      proposedByTeamId: data.proposedByTeamId,
      proposedByTeamName: data.proposedByTeamName,
      targetTeamId: data.targetTeamId,
      targetTeamName: data.targetTeamName,
      notes: data.notes,
      timestamp: Date.now(),
      status: 'pending'
    };
    gameState.murderProposals.push(proposal);

    gameState.traitorChat.push({
      id: `sys-${Date.now()}`,
      senderId: 'system',
      senderName: 'Forræder-Mødet',
      text: `🗡️ ${data.proposedByTeamName} har udpeget ${data.targetTeamName} til nattens mord. Venter på værternes godkendelse...`,
      timestamp: Date.now(),
      isSystem: true
    });

    broadcastState();
  });

  socket.on('admin:handle_murder_proposal', (data: { proposalId: string; action: 'approved' | 'rejected' }) => {
    const proposal = gameState.murderProposals.find(p => p.id === data.proposalId);
    if (!proposal) return;

    if (data.action === 'approved') {
      const targetTeam = gameState.teams.find(t => t.id === proposal.targetTeamId);

      if (targetTeam && targetTeam.hasShield) {
        proposal.status = 'blocked_by_shield';
        targetTeam.hasShield = false;

        gameState.traitorChat.push({
          id: `sys-${Date.now()}`,
          senderId: 'system',
          senderName: 'Slottets Skjold',
          text: `🛡️ MORDET FEJLEDE! ${proposal.targetTeamName} bar slottets våbenskjold og overlevede nattens angreb!`,
          timestamp: Date.now(),
          isSystem: true
        });

        io.emit('trigger_sound', { soundType: 'shield' });
      } else {
        proposal.status = 'approved';
        gameState.teams = gameState.teams.map(t => {
          if (t.id === proposal.targetTeamId) {
            return {
              ...t,
              isAlive: false,
              eliminatedAt: Date.now(),
              eliminationReason: 'murder',
              roleRevealed: false
            };
          }
          return t;
        });

        gameState.traitorChat.push({
          id: `sys-${Date.now()}`,
          senderId: 'system',
          senderName: 'Slottets Værter',
          text: `☠️ Mordet på ${proposal.targetTeamName} er blevet godkendt og effektueret af værterne!`,
          timestamp: Date.now(),
          isSystem: true
        });
      }
    } else {
      proposal.status = 'rejected';
      gameState.traitorChat.push({
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'Slottets Værter',
        text: `🛡️ Mordet på ${proposal.targetTeamName} blev afvist af værterne.`,
        timestamp: Date.now(),
        isSystem: true
      });
    }

    broadcastState();
  });

  // 10. ADMIN: Reset Game
  socket.on('admin:reset_game', () => {
    gameState = createDefaultState();
    broadcastState();
  });
});

const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🏰 Forræder Server running on http://localhost:${PORT}`);
  console.log(`📱 Local Network URL: http://${localIp}:${PORT}`);
});
