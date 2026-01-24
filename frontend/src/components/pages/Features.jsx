import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield, FileSearch, Video, Layers, Code, Database, ArrowRight } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Features() {
  const { t } = useTranslation();

  const features = [
    { icon: FileSearch, title: t('landing.features.image.title'), desc: t('landing.features.image.desc'), color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { icon: Video, title: t('landing.features.video.title'), desc: t('landing.features.video.desc'), color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { icon: Layers, title: t('landing.features.batch.title'), desc: t('landing.features.batch.desc'), color: 'text-green-400', bg: 'bg-green-400/10' },
    { icon: Code, title: t('landing.features.api.title'), desc: t('landing.features.api.desc'), color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { icon: Database, title: t('landing.features.metadata.title'), desc: t('landing.features.metadata.desc'), color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { icon: Shield, title: t('landing.features.security.title'), desc: t('landing.features.security.desc'), color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  ];

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('features.title')}</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">{t('features.subtitle')}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center text-lg px-8 py-4 font-semibold rounded-2xl bg-gradient-to-r from-primary via-purple-600 to-pink-500 hover:from-primary/90 hover:via-purple-500 hover:to-pink-400 text-white shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-1 group"
            >
              {t('hero.cta')}
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center text-lg px-8 py-4 font-semibold rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1"
            >
              {t('hero.cta2')}
            </Link>
          </div>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                variants={item}
                className="card bg-surface/50 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-5`}>
                  <Icon className={f.color} size={22} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-6">{t('landing.cta.subtitle')}</p>
          <Link
            to="/register"
            className="btn-primary text-lg px-10 py-4 shadow-xl shadow-primary/20 inline-flex items-center justify-center"
          >
            {t('landing.cta.primary')}
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}
