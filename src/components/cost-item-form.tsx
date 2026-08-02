"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding..." : "Add cost item"}
    </Button>
  );
}

export function CostItemForm({ action }: { action: (formData: FormData) => void }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        action(formData);
        formRef.current?.reset();
      }}
      className="grid grid-cols-2 gap-4 sm:grid-cols-5 sm:items-end"
    >
      <div className="sm:col-span-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="Concrete slab (100mm)" />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input id="category" name="category" placeholder="Concrete" />
      </div>
      <div>
        <Label htmlFor="unit">Unit</Label>
        <Input id="unit" name="unit" required placeholder="m²" />
      </div>
      <div>
        <Label htmlFor="unitRate">Rate (AUD)</Label>
        <Input id="unitRate" name="unitRate" type="number" step="0.01" min="0" required placeholder="145.00" />
      </div>
      <div className="col-span-2 sm:col-span-5">
        <SubmitButton />
      </div>
    </form>
  );
}
