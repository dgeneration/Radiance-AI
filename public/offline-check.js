// This script checks if the user is offline and redirects to the offline page
(function() {
  // Function to check if the user is online
  function isOnline() {
    return navigator.onLine;
  }

  // Function to redirect to the offline page
  function redirectToOfflinePage() {
    if (!isOnline() && window.location.pathname !== '/offline') {
      // Store the current URL to return to when back online
      if (window.location.pathname !== '/auth/login') {
        sessionStorage.setItem('offlineRedirectUrl', window.location.href);
      }
      window.location.href = '/offline';
    }
  }

  // Function to handle coming back online
  function handleBackOnline() {
    // User is back online, redirect to the previous page if available
    console.log('Back online');
    const redirectUrl = sessionStorage.getItem('offlineRedirectUrl');
    if (redirectUrl) {
      sessionStorage.removeItem('offlineRedirectUrl');
      window.location.href = redirectUrl;
    }
  }

  // Check connection status when the page loads
  window.addEventListener('load', function() {
    if (window.location.pathname === '/offline' && isOnline()) {
      // If we're on the offline page but we're actually online, redirect back
      handleBackOnline();
    } else {
      redirectToOfflinePage();
    }
  });

  // Check connection status when it changes
  window.addEventListener('online', handleBackOnline);
  window.addEventListener('offline', redirectToOfflinePage);
})();
