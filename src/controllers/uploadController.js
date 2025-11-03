import cloudinary from '../util/cloudinary.js';

export const uploadImages = async (req, res) => {
  try {
    console.log('📸 Incoming files:', req.files); // 🧩 add this line

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const uploadPromises = req.files.map(async (file) => {
      console.log('⏫ Uploading:', file.path); // 🧩 add this line
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'homelink_properties',
      });
      return result.secure_url;
    });

    const urls = await Promise.all(uploadPromises);
    res.status(200).json({ urls });
  } catch (error) {
    console.error('🔥 Cloudinary Upload Error:', error); // 🧩 add this line
    res
      .status(500)
      .json({ message: 'Image upload failed', error: error.message });
  }
};
