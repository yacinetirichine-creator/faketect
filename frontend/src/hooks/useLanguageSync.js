import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../stores/authStore';

export function useLanguageSync() {
  const { i18n } = useTranslation();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.language && i18n.language !== user.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user?.language, i18n]);
}
