import { Text } from "@react-email/components";

import { EmailCard } from "@/src/emails/components/email-card";
import {
  BaseLayout,
  labelStyle,
  paragraphStyle,
  valueStyle,
} from "@/src/emails/layouts/base-layout";

export type ClaimRegisteredEmailProps = {
  clientName: string;
  claimNumber: string;
  panelUrl: string;
  previewText?: string;
  ctaLabel?: string;
};

export default function ClaimRegisteredEmail({
  clientName = "Pani/Panie",
  claimNumber = "OWE-2026-0001",
  panelUrl = "https://www.oweme.pl/panel",
  previewText = "Twoja sprawa została przyjęta do OWEME.",
  ctaLabel = "Przejdź do panelu klienta",
}: ClaimRegisteredEmailProps) {
  return (
    <BaseLayout
      preview={previewText}
      title="Przyjęliśmy Twoją sprawę"
      panelUrl={panelUrl}
      cta={{ href: panelUrl, label: ctaLabel }}
    >
      <Text style={paragraphStyle}>Dzień dobry {clientName},</Text>
      <Text style={paragraphStyle}>
        dziękujemy za przesłanie wniosku. Sprawa została zapisana w systemie
        OWEME i trafiła do weryfikacji.
      </Text>
      <EmailCard>
        <Text style={labelStyle}>Numer sprawy</Text>
        <Text style={valueStyle}>{claimNumber}</Text>
      </EmailCard>
      <Text style={{ ...paragraphStyle, marginTop: "18px" }}>
        Jeżeli będziemy potrzebowali dodatkowych informacji, wyślemy osobne
        powiadomienie.
      </Text>
    </BaseLayout>
  );
}
