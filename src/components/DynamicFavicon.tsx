import { useEffect } from 'react';

interface DynamicFaviconProps {
  isDarkMode: boolean;
}

export function DynamicFavicon({ isDarkMode }: DynamicFaviconProps) {
  useEffect(() => {
    // Update theme color for mobile browsers
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    
    // Set theme color based on mode
    themeColorMeta.setAttribute('content', isDarkMode ? '#222222' : '#FBFBFB');
    
    // Update document class for CSS theming
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return null; // This component doesn't render anything visible
}