import { Routes, Route, Link, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import DriverDashboard from "./pages/DriverDashboard.jsx";
import TrackShipmentPage from "./pages/TrackShipmentPage.jsx";
import RegisterPage from "./pages/RegisterPage";
import BookingPage from "./pages/BookingPage";
import ManifestPage from "./pages/ManifestPage";
import DeliveryReceiptPage from "./pages/DeliveryReceiptPage";
import ScanPage from "./pages/ScanPage";
import CustomerDashboard from "./pages/CustomerDashboard.jsx";

function PublicTopbar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="brand-title">LogistiX Tracker</span>
          <span className="brand-subtitle">
            Smart parcel movement, driver updates, and live tracking
          </span>
        </div>

        <nav className="nav-links">
          <Link to="/register" className="nav-link">Register</Link>
          <Link to="/login" className="nav-link">Login</Link>
        </nav>
      </div>
    </header>
  );
}

function AdminTopbar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="brand-title">LogistiX Admin</span>
          <span className="brand-subtitle">
            Shipment control, assignment, and delivery operations
          </span>
        </div>

        <nav className="nav-links">
          <Link to="/admin" className="nav-link">Dashboard</Link>
          <Link to="/login" className="nav-link">Logout</Link>
        </nav>
      </div>
    </header>
  );
}

function DriverTopbar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="brand-title">Driver Workspace</span>
          <span className="brand-subtitle">
            Assigned shipments, barcode scan, and route updates
          </span>
        </div>

        <nav className="nav-links">
          <Link to="/driver" className="nav-link">Dashboard</Link>
          <Link to="/scan" className="nav-link">Scan</Link>
          <Link to="/login" className="nav-link">Logout</Link>
        </nav>
      </div>
    </header>
  );
}

function CustomerTopbar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="brand-title">Customer Portal</span>
          <span className="brand-subtitle">
            Send packages, track shipments, and view delivery progress
          </span>
        </div>

        <nav className="nav-links">
          <Link to="/customer" className="nav-link">Home</Link>
          <Link to="/track" className="nav-link">Track</Link>
          <Link to="/book" className="nav-link">Send Package</Link>
          <Link to="/login" className="nav-link">Logout</Link>
        </nav>
      </div>
    </header>
  );
}

function AppHeader() {
  const location = useLocation();
  const path = location.pathname;

  if (path === "/" || path === "/login" || path === "/register") {
    return <PublicTopbar />;
  }

  if (
    path.startsWith("/admin") ||
    path.startsWith("/manifest") ||
    path.startsWith("/delivery-receipt")
  ) {
    return <AdminTopbar />;
  }

  if (path.startsWith("/driver") || path.startsWith("/scan")) {
    return <DriverTopbar />;
  }

  if (
    path.startsWith("/customer") ||
    path.startsWith("/track") ||
    path.startsWith("/book")
  ) {
    return <CustomerTopbar />;
  }

  return <PublicTopbar />;
}

function App() {
  return (
    <div className="app-shell">
      <AppHeader />

      <main className="container">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/customer" element={<CustomerDashboard />} />

          <Route path="/track" element={<TrackShipmentPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/scan" element={<ScanPage />} />

          <Route path="/manifest/:trackingId" element={<ManifestPage />} />
          <Route
            path="/delivery-receipt/:trackingId"
            element={<DeliveryReceiptPage />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;