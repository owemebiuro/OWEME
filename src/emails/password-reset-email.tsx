import { Text } from "@react-email/components";

import { EmailCard } from "@/src/emails/components/email-card";
import {
  BaseLayout,
  labelStyle,
  paragraphStyle,
} from "@/src/emails/layouts/base-layout";

export type PasswordResetEmailProps = {
  name: string;
  resetUrl: string;
  panelUrl: string;
  previewText?: string;
};

export default function PasswordResetEmail({
  name = "Użytkowniku",
  resetUrl = "https://www.oweme.pl/auth/update-password",
  panelUrl = "https://www.oweme.pl/login",
  previewText = "Link do ustawienia nowego hasła w OWEME CRM.",
}: PasswordResetEmailProps) {
  return (
    <BaseLayout
      preview={previewText}
      title="Ustaw nowe hasło"
      panelUrl={panelUrl}
      cta={{ href: resetUrl, label: "Ustaw nowe hasło" }}
    >
      <Text style={paragraphStyle}>Dzień dobry {name},</Text>
      <Text style={paragraphStyle}>
        otrzymujesz tę wiadomość, ponieważ administrator OWEME wygenerował link
        do ustawienia nowego hasła w CRM.
      </Text>
      <EmailCard>
        <Text style={labelStyle}>Bezpieczeństwo</Text>
        <Text style={{ ...paragraphStyle, marginBottom: 0 }}>
          Link jest jednorazowy i może wygasnąć zgodnie z ustawieniami
          uwierzytelniania. Jeżeli nie spodziewasz się tej wiadomości,
          skontaktuj się z administratorem.
        </Text>
      </EmailCard>
    </BaseLayout>
  );
}
