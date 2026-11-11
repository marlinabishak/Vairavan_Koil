const axios = require("axios");

function formatWhatsAppNumber(countryCode, mobileNumber) {
  const digits = (mobileNumber || "").replace(/\D/g, "");
  const ccDigits = (countryCode || "").replace(/\D/g, "");

  if (ccDigits && digits.startsWith(ccDigits)) {
    return digits;
  }
  return `${ccDigits}${digits}`;
}

function buildTemplateComponent(variables, imageUrl = "") {
  const components = [
    {
      type: "body",
      parameters: variables.map(val => ({
        type: "text",
        text: String(val || "") || "-"
      }))
    }
  ];

  const headerLink = imageUrl || process.env.WHATSAPP_HEADER_IMAGE_URL;
  if (headerLink) {
    components.unshift({
      type: "header",
      parameters: [
        {
          type: "image",
          image: { link: headerLink }
        }
      ]
    });
  }

  return { components };
}

async function sendKattalaiTemplate({ countryCode, mobileNumber, templateName, variables, imageUrl, langCode, campaignName }) {
  const toNumber = formatWhatsAppNumber(countryCode, mobileNumber);

  const payload = {
    to: toNumber,
    type: "template",
    template: {
      language: { policy: "deterministic", code: langCode || "en" },
      name: templateName,
      ...buildTemplateComponent(variables, imageUrl),
    },
  };

  const url = `${process.env.WHATSAPP_API_ENDPOINT}?token=${process.env.WHATSAPP_API_TOKEN}`;

  console.log(`[WhatsApp] Sending to ${toNumber}:`, JSON.stringify(payload, null, 2));

  try {
    const resp = await axios.post(url, payload, { timeout: 30000 });
    console.log(`[WhatsApp] Response ${resp.status}:`, JSON.stringify(resp.data).slice(0, 1000));
    if (resp.status >= 200 && resp.status < 300) {
      return { success: true, error: null };
    }
    const err = `HTTP ${resp.status}: ${JSON.stringify(resp.data).slice(0, 500)}`;
    console.error(`WhatsApp send failed for ${toNumber}: ${err}`);
    return { success: false, error: err };
  } catch (exc) {
    let err;
    if (exc.response) {
      err = `HTTP ${exc.response.status}: ${JSON.stringify(exc.response.data).slice(0, 500)}`;
    } else {
      err = exc.message || String(exc);
    }
    console.error(`WhatsApp send raised an error for ${toNumber}: ${err}`);
    return { success: false, error: err };
  }
}

async function sendPowerUserOtp({ countryCode, mobileNumber, recipientName, roleTitle, otpCode, officeCode, devoteeName }) {
  const toNumber = formatWhatsAppNumber(countryCode, mobileNumber);
  const token = process.env.WHATSAPP_OTP_API_TOKEN || process.env.WHATSAPP_API_TOKEN;
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE || 'utility_rem';
  const url = `${process.env.WHATSAPP_API_ENDPOINT}?token=${token}`;

  // Helper to send with given parameters
  const trySend = async (params) => {
    const payload = {
      to: toNumber,
      type: "template",
      template: {
        language: { policy: "deterministic", code: "en" },
        name: templateName,
        components: [
          {
            type: "body",
            parameters: params
          }
        ]
      }
    };
    return await axios.post(url, payload, { timeout: 20000 });
  };

  try {
    let resp;
    // 1. Primary: Try 5 parameters (Format for utility_rem)
    // {{1}} = recipientName || roleTitle || "Power User"
    // {{2}} = roleTitle || "Power User"
    // {{3}} = devoteeName || "Kattalai Devotee"
    // {{4}} = officeCode ? `(Office Code: ${officeCode}, OTP` : `(OTP`
    // {{5}} = String(otpCode)
    const codePart = officeCode ? `(Office Code: ${officeCode}, OTP` : `(OTP`;
    try {
      resp = await trySend([
        { type: "text", text: String(recipientName || roleTitle || "Power User") },
        { type: "text", text: String(roleTitle || "Power User") },
        { type: "text", text: String(devoteeName || "Kattalai Devotee") },
        { type: "text", text: codePart },
        { type: "text", text: String(otpCode) }
      ]);
    } catch (fiveErr) {
      // 2. If 5-param fails, fallback to 1-param (standard OTP)
      try {
        console.log(`[WhatsApp OTP] Retrying with 1-variable format for ${roleTitle}...`);
        resp = await trySend([{ type: "text", text: String(otpCode) }]);
      } catch (oneErr) {
        // 3. Fallback to 4-param format
        console.log(`[WhatsApp OTP] Retrying with 4-variable format for ${roleTitle}...`);
        resp = await trySend([
          { type: "text", text: String(otpCode) },
          { type: "text", text: String(roleTitle || "Power User") },
          { type: "text", text: String(devoteeName || "Kattalai Devotee") },
          { type: "text", text: String(officeCode || "") }
        ]);
      }
    }

    console.log(`[WhatsApp OTP] Response ${resp.status}:`, JSON.stringify(resp.data));
    if (resp.status >= 200 && resp.status < 300) {
      return { success: true, error: null };
    }
    return { success: false, error: `HTTP ${resp.status}: ${JSON.stringify(resp.data)}` };
  } catch (exc) {
    let err = exc.response?.data ? JSON.stringify(exc.response.data) : (exc.message || String(exc));
    console.warn(`[WhatsApp OTP] Delivery notice for ${roleTitle} (${toNumber}):`, err);
    return { success: false, error: err };
  }
}

module.exports = { formatWhatsAppNumber, sendKattalaiTemplate, sendPowerUserOtp };
