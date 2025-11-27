import nodemailer from "nodemailer";

// Create reusable transporter
const createTransporter = () => {
  const isSSL = process.env.SMTP_SECURE === "ssl" || process.env.SMTP_PORT === "465";
  
  return nodemailer.createTransport({
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
};

// Welcome email for new user registration
export async function sendWelcomeEmail(name: string, email: string) {
  const transporter = createTransporter();

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to RyderComps! 🏆</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0; font-size: 18px;">Your account has been created successfully</p>
      </div>
      
      <div style="padding: 30px;">
        <p style="font-size: 18px; color: #333;">Hi ${name},</p>
        
        <p style="color: #666; line-height: 1.8; font-size: 16px;">
          Welcome to <strong>RyderComps</strong> - the UK's premier car and bike competition site! 
          We're thrilled to have you join our community of winners.
        </p>

        <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
          <h2 style="color: #ef4444; margin: 0 0 15px 0;">🎁 What's Waiting For You</h2>
          <div style="color: #e5e7eb; line-height: 1.8;">
            <p style="margin: 8px 0;">🏎️ Premium car competitions</p>
            <p style="margin: 8px 0;">🏍️ Exclusive bike giveaways</p>
            <p style="margin: 8px 0;">💰 Low ticket prices, massive prizes</p>
            <p style="margin: 8px 0;">🎯 Transparent draws with live results</p>
          </div>
        </div>

        <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #166534;">🚀 Get Started Now</h3>
          <p style="color: #166534; margin: 0; line-height: 1.6;">
            Browse our active competitions and grab your tickets before they sell out! 
            Remember - you've got to be in it to win it!
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rydercomps.co.uk" 
             style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Browse Competitions
          </a>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #92400e;">📌 Quick Links</h4>
          <ul style="margin: 0; padding-left: 20px; color: #78350f; line-height: 1.8;">
            <li><a href="https://rydercomps.co.uk/dashboard" style="color: #dc2626;">Your Dashboard</a> - View your entries & tickets</li>
            <li><a href="https://rydercomps.co.uk/winners" style="color: #dc2626;">Winners Page</a> - See our lucky winners</li>
            <li><a href="https://rydercomps.co.uk/faqs" style="color: #dc2626;">FAQs</a> - Got questions? We've got answers</li>
          </ul>
        </div>

        <p style="color: #666; line-height: 1.6;">
          Good luck, and welcome to the RyderComps family! 🤞
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
          Questions? Reply to this email or visit our <a href="https://rydercomps.co.uk/contact" style="color: #dc2626;">contact page</a>.<br>
          RyderComps - Premium Car & Bike Competitions
        </p>
      </div>
    </div>
  `;

  try {
    console.log('Sending welcome email to:', email);
    
    const info = await transporter.sendMail({
      from: `"RyderComps" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `🎉 Welcome to RyderComps, ${name}! Your Adventure Starts Now`,
      html: emailHtml,
    });
    
    console.log('Welcome email sent successfully');
    console.log('Message ID:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Failed to send welcome email:', error);
    console.error('Error message:', error.message);
    return false;
  }
}

// Password reset email
export async function sendPasswordResetEmail(name: string, email: string, resetToken: string) {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.NEXTAUTH_URL || 'https://rydercomps.co.uk'}/auth/reset-password?token=${resetToken}`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request 🔐</h1>
      </div>
      
      <div style="padding: 30px;">
        <p style="font-size: 18px; color: #333;">Hi ${name},</p>
        
        <p style="color: #666; line-height: 1.8; font-size: 16px;">
          We received a request to reset your password for your RyderComps account. 
          Click the button below to create a new password:
        </p>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 16px 45px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Reset My Password
          </a>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #92400e;">⏰ Important</h4>
          <p style="color: #78350f; margin: 0; line-height: 1.6;">
            This link will expire in <strong>1 hour</strong> for security reasons.<br>
            If you didn't request this reset, you can safely ignore this email.
          </p>
        </div>

        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="color: #dc2626; word-break: break-all; font-size: 12px; background: #f3f4f6; padding: 10px; border-radius: 4px;">
          ${resetUrl}
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
          Questions? Visit our <a href="https://rydercomps.co.uk/contact" style="color: #dc2626;">contact page</a>.<br>
          RyderComps - Premium Car & Bike Competitions
        </p>
      </div>
    </div>
  `;

  try {
    console.log('Sending password reset email to:', email);
    
    const info = await transporter.sendMail({
      from: `"RyderComps" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `🔐 Reset Your RyderComps Password`,
      html: emailHtml,
    });
    
    console.log('Password reset email sent successfully');
    console.log('Message ID:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Failed to send password reset email:', error);
    console.error('Error message:', error.message);
    return false;
  }
}

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
    console.log('Attempting to send email...');
    console.log('SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM,
      secure: process.env.SMTP_SECURE,
      tlsReject: process.env.SMTP_TLS_REJECT_UNAUTHORIZED
    });
    
    const info = await transporter.sendMail({
      from: `"RyderComps" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: data.customerEmail,
      subject: `🎟️ Order Confirmed - ${data.entries.length} Competition${data.entries.length > 1 ? 's' : ''} Entered!`,
      html: emailHtml,
    });
    
    console.log('Order confirmation email sent to:', data.customerEmail);
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    return true;
  } catch (error: any) {
    console.error('Failed to send order confirmation email:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
    return false;
  }
}

