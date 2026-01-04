self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  let payload = {};
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch {
    payload = {};
  }
  const title = payload.title || 'Новое объявление';
  const options = {
    body: payload.body || '',
    icon: '/setting/notification-box.svg',
    badge: '/setting/notification-box.svg',
    data: {
      url: payload.url || '/',
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  const url = (event.notification && event.notification.data && event.notification.data.url) || '/';
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i += 1) {
        const client = clientList[i];
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
      return undefined;
    }),
  );
});

