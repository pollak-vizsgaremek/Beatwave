export type EmailTemplateMap = {
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
  passwordReset: renderPasswordResetTemplate,
};

export const renderEmailTemplate = <K extends EmailTemplateName>(
  template: K,
  context: EmailTemplateMap[K],
) => templateRenderers[template](context);
