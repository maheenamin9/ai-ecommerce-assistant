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

export const sendPasswordResetEmail = async (email, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  await getResend().emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: email,
    subject: 'Reset your password',
    html: `
      <p>We received a request to reset your password.</p>
      <p><a href="${url}">Reset my password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });
};

export const sendOrderConfirmationEmail = async (email, order) => {
  const itemsHtml = order.items
    .map((item) => `<li>${item.name} × ${item.quantity} — $${(item.price * item.quantity).toFixed(2)}</li>`)
    .join('');

  const { street, city, state, zipCode, country } = order.shippingAddress;

  await getResend().emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: email,
    subject: `Order Confirmed — #${order._id}`,
    html: `
      <p>Thanks for your order! Here's your confirmation.</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <ul>${itemsHtml}</ul>
      <p><strong>Total:</strong> $${order.totalPrice.toFixed(2)}</p>
      <p>Shipping to: ${street}, ${city}, ${state} ${zipCode}, ${country}</p>
    `,
  });
};
