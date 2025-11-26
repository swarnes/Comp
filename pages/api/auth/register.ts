import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { sendWelcomeEmail } from "../../../lib/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { 
    name, 
    email, 
    password, 
    role = "user",
    // Address Information
    addressLine1,
    addressLine2,
    city,
    county,
    postcode,
    country = "United Kingdom",
    // Contact Information
    phone,
    dateOfBirth,
    // Preferences
    emailNotifications = true,

    marketingEmails = true
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with all profile information
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        // Address Information
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        county: county || null,
        postcode: postcode || null,
        country,
        // Contact Information
        phone: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        // Preferences
        emailNotifications,

        marketingEmails
      }
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    // Send welcome email (don't await - send in background)
    sendWelcomeEmail(name, email).catch((err) => {
      console.error("Failed to send welcome email:", err);
    });
    
    res.status(201).json({ 
      message: "User created successfully", 
      user: userWithoutPassword 
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
