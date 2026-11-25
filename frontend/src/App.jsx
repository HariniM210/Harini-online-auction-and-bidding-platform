
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import {AdminLogin,AdminPortal} from './pages/AdminPortal';
import AuthProvider from "./context/AuthProvider";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import DashboardSection from "./pages/DashboardSection";
import Register from './pages/Register';
import AuctionDetails from './pages/AuctionDetails';
import BrowseAuctions from './pages/BrowseAuctions';
import {CreateAuction,MyAuctions} from './pages/SellerAuctions';

import {Checkout,Orders,OrderDetail} from './pages/PaymentOrders';
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
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin/*" element={<AdminPortal />} />
        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard/browse" element={<BrowseAuctions />} />
          <Route path="dashboard/browse/:id" element={<AuctionDetails key="buyer" />} />
          <Route path="dashboard/my-auctions/:id" element={<AuctionDetails key="seller" seller />} />
          <Route path="dashboard/create" element={<CreateAuction key="create" />} />
          <Route path="dashboard/my-auctions" element={<MyAuctions />} />
          <Route path="dashboard/my-auctions/:id/edit" element={<CreateAuction key="edit" />} />
          <Route path="dashboard/checkout/:id" element={<Checkout/>} />
          <Route path="dashboard/orders" element={<Orders key="buyer"/>} />
          <Route path="dashboard/order-management" element={<Orders key="seller" seller/>} />
          <Route path="dashboard/orders/:id" element={<OrderDetail/>} />
          <Route path="dashboard/orders/:id/success" element={<OrderDetail success/>} />
          <Route path="dashboard/:section" element={<DashboardSection />} />

        </Route>
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
