import { io, Socket } from 'socket.io-client';

// Connect to current origin directly (works seamlessly on localhost, local IP, or public HTTPS tunnels like Cloudflare/Localtunnel/Render)
const isDev = import.meta.env.DEV;
const socketUrl = isDev && window.location.port === '5173'
  ? 'http://localhost:3001'
  : window.location.origin;

export const socket: Socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('🔮 Forbundet til Forræder Spilserveren! Socket ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.warn('⚠️ Forbindelse afbrudt:', reason);
});
