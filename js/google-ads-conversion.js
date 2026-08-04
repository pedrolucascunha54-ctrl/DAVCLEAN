/**
 * Reusable Google Ads conversion tracker.
 * Usage: trackGoogleAdsConversion(url, { send_to, value, currency })
 * If gtag is unavailable, `url` opens immediately (fallback).
 */
function trackGoogleAdsConversion(url, options) {
  options = options || {};
  var sendTo = options.send_to || 'AW-18368495873/BrHLCLrq6NscEIGC5LzE';
  var value = options.value !== undefined ? options.value : 1.0;
  var currency = options.currency || 'BRL';

  var opened = false;
  function openDestination() {
    if (opened || !url) return;
    opened = true;
    window.open(url, '_blank', 'noopener');
  }

  if (typeof gtag !== 'function') {
    openDestination();
    return;
  }

  // Fallback in case event_callback never fires (blocked network, etc).
  setTimeout(openDestination, 1000);

  gtag('event', 'conversion', {
    send_to: sendTo,
    value: value,
    currency: currency,
    event_callback: openDestination
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');
  whatsappLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      trackGoogleAdsConversion(link.href);
    });
  });
});
