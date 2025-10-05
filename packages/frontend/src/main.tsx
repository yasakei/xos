import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Unregister service worker for now to fix loading issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
}

// Register service worker for performance improvements (commented out for now)
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then((registration) => {
//         console.log('XOS Service Worker registered successfully:', registration.scope);
//       })
//       .catch((error) => {
//         console.log('XOS Service Worker registration failed:', error);
//       });
//   });
// }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Hide the initial loading screen when the app is ready
const initialLoading = document.getElementById('initial-loading');
if (initialLoading) {
  // Add a small delay to ensure the transition is smooth
  setTimeout(() => {
    initialLoading.style.opacity = '0';
    initialLoading.style.transition = 'opacity 0.3s ease-out';
    
    // Remove the element after the transition
    setTimeout(() => {
      initialLoading.remove();
    }, 300);
  }, 100);
}
