import nodemailer from "nodemailer";


export const sendOTPEmail = async (email, otp, name) => {
  const transporter = nodemailer.createTransport({
  
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,   // your gmail
      pass: process.env.EMAIL_PASS,   // app password
    },
  });

  await transporter.sendMail({
    from: `"DevNetwork" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your DevNetwork account",
    html: `
      <div style="font-family: monospace; max-width: 500px; margin: auto;
                  background: #0f0f1a; color: #e2e8f0; padding: 40px;
                  border-radius: 12px; border: 1px solid #1e293b;">

        <h1 style="color: #6366f1; margin: 0;">DevNetwork</h1>
        <p style="color: #64748b; font-size: 13px;">Developer Social Platform</p>

        <h2>Hey ${name}, verify your email 👋</h2>
        <p style="color: #94a3b8;">
          Use the OTP below. It expires in <strong style="color: #6366f1;">10 minutes</strong>.
        </p>

        <div style="background: #1e1e2e; border: 2px dashed #6366f1;
                    border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 44px; font-weight: bold;
                       letter-spacing: 14px; color: #a5b4fc;">
            ${otp}
          </span>
        </div>

        <p style="color: #475569; font-size: 13px;">
          If you didn't create an account, ignore this email.
        </p>
      </div>
    `,
  });
};


export const sendPasswordResetEmail = async (email, otp, name) => {
  const transporter = nodemailer.createTransport({
  
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,   // your gmail
      pass: process.env.EMAIL_PASS,   // app password
    },
  });
  
  await transporter.sendMail({
    from: `"DevNetwork" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset - DevNetwork",
    html: `
      <div style="font-family: monospace; max-width: 500px; margin: auto;
                  background: #0f0f1a; color: #e2e8f0; padding: 40px;
                  border-radius: 12px; border: 1px solid #1e293b;">

        <h1 style="color: #6366f1;">DevNetwork</h1>
        <h2>Password Reset Request</h2>
        <p style="color: #94a3b8;">
          Hi ${name}, use this OTP to reset your password.
          It expires in <strong style="color: #ef4444;">10 minutes</strong>.
        </p>

        <div style="background: #1e1e2e; border: 2px dashed #ef4444;
                    border-radius: 8px; padding: 24px;
                    text-align: center; margin: 24px 0;">
          <span style="font-size: 44px; font-weight: bold;
                       letter-spacing: 14px; color: #fca5a5;">
            ${otp}
          </span>
        </div>

        <p style="color: #475569; font-size: 13px;">
          If you didn't request this, please secure your account immediately.
        </p>
      </div>
    `,
  });
};

