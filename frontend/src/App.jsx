import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginSignup from './pages/LoginSignup';
import Dashboard from './pages/Dashboard';
import BuySell from './pages/BuySell'; // ✅ import this

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/buy-sell" element={<BuySell />} /> {/* ✅ add this */}
      </Routes>
    </Router>
  );
}

export default App;
