import { ReactNode } from "react";

export function Panel({ title, description, rightSlot, children }: { title: string; description?: string; rightSlot?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description ? <p className="mt-1 text-xs text-textSecondary">{description}</p> : null}
        </div>
        {rightSlot}
      </div>
      {children}
    </section>
  );
}
