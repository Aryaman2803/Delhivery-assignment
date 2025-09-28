export default () => ({
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        retryWrites: true,
      },
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CLIENT_URL || 'http://localhost:3000',
  },
  app: {
    name: 'Robotics Telemetry Dashboard',
    version: '1.0.0',
    description: 'Real-time robotics fleet monitoring system',
  },
  telemetry: {
    broadcastInterval: 500,
    maxTrailPoints: 50,
    batteryDrainRates: {
      patrol: 0.15,
      delivery: 0.2,
      maintenance: 0.05,
      idle: 0.03,
    },
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    enableConsole: true,
    enableFile: false,
  },
});