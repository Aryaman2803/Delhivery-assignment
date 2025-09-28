import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { RobotsService } from '../../robots/robots.service';
import { WebSocketGateway } from '../websocket.gateway';
import { ConfigService } from '@nestjs/config';
import {
  TelemetryDataDto,
  RobotStatus,
} from '../dto/telemetry.dto';
import { RobotDocument } from '../../robots/schemas/robot.schema';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private readonly directions = new Map<string, number>();
  private gateway: WebSocketGateway;
  private isSimulationRunning = true;
  private readonly robotSimulationStates = new Map<string, boolean>();

  constructor(
    private readonly robotsService: RobotsService,
    private readonly configService: ConfigService,
  ) {}

  setGateway(gateway: WebSocketGateway) {
    this.gateway = gateway;
  }

  simulateRobotMovement(robot: RobotDocument): TelemetryDataDto {
    const robotId = String(robot._id);

    // Set robot status to active when simulation is running (unless in maintenance)
    if (
      robot.status !== 'maintenance' &&
      robot.status !== 'offline'
    ) {
      robot.status =
        robot.config.operatingMode === 'idle'
          ? 'idle'
          : 'active';
    }

    switch (robot.config.operatingMode) {
      case 'patrol': {
        // Move in circular pattern
        const time = Date.now() * 0.001;
        robot.location.x += Math.sin(time) * 0.1;
        robot.location.y += Math.cos(time) * 0.1;
        break;
      }

      case 'delivery': {
        // Move back and forth
        const direction = this.directions.get(robotId) || 1;
        robot.location.x += direction * robot.config.speedLimit * 0.1;

        if (robot.location.x > 15) this.directions.set(robotId, -1);
        if (robot.location.x < 0) this.directions.set(robotId, 1);
        break;
      }

      case 'idle': {
        // Small random movements
        robot.location.x += (Math.random() - 0.5) * 0.02;
        robot.location.y += (Math.random() - 0.5) * 0.02;
        break;
      }

      case 'maintenance': {
        // Move slowly toward dock area
        robot.status = 'maintenance';
        if (robot.location.x > 1) robot.location.x -= 0.05;
        if (robot.location.y > 1) robot.location.y -= 0.05;
        break;
      }
    }

    // Keep robots within bounds (0-20 meters)
    robot.location.x = Math.max(0, Math.min(20, robot.location.x));
    robot.location.y = Math.max(0, Math.min(20, robot.location.y));

    // Battery simulation - use config service for drain rates
    const drainRates = this.configService.get('telemetry.batteryDrainRates');
    let batteryDrain = 0;

    switch (robot.config.operatingMode) {
      case 'patrol':
        batteryDrain = drainRates?.patrol || 0.15;
        break;
      case 'delivery':
        batteryDrain = drainRates?.delivery || 0.2;
        break;
      case 'maintenance':
        batteryDrain = drainRates?.maintenance || 0.05;
        break;
      case 'idle':
        batteryDrain = drainRates?.idle || 0.03;
        break;
    }

    robot.battery = Math.max(0, robot.battery - batteryDrain);

    // Auto-switch to maintenance when battery is low
    if (
      robot.battery <= robot.config.batteryThreshold &&
      robot.config.operatingMode !== 'maintenance'
    ) {
      robot.status = 'maintenance';
    }

    return {
      robotId,
      location: robot.location,
      battery: robot.battery,
      status: robot.status as RobotStatus,
      speed: this.calculateSpeed(robot),
      timestamp: new Date(),
    };
  }

  private calculateSpeed(robot: RobotDocument): number {
    // Calculate speed based on operating mode and status
    switch (robot.config.operatingMode) {
      case 'patrol':
        return robot.config.speedLimit * 0.6; // Moderate speed for patrol
      case 'delivery':
        return robot.config.speedLimit * 0.8; // Higher speed for delivery
      case 'maintenance':
        return robot.config.speedLimit * 0.3; // Slow speed for maintenance
      case 'idle':
        return robot.config.speedLimit * 0.1; // Very slow movement for idle
      default:
        return 0;
    }
  }

  @Interval(500) // Run every 500ms
  async broadcastTelemetry(): Promise<void> {
    try {
      const robots = await this.robotsService.getAllRobots();

      for (const robot of robots) {
        const robotId = String(robot._id);

        // Skip offline robots - they don't send telemetry
        if (robot.status === 'offline') continue;

        // Check if individual robot simulation is enabled OR global simulation is running
        const isRobotSimulationEnabled =
          this.robotSimulationStates.get(robotId) ?? false;
        const shouldSimulate =
          this.isSimulationRunning || isRobotSimulationEnabled;

        // Only simulate if either global simulation is running OR individual robot simulation is enabled
        if (!shouldSimulate) continue;

        const telemetry = this.simulateRobotMovement(robot);

        // Update robot in database
        await this.robotsService.updateRobot(String(robot._id), {
          location: robot.location,
          battery: robot.battery,
          status: robot.status,
          lastUpdate: new Date(),
        });

        // Broadcast to connected clients
        if (this.gateway) {
          this.gateway.broadcast('telemetry', telemetry);
        }
      }
    } catch (error) {
      this.logger.error('Error in telemetry broadcast:', error);
    }
  }

  startSimulation(): void {
    this.isSimulationRunning = true;
    this.logger.log('Global simulation started');
  }

  stopSimulation(): void {
    this.isSimulationRunning = false;
    // Individual robot states remain independent
    this.logger.log('Global simulation stopped');
  }

  getSimulationStatus(): boolean {
    return this.isSimulationRunning;
  }

  startRobotSimulation(robotId: string): void {
    if (!robotId) {
      throw new Error('Robot ID is required');
    }

    this.robotSimulationStates.set(robotId, true);
    this.logger.log(`Individual simulation started for robot: ${robotId}`);
  }

  stopRobotSimulation(robotId: string): void {
    if (!robotId) {
      throw new Error('Robot ID is required');
    }

    this.robotSimulationStates.set(robotId, false);
    this.logger.log(`Individual simulation stopped for robot: ${robotId}`);
  }

  getRobotSimulationStatus(robotId: string): boolean {
    if (!robotId) {
      throw new Error('Robot ID is required');
    }

    return this.robotSimulationStates.get(robotId) ?? false;
  }
}
