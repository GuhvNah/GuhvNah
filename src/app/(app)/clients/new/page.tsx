import { createClient } from "@/lib/actions/clients";
import { ClientForm } from "@/components/client-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <h1 className="text-xl font-semibold text-slate-900">New client</h1>
      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-sm font-medium text-slate-700">Client details</h2>
        </CardHeader>
        <CardBody>
          <ClientForm action={createClient} submitLabel="Create client" />
        </CardBody>
      </Card>
    </div>
  );
}
