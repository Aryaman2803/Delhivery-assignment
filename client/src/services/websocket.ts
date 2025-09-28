import { io, Socket } from 'socket.io-client';
import { TelemetryData } from '../types';

const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3001';

export class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(WEBSOCKET_URL, {
        auth: { token },
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('telemetry', (data: TelemetryData) => {
        this.emit('telemetry', data);
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        this.emit('disconnect');
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  subscribe(robotIds: string[]) {
    if (this.socket) {
      this.socket.emit('subscribe', { robotIds });
    }
  }

  unsubscribe(robotIds: string[]) {
    if (this.socket) {
      this.socket.emit('unsubscribe', { robotIds });
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  get connected(): boolean {
    return this.socket?.connected || false;
  }
}

export const webSocketService = new WebSocketService();