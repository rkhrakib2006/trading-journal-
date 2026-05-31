import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import './App.css';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const API_URL = "http://localhost:8000";

function App() {
  const [trades, setTrades] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch Data
  const fetchData = async () => {
    try {
      const tRes = await axios.get(`${API_URL}/trades/`);
      const aRes = await axios.get(`${API_URL}/analytics/`);
      setTrades(tRes.data);
      setAnalytics(aRes.data);
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle File Upload
  const handleFileUpload = async () => {
    if (!file) return alert("Select a file first");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      await axios.post(`${API_URL}/upload-history/`, formData);
      alert("Trades Imported!");
      fetchData();
    } catch (err) {
      alert("Error importing file");
    }
    setLoading(false);
  };

  // Handle Note Save
  const saveNote = async () => {
    if (!selectedTrade) return;
    try {
      await axios.post(`${API_URL}/trades/${selectedTrade}/note/`, `note=${note}`);
      alert("Note saved!");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Screenshot Upload
  const handleScreenshot = async (e) => {
    const imgFile = e.target.files[0];
    if (!selectedTrade || !imgFile) return;
    
    const formData = new FormData();
    formData.append("file", imgFile);
    
    try {
      await axios.post(`${API_URL}/trades/${selectedTrade}/screenshot/`, formData);
      alert("Screenshot uploaded!");
    } catch (err) {
      alert("Upload failed");
    }
  };

  // Chart Data
  const winLossData = {
    labels: ['Wins', 'Losses'],
    datasets: [{
      data: analytics ? [analytics.wins, analytics.losses] : [0, 0],
      backgroundColor: ['#4caf50', '#f44336'],
    }],
  };

  const pnlChartData = {
    labels: trades.map((t, i) => i + 1),
    datasets: [{
      label: 'Cumulative P&L',
      data: trades.map((t, i) => {
        const prev = trades.slice(0, i).reduce((a, b) => a + b.profit_loss, 0);
        return prev + t.profit_loss;
      }),
      borderColor: '#2196f3',
      tension: 0.1
    }]
  };

  return (
    <div className="App">
      <header className="header">
        <h1>📈 Professional Trading Journal</h1>
        <div className="tabs">
          <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
          <button onClick={() => setActiveTab("trades")}>Trade List</button>
          <button onClick={() => setActiveTab("upload")}>Import MT5</button>
        </div>
      </header>

      <div className="content">
        {activeTab === "upload" && (
          <div className="card upload-section">
            <h2>Import MT5 History</h2>
            <p>Export your trading history from MT5 Terminal as .html or .csv</p>
            <input type="file" onChange={e => setFile(e.target.files[0])} />
            <button onClick={handleFileUpload} disabled={loading}>
              {loading ? "Importing..." : "Upload & Parse"}
            </button>
          </div>
        )}

        {activeTab === "dashboard" && analytics && (
          <div className="dashboard">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total P&L</h3>
                <p className={analytics.total_pnl >= 0 ? "green" : "red"}>
                  ${analytics.total_pnl}
                </p>
              </div>
              <div className="stat-card">
                <h3>Win Rate</h3>
                <p>{analytics.win_rate}%</p>
              </div>
              <div className="stat-card">
                <h3>Profit Factor</h3>
                <p>{analytics.profit_factor}</p>
              </div>
              <div className="stat-card">
                <h3>Max Drawdown</h3>
                <p className="red">${analytics.max_drawdown}</p>
              </div>
            </div>

            <div className="charts-container">
              <div className="chart-box">
                <h3>Win vs Loss</h3>
                <Pie data={winLossData} />
              </div>
              <div className="chart-box">
                <h3>Equity Curve</h3>
                <Line data
