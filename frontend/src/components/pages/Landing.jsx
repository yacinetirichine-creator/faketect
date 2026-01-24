import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, FileSearch, Video, Layers, Code, Database, CheckCircle2, ArrowRight, Lock, Zap, Activity, FileText, Cookie } from 'lucide-react';
import CookieConsent from '../CookieConsent';
import DemoSection from '../DemoSection';
import Logo from '../Logo';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Landing() {
  const { t } = useTranslation();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const features = [
    { icon: FileSearch, title: t('landing.features.image.title'), desc: t('landing.features.image.desc'), color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { icon: Video, title: t('landing.features.video.title'), desc: t('landing.features.video.desc'), color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { icon: Layers, title: t('landing.features.batch.title'), desc: t('landing.features.batch.desc'), color: 'text-green-400', bg: 'bg-green-400/10' },
    { icon: Code, title: t('landing.features.api.title'), desc: t('landing.features.api.desc'), color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { icon: Database, title: t('landing.features.metadata.title'), desc: t('landing.features.metadata.desc'), color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { icon: Shield, title: t('landing.features.security.title'), desc: t('landing.features.security.desc'), color: 'text-cyan-400', bg: 'bg-cyan-400/10' }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 pb-32">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        </div>

        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="relative z-10"
          >
            <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-primary-300 text-sm font-medium mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              {t('landing.badge')}
            </motion.div>

            <motion.h1 variants={item} className="text-6xl md:text-7xl font-display font-bold leading-tight mb-6">
              {t('landing.hero.title')} <br />
              <span className="text-gradient">{t('landing.hero.highlight')}</span>
            </motion.h1>

            <motion.p variants={item} className="text-xl text-gray-400 mb-10 max-w-lg leading-relaxed">
              {t('landing.hero.subtitle')}
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
              <Link to="/register" className="inline-flex items-center justify-center text-lg px-8 py-4 font-semibold rounded-2xl bg-gradient-to-r from-primary via-purple-600 to-pink-500 hover:from-primary/90 hover:via-purple-500 hover:to-pink-400 text-white shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-1 group">
                {t('landing.hero.ctaPrimary')}
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
              <Link to="/pricing" className="inline-flex items-center justify-center text-lg px-8 py-4 font-semibold rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1">
                {t('landing.hero.ctaSecondary')}
              </Link>
            </motion.div>

            <motion.div variants={item} className="mt-12 flex items-center gap-8 text-gray-500 text-sm font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-primary" /> {t('landing.hero.trust.accuracy')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-primary" /> {t('landing.hero.trust.gdpr')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-primary" /> {t('landing.hero.trust.api')}
              </div>
            </motion.div>
          </motion.div>

          {/* 3D/Floating Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative perspective-1000 hidden lg:block"
          >
            <motion.div 
              animate={{ 
                rotateY: [0, -5, 0, 5, 0],
                rotateX: [0, 5, 0, -5, 0],
                y: [0, -20, 0]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="relative z-10"
            >
              {/* Main Glass Card */}
              <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl shadow-primary/20 backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/0">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400 font-mono">
                    analysis_v2.py
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                      <Activity size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 w-24 bg-white/20 rounded mb-2" />
                      <div className="h-2 w-16 bg-white/10 rounded" />
                    </div>
                    <div className="text-green-400 font-mono text-sm">{t('landing.hero.demo.real')}</div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
                      <Lock size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 w-32 bg-white/20 rounded mb-2" />
                      <div className="h-2 w-20 bg-white/10 rounded" />
                    </div>
                    <div className="text-red-400 font-mono text-sm">{t('landing.hero.demo.detected')}</div>
                  </div>

                  {/* Scanning Line Animation */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                    <motion.div 
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                    />
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div 
                animate={{ y: [0, 30, 0] }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                className="absolute -right-12 -top-12 p-4 glass-panel rounded-2xl border border-white/10 shadow-xl"
              >
                <Shield size={32} className="text-accent" />
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, -40, 0] }}
                transition={{ duration: 6, repeat: Infinity, delay: 2 }}
                className="absolute -left-8 -bottom-8 p-4 glass-panel rounded-2xl border border-white/10 shadow-xl"
              >
                <Zap size={32} className="text-yellow-400" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 border-y border-white/5 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: t('landing.stats.analyses'), value: '1M+' },
              { label: t('landing.stats.accuracy'), value: '99.9%' },
              { label: t('landing.stats.clients'), value: '500+' },
              { label: t('landing.stats.speed'), value: '<2s' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section - Exemples d'analyses */}
      <DemoSection />

      {/* Features Grid */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('landing.featuresSection.title')}</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">{t('landing.featuresSection.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-3xl bg-surface border border-white/5 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className={f.color} size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/10" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="glass-panel p-12 rounded-3xl border border-white/10 bg-gradient-to-br from-surface to-surface/50">
            <h2 className="text-4xl font-bold mb-6">{t('landing.cta.title')}</h2>
            <p className="text-xl text-gray-400 mb-10">{t('landing.cta.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-10 py-4 shadow-xl shadow-primary/20">
                {t('landing.cta.primary')}
              </Link>
              <Link to="/contact" className="btn-outline text-lg px-10 py-4">
                {t('landing.cta.secondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 bg-surface/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div className="md:col-span-1">
              <div className="mb-4">
                <Logo size="2xl" />
              </div>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                {t('landing.footer.description')}
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-gray-400">JARVIS</p>
                <p>SAS au capital de 1 000 EUR</p>
                <p>SIREN: 928 499 166</p>
                <p>RCS Créteil</p>
                <p>64 Avenue Marinville</p>
                <p>94100 Saint-Maur-des-Fossés, France</p>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold mb-4 text-white">{t('landing.footer.product')}</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/pricing" className="text-gray-400 hover:text-primary transition-colors">{t('landing.footer.pricing')}</Link></li>
                <li><Link to="/dashboard" className="text-gray-400 hover:text-primary transition-colors">{t('landing.footer.features')}</Link></li>
                <li><Link to="/register" className="text-gray-400 hover:text-primary transition-colors">{t('landing.footer.getStarted')}</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4 text-white">{t('landing.footer.support')}</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="mailto:contact@faketect.com" className="text-gray-400 hover:text-primary transition-colors">Contact</a></li>
                <li><a href="mailto:dpo@faketect.com" className="text-gray-400 hover:text-primary transition-colors">DPO</a></li>
                <li><a href="mailto:security@faketect.com" className="text-gray-400 hover:text-primary transition-colors">{t('landing.footer.security')}</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4 text-white">{t('landing.footer.legal')}</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/legal/mentions" className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <FileText size={14} /> {t('landing.footer.legalNotice')}
                </Link></li>
                <li><Link to="/legal/privacy" className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Shield size={14} /> {t('landing.footer.privacy')}
                </Link></li>
                <li><Link to="/legal/cookies" className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Cookie size={14} /> {t('landing.footer.cookies')}
                </Link></li>
                <li><Link to="/legal/terms" className="text-gray-400 hover:text-primary transition-colors">{t('footer.links.terms')}</Link></li>
                <li><Link to="/legal/sales" className="text-gray-400 hover:text-primary transition-colors">{t('footer.links.sales')}</Link></li>
                <li>
                  <button
                    onClick={() => {
                      localStorage.removeItem('cookie_consent');
                      window.location.reload();
                    }}
                    className="text-gray-400 hover:text-primary transition-colors text-left flex items-center gap-2"
                  >
                    <Cookie size={14} /> {t('landing.footer.manageCookies')}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} JARVIS - {t('landing.footer.rights')}
              </p>
              <div className="flex items-center gap-6 text-xs text-gray-500">
                <span className="flex items-center gap-2">
                  <span className="text-green-400">🇫🇷</span> {t('landing.footer.gdpr')}
                </span>
                <span className="flex items-center gap-2">
                  <Lock size={12} /> {t('landing.footer.stripe')}
                </span>
                <a 
                  href="https://www.cnil.fr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  CNIL
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
}
