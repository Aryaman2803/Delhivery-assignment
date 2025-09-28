import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Robot, TelemetryData } from '../types';
import { ConfigModal } from './ConfigModal';
import './RobotCard.css';

interface RobotCardProps {
  robot: Robot;
  telemetry?: TelemetryData;
  onConfigUpdate: (robotId: string) => void;
  simulationRunning: boolean;
}

export const RobotCard: React.FC<RobotCardProps> = ({ robot, telemetry, onConfigUpdate, simulationRunning }) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const navigate = useNavigate();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'idle': return '🟡';
      case 'maintenance': return '🔧';
      case 'offline': return '⚫';
      default: return '❓';
    }
  };

  const getBatteryIcon = (battery: number) => {
    if (battery <= 20) return '⚠️';
    return '🔋';
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

  // Use real-time telemetry data if available, otherwise use robot data
  const currentLocation = telemetry?.location || robot.location;
  const currentBattery = telemetry?.battery ?? robot.battery;
  const currentStatus = telemetry?.status || robot.status;
  const currentSpeed = telemetry?.speed || 0;

  const handleCardClick = () => {
    navigate(`/robot/${robot._id}`);
  };

  const handleConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking configure button
    setShowConfigModal(true);
  };

  return (
    <>
      <div className="robot-card" onClick={handleCardClick}>
        <div className="robot-header">
          <h3>{robot.name}</h3>
          <span 
            className="status-badge"
            style={{ backgroundColor: getStatusColor(currentStatus) }}
          >
            {getStatusIcon(currentStatus)} {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </span>
        </div>

        <div className="robot-info">
          <div className="info-row">
            <span className="label">Zone:</span>
            <span className="value">{robot.assignedZone}</span>
          </div>
          
          <div className="info-row">
            <span className="label">Battery:</span>
            <span className={`value ${currentBattery <= 20 ? 'low-battery' : ''}`}>
              {getBatteryIcon(currentBattery)} {currentBattery.toFixed(1)}%
            </span>
          </div>

          <div className="info-row">
            <span className="label">Location:</span>
            <span className="value location-value">
              <div className="coordinate-grid">
                <div className="coordinate">
                  <span className="axis">X</span>
                  <span className="coord-value">{currentLocation.x.toFixed(1)}m</span>
                </div>
                <div className="coordinate">
                  <span className="axis">Y</span>
                  <span className="coord-value">{currentLocation.y.toFixed(1)}m</span>
                </div>
                <div className="coordinate">
                  <span className="axis">Z</span>
                  <span className="coord-value">{currentLocation.z.toFixed(1)}m</span>
                </div>
              </div>
            </span>
          </div>

          <div className="info-row">
            <span className="label">Speed:</span>
            <span className="value">{currentSpeed.toFixed(1)} m/s</span>
          </div>

          <div className="info-row">
            <span className="label">Mode:</span>
            <span className="value">{robot.config.operatingMode}</span>
          </div>

          {telemetry && (
            <div className="info-row">
              <span className="label">Last Update:</span>
              <span className="value timestamp">
                {new Date(telemetry.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        <div className="robot-actions">
          <button 
            className="config-button"
            onClick={handleConfigClick}
          >
            Configure
          </button>
          <button 
            className="detail-button"
            onClick={handleCardClick}
          >
            View Details
          </button>
        </div>

        {simulationRunning && telemetry && (
          <div className="realtime-indicator active">
            <span className="pulse-dot"></span>
            Live
          </div>
        )}
        {!simulationRunning && (
          <div className="realtime-indicator inactive">
            <span className="static-dot"></span>
            Paused
          </div>
        )}
      </div>

      {showConfigModal && (
        <ConfigModal
          robot={robot}
          onClose={() => setShowConfigModal(false)}
          onUpdate={() => {
            onConfigUpdate(robot._id);
            setShowConfigModal(false);
          }}
        />
      )}
    </>
  );
};