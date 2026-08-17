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
  EliminationReason
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

// Helper to get local network IP address
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

// Initial state generator
function createDefaultState(): GameState {
  const teams: Team[] = INITIAL_TEAMS.map((t) => ({
    id: t.id,
    name: t.name,
    players: t.players,
    role: 'unassigned',
    isAlive: true,
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
    partnerSwap: {
      isActive: false,
      durationSeconds: 150, // 2.5 minutes
      startedAt: 0,
      expiresAt: 0,
      isCompleted: false
    },
    murderProposals: [],
    traitorChat: [
      {
        id: 'msg-init',
        senderId: 'system',
        senderName: 'Slottets Tavshed',
        text: 'Forrædernes konklave er åben. Her planlægges nattens ugerninger i hemmelighed.',
        timestamp: Date.now(),
        isSystem: true
      }
    ],
    activeBroadcast: null,
    gameStarted: false,
    lastUpdated: Date.now()
  };
}

// Load or initialize state
let gameState: GameState = createDefaultState();

try {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    gameState = JSON.parse(data);
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
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Socket.IO real-time handlers
io.on('connection', (socket: Socket) => {
  socket.emit('state_update', gameState);

  // 1. ADMIN: Assign Roles
  socket.on('admin:set_roles', (data: { assignments?: Record<string, RoleType>; randomize?: boolean }) => {
    if (data.randomize) {
      const teamIds = gameState.teams.map(t => t.id);
      const shuffled = [...teamIds].sort(() => 0.5 - Math.random());
      const traitorIds = new Set(shuffled.slice(0, 3));

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

  // 2. ADMIN: Set Team Status
  socket.on('admin:set_status', (data: { 
    teamId: string; 
    isAlive: boolean; 
    reason?: EliminationReason; 
    roleRevealed?: boolean;
    customPlayerNames?: string[];
  }) => {
    gameState.teams = gameState.teams.map(t => {
      if (t.id === data.teamId) {
        return {
          ...t,
          isAlive: data.isAlive,
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

  // 3. ADMIN: Broadcast Alert
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

  // 4. ADMIN & VOTING
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

  // 5. PARTNER SWAP
  socket.on('admin:start_partner_swap', (data: { durationSeconds?: number }) => {
    const duration = data?.durationSeconds || 150;
    const now = Date.now();
    gameState.partnerSwap = {
      isActive: true,
      durationSeconds: duration,
      startedAt: now,
      expiresAt: now + duration * 1000,
      winnerTeamId: undefined,
      winnerTeamName: undefined,
      winnerTimestamp: undefined,
      isCompleted: false
    };
    broadcastState();
  });

  socket.on('partner_swap:claim', (data: { teamId: string; teamName: string }) => {
    if (!gameState.partnerSwap.isActive) return;
    if (gameState.partnerSwap.winnerTeamId) return;

    const team = gameState.teams.find(t => t.id === data.teamId);
    if (!team || !team.isAlive) return;

    if (Date.now() > gameState.partnerSwap.expiresAt) return;

    gameState.partnerSwap.winnerTeamId = data.teamId;
    gameState.partnerSwap.winnerTeamName = data.teamName;
    gameState.partnerSwap.winnerTimestamp = Date.now();
    gameState.partnerSwap.isActive = false;
    broadcastState();
  });

  socket.on('admin:confirm_partner_swap', (data: {
    winningTeamId: string;
    playerToReplace: string;
    newPlayerName: string;
    fromDeadTeamName: string;
  }) => {
    const team = gameState.teams.find(t => t.id === data.winningTeamId);
    if (team) {
      const newPlayers = team.players.map(p => p === data.playerToReplace ? data.newPlayerName : p);
      team.players = newPlayers;
      team.name = newPlayers.join(' / ');
      
      gameState.partnerSwap.isCompleted = true;
      gameState.partnerSwap.swappedDetails = {
        teamId: data.winningTeamId,
        originalPlayer: data.playerToReplace,
        newPlayer: data.newPlayerName,
        fromDeadTeamName: data.fromDeadTeamName
      };
    }
    broadcastState();
  });

  socket.on('admin:reset_partner_swap', () => {
    gameState.partnerSwap = {
      isActive: false,
      durationSeconds: 150,
      startedAt: 0,
      expiresAt: 0,
      isCompleted: false
    };
    broadcastState();
  });

  // 6. TRAITOR CONCLAVE
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
      text: `🗡️ ${data.proposedByTeamName} har udpeget ${data.targetTeamName} til eliminering! Venter på værternes eksekvering.`,
      timestamp: Date.now(),
      isSystem: true
    });

    broadcastState();
  });

  socket.on('admin:handle_murder_proposal', (data: { proposalId: string; action: 'approved' | 'rejected' }) => {
    const proposal = gameState.murderProposals.find(p => p.id === data.proposalId);
    if (!proposal) return;

    proposal.status = data.action;

    if (data.action === 'approved') {
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
    } else {
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

  // 7. ADMIN: Reset
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
