const jwt = require("jsonwebtoken");

// Token expiry times
const ACCESS_TOKEN_EXPIRE = "30m";      // 30 minutes
const REFRESH_TOKEN_EXPIRE = "10d";     // 10 days
const REFRESH_TOKEN_EXPIRE_MS = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds

function getAdminModel() {
  const mongoose = require("mongoose");
  if (mongoose.models["Admin"]) {
    return mongoose.models["Admin"];
  }

  const bcrypt = require("bcryptjs");
  const adminSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
      },
      password: { type: String, required: true, minlength: 6, select: false },
      role: { type: String, enum: ["admin", "super_admin"], default: "admin" },
      isActive: { type: Boolean, default: true },
      otp: { type: String, default: null },
      otpExpire: { type: Date, default: null },
      refreshTokens: [
        {
          token: { type: String, required: true },
          expiresAt: { type: Date, required: true },
          createdAt: { type: Date, default: Date.now }
        }
      ]
    },
    { timestamps: true }
  );

  adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });

  adminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  // Generate access token (short-lived)
  adminSchema.methods.getAccessToken = function () {
    return jwt.sign(
      { id: this._id, email: this.email, type: "access" },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRE }
    );
  };

  // Generate refresh token (long-lived)
  adminSchema.methods.getRefreshToken = function () {
    return jwt.sign(
      { id: this._id, email: this.email, type: "refresh" },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRE }
    );
  };

  // Save refresh token to database
  adminSchema.methods.saveRefreshToken = function (refreshToken) {
    this.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRE_MS)
    });
    // Keep only last 5 refresh tokens
    if (this.refreshTokens.length > 5) {
      this.refreshTokens = this.refreshTokens.slice(-5);
    }
  };

  // Clean up expired refresh tokens
  adminSchema.methods.cleanupRefreshTokens = function () {
    this.refreshTokens = this.refreshTokens.filter(rt => rt.expiresAt > new Date());
  };

  return mongoose.model("Admin", adminSchema, "admins");
}

// Admin signup
const adminSignup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const AdminModel = getAdminModel();
    const existingAdmin = await AdminModel.findOne({ email: email.toLowerCase() });

    if (existingAdmin) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const admin = await AdminModel.create({
      name,
      email: email.toLowerCase(),
      password
    });

    const accessToken = admin.getAccessToken();
    const refreshToken = admin.getRefreshToken();
    
    admin.saveRefreshToken(refreshToken);
    await admin.save();

    res.status(201).json({
      message: "Admin registered successfully",
      accessToken,
      refreshToken,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const AdminModel = getAdminModel();
    const admin = await AdminModel.findOne({ email: email.toLowerCase() }).select("+password");

    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await admin.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: "Admin account is inactive" });
    }

    const accessToken = admin.getAccessToken();
    const refreshToken = admin.getRefreshToken();
    
    admin.saveRefreshToken(refreshToken);
    await admin.save();

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// Verify token middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided", code: "NO_TOKEN" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const AdminModel = getAdminModel();
      const admin = await AdminModel.findById(decoded.id);

      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin not found or inactive", code: "ADMIN_NOT_FOUND" });
      }

      req.admin = admin;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ 
          message: "Access token expired", 
          code: "TOKEN_EXPIRED",
          expiredAt: error.expiredAt 
        });
      }
      throw error;
    }
  } catch (error) {
    return res.status(401).json({ 
      message: "Invalid token", 
      code: "INVALID_TOKEN",
      error: error.message 
    });
  }
};

// Verify admin token
const verifyToken = async (req, res) => {
  try {
    return res.status(200).json({
      message: "Token valid",
      admin: {
        id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role
      }
    });
  } catch (error) {
    return res.status(401).json({ message: "Token verification failed", error: error.message });
  }
};

// Get current admin
const getCurrentAdmin = async (req, res) => {
  try {
    return res.status(200).json({
      admin: {
        id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role,
        createdAt: req.admin.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch admin data", error: error.message });
  }
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via email (using a mock for now)
const sendOTPEmail = async (email, otp) => {
  try {
    // For production, integrate with nodemailer or your email service
    console.log(`OTP sent to ${email}: ${otp}`);
    return true;
  } catch (error) {
    console.error("Failed to send OTP email", error);
    return false;
  }
};

// Forgot password - send OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const AdminModel = getAdminModel();
    const admin = await AdminModel.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const otp = generateOTP();
    const otpExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    admin.otp = otp;
    admin.otpExpire = otpExpire;
    await admin.save();

    // Send OTP to email
    await sendOTPEmail(email, otp);

    return res.status(200).json({
      message: "OTP sent to your email",
      email: email,
      otpExpiry: "15 minutes"
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to process forgot password", error: error.message });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const AdminModel = getAdminModel();
    const admin = await AdminModel.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (!admin.otp || admin.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    if (new Date() > admin.otpExpire) {
      return res.status(401).json({ message: "OTP has expired" });
    }

    res.json({
      message: "OTP verified successfully",
      email: email
    });
  } catch (error) {
    return res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};

// Reset password with OTP
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const AdminModel = getAdminModel();
    const admin = await AdminModel.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (!admin.otp || admin.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    if (new Date() > admin.otpExpire) {
      return res.status(401).json({ message: "OTP has expired" });
    }

    admin.password = newPassword;
    admin.otp = null;
    admin.otpExpire = null;
    await admin.save();

    res.json({
      message: "Password reset successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reset password", error: error.message });
  }
};

// Change password (for logged-in users)
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const AdminModel = getAdminModel();
    const admin = await AdminModel.findById(req.admin._id).select("+password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isPasswordValid = await admin.matchPassword(oldPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({
      message: "Password changed successfully"
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to change password", error: error.message });
  }
};

// Refresh access token
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      const AdminModel = getAdminModel();
      const admin = await AdminModel.findById(decoded.id);

      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Admin not found or inactive" });
      }

      // Verify refresh token is in database and not expired
      admin.cleanupRefreshTokens();
      const isValidRefreshToken = admin.refreshTokens.some(rt => rt.token === refreshToken && rt.expiresAt > new Date());

      if (!isValidRefreshToken) {
        return res.status(401).json({ message: "Invalid or expired refresh token" });
      }

      const newAccessToken = admin.getAccessToken();

      res.json({
        message: "Access token refreshed successfully",
        accessToken: newAccessToken
      });
    } catch (error) {
      return res.status(401).json({ message: "Invalid refresh token", error: error.message });
    }
  } catch (error) {
    return res.status(500).json({ message: "Failed to refresh token", error: error.message });
  }
};

// Logout (invalidate refresh tokens)
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const AdminModel = getAdminModel();
    
    if (req.admin) {
      const admin = await AdminModel.findById(req.admin._id);
      if (admin && refreshToken) {
        admin.refreshTokens = admin.refreshTokens.filter(rt => rt.token !== refreshToken);
        await admin.save();
      }
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Logout failed", error: error.message });
  }
};

module.exports = {
  adminSignup,
  adminLogin,
  authMiddleware,
  verifyToken,
  getCurrentAdmin,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
  refreshAccessToken,
  logout,
  getAdminModel
};
