import { IsString, IsNotEmpty, IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateSensorConfigDto {
  @IsString()
  @IsNotEmpty()
  cameraResolution: string;

  @IsString()
  @IsNotEmpty()
  imuSensitivity: string;
}

class CreateConfigDto {
  @IsNumber()
  @Min(0.5)
  @Max(5.0)
  speedLimit: number;

  @IsString()
  @IsNotEmpty()
  operatingMode: string;

  @IsNumber()
  @Min(10)
  @Max(30)
  batteryThreshold: number;

  @ValidateNested()
  @Type(() => CreateSensorConfigDto)
  sensorConfig: CreateSensorConfigDto;
}

export class CreateRobotDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  assignedZone: string;

  @ValidateNested()
  @Type(() => CreateConfigDto)
  config: CreateConfigDto;
}