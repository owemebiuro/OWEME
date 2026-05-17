import { Text } from "@react-email/components";

import { EmailCard } from "@/src/emails/components/email-card";
import {
  BaseLayout,
  labelStyle,
  paragraphStyle,
  valueStyle,
} from "@/src/emails/layouts/base-layout";

export type DocumentRequestEmailProps = {
  clientName: string;
  claimNumber: string;
  panelUrl: string;
  requestedDocuments?: string[];
  previewText?: string;
};

export default function DocumentRequestEmail({
  clientName = "Pani/Panie",
  claimNumber = "OWE-2026-0001",
  panelUrl = "https://www.oweme.pl/panel",
  requestedDocuments = ["uzupełnienie danych w sprawie", "dodatkowe dokumenty lotu"],
  previewText = "Potrzebujemy dodatkowych dokumentów do Twojej sprawy OWEME.",
}: DocumentRequestEmailProps) {
  return (
    <BaseLayout
      preview={previewText}
      title="Potrzebujemy dodatkowych dokumentów"
      panelUrl={panelUrl}
      cta={{ href: panelUrl, label: "Uzupełnij dokumenty" }}
    >
      <Text style={paragraphStyle}>Dzień dobry {clientName},</Text>
      <Text style={paragraphStyle}>
        aby kontynuować sprawę <strong>{claimNumber}</strong>, potrzebujemy
        uzupełnienia informacji lub dokumentów.
      </Text>
      <EmailCard>
        <Text style={labelStyle}>Prosimy o przesłanie</Text>
        {requestedDocuments.map((document) => (
          <Text key={document} style={documentStyle}>
            • {document}
          </Text>
        ))}
      </EmailCard>
      <Text style={{ ...valueStyle, marginTop: "18px" }}>
        Po otrzymaniu dokumentów wrócimy do analizy sprawy.
      </Text>
    </BaseLayout>
  );
}

const documentStyle = {
  color: "#07111f",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 8px",
} as const;
