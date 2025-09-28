import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Robot, RobotDocument } from './schemas/robot.schema';
import { GetRobotsDto } from './dto/get-robots.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { CreateRobotDto } from './dto/create-robot.dto';

interface RobotFilter {
  status?: string;
  assignedZone?: string;
  battery?: { $lte?: number; $gt?: number; };
  $or?: Array<{
    name?: { $regex: string; $options: string };
    assignedZone?: { $regex: string; $options: string };
  }>;
}

@Injectable()
export class RobotsService {
  constructor(
    @InjectModel(Robot.name) private robotModel: Model<RobotDocument>,
  ) {}

  async findAll(query: GetRobotsDto) {
    const { page = 1, limit = 10, status, zone, batteryLevel, search } = query;
    const skip = (page - 1) * limit;

    // Build filter with proper typing
    const filter: RobotFilter = {};
    if (status) {
      filter.status = status;
    }
    if (zone) {
      filter.assignedZone = zone;
    }
    if (batteryLevel) {
      switch (batteryLevel) {
        case 'low':
          filter.battery = { $lte: 20 };
          break;
        case 'medium':
          filter.battery = { $gt: 20, $lte: 60 };
          break;
        case 'high':
          filter.battery = { $gt: 60 };
          break;
      }
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assignedZone: { $regex: search, $options: 'i' } },
      ];
    }

    const [robots, total] = await Promise.all([
      this.robotModel.find(filter as FilterQuery<RobotDocument>).skip(skip).limit(limit).exec(),
      this.robotModel.countDocuments(filter as FilterQuery<RobotDocument>).exec(),
    ]);

    return {
      robots,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Robot> {
    const robot = await this.robotModel.findById(id).exec();
    if (!robot) {
      throw new NotFoundException(`Robot with ID ${id} not found`);
    }
    return robot;
  }

  async create(createRobotDto: CreateRobotDto): Promise<Robot> {
    // Generate random starting location
    const location = {
      x: Math.random() * 20,
      y: Math.random() * 20,
      z: 0,
    };

    const newRobot = new this.robotModel({
      ...createRobotDto,
      status: 'idle',
      location,
      battery: 100, // Start with full battery
      lastUpdate: new Date(),
    });

    return newRobot.save();
  }

  async updateConfig(
    id: string,
    updateConfigDto: UpdateConfigDto,
  ): Promise<Robot> {
    const robot = await this.robotModel.findById(id).exec();
    if (!robot) {
      throw new NotFoundException(`Robot with ID ${id} not found`);
    }

    // Update config fields
    if (updateConfigDto.speedLimit !== undefined) {
      robot.config.speedLimit = updateConfigDto.speedLimit;
    }
    if (updateConfigDto.operatingMode !== undefined) {
      robot.config.operatingMode = updateConfigDto.operatingMode;
    }
    if (updateConfigDto.batteryThreshold !== undefined) {
      robot.config.batteryThreshold = updateConfigDto.batteryThreshold;
    }
    if (updateConfigDto.sensorConfig) {
      if (updateConfigDto.sensorConfig.cameraResolution !== undefined) {
        robot.config.sensorConfig.cameraResolution =
          updateConfigDto.sensorConfig.cameraResolution;
      }
      if (updateConfigDto.sensorConfig.imuSensitivity !== undefined) {
        robot.config.sensorConfig.imuSensitivity =
          updateConfigDto.sensorConfig.imuSensitivity;
      }
    }

    robot.lastUpdate = new Date();
    return robot.save();
  }

  async seedRobots() {
    const count = await this.robotModel.countDocuments();
    if (count > 0) return; // Already seeded

    const seedData = [
      {
        name: 'Robot-001',
        status: 'active',
        location: { x: 5.2, y: 3.1, z: 0.0 },
        battery: 85,
        assignedZone: 'warehouse-a',
        config: {
          speedLimit: 2.5,
          operatingMode: 'patrol',
          batteryThreshold: 20,
          sensorConfig: { cameraResolution: '1080p', imuSensitivity: 'medium' },
        },
      },
      {
        name: 'Robot-002',
        status: 'idle',
        location: { x: 8.7, y: 1.2, z: 0.0 },
        battery: 45,
        assignedZone: 'warehouse-b',
        config: {
          speedLimit: 1.8,
          operatingMode: 'idle',
          batteryThreshold: 15,
          sensorConfig: { cameraResolution: '720p', imuSensitivity: 'low' },
        },
      },
      {
        name: 'Robot-003',
        status: 'active',
        location: { x: 4.5, y: 9.1, z: 0.0 },
        battery: 12,
        assignedZone: 'warehouse-a',
        config: {
          speedLimit: 3.2,
          operatingMode: 'delivery',
          batteryThreshold: 25,
          sensorConfig: { cameraResolution: '4k', imuSensitivity: 'high' },
        },
      },
      {
        name: 'Robot-004',
        status: 'maintenance',
        location: { x: 0.8, y: 0.5, z: 0.0 },
        battery: 78,
        assignedZone: 'dock',
        config: {
          speedLimit: 1.0,
          operatingMode: 'maintenance',
          batteryThreshold: 30,
          sensorConfig: { cameraResolution: '1080p', imuSensitivity: 'medium' },
        },
      },
      {
        name: 'Robot-005',
        status: 'offline',
        location: { x: 12.3, y: 7.8, z: 0.0 },
        battery: 0,
        assignedZone: 'warehouse-b',
        config: {
          speedLimit: 2.0,
          operatingMode: 'idle',
          batteryThreshold: 20,
          sensorConfig: { cameraResolution: '720p', imuSensitivity: 'low' },
        },
      },
    ];

    await this.robotModel.insertMany(seedData);
    console.log('Robots seeded successfully');
  }

  // Get all robots for simulation
  async getAllRobots(): Promise<RobotDocument[]> {
    return this.robotModel.find().exec();
  }

  // Update robot for simulation
  async updateRobot(
    id: string,
    updates: Partial<Robot>,
  ): Promise<Robot | null> {
    return this.robotModel.findByIdAndUpdate(id, updates, { new: true }).exec();
  }
}
