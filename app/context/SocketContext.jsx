import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getStoredUser, getToken } from '../../services/api';
import { API_BASE } from '../../constants/api';

const SocketContext = createContext(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let mounted = true;
    let retries = 0;

    async function tryConnect() {
      const user = await getStoredUser();
      const token = await getToken();
      if (!mounted) return;

      if (!user || !token) {
        if (retries < 30) {
          retries++;
          setTimeout(tryConnect, 2000);
        }
        return;
      }

      setUserId(user._id);

      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const sock = io(API_BASE, {
        query: { userId: user._id, token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      sock.on('connect', () => {
        if (mounted) setConnected(true);
      });

      sock.on('disconnect', () => {
        if (mounted) setConnected(false);
      });

      sock.on('connect_error', () => {});

      socketRef.current = sock;
    }

    tryConnect();

    const interval = setInterval(() => {
      if (!socketRef.current && mounted) {
        tryConnect();
      }
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}
