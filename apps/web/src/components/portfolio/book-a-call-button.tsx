"use client";

import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { openBookingWidget, prepareBookingWidget } from "@/lib/booking";
import { reportClientError } from "@/lib/client-log";

export function BookACallButton() {
  const t = useTranslations("Contact");
  useEffect(() => {
    void prepareBookingWidget().catch((error: unknown) => {
      reportClientError("booking.initializeWidget", error);
    });
  }, []);

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={(event) => {
        void openBookingWidget(event.currentTarget).catch((error: unknown) => {
          reportClientError("booking.openWidget", error);
        });
      }}
      className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-sm bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transition-none"
    >
      {t("book")} <CalendarDays aria-hidden="true" size={16} />
    </button>
  );
}
