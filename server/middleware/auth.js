const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    req.user = user;
    req.accessLevel = decoded.accessLevel || "full";
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Middleware to check if user has required access level
const requireAccessLevel = (requiredLevel) => {
  return (req, res, next) => {
    const accessLevels = {
      none: 0,
      basic: 1,
      full: 2
    };

    const userLevel = accessLevels[req.accessLevel] || 0;
    const required = accessLevels[requiredLevel] || 0;

    if (userLevel < required) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions."
      });
    }

    next();
  };
};

// Middleware to check if doctor is approved (for sensitive operations)
const requireDoctorApproval = (req, res, next) => {
  if (req.user.role === "doctor" && req.user.approvalStatus !== "approved") {
    return res.status(403).json({
      message: "Access denied. Your account is pending hospital admin approval."
    });
  }
  next();
};

// Middleware to authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. Insufficient role permissions."
      });
    }
    next();
  };
};

module.exports = {
  auth,
  authorize,
  requireAccessLevel,
  requireDoctorApproval
};
