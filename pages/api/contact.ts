import { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, subject, message, inquiryType } = req.body;

  // Validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All required fields must be filled" });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Please provide a valid email address" });
  }

  try {
    // Create transporter - you'll need to configure with your SMTP settings
    const isSSL = process.env.SMTP_SECURE === "ssl" || process.env.SMTP_PORT === "465";
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: isSSL, // true for 465/SSL, false for 587/STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
      },
      tls: {
        // Allow self-signed certificates if configured
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
      },
    });

    // Email to admin/support team
    const adminEmailOptions = {
      from: `"RyderComps Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || "support@rydercomps.co.uk",
      subject: `[${inquiryType.toUpperCase()}] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">New Contact Form Submission</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">Contact Details</h2>
            
            <table style="width: 100%; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Name:</td>
                <td style="padding: 8px 0;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Inquiry Type:</td>
                <td style="padding: 8px 0; text-transform: capitalize;">${inquiryType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Subject:</td>
                <td style="padding: 8px 0;">${subject}</td>
              </tr>
            </table>

            <h3 style="color: #333; margin-top: 30px;">Message:</h3>
            <div style="background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 10px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>

            <div style="margin-top: 30px; padding: 15px; background: #e3f2fd; border-radius: 5px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Submitted:</strong> ${new Date().toLocaleString()}<br>
                <strong>IP Address:</strong> ${req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      `,
    };

    // Auto-reply email to user
    const userEmailOptions = {
      from: `"RyderComps Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Thank you for contacting RyderComps - We've received your message",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thank You for Contacting Us!</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="font-size: 16px; color: #333;">Hi ${name},</p>
            
            <p style="color: #666; line-height: 1.6;">
              Thank you for reaching out to RyderComps! We've successfully received your message and will get back to you as soon as possible.
            </p>

            <div style="background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Your Message Summary:</h3>
              <p style="margin: 0; color: #666;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 5px 0 0 0; color: #666;"><strong>Inquiry Type:</strong> ${inquiryType}</p>
            </div>

            <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #2e7d32;">Expected Response Time:</h4>
              <p style="margin: 0; color: #666; font-size: 14px;">
                ${inquiryType === 'payment' ? 'Payment issues: 2-4 hours' :
                  inquiryType === 'account' ? 'Account issues: 4-6 hours' :
                  inquiryType === 'technical' ? 'Technical support: 4-8 hours' :
                  'General inquiries: 24 hours'}
              </p>
            </div>

            <p style="color: #666; line-height: 1.6;">
              In the meantime, you might find answers to common questions in our 
              <a href="${process.env.NEXTAUTH_URL || 'https://rydercomps.co.uk'}/faqs" style="color: #ef4444;">FAQ section</a>.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'https://rydercomps.co.uk'}" 
                 style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Visit RyderComps
              </a>
            </div>

            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
              This is an automated response. Please do not reply to this email. 
              If you need immediate assistance, please call us at +44 20 7946 0958.
            </p>
          </div>
        </div>
      `,
    };

    // Send emails
    await transporter.sendMail(adminEmailOptions);
    await transporter.sendMail(userEmailOptions);

    res.status(200).json({ 
      success: true, 
      message: "Your message has been sent successfully! We'll get back to you soon." 
    });

  } catch (error) {
    console.error("Email sending error:", error);
    
    // Don't expose sensitive error details to client
    res.status(500).json({ 
      message: "Sorry, there was an error sending your message. Please try again or contact us directly at support@rydercomps.co.uk" 
    });
  }
}
