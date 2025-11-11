import prisma from '../../src/prismaClient.js';

// ✅ Add a property to favorites
export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const propertyId = parseInt(req.params.propertyId);

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property)
      return res.status(404).json({ message: 'Property not found' });

    // Prevent duplicate favorites
    const existing = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });

    if (existing)
      return res.status(400).json({ message: 'Already in favorites' });

    const favorite = await prisma.favorite.create({
      data: { userId, propertyId },
      include: { property: true },
    });

    res.status(201).json({ message: 'Added to favorites', favorite });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ message: 'Failed to add favorite', error });
  }
};

// ✅ Remove property from favorites
export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const propertyId = parseInt(req.params.propertyId);
    console.log('User ID:', userId, 'Property ID:', propertyId);

    await prisma.favorite.delete({
      where: { userId_propertyId: { userId, propertyId } },
    });

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Failed to remove favorite', error });
  }
};

// ✅ Get all favorites for logged-in tenant
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: { property: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(favorites.map((fav) => fav.property));
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Failed to fetch favorites', error });
  }
};

// export const checkFavoriteStatus = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const propertyId = parseInt(req.params.propertyId);

//     const favorite = await prisma.favorite.findUnique({
//       where: { userId_propertyId: { userId, propertyId } },
//     });

//     res.json({ isFavorite: !!favorite });
//   } catch (error) {
//     console.error('Check favorite status error:', error);
//     res.status(500).json({ message: 'Failed to check favorite status', error });
//   }
// };

// GET /api/favorite/:propertyId/status
export const getFavoriteStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const propertyId = parseInt(req.params.propertyId);

    const favorite = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });

    res.json({ isFavorite: !!favorite }); // true if exists, false otherwise
  } catch (error) {
    console.error('Check favorite status error:', error);
    res.status(500).json({ message: 'Failed to check favorite status' });
  }
};

