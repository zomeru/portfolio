import Script from "next/script";

const GOOGLE_ANALYTICS_ID = "G-XNJS2S5JPX";

export function GoogleAnalyticsViaGtm() {
  return (
    <Script id="google-analytics-via-gtm">
      {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag("js", new Date());
gtag("config", "${GOOGLE_ANALYTICS_ID}");`}
    </Script>
  );
}
