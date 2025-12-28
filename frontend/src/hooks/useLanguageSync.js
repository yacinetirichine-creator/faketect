import { useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import i18n, { normalizeLanguage, persistLanguage } from '../i18n';

export function useLanguageSync() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.language) return;
    const desired = normalizeLanguage(user.language);
    const current = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
    if (desired && current !== desired) {
      persistLanguage(desired);
      i18n.changeLanguage(desired);
    }
  }, [user?.language]);
}
