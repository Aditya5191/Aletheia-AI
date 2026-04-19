import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Configuring } from './pages/Configuring';
import { LiveAudit } from './pages/LiveAudit';
import { BackgroundHalo } from './components/BackgroundHalo';

function App() {
  return (
    <Router>
      <div className="flex w-full min-h-screen bg-background text-on-surface relative">
        {/* Interactive Background Layer */}
        <BackgroundHalo />
        
        {/* Content Layer */}
        <div className="relative z-10 flex w-full">
          <Routes>
            <Route path="/" element={<Upload />} />
            <Route path="/configuring" element={<Configuring />} />
            <Route path="/live-audit" element={<LiveAudit />} />
            <Route 
              path="/dashboard" 
              element={
                <>
                  <Sidebar />
                  <Dashboard />
                </>
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
