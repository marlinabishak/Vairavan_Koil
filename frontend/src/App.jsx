import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import History from './pages/History.jsx';
import RequestsPage from './pages/RequestsPage.jsx';
import Settings from './pages/Settings.jsx';
import MyHistory from './pages/MyHistory.jsx';
import WhatsAppDashboard from './pages/WhatsAppDashboard.jsx';
import Profiles from './pages/Profiles.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main layout wrapper handles the background image */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/profile" element={<Profiles />} />
            <Route path="/users" element={<Profiles />} />
            <Route path="/my-history" element={<MyHistory />} />
            <Route path="/whatsapp" element={<WhatsAppDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
