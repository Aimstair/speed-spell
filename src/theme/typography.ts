import { StyleSheet } from 'react-native';

export const TYPOGRAPHY = StyleSheet.create({
  h1: {
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: -2,
    textTransform: 'uppercase',
  },
  h2: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  h3: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#666666',
  },
  body: {
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 20,
    fontWeight: '600',
  }
});
