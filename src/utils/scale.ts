import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Design baseline: iPhone 14 / typical 390x844 device
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/**
 * Horizontal scale factor based on screen width.
 */
export const scaleX = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;

/**
 * Vertical scale factor based on screen height.
 */
export const scaleY = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

/**
 * Moderate scale — blends width-based scaling with a dampening factor.
 * Good for font sizes and paddings that shouldn't scale too aggressively.
 * factor=0.5 means 50% of the difference between 1:1 and full width-scale.
 */
export const ms = (size: number, factor = 0.5) =>
  size + (scaleX(size) - size) * factor;

/**
 * Whether this device is considered "small" (height < 700dp).
 */
export const isSmallDevice = SCREEN_HEIGHT < 700;

export { SCREEN_WIDTH, SCREEN_HEIGHT };
