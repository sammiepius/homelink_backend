import prisma from '../../src/prismaClient.js';


export const createProperty = async (req, res) => {
  const {
    title,
    description,
    price,
    location,
    images,
    type,
    bedrooms,
    bathrooms,
  } = req.body;

  const landlordId = parseInt(req.user.id);

  try {
    const landlord = await prisma.user.findUnique({
      where: { id: landlordId },
    });

    if (!landlord || landlord.role !== 'LANDLORD') {
      return res
        .status(403)
        .json({ error: 'Access denied. Only landlords can add properties.' });
    }

    const newProperty = await prisma.property.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        location,
        images: JSON.stringify(images || []), // ✅ store as JSON
        type,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        landlordId,
      },
    });

    res.status(201).json({
      message: '✅ Property added successfully',
      property: newProperty,
    });
  } catch (error) {
    console.error('❌ Error creating property:', error);
    res.status(500).json({ message: 'Failed to create property' });
  }
};

// Get all properties (for listing page)
export const getAllProperties = async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      include: { landlord: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Failed to fetch properties' });
  }
};

// Get single property by ID
export const getPropertyById = async (req, res) => {
  const { id } = req.params;
  try {
    const property = await prisma.property.findUnique({
      where: { id: parseInt(id) },
      include: { landlord: true },
    });

    if (!property)
      return res.status(404).json({ message: 'Property not found' });
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ message: 'Failed to fetch property' });
  }
};

export const deleteProperty = async (req, res) => {
  const { id } = req.params;
  const landlordId = req.user.id;

  try {
    const property = await prisma.property.findUnique({
      where: { id: parseInt(id) },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.landlordId !== parseInt(landlordId)) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this property' });
    }

    await prisma.property.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ message: 'Failed to delete property' });
  }
};
