require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Logistics API is running" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/shipments", require("./routes/shipmentRoutes"));
app.use("/api/scans", require("./routes/scanRoutes"));
app.use("/api/drivers", require("./routes/driverRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/payments", paymentRoutes);
app.use("/api/support", require("./routes/supportRoutes"));

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup error:", err.message);
    process.exit(1);
  }
};

startServer();