import { Document } from 'mongoose';
import { RobotStatus, OperatingMode, LocationDto } from '../../websocket/dto/telemetry.dto';

export interface SensorConfig {
  cameraResolution: string;
  imuSensitivity: string;
}

export interface RobotConfig {
  operatingMode: OperatingMode;
  speedLimit: number;
  batteryThreshold: number;
  sensorConfig: SensorConfig;
}

export interface IRobot {
  _id: string;
  name: string;
  type: string;
  status: RobotStatus;
  location: LocationDto;
  battery: number;
  assignedZone: string;
  config: RobotConfig;
  lastUpdate: Date;
  createdAt: Date;
}

export interface IRobotDocument extends IRobot, Document {
  _id: string;
}