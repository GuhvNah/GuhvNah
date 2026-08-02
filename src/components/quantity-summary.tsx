"use client";

import { useMemo, useState } from "react";
import { Select } from "@/components/ui/input";
import { formatCurrencyAUD, formatNumber } from "@/lib/utils";

export type QuantityGroup = {
  key: string;
  label: string;
  type: "LINEAR" | "AREA" | "COUNT";
  unit: string;
  quantity: number;
};

export type CostItemOption = {
  id: string;
  name: string;
  unit: string;
  unitRate: number;
};

export function QuantitySummary({
  groups,
  costItems,
  gstRate,
}: {
  groups: QuantityGroup[];
  costItems: CostItemOption[];
  gstRate: number;
}) {
  const [selection, setSelection] = useState<Record<string, string>>({});

  const rows = useMemo(
    () =>
      groups.map((group) => {
        const costItemId = selection[group.key];
        const costItem = costItems.find((c) => c.id === costItemId);
        const lineTotal = costItem ? costItem.unitRate * group.quantity : 0;
        return { group, costItem, lineTotal };
      }),
    [groups, selection, costItems],
  );

  const subtotal = rows.reduce((sum, row) => sum + row.lineTotal, 0);
  const gst = subtotal * gstRate;
  const total = subtotal + gst;

  if (groups.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No measurements yet. Open a plan to start taking off quantities.
      </p>
    );
  }

  return (
    <div>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="py-2 pr-3 font-medium">Item</th>
            <th className="py-2 pr-3 font-medium">Quantity</th>
            <th className="py-2 pr-3 font-medium">Cost item</th>
            <th className="py-2 pr-3 text-right font-medium">Line total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(({ group, lineTotal }) => (
            <tr key={group.key}>
              <td className="py-2 pr-3 text-slate-800">{group.label}</td>
              <td className="py-2 pr-3 text-slate-600">
                {formatNumber(group.quantity)} {group.unit}
              </td>
              <td className="py-2 pr-3">
                <Select
                  value={selection[group.key] ?? ""}
                  onChange={(e) =>
                    setSelection((prev) => ({ ...prev, [group.key]: e.target.value }))
                  }
                  className="min-w-[10rem]"
                >
                  <option value="">Not priced</option>
                  {costItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({formatCurrencyAUD(item.unitRate)}/{item.unit})
                    </option>
                  ))}
                </Select>
              </td>
              <td className="py-2 pr-3 text-right text-slate-800">
                {lineTotal > 0 ? formatCurrencyAUD(lineTotal) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 ml-auto w-full max-w-xs space-y-1 border-t border-slate-200 pt-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span>{formatCurrencyAUD(subtotal)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>GST ({formatNumber(gstRate * 100, 0)}%)</span>
          <span>{formatCurrencyAUD(gst)}</span>
        </div>
        <div className="flex justify-between font-semibold text-slate-900">
          <span>Total (inc. GST)</span>
          <span>{formatCurrencyAUD(total)}</span>
        </div>
      </div>
    </div>
  );
}
