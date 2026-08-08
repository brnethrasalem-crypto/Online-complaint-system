// utils/otpGenerator.js
// Simple reusable 6-digit OTP generator (also duplicated as a User method,
// exposed here for cases where OTP is needed outside the model context).

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = generateOTP;