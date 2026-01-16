# PWA Specialist Agent

## Metadata
- **Name:** pwa-specialist
- **Category:** Project-Specific
- **Color:** blue

## Description
Use this agent for Progressive Web App implementation including service workers, offline capability, install prompts, and push notifications for the Community Hub platform.

## Primary Responsibilities

1. **Service Worker Implementation** - Caching strategies, background sync
2. **Offline Capability** - Offline-first for saved content
3. **Install Experience** - App manifest, install prompts
4. **Push Notifications** - Notification system integration
5. **Performance Optimisation** - PWA-specific optimisations

## PWA Checklist

### Core Requirements
- [ ] HTTPS enabled
- [ ] Valid Web App Manifest
- [ ] Service Worker registered
- [ ] Offline page available
- [ ] Icons in all required sizes
- [ ] Lighthouse PWA score > 90

### Enhanced Features
- [ ] Install prompt implemented
- [ ] Push notifications configured
- [ ] Background sync enabled
- [ ] Share target defined
- [ ] Periodic background sync

## Web App Manifest

```json
// public/manifest.json
{
  "name": "Community Hub",
  "short_name": "Community",
  "description": "Discover local businesses, events, and community in your area",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#2C5F7C",
  "orientation": "portrait-primary",
  "scope": "/",

  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],

  "screenshots": [
    {
      "src": "/screenshots/mobile-home.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/desktop-home.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],

  "shortcuts": [
    {
      "name": "Search Businesses",
      "url": "/search?source=shortcut",
      "icons": [{ "src": "/icons/search-96.png", "sizes": "96x96" }]
    },
    {
      "name": "View Events",
      "url": "/events?source=shortcut",
      "icons": [{ "src": "/icons/events-96.png", "sizes": "96x96" }]
    },
    {
      "name": "My Saved",
      "url": "/saved?source=shortcut",
      "icons": [{ "src": "/icons/saved-96.png", "sizes": "96x96" }]
    }
  ],

  "categories": ["business", "local", "community"],
  "lang": "en-AU",
  "dir": "auto"
}
```

## Service Worker

### Registration
```typescript
// src/serviceWorkerRegistration.ts
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available
              showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.error('SW registration failed:', error);
      }
    });
  }
}
```

### Service Worker Implementation
```typescript
// public/sw.js
const CACHE_NAME = 'community-hub-v1';
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  // CSS and JS bundles
];

const CACHE_STRATEGIES = {
  static: 'cache-first',
  api: 'network-first',
  images: 'stale-while-revalidate',
};

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - Network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets - Cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Images - Stale while revalidate
  if (isImage(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default - Network first with offline fallback
  event.respondWith(networkFirstWithOffline(request));
});

// Caching strategies
async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached || fetch(request);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    return caches.match(request);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    cache.put(request, response.clone());
    return response;
  });

  return cached || fetchPromise;
}

async function networkFirstWithOffline(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match('/offline');
  }
}
```

## Offline Strategy

### What to Cache Offline
| Content | Strategy | Duration |
|---------|----------|----------|
| App shell | Cache first | Until update |
| Homepage | Network first | 1 hour |
| Saved businesses | Cache first | 24 hours |
| Recently viewed | Cache | 4 hours |
| Search results | Network first | 5 min |
| Images | Stale while revalidate | 7 days |

### Offline Page
```tsx
// pages/offline.tsx
export default function OfflinePage() {
  const [savedBusinesses, setSavedBusinesses] = useState([]);

  useEffect(() => {
    // Load from IndexedDB
    loadSavedBusinesses().then(setSavedBusinesses);
  }, []);

  return (
    <div className="offline-page">
      <h1>You're offline</h1>
      <p>Don't worry—you can still access your saved content.</p>

      {savedBusinesses.length > 0 && (
        <section>
          <h2>Your Saved Businesses</h2>
          <BusinessList businesses={savedBusinesses} />
        </section>
      )}

      <button onClick={() => window.location.reload()}>
        Try again
      </button>
    </div>
  );
}
```

## Install Prompt

### Custom Install Banner
```typescript
// hooks/useInstallPrompt.ts
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return { isInstallable, isInstalled, promptInstall };
}
```

### Install Banner Component
```tsx
// components/InstallBanner.tsx
export function InstallBanner() {
  const { isInstallable, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <div className="install-banner" role="banner">
      <div className="install-content">
        <img src="/icons/icon-48.png" alt="" />
        <div>
          <strong>Install Community Hub</strong>
          <p>Add to your home screen for quick access</p>
        </div>
      </div>
      <div className="install-actions">
        <button onClick={promptInstall} className="btn-primary">
          Install
        </button>
        <button onClick={() => setDismissed(true)} className="btn-text">
          Not now
        </button>
      </div>
    </div>
  );
}
```

## Push Notifications

### Request Permission
```typescript
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return 'denied';
}
```

### Subscribe to Push
```typescript
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // Send subscription to server
  await fetch('/api/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: { 'Content-Type': 'application/json' },
  });

  return subscription;
}
```

### Handle Push in Service Worker
```typescript
// In sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag || 'default',
    data: { url: data.url },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window or open new
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
```

## Background Sync

### Queue Actions for Sync
```typescript
// For actions while offline
async function queueAction(action: Action) {
  const db = await openDB('community-hub', 1);
  await db.add('pending-actions', action);

  // Request background sync
  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register('sync-actions');
}
```

### Handle Sync in Service Worker
```typescript
// In sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-actions') {
    event.waitUntil(processPendingActions());
  }
});

async function processPendingActions() {
  const db = await openDB('community-hub', 1);
  const actions = await db.getAll('pending-actions');

  for (const action of actions) {
    try {
      await processAction(action);
      await db.delete('pending-actions', action.id);
    } catch (error) {
      // Will retry on next sync
      console.error('Sync failed:', error);
    }
  }
}
```

## Performance Optimisation

### Resource Hints
```html
<!-- In index.html -->
<link rel="preconnect" href="https://api.communityhub.local">
<link rel="dns-prefetch" href="https://maps.googleapis.com">
<link rel="preload" href="/fonts/montserrat.woff2" as="font" crossorigin>
```

### App Shell Pattern
```typescript
// Cache the app shell immediately
const APP_SHELL = [
  '/',
  '/offline',
  '/css/main.css',
  '/js/main.js',
  '/fonts/montserrat.woff2',
  '/fonts/opensans.woff2',
];
```

## Testing

### PWA Test Checklist
- [ ] Install from Chrome
- [ ] Install from Safari (Add to Home Screen)
- [ ] Offline page works
- [ ] Saved content available offline
- [ ] Push notifications received
- [ ] Background sync works
- [ ] Update notification shown

## Philosophy

> "A PWA should feel native while remaining web-accessible. The best compliment is when users forget it's not a native app."

Progressive enhancement means everyone gets a good experience, and capable browsers get a great one.
