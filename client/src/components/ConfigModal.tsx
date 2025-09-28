import React, { useState } from 'react';
import { Robot, UpdateConfigRequest } from '../types';
import { robotsAPI } from '../services/api';
import './ConfigModal.css';

interface ConfigModalProps {
  robot: Robot;
  onClose: () => void;
  onUpdate: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ robot, onClose, onUpdate }) => {
  const [config, setConfig] = useState<UpdateConfigRequest>({
    speedLimit: robot.config.speedLimit,
    operatingMode: robot.config.operatingMode,
    batteryThreshold: robot.config.batteryThreshold,
    sensorConfig: {
      cameraResolution: robot.config.sensorConfig.cameraResolution,
      imuSensitivity: robot.config.sensorConfig.imuSensitivity,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await robotsAPI.updateConfig(robot._id, config);
      onUpdate();
    } catch (err) {
      setError('Failed to update configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Configure {robot.name}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="config-form">
          <div className="form-group">
            <label htmlFor="operatingMode">Operating Mode</label>
            <select
              id="operatingMode"
              value={config.operatingMode}
              onChange={(e) => setConfig({ ...config, operatingMode: e.target.value })}
            >
              <option value="patrol">Patrol</option>
              <option value="delivery">Delivery</option>
              <option value="maintenance">Maintenance</option>
              <option value="idle">Idle</option>
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
              value={config.speedLimit}
              onChange={(e) => setConfig({ ...config, speedLimit: parseFloat(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="batteryThreshold">Battery Alert (%)</label>
            <input
              id="batteryThreshold"
              type="number"
              min="10"
              max="30"
              value={config.batteryThreshold}
              onChange={(e) => setConfig({ ...config, batteryThreshold: parseInt(e.target.value) })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cameraResolution">Camera</label>
              <select
                id="cameraResolution"
                value={config.sensorConfig?.cameraResolution}
                onChange={(e) => setConfig({
                  ...config,
                  sensorConfig: { ...config.sensorConfig!, cameraResolution: e.target.value }
                })}
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4k">4K</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="imuSensitivity">IMU</label>
              <select
                id="imuSensitivity"
                value={config.sensorConfig?.imuSensitivity}
                onChange={(e) => setConfig({
                  ...config,
                  sensorConfig: { ...config.sensorConfig!, imuSensitivity: e.target.value }
                })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="save-button">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};