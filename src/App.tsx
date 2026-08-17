import React, { useState, useEffect } from 'react';
import { GameState, UserSession, INITIAL_TEAMS } from './types';
import { socket } from './socket';
import { LoginScreen } from './components/LoginScreen';
import { ParticipantDashboard } from './components/ParticipantDashboard';
import { AdminPanel } from './components/AdminPanel';
import { BroadcastOverlay } from './components/BroadcastOverlay';
import { Shield, Crown, Wifi, WifiOff, LogOut, ArrowLeftRight } from 'lucide-react';

export const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('forraeder_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [gameState, setGameState] = useState<GameState>({
    teams: INITIAL_TEAMS.map(t => ({
      id: t.id,
      name: t.name,
      players: t.players,
      role: 'unassigned',
      isAlive: true,
      roleRevealed: false
    })),
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
      durationSeconds: 150,
      startedAt: 0,
      expiresAt: 0,
      isCompleted: false
    },
    murderProposals: [],
    traitorChat: [],
    activeBroadcast: null,
    gameStarted: false,
    lastUpdated: Date.now()
  });

  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [dismissedBroadcastId, setDismissedBroadcastId] = useState<string | null>(null);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
    }
    function onStateUpdate(newState: GameState) {
      setGameState(newState);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('state_update', onStateUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('state_update', onStateUpdate);
    };
  }, []);

  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
    try {
      localStorage.setItem('forraeder_session', JSON.stringify(newSession));
    } catch {
      // Ignore localStorage error
    }
  };

  const handleLogout = () => {
    setSession(null);
    try {
      localStorage.removeItem('forraeder_session');
    } catch {
      // Ignore
    }
  };

  // Check if there is an active broadcast that hasn't been locally dismissed yet
  const activeBroadcastToShow =
    gameState.activeBroadcast && gameState.activeBroadcast.id !== dismissedBroadcastId
      ? gameState.activeBroadcast
      : null;

  return (
    <div className="min-h-screen bg-[#0a090d] text-[#e6dfd1] font-sans antialiased selection:bg-[#c41e3a] selection:text-white">
      {/* Network connectivity pill indicator */}
      {!isConnected && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-red-950/90 border border-red-600 text-red-200 text-[10px] font-bold flex items-center gap-1.5 shadow-xl animate-pulse">
          <WifiOff className="w-3 h-3" />
          <span>Genforbinder til Slottet...</span>
        </div>
      )}

      {/* Fullscreen Broadcast Popup Modal */}
      {activeBroadcastToShow && (
        <BroadcastOverlay
          broadcast={activeBroadcastToShow}
          onDismiss={() => setDismissedBroadcastId(activeBroadcastToShow.id)}
        />
      )}

      {/* Screen Router */}
      {!session ? (
        <LoginScreen onLogin={handleLogin} />
      ) : session.type === 'admin' ? (
        <div className="min-h-screen p-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between py-2 mb-3 border-b border-[#d4af37]/20">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#d4af37]" />
              <span className="text-xs font-bold text-[#f6db7e]">
                Logget ind som: {session.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-[#9e9585] hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Skift Bruger
            </button>
          </div>

          <AdminPanel gameState={gameState} adminName={session.name} />
        </div>
      ) : (
        <ParticipantDashboard
          session={session}
          gameState={gameState}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};
export default App;
