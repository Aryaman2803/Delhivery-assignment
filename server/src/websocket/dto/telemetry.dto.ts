import { IsString, IsNumber, IsDateString, IsObject, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum RobotStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline',
}

export enum OperatingMode {
  PATROL = 'patrol',
  DELIVERY = 'delivery',
  IDLE = 'idle',
  MAINTENANCE = 'maintenance',
}

export class LocationDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  z: number;
}

export class TelemetryDataDto {
  @IsString()
  robotId: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsNumber()
  battery: number;

  @IsEnum(RobotStatus)
  status: RobotStatus;

  @IsNumber()
  speed: number;

  @IsDateString()
  timestamp: Date;
}

export class SubscriptionDto {
  @IsString({ each: true })
  robotIds: string[];
}

export class SimulationUpdateDto {
  @IsString()
  robotId: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsNumber()
  battery: number;

  @IsEnum(RobotStatus)
  status: RobotStatus;

  @IsDateString()
  lastUpdate: Date;
}