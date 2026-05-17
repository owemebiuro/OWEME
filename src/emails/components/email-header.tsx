import { Section, Text } from "@react-email/components";

export function EmailHeader() {
  return (
    <Section style={headerStyle}>
      <Text style={markStyle}>OWEME</Text>
      <Text style={taglineStyle}>LegalTech claim management</Text>
    </Section>
  );
}

const headerStyle = {
  padding: "28px 32px 18px",
} as const;

const markStyle = {
  color: "#07111f",
  fontSize: "24px",
  fontWeight: 800,
  letterSpacing: "0",
  lineHeight: "30px",
  margin: "0",
} as const;

const taglineStyle = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "18px",
  margin: "4px 0 0",
} as const;
