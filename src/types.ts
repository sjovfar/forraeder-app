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

export interface PartnerSwapSession {
  isActive: boolean;
  durationSeconds: number;
  startedAt: number;
  expiresAt: number;
  winnerTeamId?: string;
  winnerTeamName?: string;
  winnerTimestamp?: number;
  isCompleted: boolean;
  swappedDetails?: {
    teamId: string;
    originalPlayer: string;
    newPlayer: string;
    fromDeadTeamName: string;
  };
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
  partnerSwap: PartnerSwapSession;
  recruitment: RecruitmentSession | null;
  morningReveal: MorningRevealSession | null;
  murderProposals: MurderProposal[];
  traitorChat: ChatMessage[];
  activeBroadcast: BroadcastEvent | null;
  gameStarted: boolean;
  lastUpdated: number;
}

export const INITIAL_TEAMS: Array<{ id: string; name: string; players: string[] }> = [
  { id: 'team-1', name: 'Nicolai Herbert / Tobias Terney', players: ['Nicolai Herbert', 'Tobias Terney'] },
  { id: 'team-2', name: 'Magnus Libergren / Freja Jensen', players: ['Magnus Libergren', 'Freja Jensen'] },
  { id: 'team-3', name: 'Andreas Rosling / Laura??', players: ['Andreas Rosling', 'Laura??'] },
  { id: 'team-4', name: 'Rasmus Boas / Rebekka Busck', players: ['Rasmus Boas', 'Rebekka Busck'] },
  { id: 'team-5', name: 'Philip Koch / Sebastian Poulsen', players: ['Philip Koch', 'Sebastian Poulsen'] },
  { id: 'team-6', name: 'Nicolai Gregersen / Anna Søeberg', players: ['Nicolai Gregersen', 'Anna Søeberg'] },
  { id: 'team-7', name: 'Mikkel Aarup / Maja Mondrup', players: ['Mikkel Aarup', 'Maja Mondrup'] },
  { id: 'team-8', name: 'Ivan Mirmojtahedi / Gustav Worm', players: ['Ivan Mirmojtahedi', 'Gustav Worm'] },
  { id: 'team-9', name: 'Jakob Hemmingsen / Nicoline Mortensen', players: ['Jakob Hemmingsen', 'Nicoline Mortensen'] },
  { id: 'team-10', name: 'Christian Liebe-Lind / Clara Steen-Petersen', players: ['Christian Liebe-Lind', 'Clara Steen-Petersen'] },
  { id: 'team-11', name: 'Thomas Asboe / Cathrine Albrechtslund', players: ['Thomas Asboe', 'Cathrine Albrechtslund'] },
  { id: 'team-12', name: 'Anna Keergaard / Christian Daniel Gawelda Frøslev', players: ['Anna Keergaard', 'Christian Daniel Gawelda Frøslev'] },
  { id: 'team-13', name: 'Julius Heilmann / Caroline Lindeman', players: ['Julius Heilmann', 'Caroline Lindeman'] },
  { id: 'team-14', name: 'Caroline Nygaard / Jesper Møller', players: ['Caroline Nygaard', 'Jesper Møller'] },
];

export const ADMIN_USERS = [
  { id: 'admin-julius', name: 'Julius Tuxen (Vært)' },
  { id: 'admin-karoline', name: 'Karoline Weeke (Vært)' },
];
