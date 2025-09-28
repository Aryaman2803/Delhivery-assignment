import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { RobotsService } from './robots/robots.service';
import { AuthService } from './auth/auth.service';
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Enable CORS for frontend - use config service
    app.enableCors({
      origin: [configService.get<string>('server.corsOrigin'), 'http://localhost:3001'],
      credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        validationError: {
          target: false,
          value: false,
        },
      }),
    );

    // Seed data
    const robotsService = app.get(RobotsService);
    const authService = app.get(AuthService);

    try {
      await robotsService.seedRobots();
      logger.log('Robot data seeded successfully');
    } catch (error) {
      logger.warn('Robot seeding skipped - data already exists');
    }

    // Create default admin user
    try {
      await authService.createUser('admin', 'password', 'administrator');
      logger.log('Default admin user created: admin/password');
    } catch (error) {
      logger.warn('Admin user creation skipped - user already exists');
    }

    const port = configService.get<number>('server.port') || 3001;
    await app.listen(port);
    logger.log(`🚀 Server running on http://localhost:${port}`);
    logger.log(`🌍 Environment: ${configService.get<string>('server.nodeEnv')}`);
    logger.log(`📊 API Documentation: http://localhost:${port}/api`);
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Unhandled error during bootstrap:', error);
  process.exit(1);
});
