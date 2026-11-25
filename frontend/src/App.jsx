
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import AuthProvider from "./context/AuthProvider";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import DashboardSection from "./pages/DashboardSection";
import Register from './pages/Register';
import BrowseAuctions from './pages/BrowseAuctions';

import './styles/variables.css';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/browse" element={<BrowseAuctions />} />
          <Route path="dashboard/:section" element={<DashboardSection />} />
          <Route path="admin" element={<DashboardSection admin />} />
        </Route>
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
