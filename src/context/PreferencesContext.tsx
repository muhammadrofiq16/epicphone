'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { formatRupiah } from '@/lib/formatters';

interface PreferencesContextType {
  isDarkMode: boolean;
  hideNumbers: boolean;
  logoUrl: string;
  toggleDarkMode: (value?: boolean) => void;
  toggleHideNumbers: (value?: boolean) => void;
  updateLogoUrl: (url: string) => void;
  formatMoney: (amount: number | null | undefined, short?: boolean) => string;
  maskText: (text: string | number) => string;
  isLoading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType>({
  isDarkMode: false,
  hideNumbers: false,
  logoUrl: '/images/logo.svg',
  toggleDarkMode: () => {},
  toggleHideNumbers: () => {},
  updateLogoUrl: () => {},
  formatMoney: (amount, short) => formatRupiah(amount, short, false),
  maskText: (text) => String(text),
  isLoading: true,
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [hideNumbers, setHideNumbers] = useState<boolean>(false);
  const [logoUrl, setLogoUrl] = useState<string>('/images/logo.svg');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync dark class on document element
  const applyDarkClass = useCallback((dark: boolean) => {
    if (typeof document !== 'undefined') {
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Initialize from localStorage and then backend /api/settings
  useEffect(() => {
    // 1. Instant local read for zero flash
    const localDark = localStorage.getItem('epicphone_dark_mode') === 'true';
    const localHide = localStorage.getItem('epicphone_hide_numbers') === 'true';
    const localLogo = localStorage.getItem('epicphone_store_logo') || '/images/logo.svg';

    setIsDarkMode(localDark);
    setHideNumbers(localHide);
    setLogoUrl(localLogo);
    applyDarkClass(localDark);

    // 2. Fetch from backend to ensure synchronization with database
    async function syncSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.tema_gelap === 'boolean') {
            setIsDarkMode(data.tema_gelap);
            applyDarkClass(data.tema_gelap);
            localStorage.setItem('epicphone_dark_mode', String(data.tema_gelap));
          }
          if (typeof data.sembunyikan_angka === 'boolean') {
            setHideNumbers(data.sembunyikan_angka);
            localStorage.setItem('epicphone_hide_numbers', String(data.sembunyikan_angka));
          }
          if (data.logo_url) {
            setLogoUrl(data.logo_url);
            localStorage.setItem('epicphone_store_logo', data.logo_url);
          }
        }
      } catch (err) {
        console.error('Failed to sync settings from server:', err);
      } finally {
        setIsLoading(false);
      }
    }

    syncSettings();
  }, [applyDarkClass]);

  const toggleDarkMode = useCallback((targetValue?: boolean) => {
    setIsDarkMode((prev) => {
      const next = typeof targetValue === 'boolean' ? targetValue : !prev;
      localStorage.setItem('epicphone_dark_mode', String(next));
      applyDarkClass(next);

      // Async persist to SQLite backend
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema_gelap: next }),
      }).catch((e) => console.error('Failed to save dark mode to db:', e));

      return next;
    });
  }, [applyDarkClass]);

  const toggleHideNumbers = useCallback((targetValue?: boolean) => {
    setHideNumbers((prev) => {
      const next = typeof targetValue === 'boolean' ? targetValue : !prev;
      localStorage.setItem('epicphone_hide_numbers', String(next));

      // Async persist to SQLite backend
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sembunyikan_angka: next }),
      }).catch((e) => console.error('Failed to save hide numbers to db:', e));

      return next;
    });
  }, []);

  const updateLogoUrl = useCallback((newUrl: string) => {
    setLogoUrl(newUrl);
    localStorage.setItem('epicphone_store_logo', newUrl);
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo_url: newUrl }),
    }).catch((e) => console.error('Failed to save logo to db:', e));
  }, []);

  const formatMoney = useCallback(
    (amount: number | null | undefined, short = false) => {
      return formatRupiah(amount, short, hideNumbers);
    },
    [hideNumbers]
  );

  const maskText = useCallback(
    (text: string | number) => {
      if (!hideNumbers) return String(text);
      return '••••••';
    },
    [hideNumbers]
  );

  return (
    <PreferencesContext.Provider
      value={{
        isDarkMode,
        hideNumbers,
        logoUrl,
        toggleDarkMode,
        toggleHideNumbers,
        updateLogoUrl,
        formatMoney,
        maskText,
        isLoading,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
