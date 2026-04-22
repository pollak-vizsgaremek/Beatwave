import { renderEmailTemplate, type EmailTemplateMap, type EmailTemplateName } from "./templates";
import { sendEmail } from "./transport";

type SendTemplatedEmailParams<K extends EmailTemplateName> = {
  template: K;
  to: string;
  context: EmailTemplateMap[K];
};

export const sendTemplatedEmail = async <K extends EmailTemplateName>({
  template,
  to,
  context,
}: SendTemplatedEmailParams<K>) => {
  const rendered = renderEmailTemplate(template, context);

  await sendEmail({
    to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
};
