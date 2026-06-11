import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, Colors } from '../../constants/theme';

const ThemeContext = createContext();

const THEME_KEY = 'nursphere_theme';

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [storedTheme, setStoredTheme] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === 'dark' || val === 'light') setStoredTheme(val);
      setReady(true);
    });
  }, []);

  const isDark = ready ? (storedTheme ? storedTheme === 'dark' : systemScheme === 'dark') : systemScheme === 'dark';
  const theme = isDark ? DarkColors : Colors;

  const toggleDarkMode = useCallback(async (value) => {
    const mode = value ? 'dark' : 'light';
    setStoredTheme(mode);
    await AsyncStorage.setItem(THEME_KEY, mode);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
