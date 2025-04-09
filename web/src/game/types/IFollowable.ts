export interface IFollowable {
  coordinates: [number, number];  // [longitude, latitude]
  rotation: { x: number; y: number; z: number };
  elevation?: number;  // Optional elevation
} 