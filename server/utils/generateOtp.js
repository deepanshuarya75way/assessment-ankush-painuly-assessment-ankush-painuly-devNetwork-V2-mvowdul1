import crypto from 'crypto';


export const generateOTP = () => {
  // generates a random 6 digit number e.g. "847291"
  return crypto.randomInt(100000, 999999).toString();
};

export const getOTPExpiry = () => {
  // OTP expires in 10 minutes from now
  return new Date(Date.now() + 10 * 60 * 1000);
};
