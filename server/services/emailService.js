import { Resend } from 'resend';

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await getResend().emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: email,
    subject: 'Verify your email',
    html: `
      <p>Welcome! Please verify your email address to activate your account.</p>
      <p><a href="${url}">Verify my email</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
};
