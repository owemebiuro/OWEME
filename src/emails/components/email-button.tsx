import { Button } from "@react-email/components";
import type { ReactNode } from "react";

type EmailButtonProps = {
  href: string;
  children: ReactNode;
};

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Button href={href} style={buttonStyle}>
      {children}
    </Button>
  );
}

const buttonStyle = {
  backgroundColor: "#0b4fb3",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 700,
  lineHeight: "20px",
  padding: "14px 22px",
  textDecoration: "none",
} as const;
