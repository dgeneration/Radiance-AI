/**
 * Utility functions for managing developer mode
 */

// Check if developer mode is enabled
export function isDeveloperModeEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return localStorage.getItem('developer_mode') === 'true';
}

// Set developer mode
export function setDeveloperMode(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Update localStorage
  localStorage.setItem('developer_mode', enabled.toString());
  
  // Dispatch storage event
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'developer_mode',
    newValue: enabled.toString(),
    storageArea: localStorage
  }));
  
  // Dispatch custom event
  const customEvent = new CustomEvent('developerModeChanged', { 
    detail: { enabled } 
  });
  window.dispatchEvent(customEvent);
  
  console.log('Developer mode set to:', enabled);
}

// Toggle developer mode
export function toggleDeveloperMode(): boolean {
  const currentValue = isDeveloperModeEnabled();
  const newValue = !currentValue;
  setDeveloperMode(newValue);
  return newValue;
}
