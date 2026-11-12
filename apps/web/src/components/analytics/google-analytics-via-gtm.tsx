const GTM_ID = "GTM-PV9CX97P";
const GOOGLE_ANALYTICS_ID = "G-XNJS2S5JPX";

export function GoogleAnalyticsViaGtm() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
dataLayer.push({"gtm.start": Date.now(), event: "gtm.js"});
function gtag(){dataLayer.push(arguments);}
gtag("js", new Date());
gtag("config", "${GOOGLE_ANALYTICS_ID}");`,
        }}
      />
      <script async src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`} />
    </>
  );
}
