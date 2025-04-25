// Base API response types
export interface ModelResponse {
  modelId: string;
  name: string;
  type: 'car' | 'walking';  // Make this strict
  price: number;
  isPremium: boolean;
  isUnlocked: boolean;
  isActive: boolean;
  isFeatured: boolean;
  thumbnailUrl: string | null;
  modelUrl: string | null;
  config: ModelConfig;
  screenshot: string | null;
}

export interface PurchaseResponse {
  checkoutUrl: string;
}

export interface UnlockedModel {
  modelId: string;
  purchasedAt: string;
}

// Core model configuration types
export interface ModelObject {
  obj: string;
  type: string;
  scale: number;
  units: string;
  rotation: ModelRotation;
  anchor: string;
  elevationOffset?: number;
  screenshot?: string;
}

export interface ModelRotation {
  x: number;
  y: number;
  z: number;
}

// Physics types
export interface PlayerPhysics {
  walkMaxVelocity: number;
  runMaxVelocity: number;
  walkAcceleration: number;
  runAcceleration: number;
  deceleration: number;
  rotationSpeed: number;
  jumpForce: number;
  gravity: number;
}

export interface CarPhysics {
  maxSpeed: number;
  acceleration: number;
  brakeForce: number;
  reverseSpeed: number;
  turnSpeed: number;
  friction: number;
}

// Animation types
export interface PlayerWalkingAnimation {
  walkSpeed: number;
  runSpeed: number;
  idleAnimation: string;
  walkAnimation: string;
  runAnimation: string;
}

export interface CarDrivingAnimation {
  drivingAnimation: string;
}

// Config types
export interface PlayerModelConfig {
  model: ModelObject;
  physics: PlayerPhysics;
  walkingAnimation: PlayerWalkingAnimation;
}

export interface CarModelConfig {
  model: ModelObject;
  physics: CarPhysics;
  drivingAnimation: CarDrivingAnimation;
}

export type ModelConfig = PlayerModelConfig | CarModelConfig; 