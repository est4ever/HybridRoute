import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MetricsProvider } from './context/MetricsContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Demo from './pages/Demo';
import Metrics from './pages/Metrics';
import Architecture from './pages/Architecture';

export default function App() {
  return (
    <BrowserRouter>
      <MetricsProvider>
        <div className="min-h-screen bg-[oklch(0.04_0.01_260)] text-foreground font-sans">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/architecture" element={<Architecture />} />
          </Routes>
        </div>
      </MetricsProvider>
    </BrowserRouter>
  );
}