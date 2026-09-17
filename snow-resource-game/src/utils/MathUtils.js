import * as THREE from 'three';

export const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

export const damp = (current, target, smoothing, deltaTime) => {
  const factor = 1 - Math.exp(-smoothing * deltaTime);
  return THREE.MathUtils.lerp(current, target, factor);
};

export const dampVector3 = (
  current,
  target,
  smoothing,
  deltaTime,
  result = current
) => {
  const factor = 1 - Math.exp(-smoothing * deltaTime);
  return result.lerpVectors(current, target, factor);
};

export const dampQuaternion = (
  current,
  target,
  smoothing,
  deltaTime
) => {
  const factor = 1 - Math.exp(-smoothing * deltaTime);
  return current.slerp(target, factor);
};

export const easeInOutCubic = (value) => {
  const t = clamp(value, 0, 1);
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const randomRange = (min, max) =>
  min + Math.random() * (max - min);

export const randomSign = () =>
  Math.random() < 0.5 ? -1 : 1;

export const createId = (prefix = 'id') =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
