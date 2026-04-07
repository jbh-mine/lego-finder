/* Service worker registration helper for LEGO Finder.
 * Registers /sw.js (relative to PUBLIC_URL) in production builds only.
 * Uses scope = PUBLIC_URL so GitHub Pages subpath deploys still work.
 */

export function register() {
  if (process.env.NODE_ENV !== 'production') return;
  if (!('serviceWorker' in navigator)) return;

  const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
  if (publicUrl.origin !== window.location.origin) return;

  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL || ''}/sw.js`;
    navigator.serviceWorker
      .register(swUrl, { scope: `${process.env.PUBLIC_URL || ''}/` })
      .then((registration) => {
        registration.onupdatefound = () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.onstatechange = () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available; will be used after all tabs are closed.
              // eslint-disable-next-line no-console
              console.log('[PWA] New content available — refresh to update.');
            }
          };
        };
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('[PWA] Service worker registration failed:', err);
      });
  });
}

export function unregister() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready
    .then((registration) => registration.unregister())
    .catch(() => {});
}
