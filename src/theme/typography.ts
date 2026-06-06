import { StyleSheet } from 'react-native';
import { ms } from '../utils/scale';

export const TYPOGRAPHY = StyleSheet.create({
  h1: {
    fontSize: ms(72, 0.3),
    fontWeight: '900',
    letterSpacing: -2,
    textTransform: 'uppercase',
  },
  h2: {
    fontSize: ms(32, 0.3),
    fontWeight: '800',
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  h3: {
    fontSize: ms(24, 0.3),
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: ms(12, 0.3),
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#666666',
  },
  body: {
    fontSize: ms(16, 0.3),
    fontWeight: '600',
  },
  button: {
    fontSize: ms(16, 0.3),
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: ms(20, 0.3),
    fontWeight: '600',
  }
});
