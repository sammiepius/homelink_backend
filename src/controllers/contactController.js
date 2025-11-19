import prisma from '../../src/prismaClient.js';


export const submitContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    const newMessage = await prisma.contactMessage.create({
      data: { name, email, phone, message }
    });

    res.status(201).json({ success: true, message: "Message sent", data: newMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
