import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

// Socket.io React hook — this was tricky to get right
// socket.io auth was broken initially, fixed handshake token
export const useSocket = () => {
  const socketRef = useRef(null);
  const token = useStore((s) => s.token);
  const setSyncing = useStore((s) => s.setSyncing);
  const setSyncProgress = useStore((s) => s.setSyncProgress);

  useEffect(() => {
    if (!token) return;

    // connect with auth token
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      socket.emit('subscribe');
    });

    socket.on('sync_progress', (data) => {
      setSyncing(true);
      setSyncProgress(data);

      if (data.status === 'complete') {
        setSyncing(false);
        toast.success(`Sync complete! ${data.commitsSynced} new commits found.`);
      }
    });

    socket.on('achievement_unlocked', (data) => {
      const { achievement } = data;
      toast.success(
        `🏆 Achievement unlocked: ${achievement.icon} ${achievement.name}`,
        { duration: 6000 }
      );
    });

    socket.on('score_updated', (data) => {
      if (data.risk_flag === 'high') {
        toast.error(
          `⚠️ Your wellness score dropped to ${data.score}. Consider taking a break.`,
          { duration: 8000 }
        );
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, setSyncing, setSyncProgress]);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    emit,
    isConnected: socketRef.current?.connected || false,
  };
};

export default useSocket;
