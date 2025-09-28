import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RobotDocument = Robot & Document;

@Schema({ timestamps: true })
export class Robot {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ 
    required: true, 
    enum: ['active', 'idle', 'maintenance', 'offline'],
    default: 'idle'
  })
  status: string;

  @Prop({
    required: true,
    type: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      z: { type: Number, required: true }
    }
  })
  location: {
    x: number;
    y: number;
    z: number;
  };

  @Prop({ required: true, min: 0, max: 100 })
  battery: number;

  @Prop({ required: true })
  assignedZone: string;

  @Prop({
    required: true,
    type: {
      speedLimit: { type: Number, required: true, min: 0.5, max: 5.0 },
      operatingMode: { 
        type: String, 
        required: true, 
        enum: ['patrol', 'delivery', 'maintenance', 'idle'] 
      },
      batteryThreshold: { type: Number, required: true, min: 10, max: 30 },
      sensorConfig: {
        cameraResolution: { 
          type: String, 
          required: true, 
          enum: ['720p', '1080p', '4k'] 
        },
        imuSensitivity: { 
          type: String, 
          required: true, 
          enum: ['low', 'medium', 'high'] 
        }
      }
    }
  })
  config: {
    speedLimit: number;
    operatingMode: string;
    batteryThreshold: number;
    sensorConfig: {
      cameraResolution: string;
      imuSensitivity: string;
    };
  };

  @Prop({ default: Date.now })
  lastUpdate: Date;
}

export const RobotSchema = SchemaFactory.createForClass(Robot);