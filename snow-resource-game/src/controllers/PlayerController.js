import * as THREE from 'three';
import {
  clamp,
  dampQuaternion
} from '../utils/MathUtils.js';

const KEY_TO_DIRECTION = new Map([
  ['KeyW', [0, -1]],
  ['ArrowUp', [0, -1]],
  ['KeyS', [0, 1]],
  ['ArrowDown', [0, 1]],
  ['KeyA', [-1, 0]],
  ['ArrowLeft', [-1, 0]],
  ['KeyD', [1, 0]],
  ['ArrowRight', [1, 0]]
]);

export class PlayerController {
  constructor({
    player,
    camera,
    canvas,
    speed = 7,
    arrivalThreshold = 0.35,
    rotationSmoothing = 12,
    bounds = {
      minX: -17,
      maxX: 17,
      minZ: -17,
      maxZ: 17
    }
  }) {
    this.player = player;
    this.camera = camera;
    this.canvas = canvas;

    this.speed = speed;
    this.arrivalThreshold = arrivalThreshold;
    this.rotationSmoothing = rotationSmoothing;
    this.bounds = { ...bounds };

    this.isMoving = false;
    this.velocity = new THREE.Vector3();
    this.moveDirection = new THREE.Vector3();
    this.destination = null;

    this.keys = new Set();

    this.pointerNdc = new THREE.Vector2();
    this.pointerRaycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(
      new THREE.Vector3(0, 1, 0),
      0
    );

    this.targetQuaternion = new THREE.Quaternion();
    this.cameraForward = new THREE.Vector3();
    this.cameraRight = new THREE.Vector3();
    this.inputVector = new THREE.Vector3();
    this.worldDirection = new THREE.Vector3();
    this.destinationDirection = new THREE.Vector3();
    this.playerPosition = new THREE.Vector3();
    this.intersection = new THREE.Vector3();

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener(
      'pointerdown',
      this.onPointerDown,
      { passive: false }
    );
  }

  setBounds(bounds) {
    this.bounds = {
      ...this.bounds,
      ...bounds
    };

    this.clampPosition();
  }

  onKeyDown(event) {
    if (!KEY_TO_DIRECTION.has(event.code)) {
      return;
    }

    event.preventDefault();
    this.keys.add(event.code);
    this.destination = null;
  }

  onKeyUp(event) {
    this.keys.delete(event.code);
  }

  onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    event.preventDefault();

    const rect = this.canvas.getBoundingClientRect();

    this.pointerNdc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    this.pointerRaycaster.setFromCamera(
      this.pointerNdc,
      this.camera
    );

    if (
      this.pointerRaycaster.ray.intersectPlane(
        this.groundPlane,
        this.intersection
      )
    ) {
      this.destination = this.intersection.clone();
      this.destination.y = 0;
    }
  }

  readKeyboardDirection() {
    this.inputVector.set(0, 0, 0);

    for (const key of this.keys) {
      const direction = KEY_TO_DIRECTION.get(key);

      if (direction) {
        this.inputVector.x += direction[0];
        this.inputVector.z += direction[1];
      }
    }

    return this.inputVector;
  }

  update(deltaTime) {
    const keyboardInput = this.readKeyboardDirection();
    const hasKeyboardInput = keyboardInput.lengthSq() > 0;

    if (hasKeyboardInput) {
      this.destination = null;

      this.camera.getWorldDirection(this.cameraForward);
      this.cameraForward.y = 0;
      this.cameraForward.normalize();

      this.cameraRight.crossVectors(
        this.cameraForward,
        new THREE.Vector3(0, 1, 0)
      ).normalize();

      this.worldDirection
        .set(0, 0, 0)
        .addScaledVector(
          this.cameraRight,
          keyboardInput.x
        )
        .addScaledVector(
          this.cameraForward,
          keyboardInput.z
        );
    } else if (this.destination) {
      this.player.getWorldPosition(this.playerPosition);

      this.destinationDirection
        .subVectors(this.destination, this.playerPosition)
        .setY(0);

      if (
        this.destinationDirection.length() <=
        this.arrivalThreshold
      ) {
        this.destination = null;
        this.worldDirection.set(0, 0, 0);
      } else {
        this.worldDirection.copy(
          this.destinationDirection.normalize()
        );
      }
    } else {
      this.worldDirection.set(0, 0, 0);
    }

    if (this.worldDirection.lengthSq() > 0) {
      this.worldDirection.normalize();

      this.velocity.copy(this.worldDirection)
        .multiplyScalar(this.speed);

      this.player.position.addScaledVector(
        this.velocity,
        deltaTime
      );

      this.isMoving = true;
      this.rotateTowardsMovement(deltaTime);
    } else {
      this.velocity.set(0, 0, 0);
      this.isMoving = false;
    }

    this.clampPosition();
  }

  rotateTowardsMovement(deltaTime) {
    const angle = Math.atan2(
      this.worldDirection.x,
      this.worldDirection.z
    );

    this.targetQuaternion.setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      angle
    );

    dampQuaternion(
      this.player.quaternion,
      this.targetQuaternion,
      this.rotationSmoothing,
      deltaTime
    );
  }

  clampPosition() {
    this.player.position.x = clamp(
      this.player.position.x,
      this.bounds.minX,
      this.bounds.maxX
    );

    this.player.position.z = clamp(
      this.player.position.z,
      this.bounds.minZ,
      this.bounds.maxZ
    );
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener(
      'pointerdown',
      this.onPointerDown
    );
  }
}
