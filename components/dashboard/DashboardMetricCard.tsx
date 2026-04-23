import Link from "next/link";

type DashboardMetricCardProps = {
  label: string;
  value: string | number;
  href?: string;
  description?: string;
  tone?: "neutral" | "blue" | "amber" | "red" | "green" | "purple";
};

const toneClasses: Record<NonNullable<DashboardMetricCardProps["tone"]>, string> = {
  neutral: "border-neutral-200 bg-white text-neutral-950",
  blue: "border-blue-200 bg-blue-50 text-blue-950",
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  red: "border-red-200 bg-red-50 text-red-950",
  green: "border-green-200 bg-green-50 text-green-950",
  purple: "border-purple-200 bg-purple-50 text-purple-950",
};

export function DashboardMetricCard({
  label,
  value,
  href,
  description,
  tone = "neutral",
}: DashboardMetricCardProps) {
  const content = (
    <>
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {description ? (
        <p className="mt-2 text-sm leading-5 text-neutral-600">{description}</p>
      ) : null}
    </>
  );
  const className = `block rounded-lg border p-5 shadow-sm transition ${toneClasses[tone]} ${
    href ? "hover:-translate-y-0.5 hover:shadow-md" : ""
  }`;

  if (href) {
    return (
      <Link href={href} prefetch={false} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
