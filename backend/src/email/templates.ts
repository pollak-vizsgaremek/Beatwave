export type EmailTemplateMap = {
  welcome: {
    username: string;
  };
  accountDeleted: {
    username: string;
  };
  passwordReset: {
    resetUrl: string;
    expiresInMinutes: number;
    username: string;
  };
};

export type EmailTemplateName = keyof EmailTemplateMap;

type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

type TemplateRenderer<K extends EmailTemplateName> = (
  context: EmailTemplateMap[K],
) => RenderedEmail;

const renderWelcomeTemplate: TemplateRenderer<"welcome"> = (context) => {
  const subject = "Welcome to Beatwave";
  const text = [
    `Hi ${context.username},`,
    "",
    "Welcome to Beatwave.",
    "Your account is ready and you can now jump in, post, and connect with others.",
    "",
    "We are happy to have you here.",
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
      <p>Hi ${context.username},</p>
      <p>Welcome to Beatwave.</p>
      <p>Your account is ready and you can now jump in, post, and connect with others.</p>
      <p>We are happy to have you here.</p>
    </div>
  `;

  return {
    subject,
    text,
    html,
  };
};

const renderAccountDeletedTemplate: TemplateRenderer<"accountDeleted"> = (
  context,
) => {
  const subject = "Goodbye from Beatwave";
  const text = [
    `Hi ${context.username},`,
    "",
    "Your Beatwave account has been deleted.",
    "We are sorry to see you go.",
    "",
    "If this was not you, please contact support as soon as possible.",
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
      <p>Hi ${context.username},</p>
      <p>Your Beatwave account has been deleted.</p>
      <p>We are sorry to see you go.</p>
      <p>If this was not you, please contact support as soon as possible.</p>
    </div>
  `;

  return {
    subject,
    text,
    html,
  };
};

const renderPasswordResetTemplate: TemplateRenderer<"passwordReset"> = (
  context,
) => {
  const subject = "Beatwave password reset request";
  const text = [
    `Hi ${context.username},`,
    "",
    "We received a request to reset your Beatwave password.",
    `Use this link to reset it: ${context.resetUrl}`,
    "",
    `This link expires in ${context.expiresInMinutes} minutes.`,
    "If you did not request this, you can safely ignore this email.",
  ].join("\n");
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
      <p>Hi ${context.username},</p>
      <p>We received a request to reset your Beatwave password.</p>
      <p>
        <a href="${context.resetUrl}" style="color: #0ea5e9; font-weight: 700;">
          Reset your password
        </a>
      </p>
      <p>This link expires in ${context.expiresInMinutes} minutes.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  return {
    subject,
    text,
    html,
  };
};

const templateRenderers: { [K in EmailTemplateName]: TemplateRenderer<K> } = {
  welcome: renderWelcomeTemplate,
  accountDeleted: renderAccountDeletedTemplate,
  passwordReset: renderPasswordResetTemplate,
};

export const renderEmailTemplate = <K extends EmailTemplateName>(
  template: K,
  context: EmailTemplateMap[K],
) => templateRenderers[template](context);
