"use client";

import { formatMoney } from "../../lib/format";

type Entry = { name?: unknown; value?: unknown; color?: string };

type Props = {
  active?: boolean;
  label?: string | number;
  payload?: readonly Entry[];
  formatLabel?: (label: string) => string;
};

export default function ChartTooltip({ active, label, payload, formatLabel }: Props) {
  if (!active || !payload?.length) return null;

  return (
    <div className="card rounded-xl px-3 py-2 text-xs">
      {label !== undefined ? (
        <p className="mb-1 font-medium">{formatLabel ? formatLabel(String(label)) : label}</p>
      ) : null}
      {payload.map((entry) => (
        <p key={String(entry.name)} className="flex items-center gap-2 text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {String(entry.name ?? "")}
          <span className="tabular ml-auto pl-4 font-mono text-fg">{formatMoney(Number(entry.value))}</span>
        </p>
      ))}
    </div>
  );
}
