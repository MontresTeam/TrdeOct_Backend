const axios = require("axios");
const qs = require("qs");

async function sendWhatsAppMessage(phone, message) {
  try {
    const token = process.env.ULTRAMSG_TOKEN;
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const url = `https://api.ultramsg.com/${instanceId}/messages/chat?token=${token}`;

    const data = qs.stringify({ to: phone, body: message, priority: 10 });

    const response = await axios.post(url, data, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    console.log("✅ WhatsApp Message Sent:", response.data);
    return response.data; // ✅ return to controller if needed
  } catch (error) {
    console.error("❌ WhatsApp Send Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message);
  }
}

module.exports = { sendWhatsAppMessage };
