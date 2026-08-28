"use client";

import { getCalApi } from "@calcom/embed-react";

const CAL_LINK = "zomer/30min";
const CAL_NAMESPACE = "30min";
let configuration: Promise<void> | undefined;

export function prepareBookingWidget() {
  configuration ??= getCalApi({ namespace: CAL_NAMESPACE }).then((cal) => {
    cal("ui", {
      cssVarsPerTheme: {
        dark: { "cal-brand": "#000000" },
        light: { "cal-brand": "#000000" },
      },
      hideEventTypeDetails: false,
      layout: "month_view",
    });
  });
  return configuration;
}

function manageBookingDialogFocus(trigger?: HTMLElement | null) {
  const startedAt = performance.now();
  const intervalId = window.setInterval(() => {
    const modal = document.querySelector("cal-modal-box");
    const closeButton = modal?.shadowRoot?.querySelector<HTMLButtonElement>(
      'button[aria-label="Close"]',
    );

    if (closeButton) {
      closeButton.focus();
      if (trigger) {
        closeButton.addEventListener("click", () => window.setTimeout(() => trigger.focus()), {
          once: true,
        });
      }
      window.clearInterval(intervalId);
    } else if (performance.now() - startedAt >= 10_000) {
      window.clearInterval(intervalId);
    }
  }, 50);
}

export async function openBookingWidget(trigger?: HTMLElement | null) {
  await prepareBookingWidget();
  const cal = await getCalApi({ namespace: CAL_NAMESPACE });
  cal("modal", { calLink: CAL_LINK, config: { layout: "month_view" } });
  manageBookingDialogFocus(trigger);
}
