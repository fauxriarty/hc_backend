const prisma = require('../models');

const handleAdminQuery = async (req, res) => {
  const { category, location, description } = req.body;

  try {
    const users = await prisma.user.findMany({
      where: {
        haves: {
          some: {
            category: category,
            description: {  
              contains: description,
            },
          },
        },
        address: {
          contains: location,
        },
      },
      include: {
        haves: true,
      },
    });

    const result = users.map(user => ({
      name: user.name,
      phoneNumber: user.phoneNumber,
      email: user.email,
      address: user.address,
      description: user.haves
        .filter(have => have.category === category && have.description.includes(description))
        .map(have => have.description)
        .join(', '),
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'An error occurred while fetching users.' });
  }
};

module.exports = {
  handleAdminQuery,
};
