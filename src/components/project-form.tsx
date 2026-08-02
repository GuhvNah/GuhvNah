"use client";

import { useFormStatus } from "react-dom";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import type { Project, Client } from "@/generated/prisma/client";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function ProjectForm({
  action,
  project,
  clients,
  submitLabel = "Save project",
}: {
  action: (formData: FormData) => void;
  project?: Project;
  clients: Client[];
  submitLabel?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="name">Project name</Label>
        <Input id="name" name="name" required defaultValue={project?.name} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="clientId">Client</Label>
          <Select id="clientId" name="clientId" defaultValue={project?.clientId ?? ""}>
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={project?.status ?? "LEAD"}>
            {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="siteAddress">Site address</Label>
        <Input id="siteAddress" name="siteAddress" defaultValue={project?.siteAddress ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="suburb">Suburb</Label>
          <Input id="suburb" name="suburb" placeholder="e.g. Fremantle" defaultValue={project?.suburb ?? ""} />
        </div>
        <div>
          <Label htmlFor="postcode">Postcode</Label>
          <Input id="postcode" name="postcode" placeholder="6000" defaultValue={project?.postcode ?? ""} />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={project?.description ?? ""} />
      </div>
      <SubmitButton label={submitLabel} />
    </form>
  );
}
