import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import prisma from '../../src/prismaClient.js';

// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import prisma from "../prismaClient.js";

dotenv.config();

/**
 * ✅ Protect middleware: checks JWT and attaches user to req.user
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth error:", error);
      return res
        .status(401)
        .json({ error: "Not authorized, invalid or expired token" });
    }
  } else {
    return res.status(401).json({ error: "Not authorized, no token provided" });
  }
};

/**
 * ✅ Role-based authorization
 * Example use: router.post('/add', protect, authorizeRoles('LANDLORD'), createProperty)
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: Insufficient role" });
    }

    next();
  };
};

/**
 * ✅ Ownership verification (for editing/deleting landlord’s own property)
 */
export const checkOwnership = async (req, res, next) => {
  try {
    const propertyId = parseInt(req.params.id);
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    if (property.landlordId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this property" });
    }

    req.property = property;
    next();
  } catch (error) {
    console.error("Ownership check error:", error);
    res.status(500).json({ message: "Error verifying property ownership" });
  }
};

/**
 * ✅ (Optional) Keep your simple landlord-only middleware
 * if you’re using it in existing routes.
 */
export const landlordOnly = (req, res, next) => {
  if (req.user.role !== "LANDLORD") {
    return res.status(403).json({ message: "Access denied: Landlord only" });
  }
  next();
};


// dotenv.config();

// export const protect = async (req, res, next) => {
//   let token;

//   // check for token in Authorization header
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     try {
//       token = req.headers.authorization.split(' ')[1];
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       // find user in database
//       const user = await prisma.user.findUnique({
//         where: { id: decoded.id },
//       });

//       if (!user) {
//         return res.status(401).json({ error: 'User not found' });
//       }

//       // attach user to request (for access in routes)
//       req.user = user;
//       next();
//     } catch (error) {
//       console.error('Auth error:', error);
//       return res.status(401).json({ error: 'Not authorized, invalid token' });
//     }
//   }

//   if (!token) {
//     return res.status(401).json({ error: 'Not authorized, no token' });
//   }
// };

// export const landlordOnly = (req, res, next) => {
//   if (req.user.role !== 'LANDLORD') {
//     return res.status(403).json({ message: 'Access denied: Landlord only' });
//   }
//   next();
// };
