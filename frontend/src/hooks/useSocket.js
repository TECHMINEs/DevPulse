import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
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
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

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
      setIsConnected(true);
      socket.emit('subscribe');
    });

    socket.on('sync_progress', (data) => {
      setSyncing(true);
      setSyncProgress(data);

      if (data.status === 'complete') {
        setSyncing(false);
        toast.success(`Sync complete! ${data.commitsSynced} new commits found.`);
        queryClient.invalidateQueries();
      }
    });

    socket.on('achievement_unlocked', (data) => {
      const { achievement } = data;
      toast.success(
        `🏆 Achievement unlocked: ${achievement.icon} ${achievement.name}`,
        { duration: 6000 }
      );
      
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1','#8b5cf6','#d946ef','#f59e0b','#10b981'], ticks: 250 });

      if (achievement.points >= 20) {
        setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ['#6366f1','#8b5cf6'] }), 200);
        setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ['#d946ef','#f59e0b'] }), 350);
      }

      if (achievement.points >= 50) {
        const end = Date.now() + 2000;
        const frame = () => {
          confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#6366f1','#d946ef'] });
          confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#6366f1','#d946ef'] });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        setTimeout(frame, 600);
      }
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
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
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
    isConnected,
  };
};

export default useSocket;
