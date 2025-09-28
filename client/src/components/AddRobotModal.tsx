import React, { useState } from 'react';
import { CreateRobotRequest } from '../types';
import { robotsAPI } from '../services/api';
import './AddRobotModal.css';

interface AddRobotModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddRobotModal: React.FC<AddRobotModalProps> = ({ onClose, onSuccess }) => {
  const [robot, setRobot] = useState<CreateRobotRequest>({
    name: '',
    assignedZone: 'warehouse-a',
    config: {
      speedLimit: 2.0,
      operatingMode: 'idle',
      batteryThreshold: 20,
      sensorConfig: {
        cameraResolution: '1080p',
        imuSensitivity: 'medium',
      },
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await robotsAPI.createRobot(robot);
      onSuccess();
    } catch (err) {
      setError('Failed to create robot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-robot-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Robot</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="add-robot-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">Robot Name</label>
              <input
                id="name"
                type="text"
                value={robot.name}
                onChange={(e) => setRobot({ ...robot, name: e.target.value })}
                placeholder="e.g., Robot-006"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="assignedZone">Assigned Zone</label>
              <select
                id="assignedZone"
                value={robot.assignedZone}
                onChange={(e) => setRobot({ ...robot, assignedZone: e.target.value })}
              >
                <option value="warehouse-a">Warehouse A</option>
                <option value="warehouse-b">Warehouse B</option>
                <option value="dock">Dock</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Configuration</h3>
            
            <div className="form-group">
              <label htmlFor="operatingMode">Operating Mode</label>
              <select
                id="operatingMode"
                value={robot.config.operatingMode}
                onChange={(e) => setRobot({
                  ...robot,
                  config: { ...robot.config, operatingMode: e.target.value }
                })}
              >
                <option value="idle">Idle</option>
                <option value="patrol">Patrol</option>
                <option value="delivery">Delivery</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="speedLimit">Speed Limit (m/s)</label>
              <input
                id="speedLimit"
                type="number"
                min="0.5"
                max="5.0"
                step="0.1"
                value={robot.config.speedLimit}
                onChange={(e) => setRobot({
                  ...robot,
                  config: { ...robot.config, speedLimit: parseFloat(e.target.value) }
                })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="batteryThreshold">Battery Alert (%)</label>
              <input
                id="batteryThreshold"
                type="number"
                min="10"
                max="30"
                value={robot.config.batteryThreshold}
                onChange={(e) => setRobot({
                  ...robot,
                  config: { ...robot.config, batteryThreshold: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Sensor Configuration</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cameraResolution">Camera Resolution</label>
                <select
                  id="cameraResolution"
                  value={robot.config.sensorConfig.cameraResolution}
                  onChange={(e) => setRobot({
                    ...robot,
                    config: {
                      ...robot.config,
                      sensorConfig: { ...robot.config.sensorConfig, cameraResolution: e.target.value }
                    }
                  })}
                >
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="4k">4K</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="imuSensitivity">IMU Sensitivity</label>
                <select
                  id="imuSensitivity"
                  value={robot.config.sensorConfig.imuSensitivity}
                  onChange={(e) => setRobot({
                    ...robot,
                    config: {
                      ...robot.config,
                      sensorConfig: { ...robot.config.sensorConfig, imuSensitivity: e.target.value }
                    }
                  })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading || !robot.name} className="create-button">
              {loading ? 'Creating...' : 'Create Robot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};