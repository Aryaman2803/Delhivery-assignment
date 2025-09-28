import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Robot } from '../types';
import { robotsAPI, simulationAPI } from '../services/api';
import { ConfigModal } from '../components/ConfigModal';
import { RobotMap2D } from '../components/RobotMap2D';
import './RobotDetailPage.css';

export const RobotDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { telemetryData, subscribe, unsubscribe } = useWebSocket();
  
  const [robot, setRobot] = useState<Robot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [robotSimulationRunning, setRobotSimulationRunning] = useState(false);
  const [robotSimulationLoading, setRobotSimulationLoading] = useState(false);

  const fetchRobot = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const robotData = await robotsAPI.getRobot(id);
      setRobot(robotData);
      setError('');
    } catch (err) {
      setError('Failed to fetch robot details');
    } finally {
      setLoading(false);
    }
  };

  // Removed fetchSimulationStatus since we don't need global status on detail page

  const fetchRobotSimulationStatus = async () => {
    if (!id) return;
    try {
      console.log(`Fetching robot simulation status for robot ${id}`);
      const response = await simulationAPI.getRobotStatus(id);
      console.log(`Robot ${id} simulation status response:`, response);
      setRobotSimulationRunning(response.isRunning);
    } catch (err) {
      console.error('Failed to fetch robot simulation status:', err);
      // If global simulation is stopped, individual robot simulation is also stopped
      setRobotSimulationRunning(false);
    }
  };

  // Removed toggleSimulation since global controls are not shown on detail page

  const toggleRobotSimulation = async () => {
    if (!id) return;
    console.log(`Toggling individual robot simulation for robot ${id}. Current state: ${robotSimulationRunning}`);
    setRobotSimulationLoading(true);
    try {
      if (robotSimulationRunning) {
        console.log(`Stopping individual simulation for robot ${id}`);
        await simulationAPI.stopRobot(id);
        setRobotSimulationRunning(false);
        console.log(`Individual simulation stopped for robot ${id}`);
      } else {
        console.log(`Starting individual simulation for robot ${id}`);
        await simulationAPI.startRobot(id);
        setRobotSimulationRunning(true);
        console.log(`Individual simulation started for robot ${id}`);
      }
    } catch (err) {
      console.error('Failed to toggle robot simulation:', err);
    } finally {
      setRobotSimulationLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRobot();
      fetchRobotSimulationStatus();
      
      // Subscribe only to this specific robot
      subscribe([id]);
      
      // Cleanup: unsubscribe when leaving the page
      return () => {
        unsubscribe([id]);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only re-run when id changes

  // Individual robot simulation is independent of global simulation
  // Remove the sync effect

  const handleConfigUpdate = () => {
    fetchRobot();
    setShowConfigModal(false);
  };

  if (!id) {
    return <div className="error">Invalid robot ID</div>;
  }

  if (loading) {
    return (
      <div className="robot-detail-loading">
        <div className="spinner"></div>
        Loading robot details...
      </div>
    );
  }

  if (error || !robot) {
    return (
      <div className="robot-detail-error">
        <span className="error-icon">⚠️</span>
        {error || 'Robot not found'}
        <button onClick={fetchRobot} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  const currentTelemetry = telemetryData.get(robot._id);
  const currentLocation = currentTelemetry?.location || robot.location;
  const currentBattery = currentTelemetry?.battery ?? robot.battery;
  const currentStatus = currentTelemetry?.status || robot.status;
  const currentSpeed = currentTelemetry?.speed || 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'idle': return '🟡';
      case 'maintenance': return '🔧';
      case 'offline': return '⚫';
      default: return '❓';
    }
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

  return (
    <div className="robot-detail">
      {/* Header */}
      <header className="robot-detail-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-button">
            ← Back to Dashboard
          </button>
          <div className="robot-title">
            <h1>{robot.name}</h1>
            <span 
              className="status-badge"
              style={{ backgroundColor: getStatusColor(currentStatus) }}
            >
              {getStatusIcon(currentStatus)} {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </span>
          </div>
        </div>
        <div className="header-right">
          <span className="user-info">
            {user?.username} ({user?.role})
          </span>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="robot-detail-content">
        {/* 2D Robot Position Map */}
        <RobotMap2D
          robotId={robot._id}
          robotName={robot.name}
          telemetryData={currentTelemetry}
          assignedZone={robot.assignedZone}
        />

        {/* Live Telemetry */}
        <div className="telemetry-section">
          <div className="section-header">
            <h2>Live Telemetry</h2>
            <div className="telemetry-header-actions">
              {currentTelemetry && (
                <div className="live-indicator">
                  <span className="pulse-dot"></span>
                  Last update: {new Date(currentTelemetry.timestamp).toLocaleTimeString()}
                </div>
              )}
              <div className="robot-simulation-controls-improved">
                <div className="simulation-status-display">
                  <div className="status-indicator">
                    <span className={`status-dot ${robotSimulationRunning ? 'running' : 'stopped'}`}></span>
                    <span className="status-text">
                      {robotSimulationRunning ? 'Simulation Active' : 'Simulation Paused'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={toggleRobotSimulation} 
                  disabled={robotSimulationLoading}
                  className={`robot-sim-toggle ${robotSimulationRunning ? 'active' : 'inactive'}`}
                >
                  {robotSimulationLoading ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    <>
                      <span className="button-icon">
                        {robotSimulationRunning ? '⏸️' : '▶️'}
                      </span>
                      <span className="button-text">
                        {robotSimulationRunning ? 'Pause' : 'Start'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="telemetry-grid">
            <div className="telemetry-card">
              <div className="telemetry-label">Location</div>
              <div className="coordinate-display">
                <div className="coordinate">
                  <span className="axis">X</span>
                  <span className="coord-value">{currentLocation.x.toFixed(2)}m</span>
                </div>
                <div className="coordinate">
                  <span className="axis">Y</span>
                  <span className="coord-value">{currentLocation.y.toFixed(2)}m</span>
                </div>
                <div className="coordinate">
                  <span className="axis">Z</span>
                  <span className="coord-value">{currentLocation.z.toFixed(2)}m</span>
                </div>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-label">Battery</div>
              <div className="battery-display">
                <div className="battery-percentage">
                  {currentBattery <= 20 ? '⚠️' : '🔋'} {currentBattery.toFixed(1)}%
                </div>
                <div className="battery-bar">
                  <div 
                    className="battery-fill"
                    style={{ 
                      width: `${currentBattery}%`,
                      backgroundColor: currentBattery <= 20 ? '#ef4444' : '#22c55e'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-label">Speed</div>
              <div className="speed-display">
                <span className="speed-value">{currentSpeed.toFixed(1)}</span>
                <span className="speed-unit">m/s</span>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-label">Zone</div>
              <div className="zone-display">
                {robot.assignedZone}
              </div>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="config-section">
          <div className="section-header">
            <h2>Configuration</h2>
            <button 
              onClick={() => setShowConfigModal(true)}
              className="config-button-large"
            >
              Edit Configuration
            </button>
          </div>

          <div className="config-grid">
            <div className="config-item">
              <span className="config-label">Operating Mode:</span>
              <span className="config-value">{robot.config.operatingMode}</span>
            </div>
            <div className="config-item">
              <span className="config-label">Speed Limit:</span>
              <span className="config-value">{robot.config.speedLimit} m/s</span>
            </div>
            <div className="config-item">
              <span className="config-label">Battery Threshold:</span>
              <span className="config-value">{robot.config.batteryThreshold}%</span>
            </div>
            <div className="config-item">
              <span className="config-label">Camera Resolution:</span>
              <span className="config-value">{robot.config.sensorConfig.cameraResolution}</span>
            </div>
            <div className="config-item">
              <span className="config-label">IMU Sensitivity:</span>
              <span className="config-value">{robot.config.sensorConfig.imuSensitivity}</span>
            </div>
            <div className="config-item">
              <span className="config-label">Last Updated:</span>
              <span className="config-value">{new Date(robot.lastUpdate).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {showConfigModal && (
        <ConfigModal
          robot={robot}
          onClose={() => setShowConfigModal(false)}
          onUpdate={handleConfigUpdate}
        />
      )}
    </div>
  );
};