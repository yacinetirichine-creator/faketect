import { Link } from 'react-router-dom'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { Shield, Zap, Lock, Search, ArrowRight, CheckCircle, Globe, FileText, Image as ImageIcon, Scan, Cpu, Fingerprint, BarChart, Check, Crown, Package, Sparkles, Play, Users, Building2, Award, Star } from 'lucide-react'
import useTranslation from '../hooks/useTranslation'

// Composant Animation 3D Cube
function Cube3D() {
  const containerRef = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [30, -30]), { stiffness: 100, damping: 30 })
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-30, 30]), { stiffness: 100, damping: 30 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      mouseX.set(e.clientX - centerX)
      mouseY.set(e.clientY - centerY)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <div ref={containerRef} className="relative w-80 h-80 perspective-1000">
      <motion.div
        style={{ rotateX, rotateY }}
        className="w-full h-full relative transform-style-3d"
      >
        {/* Face avant */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/30 to-purple-500/30 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center transform translateZ-40">
          <div className="text-center">
            <Shield className="w-16 h-16 text-primary-400 mx-auto mb-4" />
            <div className="text-3xl font-bold text-white">99.8%</div>
            <div className="text-sm text-gray-300">Précision</div>
          </div>
        </div>
        
        {/* Effet de lumière */}
        <div className="absolute inset-0 bg-gradient-radial from-primary-500/20 via-transparent to-transparent rounded-2xl animate-pulse" />
        
        {/* Particules orbitales */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary-400 rounded-full"
              style={{
                top: '50%',
                left: '50%',
              }}
              animate={{
                x: [0, Math.cos(i * 45 * Math.PI / 180) * 150],
                y: [0, Math.sin(i * 45 * Math.PI / 180) * 150],
                opacity: [0.2, 0.8, 0.2],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// Composant Stats animées
function AnimatedCounter({ value, suffix = '', duration = 2 }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let start = 0
    const end = parseInt(value)
    const timer = setInterval(() => {
      start += Math.ceil(end / (duration * 60))
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [value, duration])
  
  return <span>{count.toLocaleString()}{suffix}</span>
}

export default function LandingPage() {
  const { t } = useTranslation();
  
  return (
    <div className="relative overflow-hidden">
      {/* Background Elements améliorés */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      {/* Hero Section avec 3D */}
      <section className="relative pt-20 pb-32 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Texte */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-sm text-gray-300 font-medium">{t('landing.newVersion', 'Nouvelle version 2.0 • Inscription gratuite')}</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight">
                {t('landing.hero.title1', 'Détectez les')} <br />
                <span className="text-gradient animate-gradient">{t('landing.hero.title2', 'fausses images IA')}</span>
                <br />
                <span className="text-gray-400 text-4xl md:text-5xl">en quelques secondes</span>
              </h1>
              
              <p className="text-xl text-gray-400 mb-12 max-w-xl leading-relaxed">
                {t('landing.hero.subtitle', 'FakeTect analyse vos images avec une précision de 99.8%. Inscrivez-vous gratuitement et obtenez 3 analyses par jour.')}
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 mb-12">
                <Link to="/auth?mode=signup" className="btn-primary px-8 py-4 text-lg flex items-center gap-2 group shadow-lg shadow-primary-500/30">
                  Créer un compte gratuit
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/auth" className="px-8 py-4 rounded-xl glass hover:bg-white/10 transition-all text-white font-semibold flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Voir la démo
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-8">
                <div className="flex -space-x-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 border-2 border-[#0f172a] flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <div className="text-sm text-gray-400">+2,500 utilisateurs satisfaits</div>
                </div>
              </div>
            </motion.div>

            {/* Animation 3D */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="hidden lg:flex justify-center items-center"
            >
              <Cube3D />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative z-10 border-y border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '99.8', suffix: '%', label: 'Précision de détection' },
              { value: '50000', suffix: '+', label: 'Images analysées' },
              { value: '2500', suffix: '+', label: 'Utilisateurs actifs' },
              { value: '0.5', suffix: 's', label: 'Temps moyen d\'analyse' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-primary-400 font-semibold text-sm tracking-wider uppercase mb-4 block">Fonctionnalités</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Une technologie de pointe</h2>
              <p className="text-gray-400 text-xl max-w-2xl mx-auto">Nos algorithmes IA analysent chaque pixel pour garantir l'authenticité de vos images.</p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: "Analyse Profonde",
                desc: "Inspection pixel par pixel et analyse des métadonnées EXIF pour détecter les moindres traces de manipulation IA.",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Zap,
                title: "Résultats Instantanés",
                desc: "Obtenez un verdict clair et détaillé en moins d'une seconde grâce à notre infrastructure haute performance.",
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: Shield,
                title: "Certification PDF",
                desc: "Générez des rapports certifiés avec signature cryptographique pour prouver l'authenticité de vos documents.",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: FileText,
                title: "Analyse de Documents",
                desc: "Extrayez et analysez automatiquement toutes les images des PDF, Word, PowerPoint et Excel.",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: ImageIcon,
                title: "Batch Processing",
                desc: "Analysez jusqu'à 20 images simultanément pour un gain de temps considérable.",
                color: "from-red-500 to-rose-500"
              },
              {
                icon: Globe,
                title: "API Entreprise",
                desc: "Intégrez FakeTect dans vos applications avec notre API REST simple et documentée.",
                color: "from-indigo-500 to-violet-500"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-8 rounded-2xl hover:bg-white/10 transition-all duration-300 group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} bg-opacity-20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-primary-400 font-semibold text-sm tracking-wider uppercase mb-4 block">Cas d'usage</span>
            <h2 className="text-4xl font-bold mb-4">Pour tous les professionnels</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Building2, title: 'Assurances', desc: 'Vérifiez les preuves de sinistres' },
              { icon: Users, title: 'RH & Recrutement', desc: 'Validez les documents candidats' },
              { icon: Award, title: 'Médias & Presse', desc: 'Authentifiez vos sources visuelles' },
              { icon: Shield, title: 'Juridique', desc: 'Certifiez vos preuves numériques' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-6 rounded-xl text-center hover:bg-white/10 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h4 className="font-bold mb-2">{item.title}</h4>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass p-12 rounded-3xl border border-white/10 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6">
                <Sparkles className="w-4 h-4 text-primary-400" />
                <span className="text-sm text-primary-300 font-semibold">INSCRIPTION GRATUITE</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Commencez gratuitement
              </h2>
              
              <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                Créez votre compte en 30 secondes et obtenez <span className="text-white font-semibold">3 analyses gratuites par jour</span>. Aucune carte bancaire requise.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Link
                  to="/auth?mode=signup"
                  className="px-10 py-5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-lg transition-all shadow-lg shadow-primary-500/30 inline-flex items-center gap-2"
                >
                  Créer mon compte gratuit
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/pricing"
                  className="px-8 py-4 rounded-xl glass hover:bg-white/10 text-white font-semibold transition-all"
                >
                  Voir les plans Pro
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-white font-semibold mb-1">3 analyses/jour</p>
                  <p className="text-sm text-gray-400">Gratuitement, sans engagement</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center mb-3">
                    <Zap className="w-6 h-6 text-primary-400" />
                  </div>
                  <p className="text-white font-semibold mb-1">Historique complet</p>
                  <p className="text-sm text-gray-400">Retrouvez toutes vos analyses</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
                    <Crown className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="text-white font-semibold mb-1">Rapports PDF</p>
                  <p className="text-sm text-gray-400">Certificats téléchargeables</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-8">Prêt à vérifier la vérité ?</h2>
            <p className="text-xl text-gray-400 mb-10">
              Rejoignez des milliers de professionnels qui font confiance à FakeTect pour sécuriser leurs contenus.
            </p>
            <Link to="/auth?mode=signup" className="btn-primary px-10 py-5 text-xl inline-flex items-center gap-3 shadow-xl shadow-primary-500/30 hover:scale-105 transition-transform">
              Créer mon compte gratuit
              <ArrowRight className="w-6 h-6" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
