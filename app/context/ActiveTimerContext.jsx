import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { statsApi } from '../../services/api';

const ActiveTimerContext = createContext();

const TICK_INTERVAL = 60000;

export function ActiveTimerProvider({ children }) {
  const [liveMinutes, setLiveMinutes] = useState(0);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    statsApi.get().then((data) => {
      setLiveMinutes(data.minutesStudied || 0);
      setInitialLoaded(true);
    }).catch(() => {
      setInitialLoaded(true);
    });
  }, []);

  useEffect(() => {
    function startTimer() {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        setLiveMinutes((prev) => prev + 1);
        statsApi.track('study', 1).catch(() => {});
      }, TICK_INTERVAL);
    }

    function stopTimer() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        startTimer();
      } else if (nextState.match(/inactive|background/)) {
        stopTimer();
      }
      appStateRef.current = nextState;
    });

    if (AppState.currentState === 'active') {
      startTimer();
    }

    return () => {
      stopTimer();
      sub.remove();
    };
  }, []);

  return (
    <ActiveTimerContext.Provider value={{ liveMinutes, setLiveMinutes, initialLoaded }}>
      {children}
    </ActiveTimerContext.Provider>
  );
}

export function useActiveTimer() {
  return useContext(ActiveTimerContext);
}
