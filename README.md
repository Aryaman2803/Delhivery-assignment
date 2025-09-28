# Real-Time Robotics Telemetry Dashboard

A scalable, secure, and real-time web dashboard for monitoring a fleet of autonomous mobile robots (AMRs) built with the MERN stack and designed for AWS cloud deployment.

## 🏗️ Three-Tiered Architecture

**Assignment Requirement**: Design a three-tiered architecture with compute, data, and storage/hosting layers

### Architecture Design
- **Compute Layer**: Node.js/NestJS (Express.js compatible) with Socket.io WebSocket server
- **Data Layer**: MongoDB Atlas (AWS-hosted) for persistent data storage  
- **Storage/Hosting Layer**: AWS S3 + CloudFront (frontend) + AWS EC2 (backend hosting)

## 📋 Table of Contents

- [🚀 Setup and Run Instructions](#-setup-and-run-instructions)
- [🎨 Features](#-features)
- [🔐 Authentication Strategy (JWT Details)](#-authentication-strategy-jwt-details)
- [🏃‍♂️ High-Frequency Data Sink Justification](#️-high-frequency-data-sink-justification)
- [🌩️ Conceptual Deployment Steps](#️-conceptual-deployment-steps)
- [🛠️ API Reference](#️-api-reference)
- [📋 Technology Stack](#-technology-stack)
- [🧪 Testing](#-testing)

## 🚀 Setup and Run Instructions

**Assignment Deliverable**: Complete setup and run instructions for the MERN stack application

### Prerequisites
- Node.js 16+ and npm
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation & Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd assignment
   
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies  
   cd ../client && npm install
   ```

2. **Environment Configuration**
   
   Environment files are already included in this repository for evaluation purposes and will be removed within 2 weeks after assignment submission.

### Running the Application

```bash
# Start backend server (from server/ directory)
npm run start:dev

# Start frontend (from client/ directory) 
npm start
```

**Default Login:** admin / password

### Production Build

**Task 2.2 Requirement**: Frontend Deployment Artifact Implementation

```bash
# Frontend production build (Task 2.2.1)
cd client
npm run build
# Creates optimized static build in client/build/ directory
# - Minified JavaScript and CSS
# - Optimized asset bundling
# - Production environment variables applied

# Backend production build
cd server
npm run build
npm run start:prod
# Compiles TypeScript to dist/ directory for production deployment
```

## 🎨 Features

### ✅ **Task 1.1**: Data Modeling & REST API Implementation
- **Express.js REST Endpoints**: NestJS framework (Express.js compatible) implementation
- **GET /api/robots**: Paginated and filterable robot list (status, zone, battery, search)
- **PUT /api/robots/:id/config**: Update robot configuration with JWT authentication
- **MongoDB Atlas**: AWS-compatible cloud database solution (AWS-hosted)
- **Data Models**: Robot schema with telemetry, configuration, and status tracking

### ✅ **Task 1.2**: Real-Time WebSocket Implementation  
- **Socket.io WebSocket Server**: Real-time bidirectional communication
- **Telemetry Simulation**: Background process broadcasting updates every 500ms for 5 robots
- **JWT WebSocket Security**: Token verification during connection handshake
- **Real-time Data Stream**: Location, battery, and status updates

### ✅ **Task 2.1**: Frontend Dashboard & Authentication
- **Authentication Flow**: Login component with JWT storage in localStorage
- **Fleet Dashboard**: Real-time robot visualization via authenticated WebSocket
- **Configuration Management**: Forms with Authorization header JWT implementation
- **401 Error Handling**: Graceful logout and redirect to login on unauthorized responses

### ✅ **Task 2.2**: Deployment Preparation
- **Build Script**: `npm run build` generates production-ready static React build
- **Frontend Deployment**: Complete S3/CloudFront setup with step-by-step commands
- **Backend Deployment**: EC2 and Elastic Beanstalk options with environment configuration
- **Production Environment**: Environment variables and security configuration

## 🔐 Authentication Strategy (JWT Details)

**Assignment Deliverable**: The authentication strategy used (JWT details)

### JWT Implementation Details
- **Token Generation**: Server generates JWT on successful login with payload {sub, username, role}
- **Token Storage**: Client stores JWT in localStorage (Task 2.1 requirement)
- **REST API Security**: JWT sent via `Authorization: Bearer <token>` header (Task 1.1 requirement)
- **WebSocket Security**: JWT passed during connection handshake for authentication (Task 1.2 requirement)
- **Token Verification**: NestJS guards verify JWT with configurable secret key
- **401 Error Handling**: Graceful client-side logout and redirect to login (Task 2.1 requirement)

### Security Implementation
- **Password Hashing**: Bcrypt with 10 rounds for secure storage
- **Token Expiration**: 24-hour default with configurable JWT_EXPIRES_IN
- **CORS Protection**: Configured for specific client domains
- **Protected Routes**: Role-based access control with JWT verification middleware
- **WebSocket Authentication**: Connection upgrade only after JWT validation

## 🏃‍♂️ High-Frequency Data Sink Justification

**Assignment Deliverable**: The justification for the high-frequency data sink service (Task 1.1)

### Problem Statement
100+ robots sending continuous sensor data (IMU readings, camera metadata) would overwhelm the main MongoDB database with high-volume writes, impacting real-time dashboard performance.

### Solution: **Amazon Kinesis Data Streams**

```
Robots → Kinesis Data Streams → Kinesis Analytics → DynamoDB + S3
                              ↓
                         MongoDB (Aggregated Data)
```

### Service Justification (Task 1.1.3)
**Why Kinesis over alternatives:**

**Amazon Kinesis Data Streams** ✅
- **Real-time Processing**: Sub-second latency for streaming data ingestion
- **Scalability**: Auto-scales to handle 100+ robots sending data every 100ms (1000+ events/second)  
- **Durability**: Built-in data retention (24 hours to 365 days) with replay capability
- **Cost-Effective**: Pay per shard hour and data throughput, no upfront infrastructure costs

**vs. DynamoDB Streams**: Limited to DynamoDB changes, not raw sensor ingestion
**vs. TimeStream**: More expensive, overkill for this use case
**vs. SQS**: Not designed for high-throughput streaming data

### Data Architecture Flow
1. **Kinesis Data Streams**: Ingest raw sensor data (IMU, camera, environment sensors)
2. **Kinesis Analytics**: Real-time processing and aggregation
   - Filter noise and outliers from sensor readings
   - Calculate moving averages and detect anomalies
3. **DynamoDB**: Store high-frequency raw data with TTL for automatic cleanup
4. **S3**: Archive historical data for long-term analytics
5. **MongoDB**: Store processed telemetry for dashboard (position, battery, status every 500ms)

## 🌩️ Conceptual Deployment Steps

**Assignment Deliverable**: The conceptual deployment steps for S3/CloudFront and EC2/Elastic Beanstalk (Task 2.2)

### Frontend Deployment: **AWS S3 + CloudFront** (Task 2.2.2a)

**Step-by-step deployment of static React build:**

```bash
# 1. Create S3 bucket for static hosting
aws s3 mb s3://robotics-dashboard-frontend --region us-east-1

# 2. Build production artifacts (Task 2.2.1)
cd client
npm run build  # Creates optimized build/ directory

# 3. Deploy static files to S3
aws s3 sync build/ s3://robotics-dashboard-frontend --delete

# 4. Configure S3 for static website hosting
aws s3 website s3://robotics-dashboard-frontend \
  --index-document index.html \
  --error-document index.html

# 5. Create CloudFront distribution for global CDN
# - Origin: S3 bucket endpoint
# - Custom error pages: 404/403 → /index.html (SPA routing support)
# - Compression enabled, HTTPS redirect
# - Cache behavior: Cache static assets, no-cache for index.html
```

### Backend Deployment: **AWS EC2** (Chosen Option)

**Justification for Choosing EC2:**
- **Full Control**: Complete control over server environment, Node.js version, Nginx configuration, and WebSocket scaling
- **Flexibility**: Easy to configure SSL, reverse proxy, and background processes (PM2) for real-time telemetry handling  
- **Predictable Cost**: Pay for instance type and storage only; no hidden Elastic Beanstalk resource overhead
- **WebSocket Support**: Ensures persistent connections can be tuned and scaled without managed service limitations
- **Production-Ready**: Allows fine-grained monitoring, logging, and resource optimization for high-frequency data ingestion from multiple robots

**Step-by-step EC2 deployment:**

```bash
# 1. Launch EC2 instance
# - Instance: t3.medium (production), t3.small (staging)
# - AMI: Amazon Linux 2 or Ubuntu 20.04 LTS
# - Security Groups: 22 (SSH), 80 (HTTP), 443 (HTTPS)

# 2. Install runtime environment
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2

# 3. Deploy application
cd /opt
sudo git clone <repository-url> robotics-dashboard
cd robotics-dashboard/server
sudo npm install --production
sudo npm run build

# 4. Environment configuration
sudo nano .env
# NODE_ENV=production
# MONGODB_URI=mongodb+srv://<production-cluster>
# JWT_SECRET=<64-char-production-secret>
# CLIENT_URL=https://d1234567890.cloudfront.net

# 5. Process management with PM2
sudo pm2 start dist/main.js --name robotics-api
sudo pm2 startup && pm2 save

# 6. Nginx reverse proxy configuration
sudo nano /etc/nginx/sites-available/robotics-dashboard
# server {
#     listen 80;
#     server_name api.robotics-dashboard.com;
#     location / {
#         proxy_pass http://localhost:3001;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_cache_bypass $http_upgrade;
#     }
# }

# 7. SSL termination with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.robotics-dashboard.com
```

## 🛠️ API Reference

### Authentication
- `POST /auth/login` - User authentication, returns JWT

### Robots
- `GET /api/robots` - Paginated robot list with filters (status, zone, battery, search)
- `GET /api/robots/:id` - Single robot details
- `POST /api/robots` - Create new robot (JWT required)
- `PUT /api/robots/:id/config` - Update robot configuration (JWT required)

### Simulation
- `GET /api/simulation/status` - Global simulation status
- `POST /api/simulation/start` - Start global simulation
- `POST /api/simulation/stop` - Stop global simulation
- `POST /api/simulation/robot/:id/start` - Start individual robot simulation
- `POST /api/simulation/robot/:id/stop` - Stop individual robot simulation

### WebSocket Events
- `telemetry` - Real-time robot telemetry data (500ms intervals)
- `subscribe` - Subscribe to specific robot IDs
- `unsubscribe` - Unsubscribe from robot IDs

## 📋 Technology Stack

**Backend:** NestJS, MongoDB, Socket.io, JWT, bcryptjs  
**Frontend:** React 18, TypeScript, Context API, Canvas API  
**DevOps:** Docker, PM2, Nginx, CloudWatch  
**Cloud:** AWS EC2, S3, CloudFront, MongoDB Atlas

## 🧪 Testing

```bash
# Backend tests
cd server && npm run test && npm run test:e2e

# Frontend tests  
cd client && npm test
```

**Load Testing Capacity:**
- 100+ concurrent robot connections
- 500ms telemetry update intervals
- Multiple dashboard users
- Real-time WebSocket communications

---

