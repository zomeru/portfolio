"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import type { McpInspectorCommandGroup } from "@/lib/developer-docs";
import { cn } from "@/lib/utils";

type McpInspectorCommandTabsProps = {
  groups: McpInspectorCommandGroup[];
};

export function McpInspectorCommandTabs({ groups }: McpInspectorCommandTabsProps) {
  const [activeId, setActiveId] = useState(groups[0]?.id ?? "pnpm");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function activate(index: number) {
    const group = groups[index];
    if (!group) return;

    setActiveId(group.id);
    tabRefs.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % groups.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + groups.length) % groups.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = groups.length - 1;

    if (nextIndex === null) return;
    event.preventDefault();
    activate(nextIndex);
  }

  return (
    <section className="markdown-content mt-9" aria-labelledby="mcp-inspector-commands-heading">
      <h2 id="mcp-inspector-commands-heading">Current MCP Inspector commands</h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <div
          role="tablist"
          aria-label="Package manager"
          className="flex overflow-x-auto border-b border-border bg-foreground/4"
        >
          {groups.map((group, index) => {
            const selected = group.id === activeId;
            return (
              <button
                key={group.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`mcp-inspector-tab-${group.id}`}
                aria-controls={`mcp-inspector-panel-${group.id}`}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveId(group.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={cn(
                  "relative min-h-10 shrink-0 border-b-2 px-4 font-mono text-xs transition-colors duration-200 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none",
                  selected
                    ? "border-foreground bg-background text-foreground"
                    : "border-transparent text-muted hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                {group.label}
                {group.id === "pnpm" && <span className="sr-only"> (default)</span>}
              </button>
            );
          })}
        </div>

        {groups.map((group) => {
          const selected = group.id === activeId;
          return (
            <div
              key={group.id}
              role="tabpanel"
              id={`mcp-inspector-panel-${group.id}`}
              aria-labelledby={`mcp-inspector-tab-${group.id}`}
              hidden={!selected}
            >
              <section
                aria-label={`${group.label} MCP Inspector commands`}
                // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to reach and horizontally scroll long commands.
                tabIndex={0}
                className="overflow-x-auto bg-background focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground"
              >
                <pre className="min-w-max overflow-visible rounded-none border-0 bg-background p-4 text-foreground">
                  <code>{group.commands.join("\n")}</code>
                </pre>
              </section>
            </div>
          );
        })}
      </div>
    </section>
  );
}
