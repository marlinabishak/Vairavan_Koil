import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
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

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const forceScrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const mainScroll = document.getElementById('main-content-scroll');
      if (mainScroll) mainScroll.scrollTop = 0;
      const root = document.getElementById('root');
      if (root) root.scrollTop = 0;
    };

    // Unfocus any active element (e.g. login input / submit button)
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    // Fire immediately
    forceScrollTop();

    // Fire across intervals to beat mobile keyboard collapse animation (~300ms) and dynamic DOM mounting
    const rId = requestAnimationFrame(forceScrollTop);
    const t1 = setTimeout(forceScrollTop, 50);
    const t2 = setTimeout(forceScrollTop, 150);
    const t3 = setTimeout(forceScrollTop, 300);
    const t4 = setTimeout(forceScrollTop, 500);

    return () => {
      cancelAnimationFrame(rId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
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
