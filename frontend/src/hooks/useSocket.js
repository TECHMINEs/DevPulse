import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { io } from 'socket.io-client';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

// Socket.io React hook — this was tricky to get right
// CRIT-13: reads memoryToken (non-persisted) instead of token to avoid
// localStorage exposure while still authenticating the WebSocket connection.
export const useSocket = () => {
  const socketRef = useRef(null);
  const setSyncing = useStore((s) => s.setSyncing);
  const setSyncProgress = useStore((s) => s.setSyncProgress);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // connect using httpOnly cookie
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
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
      
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#00FFFF','#FF5F1F','#39FF14','#f59e0b','#39FF14'], ticks: 250 });

      if (achievement.points >= 20) {
        setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ['#00FFFF','#FF5F1F'] }), 200);
        setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ['#39FF14','#f59e0b'] }), 350);
      }

      if (achievement.points >= 50) {
        const end = Date.now() + 2000;
        const frame = () => {
          confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#00FFFF','#39FF14'] });
          confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#00FFFF','#39FF14'] });
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

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Reconnection is automatic; surface the state through isConnected instead of the console
    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [setSyncing, setSyncProgress, queryClient]);

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
