import nodemailer from "nodemailer";

import config from "../config/config";

const hasAuth = Boolean(config.smtpUser && config.smtpPass);

const smtpTransporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: config.smtpSecure,
  ...(hasAuth
    ? {
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
      }
    : {}),
});

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const resolveRecipients = (to: string): string[] => {
  return to
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);
};

const sendEmailWithSmtp = async ({
  to,
  subject,
  text,
  html,
}: SendEmailParams) => {
  const recipients = resolveRecipients(to);

  await smtpTransporter.sendMail({
    from: config.mailFrom,
    to: recipients,
    subject,
    text,
    html,
  });
};

const sendEmailWithResend = async ({
  to,
  subject,
  text,
  html,
}: SendEmailParams) => {
  const recipients = resolveRecipients(to);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.emailFrom,
      to: recipients,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    let details = `${response.status} ${response.statusText}`;

    try {
      const data = (await response.json()) as { message?: string; name?: string };
      if (data?.message) {
        details = `${details} - ${data.message}`;
      } else if (data?.name) {
        details = `${details} - ${data.name}`;
      }
    } catch {
      // Ignore JSON parsing errors and keep status details only.
    }

    throw new Error(`[Email] Resend request failed: ${details}`);
  }
};

const useResend = Boolean(config.resendApiKey.trim());

export const sendEmail = async (params: SendEmailParams) => {
  if (useResend) {
    await sendEmailWithResend(params);
    return;
  }

  await sendEmailWithSmtp(params);
};
