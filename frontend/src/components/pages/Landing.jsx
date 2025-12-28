import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield, FileSearch, Video, Layers, Code, Database } from 'lucide-react';

export default function Landing() {
  const { t } = useTranslation();

  const features = [
    { icon: FileSearch, title: 'Analyse images', desc: 'Détectez IA et deepfakes' },
    { icon: Video, title: 'Analyse vidéo', desc: 'Jusqu\'à 60 secondes' },
    { icon: Layers, title: 'Batch', desc: 'Plusieurs fichiers' },
    { icon: Code, title: 'API', desc: 'Intégration facile' },
    { icon: Database, title: 'Métadonnées', desc: 'Analyse EXIF' }
  ];

  return (
    <div>
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-700 font-medium text-sm mb-6">
              <Shield size={16} /> Protection deepfakes
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-surface-900 mb-6">
              {t('hero.title')} <span className="text-gradient">{t('hero.highlight')}</span>
            </h1>

            <p className="text-xl text-surface-600 mb-10 max-w-2xl mx-auto">{t('hero.subtitle')}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-8 py-4">{t('hero.cta')}</Link>
              <Link to="/pricing" className="btn-outline text-lg px-8 py-4">{t('hero.cta2')}</Link>
            </div>

            <div className="flex flex-wrap justify-center gap-8 mt-16">
              {[{ v: '95%+', l: 'Précision' }, { v: '1M+', l: 'Analyses' }, { v: '<2s', l: 'Temps' }].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="text-center">
                  <div className="text-4xl font-bold text-surface-900">{s.v}</div>
                  <div className="text-surface-500">{s.l}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('features.title')}</h2>
            <p className="text-xl text-surface-600">{t('features.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card hover:shadow-xl transition-all group">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-500 transition-colors">
                  <f.icon className="text-primary-600 group-hover:text-white" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-surface-600">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="card bg-gradient-to-br from-surface-900 to-surface-800 text-white p-12">
            <h2 className="text-3xl font-bold mb-4">Prêt à détecter les faux ?</h2>
            <p className="text-surface-300 mb-8">Commencez gratuitement avec 3 analyses par jour.</p>
            <Link to="/register" className="btn bg-white text-surface-900 hover:bg-surface-100 px-8 py-4 text-lg">Créer mon compte gratuit</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
