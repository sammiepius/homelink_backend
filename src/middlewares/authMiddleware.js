import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import prisma from '../../src/prismaClient.js';

dotenv.config();

export const protect = async (req, res, next) => {
  let token;

  // check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // find user in database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // attach user to request (for access in routes)
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ error: 'Not authorized, invalid token' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
};
