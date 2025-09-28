export interface Robot {
  _id: string;
  name: string;
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  location: {
    x: number;
    y: number;
    z: number;
  };
  battery: number;
  assignedZone: string;
  config: {
    speedLimit: number;
    operatingMode: 'patrol' | 'delivery' | 'maintenance' | 'idle';
    batteryThreshold: number;
    sensorConfig: {
      cameraResolution: '720p' | '1080p' | '4k';
      imuSensitivity: 'low' | 'medium' | 'high';
    };
  };
  lastUpdate: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'operator';
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface TelemetryData {
  robotId: string;
  location: { x: number; y: number; z: number };
  battery: number;
  status: string;
  speed: number;
  timestamp: string;
}

export interface GetRobotsResponse {
  robots: Robot[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateConfigRequest {
  speedLimit?: number;
  operatingMode?: string;
  batteryThreshold?: number;
  sensorConfig?: {
    cameraResolution?: string;
    imuSensitivity?: string;
  };
}

export interface CreateRobotRequest {
  name: string;
  assignedZone: string;
  config: {
    speedLimit: number;
    operatingMode: string;
    batteryThreshold: number;
    sensorConfig: {
      cameraResolution: string;
      imuSensitivity: string;
    };
  };
}