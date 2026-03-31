export function KpiCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4">
      <p className="text-xs text-textSecondary">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-wide">{value}</p>
      <p className="mt-2 text-xs text-indigo-200">{trend}</p>
    </article>
  );
}
