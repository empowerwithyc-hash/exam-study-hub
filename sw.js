// Exam Study Hub — offline-first service worker
// Unique cache name per app to avoid colliding with other apps on this origin.
var CACHE_NAME = 'exam-study-hub-v2';
var CACHE_PREFIX = 'exam-study-hub-';

var PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(PRECACHE_URLS);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names
          .filter(function(name){ return name.indexOf(CACHE_PREFIX) === 0 && name !== CACHE_NAME; })
          .map(function(name){ return caches.delete(name); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event){
  var request = event.request;

  // Only handle same-origin GET requests; never touch cross-origin requests.
  if (request.method !== 'GET') return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.match(request).then(function(cached){
        var networkFetch = fetch(request).then(function(response){
          if (response && response.ok){
            cache.put(request, response.clone());
          }
          return response;
        }).catch(function(){
          return cached;
        });
        // Cache-first: return cached immediately if present, update cache in background.
        return cached || networkFetch;
      });
    })
  );
});
