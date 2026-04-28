import config from "../config/config";

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

type SendEmailWithResendParams = Omit<SendEmailParams, "to"> & {
  recipients: string[];
};

const sendEmailWithResend = async ({
  recipients,
  subject,
  text,
  html,
}: SendEmailWithResendParams) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey.trim()}`,
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

  if (response.ok) {
    return;
  }

  let details = `${response.status} ${response.statusText}`;

  try {
    const data = (await response.json()) as { message?: string; name?: string };
    if (data?.message) {
      details = `${details} - ${data.message}`;
    } else if (data?.name) {
      details = `${details} - ${data.name}`;
    }
  } catch {
    // Keep HTTP status details when response body is not JSON.
  }

  throw new Error(`[Email] Resend request failed: ${details}`);
};

const useResend = Boolean(config.resendApiKey.trim());

export const sendEmail = async (params: SendEmailParams) => {
  const recipients = resolveRecipients(params.to);

  if (!recipients.length) {
    throw new Error("[Email] No valid recipients provided.");
  }

  if (!useResend) {
    if (config.nodeEnv === "production") {
      throw new Error("[Email] RESEND_API_KEY is required in production.");
    }
    return;
  }

  await sendEmailWithResend({
    recipients,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
};
