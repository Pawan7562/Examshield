// tests/test_logo_delivery.js
require('dotenv').config();
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const fs = require('fs');
const path = require('path');

async function testLogo() {
  const logoPath = path.join(__dirname, '../assets/nexifyforge-logo.jpg');
  const logoB64 = fs.readFileSync(logoPath).toString('base64');

  const payload = {
    sender: { name: 'NexifyForge', email: 'exam@nexifyforge.in' },
    to: [{ email: 'exam@nexifyforge.in' }],
    subject: 'Nexify Forge Official Logo Delivery Test',
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background-color: #f8fafc;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; max-width: 500px;">
          <tr>
            <td valign="middle" style="width: 44px; padding-right: 12px;">
              <img src="cid:nexifyforge-logo.jpg" alt="Nexify Forge" width="42" height="42" style="display: block; width: 42px; height: 42px; border-radius: 8px; border: 1px solid #e2e8f0;" />
            </td>
            <td valign="middle">
              <div style="font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">NEXIFY FORGE</div>
              <div style="font-size: 12px; font-weight: 600; color: #64748b;">Exam Monitoring System</div>
            </td>
          </tr>
        </table>
      </div>
    `,
    attachment: [
      {
        name: 'nexifyforge-logo.jpg',
        content: logoB64
      }
    ]
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log('Brevo Attachment response:', data);
}

testLogo().catch(console.error);
