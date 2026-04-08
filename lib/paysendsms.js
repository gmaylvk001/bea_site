const BASE_URL = process.env.PAY4SMS_URL;
const TOKEN = process.env.PAY4SMS_TOKEN;
const DEFAULT_SENDER = process.env.PAY4SMS_SENDER_ID;
const DEFAULT_CREDIT = process.env.PAY4SMS_CREDIT;
const TEMPLATE_ID = process.env.PAY4SMS_TEMPLATE_ID;

export async function sendSMS({ otp, numbers }) {
  console.log("SMS FUNCTION CALLED", otp);
  console.log("SMS FUNCTION CALLED", numbers);
  try {
    if (!BASE_URL || !TOKEN) {
      throw new Error("Missing PAY4SMS environment variables");
    }

    // ❗ Only OTP goes here (not full message)
    // const encodedMessage = encodeURIComponent(otp);
const encodedMessage = encodeURIComponent(`${otp} is your Bharath Electronics and Appliances login verification code. Do not share this code with anyone.`);
    const url = `https://pay4sms.in/sendsms/?token=${TOKEN}&credit=${DEFAULT_CREDIT}&sender=${DEFAULT_SENDER}&message=${encodedMessage}&number=${numbers}&templateid=${TEMPLATE_ID}`;

    const response = await fetch(url);
    const responseText = (await response.text()).trim();
    return { success: true };
    
  }catch (error) {
    console.error("❌ SMS ERROR:", error);
    return { success: false, error: error.message };
  }
  
}