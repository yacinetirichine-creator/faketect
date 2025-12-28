import { useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import i18n from '../i18n';

export function useLanguageSync() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.language && i18n.language !== user.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user?.language]);
}
