import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { sendPasswordResetEmail } from "../../../lib/email";
import crypto from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      console.log("Password reset requested for non-existent email:", email);
      return res.status(200).json({ 
        message: "If an account with that email exists, we've sent a password reset link." 
      });
    }

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() }
    });

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    
    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expiresAt
      }
    });

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(
      user.name || "Customer",
      email,
      token
    );

    if (!emailSent) {
      console.error("Failed to send password reset email to:", email);
    }

    res.status(200).json({ 
      message: "If an account with that email exists, we've sent a password reset link." 
    });

  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

