import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { plansApi, stripeApi } from '../../services/api';
import useAuthStore from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import i18n from '../../i18n';

export default function Pricing() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  useEffect(() => { plansApi.getPlans().then(({ data }) => { setPlans(data.plans); setLoading(false); }); }, []);

  const handleChoose = async (id) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    
    if (id === 'FREE') {
      navigate('/dashboard');
      return;
    }

    try {
      setCheckoutLoading(id);
      const { data } = await stripeApi.createCheckout(id, yearly ? 'yearly' : 'monthly', i18n.language);
      window.location.href = data.url;
    } catch (error) {
      toast.error(error.response?.data?.error || t('pricing.checkoutError'));
      setCheckoutLoading(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('pricing.title')}</h1>
          <p className="text-xl text-gray-400">{t('pricing.subtitle')}</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={!yearly ? 'font-semibold text-white' : 'text-gray-500'}>{t('pricing.monthly')}</span>
          <button onClick={() => setYearly(!yearly)} className={`relative w-14 h-7 rounded-full transition-colors ${yearly ? 'bg-primary' : 'bg-white/20'}`}>
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${yearly ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
          <span className={yearly ? 'font-semibold text-white' : 'text-gray-500'}>{t('pricing.yearly')}</span>
          {yearly && <span className="badge-success">{t('pricing.save')} 30%</span>}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {plans.map((p, i) => {
            const pop = p.id === 'PRO';
            const cur = user?.plan === p.id;
            const price = yearly ? p.yearlyPrice : p.monthlyPrice;

            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`card relative bg-surface/50 border-white/10 ${pop ? 'ring-2 ring-primary shadow-2xl shadow-primary/20' : ''}`}>
                {pop && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1"><Sparkles size={14} />{t('pricing.popular')}</span></div>}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold text-white">{price}€</span>
                    <span className="text-gray-400">{yearly ? t('pricing.perYear') : t('pricing.perMonth')}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {p.perMonth > 0
                      ? `${p.perMonth} ${t('pricing.analysesPerMonth')}`
                      : p.perMonth === -1
                        ? t('pricing.unlimited')
                        : `${p.perDay} ${t('pricing.analysesPerDay')}`}
                  </p>
                </div>

                <ul className="space-y-2 mb-6">
                  {p.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm">
                      <Check className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                      <span className="text-gray-300">{f}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={() => handleChoose(p.id)} disabled={cur || checkoutLoading === p.id} className={`w-full py-3 rounded-xl font-semibold transition-all ${cur ? 'bg-white/5 text-gray-500 cursor-not-allowed' : pop ? 'bg-primary text-white hover:bg-primary-600 shadow-lg shadow-primary/25' : 'bg-surface text-white hover:bg-surface/80 border border-white/10'}`}>
                  {checkoutLoading === p.id ? (
                    <Loader2 className="animate-spin mx-auto" size={20} />
                  ) : cur ? t('pricing.current') : p.id === 'FREE' ? t('pricing.free') : t('pricing.choose')}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
