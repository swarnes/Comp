import nodemailer from "nodemailer";

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "ssl", // true for 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS, // Support both names
    },
  });
};

interface OrderEntry {
  competitionTitle: string;
  ticketNumbers: number[];
  quantity: number;
  totalCost: number;
}

interface OrderConfirmationData {
  customerName: string;
  customerEmail: string;
  entries: OrderEntry[];
  totalAmount: number;
  paymentMethod: string;
  ryderCashUsed?: number;
}

export async function sendOrderConfirmation(data: OrderConfirmationData) {
  const transporter = createTransporter();
  
  const entriesHtml = data.entries.map(entry => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${entry.competitionTitle}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
        ${entry.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        ${entry.ticketNumbers.map(n => `<span style="background: #dc2626; color: white; padding: 2px 8px; border-radius: 4px; margin: 2px; display: inline-block;">#${n}</span>`).join(' ')}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        £${entry.totalCost.toFixed(2)}
      </td>
    </tr>
  `).join('');

  const paymentInfo = data.paymentMethod === 'rydercash' 
    ? `<p style="color: #059669;">Paid with RyderCash: £${data.totalAmount.toFixed(2)}</p>`
    : data.paymentMethod === 'mixed'
    ? `<p>RyderCash: £${data.ryderCashUsed?.toFixed(2) || '0.00'}<br>Card: £${(data.totalAmount - (data.ryderCashUsed || 0)).toFixed(2)}</p>`
    : `<p>Card Payment: £${data.totalAmount.toFixed(2)}</p>`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Order Confirmed! 🎉</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Thank you for your purchase</p>
      </div>
      
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #333;">Hi ${data.customerName},</p>
        
        <p style="color: #666; line-height: 1.6;">
          Great news! Your competition entries have been confirmed. Here are your ticket details:
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: #1f2937; color: white;">
              <th style="padding: 12px; text-align: left;">Competition</th>
              <th style="padding: 12px; text-align: center;">Qty</th>
              <th style="padding: 12px; text-align: left;">Ticket Numbers</th>
              <th style="padding: 12px; text-align: right;">Cost</th>
            </tr>
          </thead>
          <tbody>
            ${entriesHtml}
          </tbody>
        </table>

        <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #166534;">Payment Summary</h3>
          ${paymentInfo}
          <p style="font-size: 20px; font-weight: bold; color: #166534; margin: 10px 0 0 0;">
            Total: £${data.totalAmount.toFixed(2)}
          </p>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #92400e;">📌 What's Next?</h4>
          <ul style="margin: 0; padding-left: 20px; color: #78350f;">
            <li>Keep an eye on your email for draw announcements</li>
            <li>View your entries anytime in your <a href="https://rydercomps.co.uk/dashboard" style="color: #dc2626;">dashboard</a></li>
            <li>Winners are announced on our <a href="https://rydercomps.co.uk/winners" style="color: #dc2626;">winners page</a></li>
          </ul>
        </div>

        <p style="color: #666; line-height: 1.6;">
          Good luck! 🤞 We'll notify you if you're a winner.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rydercomps.co.uk" 
             style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Browse More Competitions
          </a>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
          Questions? Reply to this email or visit our <a href="https://rydercomps.co.uk/contact" style="color: #dc2626;">contact page</a>.<br>
          RyderComps - Premium Car & Bike Competitions
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"RyderComps" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: data.customerEmail,
      subject: `🎟️ Order Confirmed - ${data.entries.length} Competition${data.entries.length > 1 ? 's' : ''} Entered!`,
      html: emailHtml,
    });
    
    console.log('Order confirmation email sent to:', data.customerEmail);
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
}

