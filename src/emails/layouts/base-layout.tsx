import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

import { EmailButton } from "@/src/emails/components/email-button";
import { EmailFooter } from "@/src/emails/components/email-footer";
import { EmailHeader } from "@/src/emails/components/email-header";

type BaseLayoutProps = {
  preview: string;
  title: string;
  children: ReactNode;
  panelUrl: string;
  cta?: {
    href: string;
    label: string;
  };
};

export function BaseLayout({
  preview,
  title,
  children,
  panelUrl,
  cta,
}: BaseLayoutProps) {
  return (
    <Html lang="pl">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <EmailHeader />
          <Section style={contentStyle}>
            <Heading as="h1" style={titleStyle}>
              {title}
            </Heading>
            {children}
            {cta ? (
              <Section style={ctaStyle}>
                <EmailButton href={cta.href}>{cta.label}</EmailButton>
              </Section>
            ) : null}
            <Text style={hintStyle}>
              Jeżeli przycisk nie działa, skopiuj i wklej ten adres w przeglądarce:
              {" "}
              {cta?.href ?? panelUrl}
            </Text>
          </Section>
          <EmailFooter panelUrl={panelUrl} />
        </Container>
      </Body>
    </Html>
  );
}

export const paragraphStyle = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
} as const;

export const labelStyle = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0",
  lineHeight: "16px",
  margin: "0 0 6px",
  textTransform: "uppercase",
} as const;

export const valueStyle = {
  color: "#07111f",
  fontSize: "15px",
  fontWeight: 700,
  lineHeight: "22px",
  margin: "0",
} as const;

const bodyStyle = {
  backgroundColor: "#eef4fb",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: "0",
  padding: "24px 12px",
} as const;

const containerStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #dbeafe",
  borderRadius: "14px",
  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
  margin: "0 auto",
  maxWidth: "640px",
  overflow: "hidden",
} as const;

const contentStyle = {
  padding: "8px 32px 18px",
} as const;

const titleStyle = {
  color: "#07111f",
  fontSize: "26px",
  fontWeight: 800,
  letterSpacing: "0",
  lineHeight: "34px",
  margin: "0 0 18px",
} as const;

const ctaStyle = {
  margin: "24px 0 18px",
} as const;

const hintStyle = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "18px 0 0",
  wordBreak: "break-word",
} as const;
