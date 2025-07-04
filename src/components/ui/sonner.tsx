"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

interface CustomToasterProps extends ToasterProps {
  isDarkMode?: boolean;
}

const Toaster = ({ isDarkMode, ...props }: CustomToasterProps) => {
  return (
    <Sonner
      theme={isDarkMode ? "dark" : "light"}
      className="toaster group"
      style={
        {
          // Force override Sonner's default variables
          "--normal-bg": "transparent",
          "--normal-text": "transparent", 
          "--normal-border": "transparent",
          "--success-bg": "transparent",
          "--success-text": "transparent",
          "--success-border": "transparent",
          "--error-bg": "transparent", 
          "--error-text": "transparent",
          "--error-border": "transparent",
          "--warning-bg": "transparent",
          "--warning-text": "transparent", 
          "--warning-border": "transparent",
          "--info-bg": "transparent",
          "--info-text": "transparent",
          "--info-border": "transparent",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };