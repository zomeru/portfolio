import { getNotificationsServerEnv } from "@portfolio/env/notifications-server";

export function getPushSubscriptionConfig() {
  const { webPushVapidPublicKey, webPushVapidPrivateKey, webPushSubject } =
    getNotificationsServerEnv();
  return {
    enabled: Boolean(webPushVapidPublicKey && webPushVapidPrivateKey && webPushSubject),
    publicKey: webPushVapidPublicKey ?? null,
  };
}
