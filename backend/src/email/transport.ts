import nodemailer from "nodemailer";

import config from "../config/config";

const hasAuth = Boolean(config.smtpUser && config.smtpPass);

const transporter = nodemailer.createTransport({
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

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: SendEmailParams) => {
  await transporter.sendMail({
    from: config.mailFrom,
    to,
    subject,
    text,
    html,
  });
};
