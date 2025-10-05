// Service Worker for XOS - Aggressive caching for 10x performance
const CACHE_NAME = 'xos-cache-v1';
const STATIC_CACHE = 'xos-static-v1';
const DYNAMIC_CACHE = 'xos-dynamic-v1';

// Files to cache immediately
const urlsToCache = [
  '/',
  '/index.html',
  '/src/index.css',
  '/src/main.tsx',
  '/src/App.tsx',
  '/api/vfs/static/wallpapers/default.png',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Static assets - cache first
  static: [
    /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/,
    /\/wallpapers\//,
    /\/assets\//,
  ],
  
  // API calls - network first with fallback
  api: [
    /\/api\//,
  ],
  
  // App chunks - cache first with update
  chunks: [
    /\/js\/.*\.js$/,
    /\/css\/.*\.css$/,
  ],
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('XOS Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('XOS Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Old caches cleaned up');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Determine cache strategy
  let strategy = 'networkFirst'; // default
  
  // Check for static assets
  for (const pattern of CACHE_STRATEGIES.static) {
    if (pattern.test(url.pathname)) {
      strategy = 'cacheFirst';
      break;
    }
  }
  
  // Check for API calls
  for (const pattern of CACHE_STRATEGIES.api) {
    if (pattern.test(url.pathname)) {
      strategy = 'networkFirst';
      break;
    }
  }
  
  // Check for app chunks
  for (const pattern of CACHE_STRATEGIES.chunks) {
    if (pattern.test(url.pathname)) {
      strategy = 'staleWhileRevalidate';
      break;
    }
  }
  
  event.respondWith(handleRequest(request, strategy));
});

// Cache-first strategy - for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache-first strategy failed:', error);
    // Return a fallback response if available
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy - for API calls
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a meaningful error for API calls
    return new Response(JSON.stringify({ error: 'Network unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale-while-revalidate strategy - for app chunks
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await caches.match(request);
  
  // Always try to fetch from network in background
  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Update cache in background
    networkResponsePromise;
    return cachedResponse;
  }
  
  // If no cached version, wait for network
  return networkResponsePromise || new Response('Offline', { status: 503 });
}

// Main request handler
async function handleRequest(request, strategy) {
  switch (strategy) {
    case 'cacheFirst':
      return cacheFirst(request);
    case 'networkFirst':
      return networkFirst(request);
    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request);
    default:
      return fetch(request);
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any queued actions when back online
  console.log('Background sync triggered');
}

// Push notifications support
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      vibrate: [100, 50, 100],
      data: data.data || {},
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});