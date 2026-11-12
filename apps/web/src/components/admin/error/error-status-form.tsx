import type { AdminErrorStatus } from "@portfolio/api/types";
import { useState } from "react";

import { Select, type SelectOption } from "@/components/ui/select";

import { updateErrorStatus } from "../actions";
import { useAdminFormAction } from "../use-admin-action";

const statusOptions: SelectOption[] = [
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
  { label: "Ignored", value: "ignored" },
];

export function ErrorStatusForm({
  id,
  initialStatus,
}: {
  id: string;
  initialStatus: AdminErrorStatus;
}) {
  const [status, setStatus] = useState(initialStatus);

  const update = useAdminFormAction(updateErrorStatus);

  return (
    <form action={update} className="flex items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <Select
        id="error-issue-status"
        name="status"
        label="Status"
        value={status}
        options={statusOptions}
        onValueChangeAction={(value) => setStatus(value as AdminErrorStatus)}
        triggerClassName="min-w-36"
      />
      <button
        type="submit"
        className="min-h-10 rounded-md bg-foreground px-3 text-xs font-medium text-background"
      >
        Update
      </button>
    </form>
  );
}
