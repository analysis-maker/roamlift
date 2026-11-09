import { useColorScheme } from 'react-native';

const light = {
  bg: '#F4F3EF',
  card: '#FFFFFF',
  ink: '#10181C',
  muted: '#5B666B',
  line: '#DEDBD3',
  accent: '#FF9F1C',
  onAccent: '#10181C',
  accentSoft: '#FFF1DC',
  good: '#1F8A5B',
  warn: '#B4570B',
};

const dark: typeof light = {
  bg: '#0C1215',
  card: '#151E22',
  ink: '#EEF1F0',
  muted: '#98A3A7',
  line: '#26323A',
  accent: '#FFB04A',
  onAccent: '#10181C',
  accentSoft: '#2A2216',
  good: '#4CC38A',
  warn: '#F0A050',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const space = (n: number) => n * 4;
