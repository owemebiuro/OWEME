type KpiCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export function KpiCard({ label, value, helper }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
        {value}
      </p>
      {helper ? (
        <p className="mt-2 text-sm leading-5 text-neutral-600">{helper}</p>
      ) : null}
    </div>
  );
}
