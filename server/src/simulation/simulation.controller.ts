import {
  Controller,
  Post,
  Get,
  UseGuards,
  Param,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { TelemetryService } from '../websocket/services/telemetry.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  SimulationResponseDto,
  SimulationStatusDto,
} from './dto/simulation.dto';

@Controller('api/simulation')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  private readonly logger = new Logger(SimulationController.name);

  constructor(private readonly telemetryService: TelemetryService) {}

  @Post('start')
  startSimulation(): SimulationResponseDto {
    try {
      this.telemetryService.startSimulation();
      this.logger.log('Global simulation started via API');
      return {
        success: true,
        message: 'Simulation started',
        isRunning: true,
      };
    } catch (error) {
      this.logger.error('Failed to start simulation:', error);
      throw new HttpException(
        'Failed to start simulation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('stop')
  stopSimulation(): SimulationResponseDto {
    try {
      this.telemetryService.stopSimulation();
      this.logger.log('Global simulation stopped via API');
      return {
        success: true,
        message: 'Simulation stopped',
        isRunning: false,
      };
    } catch (error) {
      this.logger.error('Failed to stop simulation:', error);
      throw new HttpException(
        'Failed to stop simulation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status')
  getSimulationStatus(): SimulationStatusDto {
    try {
      const isRunning = this.telemetryService.getSimulationStatus();
      return {
        isRunning,
        message: isRunning ? 'Simulation is running' : 'Simulation is stopped',
      };
    } catch (error) {
      this.logger.error('Failed to get simulation status:', error);
      throw new HttpException(
        'Failed to get simulation status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('robot/:id/start')
  startRobotSimulation(@Param('id') robotId: string): SimulationResponseDto {
    try {
      if (!robotId) {
        throw new HttpException('Robot ID is required', HttpStatus.BAD_REQUEST);
      }

      this.telemetryService.startRobotSimulation(robotId);
      this.logger.log(`Individual simulation started for robot: ${robotId}`);

      return {
        success: true,
        message: `Simulation started for robot ${robotId}`,
        robotId,
        isRunning: true,
      };
    } catch (error) {
      this.logger.error(
        `Failed to start robot simulation for ${robotId}:`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to start simulation for robot ${robotId}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('robot/:id/stop')
  stopRobotSimulation(@Param('id') robotId: string): SimulationResponseDto {
    try {
      if (!robotId) {
        throw new HttpException('Robot ID is required', HttpStatus.BAD_REQUEST);
      }

      this.telemetryService.stopRobotSimulation(robotId);
      this.logger.log(`Individual simulation stopped for robot: ${robotId}`);

      return {
        success: true,
        message: `Simulation stopped for robot ${robotId}`,
        robotId,
        isRunning: false,
      };
    } catch (error) {
      this.logger.error(
        `Failed to stop robot simulation for ${robotId}:`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to stop simulation for robot ${robotId}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('robot/:id/status')
  getRobotSimulationStatus(
    @Param('id') robotId: string,
  ): SimulationResponseDto {
    try {
      if (!robotId) {
        throw new HttpException('Robot ID is required', HttpStatus.BAD_REQUEST);
      }

      const isRunning = this.telemetryService.getRobotSimulationStatus(robotId);

      return {
        success: true,
        robotId,
        isRunning,
        message: isRunning
          ? `Robot ${robotId} simulation is running`
          : `Robot ${robotId} simulation is stopped`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get robot simulation status for ${robotId}:`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get simulation status for robot ${robotId}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
