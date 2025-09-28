import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Robot } from '../types';
import { robotsAPI, simulationAPI } from '../services/api';
import { RobotCard } from '../components/RobotCard';
import { AddRobotModal } from '../components/AddRobotModal';
import { useDebounce } from '../hooks/useDebounce';
import './DashboardPage.css';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { telemetryData, subscribe } = useWebSocket();
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    zone: '',
    batteryLevel: '',
    search: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });

  const [totalRobots, setTotalRobots] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [showAddRobotModal, setShowAddRobotModal] = useState(false);

  const fetchRobots = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      };
      const response = await robotsAPI.getRobots(params);
      setRobots(response.robots);
      setTotalRobots(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setError('');
      
      // Subscribe to all robots on this page
      const robotIds = response.robots.map(robot => robot._id);
      subscribe(robotIds);
    } catch (err) {
      setError('Failed to fetch robots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRobots();
    fetchSimulationStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination]);

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearch]);

  const fetchSimulationStatus = async () => {
    try {
      const response = await simulationAPI.getStatus();
      setSimulationRunning(response.isRunning);
    } catch (err) {
      console.error('Failed to fetch simulation status');
    }
  };

  const toggleSimulation = async () => {
    setSimulationLoading(true);
    try {
      if (simulationRunning) {
        await simulationAPI.stop();
        setSimulationRunning(false);
      } else {
        await simulationAPI.start();
        setSimulationRunning(true);
      }
    } catch (err) {
      console.error('Failed to toggle simulation');
    } finally {
      setSimulationLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      zone: '',
      batteryLevel: '',
      search: '',
    });
    setSearchInput('');
    setPagination({ page: 1, limit: 10 });
  };

  const handleConfigUpdate = (robotId: string) => {
    // Refresh robots data after config update
    fetchRobots();
  };

  const handleRobotCreated = () => {
    setShowAddRobotModal(false);
    fetchRobots(); // Refresh the robots list
  };

  // Robots are already filtered by backend, no need for frontend filtering

  // Calculate stats
  const stats = {
    active: robots.filter(r => r.status === 'active').length,
    idle: robots.filter(r => r.status === 'idle').length,
    offline: robots.filter(r => r.status === 'offline').length,
    lowBattery: robots.filter(r => r.battery <= 20).length,
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🤖 Robotics Dashboard</h1>
          <div className="global-simulation-status">
            <span className={`sim-status ${simulationRunning ? 'active' : 'stopped'}`}>
              <span className={`status-dot ${simulationRunning ? 'green' : 'red'}`}></span>
              Fleet Simulation: {simulationRunning ? 'Active' : 'Stopped'}
            </span>
          </div>
        </div>
        <div className="header-right">
          {/* <div className="simulation-controls">
            <span className="simulation-status">
              Simulation: {simulationRunning ? '🟢 Running' : '⚫ Stopped'}
            </span>
            <button 
              onClick={toggleSimulation} 
              disabled={simulationLoading}
              className={`simulation-button ${simulationRunning ? 'stop' : 'start'}`}
            >
              {simulationLoading ? '...' : (simulationRunning ? 'Stop' : 'Start')}
            </button>
          </div> */}
          <span className="user-info">
            Welcome, {user?.username} ({user?.role})
          </span>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>

          <select
            value={filters.zone}
            onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
          >
            <option value="">All Zones</option>
            <option value="warehouse-a">Warehouse A</option>
            <option value="warehouse-b">Warehouse B</option>
            <option value="dock">Dock</option>
          </select>

          <select
            value={filters.batteryLevel}
            onChange={(e) => setFilters({ ...filters, batteryLevel: e.target.value })}
          >
            <option value="">All Battery</option>
            <option value="low">Low (≤20%)</option>
            <option value="medium">Medium (21-60%)</option>
            <option value="high">High (&gt;60%)</option>
          </select>

          <input
            type="text"
            placeholder="🔍 Search robots..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />

          <button onClick={resetFilters} className="reset-button">
            Reset Filters
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-section">
        <div className="stat-card">
          <span className="stat-icon">🟢</span>
          <div>
            <div className="stat-number">{stats.active}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🟡</span>
          <div>
            <div className="stat-number">{stats.idle}</div>
            <div className="stat-label">Idle</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚫</span>
          <div>
            <div className="stat-number">{stats.offline}</div>
            <div className="stat-label">Offline</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚠️</span>
          <div>
            <div className="stat-number">{stats.lowBattery}</div>
            <div className="stat-label">Low Battery</div>
          </div>
        </div>
      </div>

      {/* Robot Grid */}
      <div className="robots-section">
        <div className="section-header">
          <h2>Robot Fleet ({totalRobots} robots)</h2>
          <div className="section-header-actions">
            <div className="pagination-info">
              Page {pagination.page} of {totalPages} • Showing {robots.length} robots
            </div>
            <button 
              onClick={() => setShowAddRobotModal(true)}
              className="add-robot-button"
            >
              + Add Robot
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            Loading robots...
          </div>
        ) : error ? (
          <div className="error">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={fetchRobots} className="retry-button">
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="robots-grid">
              {robots.map((robot) => (
                <RobotCard
                  key={robot._id}
                  robot={robot}
                  telemetry={telemetryData.get(robot._id)}
                  onConfigUpdate={handleConfigUpdate}
                  simulationRunning={simulationRunning}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="pagination-button"
                >
                  ← Previous
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, pagination.page - 2) + i;
                    if (page > totalPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => setPagination({ ...pagination, page })}
                        className={`pagination-page ${page === pagination.page ? 'active' : ''}`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === totalPages}
                  className="pagination-button"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {!loading && !error && robots.length === 0 && (
          <div className="no-robots">
            <span className="no-results-icon">🤖</span>
            <h3>No robots found</h3>
            <p>Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>

      {/* Add Robot Modal */}
      {showAddRobotModal && (
        <AddRobotModal
          onClose={() => setShowAddRobotModal(false)}
          onSuccess={handleRobotCreated}
        />
      )}
    </div>
  );
};