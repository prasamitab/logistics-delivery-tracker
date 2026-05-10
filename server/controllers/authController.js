//authcontroller.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, vehicleNumber } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Please provide name, email, password and role",
      });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
      phone: phone || "",
      vehicleNumber: vehicleNumber || "",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        vehicleNumber: user.vehicleNumber,
      },
      token: generateToken(user),
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (role && user.role !== role) {
      return res.status(401).json({
        message: "Role mismatch",
      });
    }

    res.json({
      message: "Login successful",
      token: generateToken(user),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        vehicleNumber: user.vehicleNumber,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};