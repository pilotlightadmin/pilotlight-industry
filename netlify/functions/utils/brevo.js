// Brevo (formerly Sendinblue) API helper
// Sends transactional emails directly via Brevo's API

const BREVO_API_URL = 'https://api.brevo.com/v3';

const brevoHeaders = () => ({
  'accept': 'application/json',
  'content-type': 'application/json',
  'api-key': process.env.BREVO_API_KEY
});

/**
 * Send a transactional email directly via Brevo API.
 * @param {string} toEmail - Recipient email
 * @param {string} toName - Recipient name
 * @param {string} subject - Email subject line
 * @param {string} htmlContent - Full HTML content of the email
 */
export async function sendBrevoEmail(toEmail, toName, subject, htmlContent) {
  const body = {
    sender: { name: 'Pilot Light', email: 'admin@pilotlighthq.com' },
    to: [{ email: toEmail, name: toName }],
    subject,
    htmlContent
  };

  const resp = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: 'POST',
    headers: brevoHeaders(),
    body: JSON.stringify(body)
  });

  if (resp.status === 201) {
    return { success: true };
  }

  const err = await resp.text();
  console.error('Brevo send email error:', resp.status, err);
  return { success: false, error: err };
}

/**
 * Build the creator welcome email HTML with the recipient's name.
 * @param {string} firstName - Creator's first name / display name
 * @returns {string} Full HTML email content
 */
