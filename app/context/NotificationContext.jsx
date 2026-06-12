import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { notificationsApi } from '../../services/api';

const NotificationContext = createContext();

const POLL_INTERVAL = 30000;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationsApi.get();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    function startPolling() {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    }

    function stopPolling() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        fetchNotifications();
        startPolling();
      } else if (nextState.match(/inactive|background/)) {
        stopPolling();
      }
      appStateRef.current = nextState;
    });

    if (AppState.currentState === 'active') {
      startPolling();
    }

    return () => {
      stopPolling();
      sub.remove();
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationsApi.markRead(id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      setUnreadCount(0);
    } catch {}
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
