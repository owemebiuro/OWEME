import { Section } from "@react-email/components";
import type { ReactNode } from "react";

type EmailCardProps = {
  children: ReactNode;
};

export function EmailCard({ children }: EmailCardProps) {
  return <Section style={cardStyle}>{children}</Section>;
}

const cardStyle = {
  backgroundColor: "#f8fafc",
  border: "1px solid #dbeafe",
  borderRadius: "10px",
  padding: "18px 20px",
} as const;
