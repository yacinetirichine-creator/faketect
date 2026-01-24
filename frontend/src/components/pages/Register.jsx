import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ShieldCheck, Phone } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function Register() {
  const { t, i18n } = useTranslation();
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [aiProcessingConsent, setAiProcessingConsent] = useState(false);
  const [show, setShow] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!aiProcessingConsent) {
      toast.error(t('auth.aiConsentRequired'));
      return;
    }
    const lang = (i18n.resolvedLanguage || i18n.language || 'fr').split('-')[0];
    const res = await register(email, password, name, lang, phone, acceptMarketing, aiProcessingConsent);
    if (res.success) { toast.success(t('auth.registerSuccess')); navigate('/dashboard'); }
    else toast.error(res.error);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card p-8 border-white/10 bg-surface/50 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t('auth.registerTitle')}</h1>
            <p className="text-gray-400 mt-1">{t('auth.registerSub')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">{t('auth.name')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input pl-10" placeholder={t('auth.placeholders.name')} autoComplete="name" required />
              </div>
            </div>

            <div>
              <label className="label">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder={t('auth.placeholders.email')} autoComplete="email" required />
              </div>
            </div>

            <div>
              <label className="label">{t('auth.phone')} <span className="text-gray-500 text-xs">({t('common.optional')})</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input pl-10" placeholder={t('auth.placeholders.phone')} autoComplete="tel" />
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('auth.phoneHint')}</p>
            </div>

            <div>
              <label className="label">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10 pr-10" placeholder="••••••••" autoComplete="new-password" required />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                  {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="aiConsent"
                checked={aiProcessingConsent}
                onChange={(e) => setAiProcessingConsent(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary bg-surface border-white/20 rounded focus:ring-primary focus:ring-2"
                required
              />
              <label htmlFor="aiConsent" className="text-xs text-gray-400 leading-relaxed">
                <span className="text-red-400">*</span> {t('auth.aiProcessingConsent')} <Link to="/legal/privacy" className="text-primary hover:underline">{t('auth.privacyPolicy')}</Link>
              </label>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="marketing"
                checked={acceptMarketing}
                onChange={(e) => setAcceptMarketing(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary bg-surface border-white/20 rounded focus:ring-primary focus:ring-2"
              />
              <label htmlFor="marketing" className="text-xs text-gray-400 leading-relaxed">
                {t('auth.marketingConsent')} <Link to="/legal/privacy" className="text-primary hover:underline">{t('auth.privacyPolicy')}</Link>
              </label>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-lg shadow-lg shadow-primary/25">
              {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('auth.registerBtn')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {t('auth.hasAccount')} <Link to="/login" className="text-primary hover:text-primary-400 font-medium transition-colors">{t('auth.loginLink')}</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
