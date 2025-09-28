import { 
  Controller, 
  Get, 
  Put, 
  Post,
  Param, 
  Body, 
  Query, 
  UseGuards, 
  ValidationPipe,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { RobotsService } from './robots.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetRobotsDto } from './dto/get-robots.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { CreateRobotDto } from './dto/create-robot.dto';

@Controller('api/robots')
@UseGuards(JwtAuthGuard)
export class RobotsController {
  constructor(private readonly robotsService: RobotsService) {}

  @Get()
  async getRobots(@Query(ValidationPipe) query: GetRobotsDto) {
    try {
      return await this.robotsService.findAll(query);
    } catch (error) {
      throw new HttpException('Failed to fetch robots', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async createRobot(@Body(ValidationPipe) createRobotDto: CreateRobotDto) {
    try {
      const robot = await this.robotsService.create(createRobotDto);
      return { success: true, robot };
    } catch (error) {
      throw new HttpException('Failed to create robot', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async getRobot(@Param('id') id: string) {
    try {
      return await this.robotsService.findOne(id);
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw error;
      }
      throw new HttpException('Failed to fetch robot', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id/config')
  async updateConfig(
    @Param('id') id: string,
    @Body(ValidationPipe) updateConfigDto: UpdateConfigDto,
  ) {
    try {
      const robot = await this.robotsService.updateConfig(id, updateConfigDto);
      return { success: true, robot };
    } catch (error) {
      if (error.name === 'NotFoundException') {
        throw error;
      }
      throw new HttpException('Failed to update robot config', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}