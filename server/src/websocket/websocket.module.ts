import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RobotsModule } from '../robots/robots.module';
import { WebSocketGateway } from './websocket.gateway';
import { TelemetryService } from './services/telemetry.service';

@Module({
  imports: [
    JwtModule.register({
      secret: 'hehe-heheh-hehe',
      signOptions: { expiresIn: '1h' },
    }),
    RobotsModule,
  ],
  providers: [WebSocketGateway, TelemetryService],
  exports: [TelemetryService],
})
export class WebSocketModule {}
