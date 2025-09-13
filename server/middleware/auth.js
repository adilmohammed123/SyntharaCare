const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
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

    // Validate that the userId in the token is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
      console.error("Invalid userId in JWT token:", decoded.userId);
      return res.status(401).json({ message: "Invalid token format" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.log("User not found for userId:", decoded.userId);
      return res.status(401).json({ message: "Token is not valid" });
    }

    console.log("User loaded:", {
      userId: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Middleware to authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    // Flatten the roles array in case it's nested
    const flatRoles = roles.flat();

    console.log("Authorization check:", {
      userId: req.user._id,
      userRole: req.user.role,
      requiredRoles: flatRoles,
      hasPermission: flatRoles.includes(req.user.role)
    });

    if (!flatRoles.includes(req.user.role)) {
      console.log("Access denied for user:", {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: flatRoles
      });
      return res.status(403).json({
        message: "Access denied. Insufficient role permissions."
      });
    }
    next();
  };
};

module.exports = {
  auth,
  authorize
};
