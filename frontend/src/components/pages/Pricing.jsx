import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { plansApi } from '../../services/api';
import useAuthStore from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { plansApi.getPlans().then(({ data }) => { setPlans(data.plans); setLoading(false); }); }, []);

  const handleChoose = (id) => {
    if (!isAuthenticated) navigate('/register');
    else if (id === 'FREE') navigate('/dashboard');
    else alert('Stripe checkout à implémenter');
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('pricing.title')}</h1>
          <p className="text-xl text-surface-600">{t('pricing.subtitle')}</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={!yearly ? 'font-semibold' : 'text-surface-500'}>{t('pricing.monthly')}</span>
          <button onClick={() => setYearly(!yearly)} className={`relative w-14 h-7 rounded-full transition-colors ${yearly ? 'bg-primary-600' : 'bg-surface-300'}`}>
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${yearly ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
          <span className={yearly ? 'font-semibold' : 'text-surface-500'}>{t('pricing.yearly')}</span>
          {yearly && <span className="badge-success">{t('pricing.save')} 30%</span>}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {plans.map((p, i) => {
            const pop = p.id === 'PRO';
            const cur = user?.plan === p.id;
            const price = yearly ? p.yearlyPrice : p.monthlyPrice;

            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`card relative ${pop ? 'ring-2 ring-primary-500 shadow-xl' : ''}`}>
                {pop && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1"><Sparkles size={14} />{t('pricing.popular')}</span></div>}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold">{price}€</span>
                    <span className="text-surface-500">{yearly ? t('pricing.perYear') : t('pricing.perMonth')}</span>
                  </div>
                  <p className="text-sm text-surface-500 mt-1">{p.perMonth > 0 ? `${p.perMonth} analyses/mois` : p.perMonth === -1 ? 'Illimité' : `${p.perDay}/jour`}</p>
                </div>

                <ul className="space-y-2 mb-6">
                  {p.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm">
                      <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                      <span className="text-surface-600">{f}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={() => handleChoose(p.id)} disabled={cur} className={`w-full py-3 rounded-xl font-semibold transition-all ${cur ? 'bg-surface-200 text-surface-500' : pop ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-surface-900 text-white hover:bg-surface-800'}`}>
                  {cur ? t('pricing.current') : p.id === 'FREE' ? t('pricing.free') : t('pricing.choose')}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
