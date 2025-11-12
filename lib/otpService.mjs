// lib/otpService.mjs

import nodemailer from "nodemailer";
import twilio from "twilio";

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const otpStore = new Map();

export const sendOtp = async ({ email, mobile, type }) => {
  const otp = generateOtp();
  const expiry = Date.now() + 15 * 60 * 1000;

  if (email) {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your OTP for Password Reset',
      text: `Your OTP for password reset is: ${otp}. It will expire in 15 minutes.`,
      html: `<p>Your OTP for password reset is: <strong>${otp}</strong>. It will expire in 15 minutes.</p>`,
    });
    otpStore.set(`email:${email}`, { otp, expiry, type });
    return { success: true, method: 'email' };
  }

  if (mobile) {
    await twilioClient.messages.create({
      body: `Your OTP for password reset is: ${otp}. It will expire in 15 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: mobile,
    });
    otpStore.set(`mobile:${mobile}`, { otp, expiry, type });
    return { success: true, method: 'mobile' };
  }

  throw new Error('Either email or mobile must be provided');
};

export const verifyOtp = ({ email, mobile, otp }) => {
  const key = email ? `email:${email}` : `mobile:${mobile}`;
  const storedOtp = otpStore.get(key);

  if (!storedOtp) {
    return { success: false, message: 'OTP not found or expired' };
  }

  if (storedOtp.otp !== otp) {
    return { success: false, message: 'Invalid OTP' };
  }

  if (Date.now() > storedOtp.expiry) {
    otpStore.delete(key);
    return { success: false, message: 'OTP expired' };
  }

  otpStore.delete(key);
  return { success: true };
};
