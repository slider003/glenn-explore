declare module '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions' {
  export default class MapboxDirections {
    constructor(options: {
      accessToken?: string;
      unit?: string;
      profile?: string;
      alternatives?: boolean;
      geometries?: string;
      controls?: {
        inputs?: boolean;
        instructions?: boolean;
        profileSwitcher?: boolean;
      };
      flyTo?: boolean;
      interactive?: boolean;
      steps?: boolean;
      congestion?: boolean;
      language?: string;
      placeholderOrigin?: string;
      placeholderDestination?: string;
      zoom?: number;
      placeName?: string;
      geocodingOptions?: any;
    });

    setOrigin(origin: Array<number> | string): this;
    setDestination(destination: Array<number> | string): this;
    setProfile(profile: string): this;
    getOrigin(): Array<number> | string;
    getDestination(): any;
    removeRoutes(): this;
    addWaypoint(index: number, waypoint: Array<number>): this;
    setWaypoint(index: number, waypoint: Array<number>): this;
    removeWaypoint(index: number): this;
    getWaypoints(): Array<any>;
    reverse(): this;
    on(type: string, fn: Function): this;
  }
} 