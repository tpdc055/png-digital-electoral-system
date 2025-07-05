// PNG Digital Electoral System - Service Worker
// Enables offline functionality and PWA capabilities

const CACHE_NAME = 'png-electoral-v1.0.0';
const STATIC_CACHE = 'png-electoral-static-v1';
const DYNAMIC_CACHE = 'png-electoral-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API routes to cache
const API_ROUTES = [
  '/api/elections',
  '/api/candidates',
  '/api/citizens'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('PNG Electoral System SW: Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('PNG Electoral System SW: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('PNG Electoral System SW: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('PNG Electoral System SW: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('PNG Electoral System SW: Activating...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('PNG Electoral System SW: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('PNG Electoral System SW: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle navigation requests (pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If online, serve from network and update cache
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          // If offline, serve from cache or fallback to index.html
          return caches.match(request)
            .then(response => response || caches.match('/'))
            .then(response => {
              if (!response) {
                return new Response(
                  '<h1>PNG Electoral System - Offline</h1><p>Please check your internet connection and try again.</p>',
                  { headers: { 'Content-Type': 'text/html' } }
                );
              }
              return response;
            });
        })
    );
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses for offline access
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Serve from cache when offline
          return caches.match(request)
            .then(response => {
              if (response) {
                return response;
              }
              // Return offline fallback for API requests
              return new Response(
                JSON.stringify({
                  error: 'Offline',
                  message: 'This data is not available offline',
                  offline: true
                }),
                {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response.ok) {
              return response;
            }

            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone));

            return response;
          })
          .catch(() => {
            // Fallback for failed requests
            if (request.destination === 'image') {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#6b7280">Image Offline</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            return new Response('Resource not available offline', { status: 503 });
          });
      })
  );
});

// Handle background sync for vote submission
self.addEventListener('sync', event => {
  console.log('PNG Electoral System SW: Background sync triggered', event.tag);

  if (event.tag === 'submit-vote') {
    event.waitUntil(
      submitPendingVotes()
    );
  }

  if (event.tag === 'sync-data') {
    event.waitUntil(
      syncElectoralData()
    );
  }
});

// Handle push notifications for electoral updates
self.addEventListener('push', event => {
  console.log('PNG Electoral System SW: Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'New electoral update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'electoral-update',
    actions: [
      {
        action: 'view',
        title: 'View Update',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-action.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('PNG Electoral System', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('PNG Electoral System SW: Notification clicked', event.action);

  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Helper function to submit pending votes when back online
async function submitPendingVotes() {
  try {
    // Get pending votes from IndexedDB
    const pendingVotes = await getPendingVotes();

    for (const vote of pendingVotes) {
      try {
        const response = await fetch('/api/votes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(vote)
        });

        if (response.ok) {
          await removePendingVote(vote.id);
          console.log('PNG Electoral System SW: Vote submitted successfully', vote.id);
        }
      } catch (error) {
        console.error('PNG Electoral System SW: Failed to submit vote', vote.id, error);
      }
    }
  } catch (error) {
    console.error('PNG Electoral System SW: Background sync failed', error);
  }
}

// Helper function to sync electoral data
async function syncElectoralData() {
  try {
    // Sync candidates
    await fetch('/api/candidates');

    // Sync elections
    await fetch('/api/elections');

    console.log('PNG Electoral System SW: Data sync completed');
  } catch (error) {
    console.error('PNG Electoral System SW: Data sync failed', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingVotes() {
  // This would integrate with your IndexedDB implementation
  return [];
}

async function removePendingVote(voteId) {
  // This would integrate with your IndexedDB implementation
  console.log('Removing pending vote:', voteId);
}

// Message handling for communication with the main app
self.addEventListener('message', event => {
  console.log('PNG Electoral System SW: Message received', event.data);

  if (event.data && event.data.type === 'CACHE_VOTE') {
    // Cache vote data for offline submission
    caches.open(DYNAMIC_CACHE)
      .then(cache => {
        const request = new Request('/offline-vote-' + Date.now());
        const response = new Response(JSON.stringify(event.data.vote));
        return cache.put(request, response);
      });
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('PNG Electoral System SW: Service Worker loaded successfully');
