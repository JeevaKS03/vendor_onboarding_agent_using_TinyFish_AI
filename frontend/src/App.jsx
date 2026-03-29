import { useState, useEffect, useRef } from 'react';
import './index.css';

const DEFAULT_VENDOR_DATA = {
  businessName: "TechSolutions India Pvt Ltd",
  legalName: "TechSolutions India Private Limited",
  pan: "ABCDE1234F",
  state: "Maharashtra",
  district: "Mumbai",
  email: "contact@techsolutions.demo",
  phone: "9876543210"
};

function App() {
  const [vendorData, setVendorData] = useState(DEFAULT_VENDOR_DATA);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, running, completed, failed
  const [logs, setLogs] = useState([]);
  
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    let interval;
    if (jobId && (status === 'running' || status === 'idle' && jobId)) {
      interval = setInterval(async () => {
        try {

          const statusRes = await fetch(`http://localhost:3001/api/status/${jobId}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setStatus(statusData.status);
          }


          const logsRes = await fetch(`http://localhost:3001/api/logs/${jobId}`);
          if (logsRes.ok) {
            const logsData = await logsRes.json();
            setLogs(logsData.logs || []);
          }

          if (status !== 'running') {
          }

        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [jobId, status]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVendorData(prev => ({ ...prev, [name]: value }));
  };

  const startOnboarding = async (e) => {
    e.preventDefault();
    try {
      setStatus('running');
      setLogs([]);
      
      const res = await fetch('http://localhost:3001/api/start-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorData: vendorData })
      });
      
      const data = await res.json();
      if (data.jobId) {
        setJobId(data.jobId);
      }
    } catch (err) {
      alert("Failed to reach backend: " + err.message);
      setStatus('idle');
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>GST Portal Onboarding</h1>
        <p>Autonomous Vendor Setup via TinyFish API</p>
      </header>

      <div className="dashboard-grid">
        <div className="card">
          <h2>Vendor Configuration</h2>
          <form onSubmit={startOnboarding} className="onboarding-form">
            <div className="form-row">
              <div className="form-group">
                <label>Business Name</label>
                <input name="businessName" value={vendorData.businessName} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Legal Name</label>
                <input name="legalName" value={vendorData.legalName} onChange={handleInputChange} required />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>PAN Number</label>
                <input name="pan" value={vendorData.pan} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" name="email" value={vendorData.email} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>State</label>
                <input name="state" value={vendorData.state} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>District</label>
                <input name="district" value={vendorData.district} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <input type="tel" name="phone" value={vendorData.phone} onChange={handleInputChange} required />
            </div>
          
            <button 
              type="submit"
              className="btn-primary" 
              disabled={status === 'running'}
            >
              {status === 'running' ? 'Agent is Working...' : 'Start Autonomous Onboarding'}
            </button>
          </form>

          {status !== 'idle' && (
            <div style={{ textAlign: 'center' }}>
              <div className={`status-indicator status-${status}`}>
                {status === 'running' && <div className="pulse"></div>}
                Status: {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Live Agent Telemetry</h2>
          <div className="log-viewer">
            {logs.length === 0 ? (
              <div style={{ color: '#475569', textAlign: 'center', marginTop: '50px' }}>
                Waiting for agent initialization...
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="log-entry">
                  <span className="log-time">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className="log-msg"> {log.message}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
