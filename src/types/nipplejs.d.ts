declare module 'nipplejs' {
  export interface JoystickOptions {
    zone: HTMLElement;
    mode?: 'static' | 'semi' | 'dynamic';
    position?: { top?: string; left?: string; bottom?: string; right?: string };
    color?: string;
    size?: number;
    threshold?: number;
    fadeTime?: number;
    multitouch?: boolean;
    maxNumberOfNipples?: number;
    dataOnly?: boolean;
    lockX?: boolean;
    lockY?: boolean;
    restJoystick?: boolean;
    restOpacity?: number;
    catchDistance?: number;
    shape?: string;
    dynamicPage?: boolean;
  }

  export interface JoystickManager {
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
    destroy(): void;
    get(id?: number): JoystickInstance | JoystickInstance[];
    ids: string[];
    id: string;
    options: JoystickOptions;
  }

  export interface JoystickInstance {
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
    destroy(): void;
    identifier: number;
    position: { x: number; y: number };
    frontPosition: { x: number; y: number };
    ui: {
      el: HTMLElement;
      front: HTMLElement;
      back: HTMLElement;
    };
  }

  export interface JoystickOutputData {
    angle: {
      radian: number;
      degree: number;
    };
    direction: {
      x: 'left' | 'right' | 'none';
      y: 'up' | 'down' | 'none';
      angle: string;
    };
    force: number;
    distance: number;
    pressure: number;
    identifier: number;
    position: {
      x: number;
      y: number;
    };
    vector: {
      x: number;
      y: number;
    };
    raw: {
      distance: number;
      position: {
        x: number;
        y: number;
      };
      angle: {
        radian: number;
        degree: number;
      };
    };
    instance: JoystickInstance;
  }

  export interface Nipplejs {
    create(options: JoystickOptions): JoystickManager;
  }

  const nipplejs: Nipplejs;
  export default nipplejs;
} 