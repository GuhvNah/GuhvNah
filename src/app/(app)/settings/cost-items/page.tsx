import { prisma } from "@/lib/prisma";
import { requireOrgSession } from "@/lib/session";
import { createCostItem, deleteCostItem } from "@/lib/actions/cost-items";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CostItemForm } from "@/components/cost-item-form";
import { Button } from "@/components/ui/button";
import { formatCurrencyAUD } from "@/lib/utils";

export default async function CostItemsPage() {
  const { orgId } = await requireOrgSession();
  const costItems = await prisma.costItem.findMany({
    where: { organizationId: orgId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-xl font-semibold text-slate-900">Cost items</h1>
      <p className="mt-1 text-sm text-slate-500">
        Your rate library. Link these to takeoff quantities to price up a job.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-sm font-medium text-slate-700">Add a cost item</h2>
        </CardHeader>
        <CardBody>
          <CostItemForm action={createCostItem} />
        </CardBody>
      </Card>

      <Card className="mt-6">
        {costItems.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            No cost items yet. Add materials and rates above (e.g. concrete slab, m², $145).
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Unit</th>
                <th className="px-5 py-3 font-medium">Rate</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {costItems.map((item) => {
                const deleteWithId = deleteCostItem.bind(null, item.id);
                return (
                  <tr key={item.id}>
                    <td className="px-5 py-3 text-slate-800">{item.name}</td>
                    <td className="px-5 py-3 text-slate-500">{item.category || "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{item.unit}</td>
                    <td className="px-5 py-3 text-slate-800">
                      {formatCurrencyAUD(Number(item.unitRate))}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <form action={deleteWithId}>
                        <Button type="submit" variant="ghost" size="sm">
                          Remove
                        </Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
