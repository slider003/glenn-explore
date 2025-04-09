declare module 'threebox-plugin' {
  export class Threebox {
    constructor(map: any, glContext: any, options?: any);
    
    // Common Threebox methods
    add(obj: any, layerId?: string, sourceId?: string): void;
    update(): void;
    remove(obj: any): void;
    clear(layerId?: string, dispose?: boolean): Promise<void>;
    dispose(): Promise<void>;
    loadObj(options: any, callback: (obj: any) => void): void;
    Object3D(options: any): any;
    map: any;
    
    // Properties
    lights: any;
    world: any;
    defaultLights(): void;
  }
} 