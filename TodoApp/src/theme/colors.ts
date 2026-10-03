export const Colors = {
  background: '#0D0D0D',
  card: '#1A1A2E',
  cardElevated: '#16213E',
  accent: '#E94560',
  accentSoft: '#FF6B81',
  text: '#EAEAEA',
  textMuted: '#888899',
  success: '#2ECC71',
  warning: '#F39C12',
  danger: '#E74C3C',
  border: '#2A2A4A',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.6)',
} as const;

export type ColorKey = keyof typeof Colors;
