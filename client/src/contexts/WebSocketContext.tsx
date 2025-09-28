import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TelemetryData } from '../types';
import { webSocketService } from '../services/websocket';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  connected: boolean;
  telemetryData: Map<string, TelemetryData>;
  subscribe: (robotIds: string[]) => void;
  unsubscribe: (robotIds: string[]) => void;
  connectionError: string | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const [telemetryData, setTelemetryData] = useState<Map<string, TelemetryData>>(new Map());
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!isAuthenticated || !token) {
      webSocketService.disconnect();
      setConnected(false);
      return;
    }

    const connectWebSocket = async () => {
      try {
        await webSocketService.connect(token);
        setConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
      } catch (error) {
        setConnectionError('Failed to connect to WebSocket');
        setConnected(false);
        
        // Retry logic
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
          }, 2000 * (reconnectAttempts + 1)); // Exponential backoff
        }
      }
    };

    // WebSocket event listeners
    const handleTelemetry = (data: TelemetryData) => {
      setTelemetryData(prev => {
        const newMap = new Map(prev);
        newMap.set(data.robotId, data);
        return newMap;
      });
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    webSocketService.on('telemetry', handleTelemetry);
    webSocketService.on('disconnect', handleDisconnect);

    connectWebSocket();

    return () => {
      webSocketService.off('telemetry', handleTelemetry);
      webSocketService.off('disconnect', handleDisconnect);
      webSocketService.disconnect();
    };
  }, [token, isAuthenticated, reconnectAttempts]);

  const subscribe = (robotIds: string[]) => {
    webSocketService.subscribe(robotIds);
  };

  const unsubscribe = (robotIds: string[]) => {
    webSocketService.unsubscribe(robotIds);
  };

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        telemetryData,
        subscribe,
        unsubscribe,
        connectionError,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};