import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          ryderCash: true,
          // Address Information
          addressLine1: true,
          addressLine2: true,
          city: true,
          county: true,
          postcode: true,
          country: true,
          // Contact Information
          phone: true,
          dateOfBirth: true,
          // Preferences
          emailNotifications: true,
          smsNotifications: true,
          marketingEmails: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else if (req.method === "PUT") {
    const {
      name,
      email,
      // Address Information
      addressLine1,
      addressLine2,
      city,
      county,
      postcode,
      country,
      // Contact Information
      phone,
      dateOfBirth,
      // Preferences
      emailNotifications,

      marketingEmails
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    try {
      // Check if email is being changed and if it's already taken
      if (email !== session.user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser && existingUser.id !== session.user.id) {
          return res.status(400).json({ message: "Email already in use by another account" });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name,
          email,
          // Address Information
          addressLine1: addressLine1 || null,
          addressLine2: addressLine2 || null,
          city: city || null,
          county: county || null,
          postcode: postcode || null,
          country: country || "United Kingdom",
          // Contact Information
          phone: phone || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          // Preferences
          emailNotifications: emailNotifications ?? true,

          marketingEmails: marketingEmails ?? true
        },
        select: {
          id: true,
          name: true,
          email: true,
          ryderCash: true,
          // Address Information
          addressLine1: true,
          addressLine2: true,
          city: true,
          county: true,
          postcode: true,
          country: true,
          // Contact Information
          phone: true,
          dateOfBirth: true,
          // Preferences
          emailNotifications: true,
          smsNotifications: true,
          marketingEmails: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Failed to update user profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
