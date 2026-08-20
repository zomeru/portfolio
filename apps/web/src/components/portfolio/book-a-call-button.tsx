"use client";

import { getCalApi } from "@calcom/embed-react";
import { CalendarDays } from "lucide-react";
import { useEffect } from "react";

const CAL_LINK = "zomer/30min";
const CAL_NAMESPACE = "30min";

export function BookACallButton() {
  useEffect(() => {
    async function configureCalEmbed() {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });

      cal("ui", {
        styles: { branding: { brandColor: "#000000" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    }

    void configureCalEmbed();
  }, []);

  return (
    <button
      type="button"
      data-cal-namespace={CAL_NAMESPACE}
      data-cal-link={CAL_LINK}
      data-cal-config='{"layout":"month_view"}'
      className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-sm bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transition-none"
    >
      Book a call <CalendarDays aria-hidden="true" size={16} />
    </button>
  );
}
