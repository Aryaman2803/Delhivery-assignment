import {
  IsOptional,
  IsNumber,
  IsString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SensorConfigDto {
  @IsOptional()
  @IsString()
  cameraResolution?: string;

  @IsOptional()
  @IsString()
  imuSensitivity?: string;
}

export class UpdateConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(5.0)
  speedLimit?: number;

  @IsOptional()
  @IsString()
  operatingMode?: string;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(30)
  batteryThreshold?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SensorConfigDto)
  sensorConfig?: SensorConfigDto;
}