// Instant Win Notification Email
interface InstantWinData {
  customerName: string;
  customerEmail: string;
  competitionTitle: string;
  wins: {
    ticketNumber: number;
    prizeName: string;
    prizeType: 'CASH' | 'RYDER_CASH';
    value: number;
  }[];
  totalCashWon: number;
  totalRyderCashWon: number;
}

export async function sendInstantWinEmail(data: InstantWinData) {
  const transporter = createTransporter();
  
  const totalWon = data.totalCashWon + data.totalRyderCashWon;
  
  const winsHtml = data.wins.map(win => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #fef3c7;">
        <span style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #78350f; padding: 4px 12px; border-radius: 4px; font-weight: bold;">
          🏆 #${win.ticketNumber}
        </span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fef3c7; font-weight: bold; color: #166534;">
        ${win.prizeName}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fef3c7; text-align: right; font-weight: bold; color: #166534;">
        £${win.value.toFixed(2)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fef3c7;">
        <span style="background: ${win.prizeType === 'RYDER_CASH' ? '#dcfce7' : '#dbeafe'}; color: ${win.prizeType === 'RYDER_CASH' ? '#166534' : '#1e40af'}; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
          ${win.prizeType === 'RYDER_CASH' ? '💰 RyderCash' : '💵 Cash'}
        </span>
      </td>
    </tr>
  `).join('');

  // Build claim instructions based on prize types
  let claimInstructions = '';
  
  if (data.totalRyderCashWon > 0) {
    claimInstructions += `
      <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e;">
        <h4 style="margin: 0 0 10px 0; color: #166534;">💰 RyderCash (£${data.totalRyderCashWon.toFixed(2)})</h4>
        <p style="color: #166534; margin: 0; line-height: 1.6;">
          <strong>Already credited!</strong> Your RyderCash has been automatically added to your account. 
          Use it on your next competition entry - it works just like cash!
        </p>
        <p style="margin: 10px 0 0 0;">
          <a href="https://rydercomps.co.uk/account" style="color: #166534; font-weight: bold;">View Your Balance →</a>
        </p>
      </div>
    `;
  }
  
  if (data.totalCashWon > 0) {
    claimInstructions += `
      <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6;">
        <h4 style="margin: 0 0 10px 0; color: #1e40af;">💵 Cash Prize (£${data.totalCashWon.toFixed(2)})</h4>
        <p style="color: #1e40af; margin: 0; line-height: 1.6;">
          <strong>Action Required:</strong> To claim your cash prize, please contact us with your preferred payment method:
        </p>
        <ul style="color: #1e40af; margin: 10px 0; padding-left: 20px;">
          <li>Bank Transfer (UK accounts)</li>
          <li>PayPal</li>
        </ul>
        <p style="margin: 10px 0 0 0;">
          <a href="https://rydercomps.co.uk/contact" style="background: #3b82f6; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; display: inline-block;">
            Contact Us to Claim
          </a>
        </p>
      </div>
    `;
  }

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9;">
      <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 40px; text-align: center;">
        <div style="font-size: 60px; margin-bottom: 10px;">🎉🏆🎉</div>
        <h1 style="color: #78350f; margin: 0; font-size: 32px;">CONGRATULATIONS!</h1>
        <p style="color: #92400e; margin: 15px 0 0 0; font-size: 20px;">You've Won an Instant Prize!</p>
      </div>
      
      <div style="padding: 30px;">
        <p style="font-size: 18px; color: #333;">Hi ${data.customerName},</p>
        
        <p style="color: #666; line-height: 1.8; font-size: 16px;">
          Amazing news! 🎊 Your ticket purchase for <strong>${data.competitionTitle}</strong> 
          included ${data.wins.length} winning ticket${data.wins.length > 1 ? 's' : ''}!
        </p>

        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 25px 0; text-align: center; border: 2px solid #f59e0b;">
          <h2 style="color: #78350f; margin: 0 0 5px 0;">Total Won</h2>
          <div style="font-size: 48px; font-weight: bold; color: #166534;">£${totalWon.toFixed(2)}</div>
        </div>

        <h3 style="color: #333; margin: 25px 0 15px 0;">🏆 Your Winning Tickets</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);">
              <th style="padding: 12px; text-align: left; color: #78350f;">Ticket</th>
              <th style="padding: 12px; text-align: left; color: #78350f;">Prize</th>
              <th style="padding: 12px; text-align: right; color: #78350f;">Value</th>
              <th style="padding: 12px; text-align: left; color: #78350f;">Type</th>
            </tr>
          </thead>
          <tbody>
            ${winsHtml}
          </tbody>
        </table>

        <h3 style="color: #333; margin: 25px 0 15px 0;">📋 How to Claim Your Prize</h3>
        ${claimInstructions}

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h4 style="margin: 0 0 10px 0; color: #374151;">📌 Remember</h4>
          <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
            <li>You're still in the running for the <strong>main prize draw</strong>!</li>
            <li>View all your entries in your <a href="https://rydercomps.co.uk/dashboard" style="color: #dc2626;">dashboard</a></li>
            <li>Instant wins are separate from the main competition draw</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rydercomps.co.uk" 
             style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Try Your Luck Again!
          </a>
        </div>

        <p style="color: #666; line-height: 1.6;">
          Congratulations once again! 🎉 Good luck in the main draw!
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
          Questions about your prize? Reply to this email or visit our <a href="https://rydercomps.co.uk/contact" style="color: #dc2626;">contact page</a>.<br>
          RyderComps - Premium Car & Bike Competitions
        </p>
      </div>
    </div>
  `;

  try {
    console.log('Sending instant win notification email to:', data.customerEmail);
    
    const info = await transporter.sendMail({
      from: `"RyderComps" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: data.customerEmail,
      subject: `🏆 WINNER! You won £${totalWon.toFixed(2)} in Instant Prizes!`,
      html: emailHtml,
    });
    
    console.log('Instant win email sent successfully');
    console.log('Message ID:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Failed to send instant win email:', error);
    console.error('Error message:', error.message);
    return false;
  }
}

// Admin notification for new withdrawal request
export async function sendWithdrawalRequestNotification(data: {
  userName: string;
  userEmail: string;
  amount: number;
  paymentMethod: string;
  paymentDetails: any;
}) {
  const transporter = createTransporter();
  
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;
  
  const paymentDetailsHtml = data.paymentMethod === 'bank_transfer' 
    ? `
      <p><strong>Account Name:</strong> ${data.paymentDetails.accountName}</p>
      <p><strong>Sort Code:</strong> ${data.paymentDetails.sortCode}</p>
      <p><strong>Account Number:</strong> ${data.paymentDetails.accountNumber}</p>
    `
    : `<p><strong>PayPal Email:</strong> ${data.paymentDetails.paypalEmail}</p>`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">💸 New Withdrawal Request</h1>
      </div>
      
      <div style="padding: 30px;">
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
          <h2 style="color: #92400e; margin: 0 0 10px 0;">Action Required</h2>
          <p style="color: #78350f; margin: 0;">A user has submitted a withdrawal request that needs your attention.</p>
        </div>

        <h3 style="color: #333; margin: 20px 0 10px 0;">User Details</h3>
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <p style="margin: 5px 0;"><strong>Name:</strong> ${data.userName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${data.userEmail}</p>
        </div>

        <h3 style="color: #333; margin: 20px 0 10px 0;">Withdrawal Details</h3>
        <div style="background: #dcfce7; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 36px; font-weight: bold; color: #166534;">£${data.amount.toFixed(2)}</div>
          <div style="color: #166534; margin-top: 5px;">Requested Amount</div>
        </div>

        <h3 style="color: #333; margin: 20px 0 10px 0;">Payment Method: ${data.paymentMethod === 'bank_transfer' ? '🏦 Bank Transfer' : '💳 PayPal'}</h3>
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
          ${paymentDetailsHtml}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rydercomps.co.uk/admin/withdrawals" 
             style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            Review Withdrawal Requests
          </a>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
          This is an automated notification from RyderComps.
        </p>
      </div>
    </div>
  `;

  try {
    console.log('Sending withdrawal request notification to admin:', adminEmail);
    
    const info = await transporter.sendMail({
      from: `"RyderComps" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `💸 New Withdrawal Request - £${data.amount.toFixed(2)} from ${data.userName}`,
      html: emailHtml,
    });
    
    console.log('Admin notification email sent successfully');
    console.log('Message ID:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Failed to send admin notification:', error);
    console.error('Error message:', error.message);
    return false;
  }
}

// User notification when withdrawal is processed
export async function sendWithdrawalProcessedEmail(data: {
  userName: string;
  userEmail: string;
  amount: number;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}) {
  const transporter = createTransporter();
  
  const isApproved = data.status === 'approved';
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9;">
      <div style="background: linear-gradient(135deg, ${isApproved ? '#22c55e' : '#ef4444'} 0%, ${isApproved ? '#16a34a' : '#dc2626'} 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">${isApproved ? '✅ Withdrawal Approved!' : '❌ Withdrawal Update'}</h1>
      </div>
      
      <div style="padding: 30px;">
        <p style="font-size: 18px; color: #333;">Hi ${data.userName},</p>
        
        ${isApproved ? `
          <p style="color: #666; line-height: 1.8; font-size: 16px;">
            Great news! Your withdrawal request has been approved and processed.
          </p>
          
          <div style="background: #dcfce7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <div style="font-size: 36px; font-weight: bold; color: #166534;">£${data.amount.toFixed(2)}</div>
            <div style="color: #166534; margin-top: 5px;">Has been sent to your account</div>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #92400e;">⏰ Processing Time</h4>
            <p style="color: #78350f; margin: 0; line-height: 1.6;">
              Bank transfers typically arrive within 1-3 business days. PayPal transfers are usually instant.
            </p>
          </div>
        ` : `
          <p style="color: #666; line-height: 1.8; font-size: 16px;">
            Unfortunately, we were unable to process your withdrawal request at this time.
          </p>
          
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #991b1b;">Reason</h4>
            <p style="color: #991b1b; margin: 0; line-height: 1.6;">
              ${data.rejectionReason || 'Please contact support for more information.'}
            </p>
          </div>
          
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #1e40af;">💰 Your Balance</h4>
            <p style="color: #1e40af; margin: 0; line-height: 1.6;">
              The amount of £${data.amount.toFixed(2)} has been returned to your account balance.
              You can submit a new withdrawal request after addressing the issue.
            </p>
          </div>
        `}

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://rydercomps.co.uk/account" 
             style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            View Your Account
          </a>
        </div>

        <p style="color: #666; line-height: 1.6;">
          If you have any questions, please don't hesitate to contact us.
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
          Questions? Reply to this email or visit our <a href="https://rydercomps.co.uk/contact" style="color: #dc2626;">contact page</a>.<br>
          RyderComps - Premium Car & Bike Competitions
        </p>
      </div>
    </div>
  `;

  try {
    console.log('Sending withdrawal processed email to:', data.userEmail);
    
    const info = await transporter.sendMail({
      from: `"RyderComps" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: data.userEmail,
      subject: isApproved 
        ? `✅ Withdrawal Approved - £${data.amount.toFixed(2)}` 
        : `❌ Withdrawal Request Update`,
      html: emailHtml,
    });
    
    console.log('Withdrawal processed email sent successfully');
    console.log('Message ID:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Failed to send withdrawal processed email:', error);
    console.error('Error message:', error.message);
    return false;
  }
}

