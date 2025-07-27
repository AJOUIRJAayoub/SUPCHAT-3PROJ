// Utility functions used across the backend
const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // HTML template for verification emails
  getVerificationEmailTemplate(name, verificationUrl) {
    return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container {
                        padding: 20px;
                        font-family: Arial, sans-serif;
                    }
                    .button {
                        background-color: #4CAF50;
                        border: none;
                        color: white;
                        padding: 15px 32px;
                        text-align: center;
                        text-decoration: none;
                        display: inline-block;
                        font-size: 16px;
                        margin: 4px 2px;
                        cursor: pointer;
                        border-radius: 4px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Welcome to Our Platform, ${name}!</h2>
                    <p>Thank you for registering. Please verify your email address to complete your registration.</p>
                    <a href="${verificationUrl}" class="button">Verify Email</a>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p>${verificationUrl}</p>
                    <p>This link will expire in 24 hours.</p>
                </div>
            </body>
            </html>
        `;
  }

  // HTML template for password reset emails
  getPasswordResetTemplate(name, resetUrl) {
    return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container {
                        padding: 20px;
                        font-family: Arial, sans-serif;
                    }
                    .button {
                        background-color: #008CBA;
                        border: none;
                        color: white;
                        padding: 15px 32px;
                        text-align: center;
                        text-decoration: none;
                        display: inline-block;
                        font-size: 16px;
                        margin: 4px 2px;
                        cursor: pointer;
                        border-radius: 4px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Password Reset Request</h2>
                    <p>Hi ${name},</p>
                    <p>You requested to reset your password. Click the button below to reset it:</p>
                    <a href="${resetUrl}" class="button">Reset Password</a>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p>${resetUrl}</p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            </body>
            </html>
        `;
  }

  // Main send email method
  async sendEmail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
        to,
        subject,
        html,
        text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  }

  // Send verification email
  async sendVerificationEmail(user, verificationUrl) {
    const html = this.getVerificationEmailTemplate(user.name, verificationUrl);
    await this.sendEmail({
      to: user.email,
      subject: "Email Verification",
      html,
      text: `Please verify your email by clicking this link: ${verificationUrl}`,
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(user, resetUrl) {
    const html = this.getPasswordResetTemplate(user.name, resetUrl);
    await this.sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html,
      text: `Reset your password by clicking this link: ${resetUrl}`,
    });
  }

  // Send welcome email after verification
  async sendWelcomeEmail(user) {
    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container {
                        padding: 20px;
                        font-family: Arial, sans-serif;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Welcome to Our Platform!</h2>
                    <p>Hi ${user.name},</p>
                    <p>Thank you for verifying your email. Your account is now fully activated.</p>
                    <p>You can now access all features of our platform.</p>
                </div>
            </body>
            </html>
        `;

    await this.sendEmail({
      to: user.email,
      subject: "Welcome to Our Platform",
      html,
      text: `Welcome to our platform! Your account is now fully activated.`,
    });
  }
  async sendContactUsEmail(name, phone, email, message, service) {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>New Contact Message</title>
          <style>
            .container {
              padding: 20px;
              font-family: Arial, sans-serif;
              background: #f9f9f9;
              border: 1px solid #ddd;
            }
            h1 {
              color: #333;
            }
            p {
              color: #555;
              line-height: 1.5;
            }
            .detail {
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>New Contact Message</h1>
            <div class="detail"><strong>Name:</strong> ${name}</div>
            <div class="detail"><strong>Email:</strong> ${email}</div>
            <div class="detail"><strong>Phone:</strong> ${phone}</div>
        
            <div class="detail"><strong>Message:</strong></div>
            <p>${message}</p>
          </div>
        </body>
        </html>
        `.trim();

    await this.sendEmail({
      to: process.env.EMAIL_USER,
      subject: "Message from user is",
      html,
      text: message,
    });
  }
}

// Create and export a single instance
const emailService = new EmailService();
module.exports = emailService;
