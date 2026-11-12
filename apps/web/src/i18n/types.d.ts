import type { Messages } from "./messages";
import type { Locale } from "./routing";

declare module "use-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
