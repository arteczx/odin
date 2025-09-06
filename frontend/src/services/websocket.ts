import { io, Socket } from 'socket.io-client';
import { WebSocketMessage } from '../types';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, ((message: WebSocketMessage) => void)[]> = new Map();

  connect(projectId: string): void {
    const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
    
    this.socket = io(WS_URL, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      // Join project room
      this.socket?.emit('join_project', { project_id: projectId });
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('project_update', (message: WebSocketMessage) => {
      this.notifyListeners(message.type, message);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribe(eventType: string, callback: (message: WebSocketMessage) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)?.push(callback);
  }

  unsubscribe(eventType: string, callback: (message: WebSocketMessage) => void): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notifyListeners(eventType: string, message: WebSocketMessage): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => callback(message));
    }
  }
}

export const wsService = new WebSocketService();
export default wsService;
