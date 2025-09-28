import axios from 'axios';
import { AuthResponse, LoginCredentials, GetRobotsResponse, UpdateConfigRequest, CreateRobotRequest } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto logout on 401
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: LoginCredentials): Promise<AuthResponse> =>
    api.post('/auth/login', credentials).then(res => res.data),
};

// Robots API
export const robotsAPI = {
  getRobots: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    zone?: string;
    batteryLevel?: string;
  }): Promise<GetRobotsResponse> =>
    api.get('/api/robots', { params }).then(res => res.data),

  getRobot: (id: string) =>
    api.get(`/api/robots/${id}`).then(res => res.data),

  updateConfig: (id: string, config: UpdateConfigRequest) =>
    api.put(`/api/robots/${id}/config`, config).then(res => res.data),

  createRobot: (robot: CreateRobotRequest) =>
    api.post('/api/robots', robot).then(res => res.data),
};

// Simulation API
export const simulationAPI = {
  getStatus: () =>
    api.get('/api/simulation/status').then(res => res.data),
  
  start: () =>
    api.post('/api/simulation/start').then(res => res.data),
    
  stop: () =>
    api.post('/api/simulation/stop').then(res => res.data),
    
  // Individual robot simulation controls
  getRobotStatus: (robotId: string) =>
    api.get(`/api/simulation/robot/${robotId}/status`).then(res => res.data),
    
  startRobot: (robotId: string) =>
    api.post(`/api/simulation/robot/${robotId}/start`).then(res => res.data),
    
  stopRobot: (robotId: string) =>
    api.post(`/api/simulation/robot/${robotId}/stop`).then(res => res.data),
};