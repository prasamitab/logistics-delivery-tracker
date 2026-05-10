import { useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import BarcodeLabel from "../components/BarcodeLabel";

const scannerId = "shipment-scanner";

export default function ScanPage() {
  const scannerRef = useRef(null);
  const [searchParams] = useSearchParams();

  const [decodedText, setDecodedText] = useState(searchParams.get("trackingId") || "");
  const [status, setStatus] = useState("Picked Up");
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerStarted, setScannerStarted] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  const startScanner = async () => {
    try {
      setMessage("");
      setSuccess("");
      setScannerLoading(true);

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerId);
      }

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {
        setMessage("No camera found on this device.");
        setScannerLoading(false);
        return;
      }

      const backCamera = cameras[cameras.length - 1];

      await scannerRef.current.start(
        backCamera.id,
        {
          fps: 10,
          qrbox: { width: 300, height: 120 },
          aspectRatio: 1.7778,
        },
        async (decodedString) => {
          setDecodedText(decodedString);
          setSuccess(`Scanned successfully: ${decodedString}`);
          setMessage("");

          try {
            if (scannerRef.current) {
              await scannerRef.current.stop();
              await scannerRef.current.clear();
              scannerRef.current = null;
              setScannerStarted(false);
            }
          } catch (stopErr) {
            console.error("Scanner stop error:", stopErr);
          }
        },
        () => {}
      );

      setScannerStarted(true);
    } catch (err) {
      console.error("Scanner start failed:", err);
      setMessage("Unable to start scanner. Please allow camera access and try again.");
    } finally {
      setScannerLoading(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerStarted) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch (err) {
      console.error("Scanner stop failed:", err);
    } finally {
      scannerRef.current = null;
      setScannerStarted(false);
    }
  };

  const fillCurrentLocation = () => {
    setMessage("");
    setSuccess("");

    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toString());
        setLng(position.coords.longitude.toString());
      },
      () => {
        setMessage("Unable to fetch current location.");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSuccess((prev) => prev || "");

    if (!decodedText.trim()) {
      setMessage("Tracking ID is required. Scan barcode first.");
      return;
    }

    if (!locationName.trim()) {
      setMessage("Enter a location name.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const payload = {
        trackingId: decodedText.trim(),
        status,
        locationName: locationName.trim(),
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
      };

      const res = await api.post("/shipments/scan", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(
        `${decodedText} scanned and updated successfully. ${res.data?.message || ""}`
      );
    } catch (err) {
      console.error("Save scan event error:", err);
      setMessage(err.response?.data?.message || "Failed to save scan event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <p className="status-badge status-transit">Barcode Scan Portal</p>
        <h1 className="hero-title" style={{ marginTop: "1rem" }}>
          Scan shipment barcode
        </h1>
        <p className="hero-subtitle">
          Start scanner, capture barcode, and update shipment status step-by-step.
        </p>
      </section>

      {message && <div className="message error">{message}</div>}
      {success && <div className="message success">{success}</div>}

      <div className="dashboard-grid two-col">
        <section className="panel-card">
          <h2 className="section-title">Camera Scanner</h2>

          <div className="inline-row" style={{ marginTop: "1rem", flexWrap: "wrap" }}>
            {!scannerStarted ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={startScanner}
                disabled={scannerLoading}
              >
                {scannerLoading ? "Starting Scanner..." : "Start Scanner"}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={stopScanner}
              >
                Stop Scanner
              </button>
            )}
          </div>

          <div
            id={scannerId}
            style={{
              width: "100%",
              minHeight: "320px",
              marginTop: "1rem",
              borderRadius: "16px",
              overflow: "hidden",
              background: "#111111",
            }}
          />

          <div className="shipment-card" style={{ marginTop: "1rem" }}>
            <p className="tracking-label">Scanned Tracking ID</p>
            <h3>{decodedText || "No barcode detected yet"}</h3>
          </div>

          {decodedText && (
            <div style={{ marginTop: "1rem" }}>
              <BarcodeLabel value={decodedText} />
            </div>
          )}
        </section>

        <section className="panel-card">
          <h2 className="section-title">Create Scan Event</h2>

          <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
            <div className="form-grid">
              <div>
              <label>Tracking ID</label>
                <input
                  value={decodedText}
                  onChange={(e) => setDecodedText(e.target.value)}
                  placeholder="LDT260400001"
                />
              </div>

              <div>
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Picked Up">Picked Up</option>
                  <option value="At Origin Hub">At Origin Hub</option>
                  <option value="In Transit">In Transit</option>
                  <option value="At Destination Hub">At Destination Hub</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              <div>
                <label>Location Name</label>
                <input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Hyderabad Hub"
                />
              </div>

              <div>
                <label>Latitude</label>
                <input
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="17.3850"
                />
              </div>

              <div>
                <label>Longitude</label>
                <input
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="78.4867"
                />
              </div>
            </div>

            <div className="inline-row" style={{ marginTop: "1rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={fillCurrentLocation}
              >
                Use Current Location
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Scan Event"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}