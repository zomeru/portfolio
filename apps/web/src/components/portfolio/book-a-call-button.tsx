"use client";

import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useNetworkStatus } from "@/components/pwa/network-status";
import { openBookingWidget, prepareBookingWidget } from "@/lib/booking";
import { reportClientError } from "@/lib/client-log";

export function BookACallButton() {
  const t = useTranslations("Contact");
  const tRequest = useTranslations("Errors.request");
  const { isOffline } = useNetworkStatus();
  const [error, setError] = useState("");
  useEffect(() => {
    if (isOffline) return;
    void prepareBookingWidget().catch((error: unknown) => {
      reportClientError("booking.initializeWidget", error);
    });
  }, [isOffline]);

  return (
    <div>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={(event) => {
          if (isOffline) {
            setError(tRequest("offline"));
            return;
          }
          setError("");
          void openBookingWidget(event.currentTarget).catch((bookingError: unknown) => {
            reportClientError("booking.openWidget", bookingError);
            setError(tRequest("network"));
          });
        }}
        className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-sm bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transition-none"
      >
        {t("book")} <CalendarDays aria-hidden="true" size={16} />
      </button>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
