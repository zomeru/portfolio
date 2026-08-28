"use client";

import type { AdminErrorSeverity, AdminErrorStatus } from "@portfolio/api/types";
import { useState } from "react";

import { Select, type SelectOption } from "@/components/ui/select";

const statusOptions: SelectOption[] = [
  { label: "All", value: "" },
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
  { label: "Ignored", value: "ignored" },
];

const severityOptions: SelectOption[] = [
  { label: "All", value: "" },
  { label: "Error", value: "error" },
  { label: "Warning", value: "warning" },
];

export function ErrorFilters({
  initialQuery,
  initialSeverity,
  initialStatus,
}: {
  initialQuery: string | undefined;
  initialSeverity: AdminErrorSeverity | undefined;
  initialStatus: AdminErrorStatus | undefined;
}) {
  const [status, setStatus] = useState<AdminErrorStatus | "">(initialStatus ?? "");
  const [severity, setSeverity] = useState<AdminErrorSeverity | "">(initialSeverity ?? "");

  return (
    <form
      action="/admin/error"
      className="mt-8 grid gap-3 rounded-lg border border-border/70 bg-foreground/2.5 p-4 sm:grid-cols-[1fr_auto_auto_auto]"
    >
      <label className="grid gap-1 text-xs text-muted">
        Search
        <input
          name="q"
          type="search"
          defaultValue={initialQuery}
          maxLength={200}
          placeholder="Message, source, route, or code"
          className="min-h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
        />
      </label>
      <Select
        id="error-status-filter"
        name="status"
        label="Status"
        value={status}
        options={statusOptions}
        onValueChangeAction={(value) => setStatus(value as AdminErrorStatus | "")}
        triggerClassName="min-h-11 min-w-36"
      />
      <Select
        id="error-severity-filter"
        name="severity"
        label="Severity"
        value={severity}
        options={severityOptions}
        onValueChangeAction={(value) => setSeverity(value as AdminErrorSeverity | "")}
        triggerClassName="min-h-11 min-w-36"
      />
      <button
        type="submit"
        className="min-h-11 self-end rounded-md bg-foreground px-4 text-sm font-medium text-background"
      >
        Filter
      </button>
    </form>
  );
}