export function buildCreatorWelcomeEmail(firstName) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Welcome to Pilot Light — You're a Creator!</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    body, .body-wrapper { background-color: #0a0e27 !important; }
    /* Prevent Gmail dark mode from inverting colors */
    u + .body { background-color: #0a0e27 !important; }
    [data-ogsc] .dark-bg { background-color: #1a1a2e !important; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 0 16px !important; }
      .hero-title { font-size: 26px !important; }
      .hero-subtitle { font-size: 15px !important; }
      .content-padding { padding: 24px 20px !important; }
      .cta-button { width: 100% !important; }
    }
    @media (prefers-color-scheme: dark) {
      body, .body-wrapper { background-color: #0a0e27 !important; }
      .dark-bg { background-color: #1a1a2e !important; }
      h1, h2, h3, .white-text { color: #ffffff !important; }
      .body-text { color: #d0d0d0 !important; }
      .sub-text { color: #b0b0b0 !important; }
    }
  </style>
</head>
<body class="body" style="margin: 0; padding: 0; background-color: #0a0e27; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #0a0e27;">
    You've been approved as a Creator on Pilot Light — here's how to get started.
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0e27;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" class="email-container" style="max-width: 560px; width: 100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="https://pilotlighthq.com/email/logo.png" alt="Pilot Light" width="280" style="display: block; width: 280px; max-width: 100%; height: auto;" />
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td class="dark-bg" style="background-color: #1a1a2e; border-radius: 20px 20px 0 0; border: 1px solid #2a2a4e; border-bottom: none;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="content-padding" style="padding: 48px 40px 32px; text-align: center;">
                    <img src="https://pilotlighthq.com/email/flame.png" alt="Pilot Light flame" width="80" style="display: block; width: 80px; height: 80px; margin: 0 auto 24px; border-radius: 50%;" />
                    <h1 class="hero-title white-text" style="margin: 0 0 12px; font-size: 32px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                      You're in, ${firstName}!
                    </h1>
                    <p class="hero-subtitle sub-text" style="margin: 0; font-size: 18px; color: #b0b8d0; line-height: 1.5;">
                      Your creator application has been approved.<br>It's time to share your vision with the world.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="dark-bg" style="background-color: #1a1a2e; border-left: 1px solid #2a2a4e; border-right: 1px solid #2a2a4e;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="content-padding" style="padding: 8px 40px 32px;">
                    <p class="body-text" style="margin: 0 0 24px; font-size: 16px; color: #c8cee0; line-height: 1.6;">
                      Welcome to the creator side of Pilot Light. You now have access to the Creator Portal, where you can upload your pilot teaser, track audience votes, and see how your work resonates with real viewers.
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr><td style="padding: 8px 0 24px;"><div style="height: 1px; background-color: #2a2a4e;"></div></td></tr>
                    </table>
                    <h2 class="white-text" style="margin: 0 0 20px; font-size: 20px; font-weight: 700; color: #ffffff;">Here's how to get started</h2>
                  </td>
                </tr>

                <!-- Step 1 -->
                <tr>
                  <td class="content-padding" style="padding: 0 40px 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td width="48" valign="top">
                          <div style="width: 40px; height: 40px; border-radius: 12px; background-color: #f7971e; text-align: center; line-height: 40px; font-size: 18px; font-weight: 800; color: #ffffff;">1</div>
                        </td>
                        <td valign="top" style="padding-left: 12px;">
                          <h3 class="white-text" style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #ffffff;">Upload your pilot teaser</h3>
                          <p class="body-text" style="margin: 0; font-size: 14px; color: #b0b8d0; line-height: 1.5;">Head to the Creator Portal and upload a 60-90 second pilot teaser. It can be a trailer, a short, a scene, a talking head, or even you walking through your pitch deck — get creative about how you sell your idea.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Step 2 -->
                <tr>
                  <td class="content-padding" style="padding: 0 40px 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td width="48" valign="top">
                          <div style="width: 40px; height: 40px; border-radius: 12px; background-color: #f7971e; text-align: center; line-height: 40px; font-size: 18px; font-weight: 800; color: #ffffff;">2</div>
                        </td>
                        <td valign="top" style="padding-left: 12px;">
                          <h3 class="white-text" style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #ffffff;">Set up your pilot page</h3>
                          <p class="body-text" style="margin: 0; font-size: 14px; color: #b0b8d0; line-height: 1.5;">Add your logline, genre, and funding link so voters know what your project is about. A strong logline goes a long way.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Step 3 -->
                <tr>
                  <td class="content-padding" style="padding: 0 40px 32px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td width="48" valign="top">
                          <div style="width: 40px; height: 40px; border-radius: 12px; background-color: #f7971e; text-align: center; line-height: 40px; font-size: 18px; font-weight: 800; color: #ffffff;">3</div>
                        </td>
                        <td valign="top" style="padding-left: 12px;">
                          <h3 class="white-text" style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #ffffff;">Watch the votes come in</h3>
                          <p class="body-text" style="margin: 0; font-size: 14px; color: #b0b8d0; line-height: 1.5;">Real audiences will watch and rate your pilot teaser. You'll see scores, feedback, and engagement right in your Creator Portal dashboard.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="content-padding" style="padding: 0 40px 40px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>
                        <td style="border-radius: 12px; background-color: #f7971e;">
                          <a href="https://pilotlighthq.com/#creator-portal" target="_blank" class="cta-button" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; letter-spacing: 0.02em;">
                            Go to Creator Portal &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="dark-bg" style="background-color: #1a1a2e; border-radius: 0 0 20px 20px; border: 1px solid #2a2a4e; border-top: none;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 24px 40px;">
                    <div style="height: 1px; background-color: #2a2a4e; margin-bottom: 24px;"></div>
                    <p style="margin: 0 0 8px; font-size: 13px; color: #7a7fa0; text-align: center; line-height: 1.5;">
                      You're receiving this because your creator application was approved at <a href="https://pilotlighthq.com" style="color: #9a9fc0; text-decoration: underline;">pilotlighthq.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Build the password reset email HTML.
 * @param {string} firstName - User's name
 * @param {string} resetUrl - Full URL with token for resetting password
 * @returns {string} Full HTML email content
 */
export function buildPasswordResetEmail(firstName, resetUrl) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Reset Your Pilot Light Password</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    body, .body-wrapper { background-color: #0a0e27 !important; }
    u + .body { background-color: #0a0e27 !important; }
    [data-ogsc] .dark-bg { background-color: #1a1a2e !important; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 0 16px !important; }
      .hero-title { font-size: 26px !important; }
      .content-padding { padding: 24px 20px !important; }
      .cta-button { width: 100% !important; }
    }
    @media (prefers-color-scheme: dark) {
      body, .body-wrapper { background-color: #0a0e27 !important; }
      .dark-bg { background-color: #1a1a2e !important; }
      h1, h2, h3, .white-text { color: #ffffff !important; }
      .body-text { color: #d0d0d0 !important; }
      .sub-text { color: #b0b0b0 !important; }
    }
  </style>
</head>
<body class="body" style="margin: 0; padding: 0; background-color: #0a0e27; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #0a0e27;">
    Reset your Pilot Light password — this link expires in 1 hour.
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0e27;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" class="email-container" style="max-width: 560px; width: 100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="https://pilotlighthq.com/email/logo.png" alt="Pilot Light" width="280" style="display: block; width: 280px; max-width: 100%; height: auto;" />
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td class="dark-bg" style="background-color: #1a1a2e; border-radius: 20px 20px 0 0; border: 1px solid #2a2a4e; border-bottom: none;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="content-padding" style="padding: 48px 40px 32px; text-align: center;">
                    <img src="https://pilotlighthq.com/email/flame.png" alt="Pilot Light flame" width="80" style="display: block; width: 80px; height: 80px; margin: 0 auto 24px; border-radius: 50%;" />
                    <h1 class="hero-title white-text" style="margin: 0 0 12px; font-size: 32px; font-weight: 800; color: #ffffff; line-height: 1.2;">
                      Password Reset
                    </h1>
                    <p class="sub-text" style="margin: 0; font-size: 18px; color: #b0b8d0; line-height: 1.5;">
                      Hey ${firstName}, we received a request to reset your password.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="dark-bg" style="background-color: #1a1a2e; border-left: 1px solid #2a2a4e; border-right: 1px solid #2a2a4e;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="content-padding" style="padding: 8px 40px 32px;">
                    <p class="body-text" style="margin: 0 0 24px; font-size: 16px; color: #c8cee0; line-height: 1.6;">
                      Click the button below to create a new password. This link will expire in <strong style="color: #ffffff;">1 hour</strong>.
                    </p>

                    <!-- CTA -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto 24px;">
                      <tr>
                        <td style="border-radius: 12px; background-color: #4ecdc4;">
                          <a href="${resetUrl}" target="_blank" class="cta-button" style="display: inline-block; padding: 16px 40px; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; letter-spacing: 0.02em;">
                            Reset My Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr><td style="padding: 8px 0 24px;"><div style="height: 1px; background-color: #2a2a4e;"></div></td></tr>
                    </table>

                    <p class="body-text" style="margin: 0 0 16px; font-size: 14px; color: #b0b8d0; line-height: 1.6;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0 0 24px; font-size: 13px; color: #4ecdc4; line-height: 1.5; word-break: break-all;">
                      ${resetUrl}
                    </p>

                    <p class="body-text" style="margin: 0; font-size: 14px; color: #7a7fa0; line-height: 1.6;">
                      If you didn't request this, you can safely ignore this email. Your password won't change unless you click the link above.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="dark-bg" style="background-color: #1a1a2e; border-radius: 0 0 20px 20px; border: 1px solid #2a2a4e; border-top: none;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 24px 40px;">
                    <div style="height: 1px; background-color: #2a2a4e; margin-bottom: 24px;"></div>
                    <p style="margin: 0 0 8px; font-size: 13px; color: #7a7fa0; text-align: center; line-height: 1.5;">
                      You're receiving this because a password reset was requested for your account at <a href="https://pilotlighthq.com" style="color: #9a9fc0; text-decoration: underline;">pilotlighthq.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
