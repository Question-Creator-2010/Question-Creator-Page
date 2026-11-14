import test from 'node:test';
import assert from 'node:assert/strict';
import { binarizeRgbaBuffer, computeOtsuThreshold } from './imagePreprocess';

test('computeOtsuThreshold separates dark ink pixels from light paper background', () => {
  // 50 dark ink pixels (val ~30) and 50 bright paper pixels (val ~230)
  const grays = new Uint8Array(100);
  for (let i = 0; i < 50; i++) grays[i] = 30;
  for (let i = 50; i < 100; i++) grays[i] = 230;

  const t = computeOtsuThreshold(grays);
  assert.ok(t > 30 && t < 230, `Expected threshold between 30 and 230, got ${t}`);
});

test('binarizeRgbaBuffer converts faint dark ink to pure black (0) and off-white paper to pure white (255)', () => {
  // 2 pixels: dark ink (40, 40, 40) and light paper (225, 220, 215)
  const buffer = new Uint8ClampedArray([
    40, 40, 40, 255,
    225, 220, 215, 255,
  ]);
  binarizeRgbaBuffer(buffer);
  assert.deepEqual(Array.from(buffer), [
    0, 0, 0, 255,
    255, 255, 255, 255,
  ]);
});
