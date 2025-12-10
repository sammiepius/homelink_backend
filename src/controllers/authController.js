import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import prisma from '../../src/prismaClient.js';
import cloudinary from '../util/cloudinary.js';

dotenv.config();

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '3d' });
};

// ---------- SIGNUP CONTROLLER ----------
export const signup = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'tenant', // default role
        phone: phone || null,
        profilePhoto: null,
      },
    });

    // Send success response
    res.status(201).json({
      message: 'User registered successfully',
      token: generateToken(newUser.id),
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed. Please try again later.' });
  }
};

// ---------- LOGIN CONTROLLER ----------
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: 'Invalid email or password' });

    // Return token + user data
    res.status(200).json({
      message: 'Login successful',
      token: generateToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again later.' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profilePhoto: true,
        role: true,
      },
    });
    res.status(200).json(user);
  } catch (error) {
    console.error('Get profile:', error);
    res.status(500).json({ message: 'failed to fetch user profile' });
  }
};

//Update profile
export const updateProfile = async (req, res) => {
  console.log('📸 Incoming file:', req.file);

  try {
    const userId = req.user.id; // from protect middleware
    const { name, phone } = req.body;
    // let profilePhotoUrl = null;

    const updateData = {};

    if (name && name.trim() !== '') updateData.name = name;
    if (phone && phone.trim() !== '') updateData.phone = phone;

    // ✅ FIXED: use req.file, not file
    if (req.file) {
      const upload = await cloudinary.uploader.upload(req.file.path, {
        folder: 'homelink_profiles',
      });
      updateData.profilePhoto = upload.secure_url;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No data provided for update' });
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Profile Update Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to update profile', error: error.message });
  }
};

//CHANGE PASSORD
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(404).json({ message: 'Incorrect current password' });
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password Error:', error);
    res.status(500).json({ message: 'Failed to update password', error });
  }
};


export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Not an admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
