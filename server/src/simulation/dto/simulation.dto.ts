import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class SimulationStatusDto {
  @IsBoolean()
  isRunning: boolean;

  @IsString()
  message: string;
}

export class SimulationResponseDto {
  @IsBoolean()
  success: boolean;

  @IsString()
  message: string;

  @IsBoolean()
  isRunning: boolean;

  @IsOptional()
  @IsString()
  robotId?: string;
}

export class RobotSimulationParamDto {
  @IsString()
  id: string;
}