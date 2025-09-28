import React, { useRef, useEffect, useState } from 'react';
import { TelemetryData } from '../types';
import './RobotMap2D.css';

interface RobotMap2DProps {
  robotId: string;
  robotName: string;
  telemetryData: TelemetryData | undefined;
  assignedZone: string;
}

interface Position {
  x: number;
  y: number;
  timestamp: number;
}

export const RobotMap2D: React.FC<RobotMap2DProps> = ({
  robotId,
  robotName,
  telemetryData,
  assignedZone
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [trail, setTrail] = useState<Position[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 600 });

  // Define zones with boundaries and colors
  const zones = {
    'warehouse-a': { x: 0, y: 0, width: 8, height: 10, color: '#3b82f6', label: 'Warehouse A' },
    'warehouse-b': { x: 12, y: 0, width: 8, height: 10, color: '#10b981', label: 'Warehouse B' },
    'dock': { x: 8, y: 12, width: 4, height: 8, color: '#f59e0b', label: 'Dock' }
  };

  // Convert world coordinates (0-20m) to canvas coordinates
  const worldToCanvas = (worldX: number, worldY: number) => {
    const padding = 40;
    const scale = (canvasSize.width - 2 * padding) / 20;
    return {
      x: padding + worldX * scale,
      y: canvasSize.height - padding - worldY * scale // Flip Y axis
    };
  };

  // Update trail when new telemetry data arrives
  useEffect(() => {
    if (telemetryData) {
      const newPosition: Position = {
        x: telemetryData.location.x,
        y: telemetryData.location.y,
        timestamp: Date.now()
      };

      setTrail(prev => {
        const updated = [...prev, newPosition];
        // Keep only last 50 positions (about 25 seconds of trail)
        return updated.slice(-50);
      });
    }
  }, [telemetryData]);

  // Draw the map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Set canvas background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw grid
    drawGrid(ctx);

    // Draw zones
    drawZones(ctx);

    // Draw robot trail
    drawTrail(ctx);

    // Draw robot
    if (telemetryData) {
      drawRobot(ctx, telemetryData);
    }

    // Draw legends and labels
    drawLabels(ctx);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telemetryData, trail, canvasSize]);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const padding = 40;
    const scale = (canvasSize.width - 2 * padding) / 20;

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    // Draw grid lines
    for (let i = 0; i <= 20; i++) {
      const x = padding + i * scale;
      const y = padding + i * scale;

      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvasSize.height - padding);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvasSize.width - padding, y);
      ctx.stroke();

      // Grid labels
      if (i % 5 === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // X-axis labels
        ctx.fillText(`${i}m`, x, canvasSize.height - 20);
        
        // Y-axis labels
        ctx.textAlign = 'right';
        ctx.fillText(`${20 - i}m`, 30, y + 4);
      }
    }
  };

  const drawZones = (ctx: CanvasRenderingContext2D) => {
    Object.entries(zones).forEach(([zoneName, zone]) => {
      const topLeft = worldToCanvas(zone.x, zone.y + zone.height);
      const bottomRight = worldToCanvas(zone.x + zone.width, zone.y);

      // Draw zone rectangle
      ctx.fillStyle = zone.color + '20'; // 20% opacity
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 2;

      ctx.fillRect(
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y
      );

      ctx.strokeRect(
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y
      );

      // Draw zone label
      ctx.fillStyle = zone.color;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        zone.label,
        topLeft.x + (bottomRight.x - topLeft.x) / 2,
        topLeft.y + (bottomRight.y - topLeft.y) / 2
      );

      // Highlight assigned zone
      if (zoneName === assignedZone) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          topLeft.x - 2,
          topLeft.y - 2,
          bottomRight.x - topLeft.x + 4,
          bottomRight.y - topLeft.y + 4
        );
        ctx.setLineDash([]);
      }
    });
  };

  const drawTrail = (ctx: CanvasRenderingContext2D) => {
    if (trail.length < 2) return;

    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;

    ctx.beginPath();
    trail.forEach((pos, index) => {
      const canvasPos = worldToCanvas(pos.x, pos.y);
      
      if (index === 0) {
        ctx.moveTo(canvasPos.x, canvasPos.y);
      } else {
        ctx.lineTo(canvasPos.x, canvasPos.y);
      }

      // Draw trail dots with fading opacity
      const age = (Date.now() - pos.timestamp) / 25000; // 25 seconds max
      const opacity = Math.max(0.1, 1 - age);
      
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const drawRobot = (ctx: CanvasRenderingContext2D, telemetry: TelemetryData) => {
    const pos = worldToCanvas(telemetry.location.x, telemetry.location.y);

    // Robot body
    ctx.fillStyle = getStatusColor(telemetry.status);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 12, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Robot direction indicator (based on speed)
    if (telemetry.speed > 0.1) {
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(pos.x + 8, pos.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Robot label
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(robotName, pos.x, pos.y - 20);

    // Coordinates display
    ctx.font = '10px Arial';
    ctx.fillText(
      `(${telemetry.location.x.toFixed(1)}, ${telemetry.location.y.toFixed(1)})`,
      pos.x,
      pos.y + 25
    );
  };

  const drawLabels = (ctx: CanvasRenderingContext2D) => {
    // Title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Robot Position Map (20m × 20m)', 10, 25);

    // Legend
    const legendY = 50;
    ctx.font = '12px Arial';
    
    // Status legend
    const statuses = [
      { status: 'active', color: '#22c55e', label: 'Active' },
      { status: 'idle', color: '#eab308', label: 'Idle' },
      { status: 'maintenance', color: '#f97316', label: 'Maintenance' },
      { status: 'offline', color: '#6b7280', label: 'Offline' }
    ];

    statuses.forEach((item, index) => {
      const x = 10;
      const y = legendY + index * 20;

      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(x + 6, y, 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#1f2937';
      ctx.fillText(item.label, x + 20, y + 4);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'idle': return '#eab308';
      case 'maintenance': return '#f97316';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const size = Math.min(container.clientWidth - 20, 600);
        setCanvasSize({ width: size, height: size });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="robot-map-2d">
      <div className="map-header">
        <h3>Real-time Position Tracking</h3>
        <div className="map-stats">
          {telemetryData && (
            <>
              <span className="stat">
                Speed: {telemetryData.speed.toFixed(1)} m/s
              </span>
              <span className="stat">
                Zone: {assignedZone}
              </span>
              <span className="stat">
                Trail: {trail.length} points
              </span>
            </>
          )}
        </div>
      </div>
      
      <div className="map-container">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="robot-canvas"
        />
      </div>
    </div>
  );
};