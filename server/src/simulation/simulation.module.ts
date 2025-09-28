import { Module } from '@nestjs/common';
import { SimulationController } from './simulation.controller';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebSocketModule],
  controllers: [SimulationController],
})
export class SimulationModule {}
