import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { TelemetryService } from './services/telemetry.service';
import { ConfigService } from '@nestjs/config';
import { SubscriptionDto } from './dto/websocket.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@WSGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Add your frontend URL
    credentials: true,
  },
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private readonly connectedClients = new Set<Socket>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly telemetryService: TelemetryService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(): void {
    this.logger.log('WebSocket Gateway initialized');
    this.telemetryService.setGateway(this);
  }

  handleConnection(client: Socket): void {
    try {
      // Extract token from auth with proper typing
      const token = String(client.handshake.auth?.token || '').replace(
        'Bearer ',
        '',
      );

      if (!token) {
        this.logger.warn('Client connection rejected: No token provided');
        client.disconnect();
        return;
      }

      // Verify JWT token using config service
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      }) as JwtPayload;

      // Store user info in client with proper typing
      client.data.user = {
        userId: payload.sub,
        username: payload.username,
        role: payload.role,
      };
      this.connectedClients.add(client);

      this.logger.log(`Client connected: ${payload.username} (${client.id})`);
    } catch (error) {
      this.logger.warn('Client connection rejected: Invalid token');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, data: { robotIds: string[] }) {
    console.log(`Client ${client.id} subscribed to robots:`, data.robotIds);
    // For this implementation, we broadcast to all clients
    // In a more advanced version, you could implement per-robot subscriptions
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, data: { robotIds: string[] }) {
    console.log(`Client ${client.id} unsubscribed from robots:`, data.robotIds);
  }

  // Method to broadcast telemetry data to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}
