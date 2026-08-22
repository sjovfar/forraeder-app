import React, { useState, useEffect } from 'react';
import { GameState, UserSession, INITIAL_TEAMS, SoundType } from './types';
import { socket } from './socket';
import { soundEngine } from './soundEngine';
import { LoginScreen } from './components/LoginScreen';
import { ParticipantDashboard } from './components/ParticipantDashboard';
import { AdminPanel } from './components/AdminPanel';
import { BroadcastOverlay } from './components/BroadcastOverlay';
import { Shield, Crown, WifiOff, LogOut, AlertTriangle } from 'lucide-react';

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
  const [forceLogoutNotice, setForceLogoutNotice] = useState<string | null>(null);

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
    function onTriggerSound(data: { soundType: SoundType }) {
      if (data?.soundType) {
        soundEngine.playBySoundType(data.soundType);
      }
    }
    function onForceLogout(data: { message?: string }) {
      try {
        localStorage.removeItem('forraeder_session');
      } catch {}
      setSession(null);
      setForceLogoutNotice(data?.message || 'Slottets Værter har nulstillet alle login-sessioner.');
      soundEngine.playGong();
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('state_update', onStateUpdate);
    socket.on('trigger_sound', onTriggerSound);
    socket.on('force_logout', onForceLogout);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('state_update', onStateUpdate);
      socket.off('trigger_sound', onTriggerSound);
      socket.off('force_logout', onForceLogout);
    };
  }, []);

  const handleLogin = (newSession: UserSession) => {
    setForceLogoutNotice(null);
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

      {/* Force Logout Notification Banner on Login Screen */}
      {forceLogoutNotice && !session && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md p-3.5 rounded-2xl bg-gradient-to-r from-[#380a10] via-[#520d17] to-[#380a10] border-2 border-[#ff3855] text-white shadow-2xl text-xs flex items-center justify-between gap-2 animate-bounce">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#ff8095] shrink-0" />
            <span>{forceLogoutNotice}</span>
          </div>
          <button
            onClick={() => setForceLogoutNotice(null)}
            className="text-[10px] uppercase font-bold text-[#f6db7e] hover:underline shrink-0"
          >
            Luk
          </button>
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
