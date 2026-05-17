import { Text } from "@react-email/components";

export type EmailStatusTone =
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple"
  | "slate";

type EmailStatusBadgeProps = {
  label: string;
  tone?: EmailStatusTone;
};

const toneStyles: Record<EmailStatusTone, { backgroundColor: string; color: string; borderColor: string }> = {
  amber: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    color: "#9a3412",
  },
  blue: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    color: "#1d4ed8",
  },
  green: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
    color: "#047857",
  },
  purple: {
    backgroundColor: "#f5f3ff",
    borderColor: "#ddd6fe",
    color: "#6d28d9",
  },
  red: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    color: "#b91c1c",
  },
  slate: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    color: "#334155",
  },
};

export function EmailStatusBadge({ label, tone = "blue" }: EmailStatusBadgeProps) {
  return <Text style={{ ...badgeStyle, ...toneStyles[tone] }}>{label}</Text>;
}

const badgeStyle = {
  border: "1px solid",
  borderRadius: "999px",
  display: "inline-block",
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: "16px",
  margin: "0",
  padding: "6px 10px",
} as const;
