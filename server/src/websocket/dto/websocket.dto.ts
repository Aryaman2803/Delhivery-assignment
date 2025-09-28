import { IsString, IsOptional, IsObject } from 'class-validator';

export class WebSocketConnectionDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  role?: string;
}

export class WebSocketMessageDto {
  @IsString()
  event: string;

  @IsOptional()
  @IsObject()
  data?: any;
}

export class WebSocketErrorDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsObject()
  details?: any;
}

export class SubscriptionDto {
  @IsString({ each: true })
  robotIds: string[];
}