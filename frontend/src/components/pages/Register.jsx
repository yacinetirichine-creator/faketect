import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function Register() {
  const { t, i18n } = useTranslation();
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Mots de passe différents');
    if (password.length < 6) return toast.error('Minimum 6 caractères');
    const res = await register(email, password, name, i18n.language);
    if (res.success) { toast.success('Compte créé !'); navigate('/dashboard'); }
    else toast.error(res.error);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mx-auto mb-4" />
            <h1 className="text-2xl font-bold">{t('auth.registerTitle')}</h1>
            <p className="text-surface-600 mt-1">{t('auth.registerSub')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">{t('auth.name')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={20} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input pl-10" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="label">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={20} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="email@example.com" required />
              </div>
            </div>

            <div>
              <label className="label">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={20} />
                <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10 pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                  {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">{t('auth.confirm')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={20} />
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input pl-10" placeholder="••••••••" required />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full">{isLoading ? t('common.loading') : t('auth.register')}</button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-surface-600">{t('auth.hasAccount')} <Link to="/login" className="text-primary-600 font-medium hover:underline">{t('auth.login')}</Link></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
