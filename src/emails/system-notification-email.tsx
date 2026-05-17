import { Text } from "@react-email/components";

import { EmailCard } from "@/src/emails/components/email-card";
import {
  BaseLayout,
  labelStyle,
  paragraphStyle,
  valueStyle,
} from "@/src/emails/layouts/base-layout";

export type SystemNotificationEmailProps = {
  title: string;
  intro: string;
  panelUrl: string;
  previewText: string;
  ctaLabel?: string;
  items: Array<{
    label: string;
    detail?: string;
  }>;
};

export default function SystemNotificationEmail({
  title = "Powiadomienie OWEME CRM",
  intro = "W systemie OWEME CRM pojawiły się elementy wymagające uwagi.",
  panelUrl = "https://www.oweme.pl/crm",
  previewText = "Powiadomienie systemowe OWEME CRM.",
  ctaLabel = "Przejdź do CRM",
  items = [],
}: SystemNotificationEmailProps) {
  return (
    <BaseLayout
      preview={previewText}
      title={title}
      panelUrl={panelUrl}
      cta={{ href: panelUrl, label: ctaLabel }}
    >
      <Text style={paragraphStyle}>{intro}</Text>
      <EmailCard>
        <Text style={labelStyle}>Elementy</Text>
        {items.map((item) => (
          <Text key={`${item.label}-${item.detail ?? ""}`} style={itemStyle}>
            <strong>{item.label}</strong>
            {item.detail ? (
              <>
                <br />
                <span style={detailStyle}>{item.detail}</span>
              </>
            ) : null}
          </Text>
        ))}
        {!items.length ? <Text style={valueStyle}>Brak elementów.</Text> : null}
      </EmailCard>
    </BaseLayout>
  );
}

const itemStyle = {
  color: "#07111f",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 12px",
} as const;

const detailStyle = {
  color: "#64748b",
  fontSize: "13px",
} as const;
