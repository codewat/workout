// Workoutwork PWA Service Worker for background alarm notifications
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TRIGGER_ALARM") {
    self.registration.showNotification("Time's Up! 🛑", {
      body: event.data.body || "Rest period finished! Time for the next set.",
      tag: "workout-timer-alarm",
      renotify: true,
      requireInteraction: true,
      vibrate: [400, 200, 400, 200, 600],
    });
  }
});
