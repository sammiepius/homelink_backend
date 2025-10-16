import prisma from '../../src/prismaClient.js';

export const createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      location,
      type,
      bedrooms,
      bathrooms,
      landlordId,
      images,
    } = req.body;

    const newProperty = await prisma.property.create({
      data: {
        title,
        description,
        price,
        location,
        type,
        bedrooms,
        bathrooms,
        landlordId,
        images: JSON.stringify(images),
      },
    });

    res.json(newProperty);
  } catch (err) {
    console.error('❌ Error creating property:', err);
    res.status(500).json({ error: 'Failed to create property' });
  }
};
