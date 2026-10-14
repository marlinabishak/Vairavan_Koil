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

module.exports = { formatWhatsAppNumber, sendKattalaiTemplate };
