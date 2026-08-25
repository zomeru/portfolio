"use client";

import { ChevronDown, ChevronUp } from "lucide";
import { Check } from "lucide-react";
import { MorphIcon } from "morphicons/react";
import {
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

export type SelectOption = {
  label: string;
  value: string;
};

export type SelectProps = {
  className?: string;
  disabled?: boolean;
  id?: string;
  label: string;
  onValueChangeAction: (value: string) => void;
  options: SelectOption[];
  value: string;
};

export function Select({
  className,
  disabled = false,
  id,
  label,
  onValueChangeAction,
  options,
  value,
}: SelectProps) {
  const generatedId = useId();
  const triggerId = id ?? `select-${generatedId}`;
  const labelId = `${triggerId}-label`;
  const valueId = `${triggerId}-value`;
  const listboxId = `${triggerId}-listbox`;
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const typeaheadRef = useRef("");
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(
    () => () => {
      if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
    },
    [],
  );

  function openAt(index: number) {
    setActiveIndex(index);
    setOpen(true);
  }

  function closeAndFocusTrigger() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    onValueChangeAction(option.value);
    closeAndFocusTrigger();
  }

  function moveActive(direction: 1 | -1) {
    setActiveIndex((current) => (current + direction + options.length) % options.length);
  }

  function handleTypeahead(key: string) {
    if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
    typeaheadRef.current += key.toLocaleLowerCase();
    typeaheadTimerRef.current = setTimeout(() => {
      typeaheadRef.current = "";
    }, 500);

    const match = options.findIndex((option) =>
      option.label.toLocaleLowerCase().startsWith(typeaheadRef.current),
    );
    if (match >= 0) setActiveIndex(match);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const fallback = event.key === "ArrowDown" ? selectedIndex : options.length - 1;
      openAt(fallback);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      openAt(event.key === "Home" ? 0 : options.length - 1);
    }
  }

  function handleListboxKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActive(-1);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        closeAndFocusTrigger();
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
          handleTypeahead(event.key);
        }
    }
  }

  function handleOptionPointerMove(event: ReactPointerEvent<HTMLDivElement>, index: number) {
    if (event.pointerType !== "touch") setActiveIndex(index);
  }

  const selectedOption = options[selectedIndex] ?? options[0];

  return (
    <div ref={rootRef} data-slot="select" className={cn("relative grid gap-1", className)}>
      <span id={labelId} className="text-xs text-muted">
        {label}
      </span>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={`${labelId} ${valueId}`}
        disabled={disabled}
        data-slot="select-trigger"
        data-state={open ? "open" : "closed"}
        onClick={() => (open ? setOpen(false) : openAt(selectedIndex))}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "flex min-h-10 w-full items-center justify-between gap-3 rounded-md border border-border",
          "bg-background px-3 text-left text-sm text-foreground transition-colors duration-150",
          "hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60",
          "focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none",
        )}
      >
        <span id={valueId} className="min-w-0 truncate">
          {selectedOption?.label}
        </span>
        <MorphIcon
          icon={open ? ChevronUp : ChevronDown}
          reducedMotion="user"
          spring="snappy"
          size={16}
          strokeWidth={1.5}
          className="shrink-0"
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          data-slot="select-content"
          className={cn(
            "absolute top-full right-0 left-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-md",
            "border border-border bg-background p-1 shadow-lg",
          )}
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <div
                key={option.value}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={selected}
                tabIndex={activeIndex === index ? 0 : -1}
                data-slot="select-option"
                data-active={activeIndex === index}
                data-selected={selected}
                onClick={() => choose(index)}
                onKeyDown={handleListboxKeyDown}
                onPointerMove={(event) => handleOptionPointerMove(event, index)}
                className={cn(
                  "flex min-h-10 cursor-default items-center justify-between gap-3 rounded-sm px-2.5",
                  "text-sm outline-none data-[active=true]:bg-border/60",
                )}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                <Check
                  aria-hidden="true"
                  size={15}
                  strokeWidth={1.5}
                  className={selected ? "shrink-0" : "invisible shrink-0"}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
