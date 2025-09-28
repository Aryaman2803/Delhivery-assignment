import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RobotsService } from './robots.service';
import { RobotsController } from './robots.controller';
import { Robot, RobotSchema } from './schemas/robot.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Robot.name, schema: RobotSchema }]),
  ],
  controllers: [RobotsController],
  providers: [RobotsService],
  exports: [RobotsService],
})
export class RobotsModule {}