export type RoleType = 'loyal' | 'traitor' | 'unassigned';

export type EliminationReason = 'murder' | 'banishment' | 'challenge' | 'manual' | 'none';

export interface Team {
  id: string;
  name: string;
  players: string[];
  role: RoleType;
  isAlive: boolean;
  hasShield: boolean; // Shield against traitor murder
  eliminatedAt?: number;
  eliminationReason?: EliminationReason;
  roleRevealed: boolean;
}

export interface UserSession {
  type: 'team' | 'admin';
  id: string;
  name: string;
}

export interface VoteRecord {
  voterTeamId: string;
  voterTeamName: string;
  targetTeamId: string;
  targetTeamName: string;
  timestamp: number;
}

export interface VoteSession {
  isActive: boolean;
  roundNumber: number;
  title: string;
  startedAt: number;
  votes: Record<string, VoteRecord>; // voterTeamId -> VoteRecord
  isConcluded: boolean;
  eliminatedTeamId?: string;
}

export interface MurderProposal {
  id: string;
  proposedByTeamId: string;
  proposedByTeamName: string;
  targetTeamId: string;
  targetTeamName: string;
  notes?: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected' | 'blocked_by_shield';
}

export interface RecruitmentSession {
  id: string;
  isActive: boolean;
  targetTeamId: string;
  targetTeamName: string;
  proposedByTeamName: string;
  status: 'pending_admin' | 'dispatched' | 'accepted' | 'rejected' | 'rejected_by_admin';
  timestamp: number;
}

export interface MorningRevealSession {
  isActive: boolean;
  murderedTeamId?: string;
  murderedTeamName?: string;
  noMurder?: boolean;
  revealedTeamIds: string[];
  timestamp: number;
  isConcluded: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export type SoundType = 
  | 'bell' 
  | 'gong' 
  | 'alarm' 
  | 'whisper' 
  | 'victory' 
  | 'heartbeat' 
  | 'knife' 
  | 'thunder' 
  | 'drone'
  | 'shield';

export interface BroadcastEvent {
  id: string;
  title: string;
  message: string;
  soundType: SoundType;
  timestamp: number;
  sender: string;
}

export interface GameState {
  teams: Team[];
  voteSession: VoteSession;
  recruitment: RecruitmentSession | null;
  morningReveal: MorningRevealSession | null;
  murderProposals: MurderProposal[];
  traitorChat: ChatMessage[];
  activeBroadcast: BroadcastEvent | null;
  gameStarted: boolean;
  lastUpdated: number;
}

export const INITIAL_TEAMS: Array<{ id: string; name: string; players: string[] }> = [];

export const ADMIN_USERS = [
  { id: 'admin-julius', name: 'Julius Tuxen (Vært)' },
  { id: 'admin-karoline', name: 'Karoline Weeke (Vært)' },
];
