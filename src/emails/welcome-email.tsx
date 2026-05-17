import { Text } from "@react-email/components";

import { EmailCard } from "@/src/emails/components/email-card";
import {
  BaseLayout,
  labelStyle,
  paragraphStyle,
  valueStyle,
} from "@/src/emails/layouts/base-layout";

export type WelcomeEmailProps = {
  name: string;
  email: string;
  role?: string;
  panelUrl: string;
  previewText?: string;
};

export default function WelcomeEmail({
  name = "Użytkowniku",
  email = "user@example.com",
  role = "CRM",
  panelUrl = "https://www.oweme.pl/login",
  previewText = "Twoje konto OWEME CRM zostało utworzone.",
}: WelcomeEmailProps) {
  return (
    <BaseLayout
      preview={previewText}
      title="Twoje konto OWEME CRM jest gotowe"
      panelUrl={panelUrl}
      cta={{ href: panelUrl, label: "Przejdź do CRM" }}
    >
      <Text style={paragraphStyle}>Dzień dobry {name},</Text>
      <Text style={paragraphStyle}>
        utworzyliśmy dla Ciebie konto w systemie OWEME CRM. Dane dostępowe są
        obsługiwane przez bezpieczne logowanie Supabase.
      </Text>
      <EmailCard>
        <Text style={labelStyle}>Konto</Text>
        <Text style={valueStyle}>{email}</Text>
        <Text style={{ ...labelStyle, marginTop: "14px" }}>Rola</Text>
        <Text style={valueStyle}>{role}</Text>
      </EmailCard>
    </BaseLayout>
  );
}
