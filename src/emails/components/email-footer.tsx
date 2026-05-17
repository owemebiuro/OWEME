import { Hr, Link, Section, Text } from "@react-email/components";

type EmailFooterProps = {
  panelUrl: string;
};

export function EmailFooter({ panelUrl }: EmailFooterProps) {
  return (
    <Section style={footerStyle}>
      <Hr style={dividerStyle} />
      <Text style={footerTextStyle}>
        OWEME sp. z o.o. Ten email zostal wygenerowany automatycznie przez system
        CRM OWEME.
      </Text>
      <Text style={footerTextStyle}>
        Panel klienta:{" "}
        <Link href={panelUrl} style={footerLinkStyle}>
          {panelUrl}
        </Link>
      </Text>
    </Section>
  );
}

const footerStyle = {
  padding: "8px 32px 30px",
} as const;

const dividerStyle = {
  borderColor: "#e2e8f0",
  margin: "18px 0",
} as const;

const footerTextStyle = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0 0 8px",
} as const;

const footerLinkStyle = {
  color: "#0b4fb3",
  textDecoration: "underline",
} as const;
