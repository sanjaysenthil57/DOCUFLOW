const nodemailer = require('nodemailer');

const isSmtpConfigured = () => {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_HOST.trim().length > 0);
};

const getTransporter = () => {
  if (!isSmtpConfigured()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendPasswordResetEmail = async (email, resetToken, verificationCode, name) => {
  const from = process.env.EMAIL_FROM || '"DocuFlow AI (Kongu Engineering College)" <noreply@kongu.edu>';

  if (!isSmtpConfigured()) {
    return {
      sent: false,
      reason: 'SMTP_NOT_CONFIGURED',
      message: 'SMTP credentials are not configured in backend/.env.'
    };
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resetLink = `${clientUrl}/forgot-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  try {
    const transporter = getTransporter();
    const mailOptions = {
      from,
      to: email,
      subject: 'DocuFlow AI — Password Recovery Verification Code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #2563eb;">
            <h2 style="color: #0f172a; margin: 0; font-size: 22px;">DocuFlow <span style="color: #2563eb;">AI</span></h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Kongu Engineering College • Academic Platform</p>
          </div>
          <div style="padding: 24px 0;">
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">Hello <strong>${name || 'Faculty Member'}</strong>,</p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              A secure password reset was requested for your registered institutional account (<code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #0f172a;">${email}</code>).
            </p>
            
            <div style="background-color: #f8fafc; border: 2px dashed #93c5fd; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #475569; font-weight: 700; display: block; margin-bottom: 8px;">Your 6-Digit Verification Code</span>
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; font-family: monospace;">${verificationCode}</span>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">Verify & Reset Password Online</a>
            </div>

            <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 16px 0;">
              • This recovery verification code and link expire in <strong>15 minutes</strong>.<br/>
              • If you did not initiate this password reset, please secure your account immediately or notify the IT administrator.
            </p>
          </div>
          <div style="text-align: center; padding-top: 16px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 11px;">
            Kongu Engineering College, Perundurai, Erode, Tamil Nadu 638060
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[SMTP Password Reset Email Dispatch Failed]', error);
    return { sent: false, error: error.message };
  }
};

module.exports = {
  isSmtpConfigured,
  sendPasswordResetEmail
};
