import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create a transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'noreply52147@gmail.com',
    // For Gmail, you need to use an App Password
    // This is a placeholder - replace with the actual app password
    pass: 'tnnz xzwq jryi wigl',
  },
});

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: '"LMS System" <noreply52147@gmail.com>',
      to,
      subject,
      html,
    });

    console.log('Email sent to:', to);
    console.log('Email message ID:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export function generateOTP() {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createOTPEmailTemplate(otp: string, userName: string = 'user') {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p>Dear ${userName},</p>
      <p>This is your OTP:</p>
      <div style="font-size: 24px; font-weight: bold; margin: 20px 0;">${otp}</div>
      <p>Thank you</p>
      <p>Development Team</p>
    </div>
  `;
}
