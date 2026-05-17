import { Column, Row, Section, Text } from "@react-email/components";

import { EmailCard } from "@/src/emails/components/email-card";
import {
  EmailStatusBadge,
  type EmailStatusTone,
} from "@/src/emails/components/email-status-badge";
import {
  BaseLayout,
  labelStyle,
  paragraphStyle,
  valueStyle,
} from "@/src/emails/layouts/base-layout";

export type ClaimStatusEmailProps = {
  clientName: string;
  claimNumber: string;
  oldStatus: string;
  newStatus: string;
  panelUrl: string;
  previewText?: string;
  oldStatusLabel?: string;
  newStatusLabel?: string;
  newStatusTone?: EmailStatusTone;
  statusDescription?: string;
  nextStep?: string;
  ctaLabel?: string;
};

export default function ClaimStatusEmail({
  clientName = "Pani/Panie",
  claimNumber = "OWE-2026-0001",
  oldStatus = "NEW",
  newStatus = "CLAIM_SENT",
  panelUrl = "https://www.oweme.pl/panel",
  previewText = "Status Twojej sprawy OWEME został zaktualizowany.",
  oldStatusLabel = oldStatus,
  newStatusLabel = newStatus,
  newStatusTone = "blue",
  statusDescription = "Pracujemy nad Twoją sprawą i poinformujemy Cię o kolejnym kroku.",
  nextStep = "Nasz zespół przeanalizuje dokumenty i wróci z informacją o dalszym działaniu.",
  ctaLabel = "Przejdź do panelu klienta",
}: ClaimStatusEmailProps) {
  return (
    <BaseLayout
      preview={previewText}
      title="Zmieniliśmy status Twojej sprawy"
      panelUrl={panelUrl}
      cta={{ href: panelUrl, label: ctaLabel }}
    >
      <Text style={paragraphStyle}>Dzień dobry {clientName},</Text>
      <Text style={paragraphStyle}>
        w systemie OWEME pojawiła się aktualizacja dotycząca sprawy{" "}
        <strong>{claimNumber}</strong>.
      </Text>

      <EmailCard>
        <Row>
          <Column style={columnStyle}>
            <Text style={labelStyle}>Poprzedni status</Text>
            <Text style={valueStyle}>{oldStatusLabel}</Text>
          </Column>
          <Column style={columnStyle}>
            <Text style={labelStyle}>Nowy status</Text>
            <EmailStatusBadge label={newStatusLabel} tone={newStatusTone} />
          </Column>
        </Row>
      </EmailCard>

      <Section style={sectionStyle}>
        <Text style={labelStyle}>Co to oznacza?</Text>
        <Text style={paragraphStyle}>{statusDescription}</Text>
      </Section>

      <Section style={sectionStyle}>
        <Text style={labelStyle}>Kolejny krok</Text>
        <Text style={paragraphStyle}>{nextStep}</Text>
      </Section>
    </BaseLayout>
  );
}

const sectionStyle = {
  margin: "20px 0 0",
} as const;

const columnStyle = {
  width: "50%",
} as const;
