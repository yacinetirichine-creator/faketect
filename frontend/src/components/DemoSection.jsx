import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Image, Video, CheckCircle2, XCircle, HelpCircle, Eye, Download } from 'lucide-react';

/**
 * Section démo publique avec exemples d'analyses
 * Affichée sur la landing page pour montrer le produit
 */
export default function DemoSection() {
  const { t } = useTranslation();
  const [selectedDemo, setSelectedDemo] = useState(null);

  const demoExamples = [
    {
      id: 'photo-real',
      type: 'image',
      title: t('demo.example1.title', 'Photo réelle'),
      thumbnail: '📷',
      result: {
        verdict: 'real',
        aiScore: 12,
        confidence: 92,
        label: t('demo.example1.result', 'Image RÉELLE'),
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        icon: CheckCircle2
      },
      description: t('demo.example1.desc', 'Photo prise avec un smartphone, aucun signe de génération IA détecté.')
    },
    {
      id: 'ai-portrait',
      type: 'image',
      title: t('demo.example2.title', 'Portrait IA'),
      thumbnail: '🤖',
      result: {
        verdict: 'ai',
        aiScore: 94,
        confidence: 88,
        label: t('demo.example2.result', 'Généré par IA'),
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        icon: XCircle
      },
      description: t('demo.example2.desc', 'Portrait créé avec Midjourney. Artefacts IA détectés dans les yeux et les cheveux.')
    },
    {
      id: 'video-real',
      type: 'video',
      title: t('demo.example3.title', 'Vidéo authentique'),
      thumbnail: '🎥',
      result: {
        verdict: 'real',
        aiScore: 8,
        confidence: 95,
        label: t('demo.example3.result', 'Vidéo RÉELLE'),
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        icon: CheckCircle2
      },
      description: t('demo.example3.desc', 'Vidéo capturée avec une caméra. Mouvement naturel et cohérence temporelle.')
    },
    {
      id: 'ai-deepfake',
      type: 'video',
      title: t('demo.example4.title', 'Deepfake'),
      thumbnail: '👤',
      result: {
        verdict: 'ai',
        aiScore: 89,
        confidence: 81,
        label: t('demo.example4.result', 'Deepfake détecté'),
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        icon: XCircle
      },
      description: t('demo.example4.desc', 'Vidéo générée par IA. Incohérences dans les expressions faciales détectées.')
    },
    {
      id: 'mixed-content',
      type: 'image',
      title: t('demo.example5.title', 'Contenu mixte'),
      thumbnail: '🎨',
      result: {
        verdict: 'uncertain',
        aiScore: 52,
        confidence: 64,
        label: t('demo.example5.result', 'INCERTAIN'),
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        icon: HelpCircle
      },
      description: t('demo.example5.desc', 'Photo retouchée avec IA. Mélange de contenu réel et généré.')
    },
    {
      id: 'ai-landscape',
      type: 'image',
      title: t('demo.example6.title', 'Paysage IA'),
      thumbnail: '🏔️',
      result: {
        verdict: 'ai',
        aiScore: 97,
        confidence: 93,
        label: t('demo.example6.result', 'Généré par IA'),
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        icon: XCircle
      },
      description: t('demo.example6.desc', 'Paysage créé avec DALL-E. Structures impossibles et textures artificielles.')
    }
  ];

  const ResultIcon = selectedDemo?.result.icon || Eye;

  return (
    <section className="py-32 relative">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-4">
              {t('demo.badge', 'Exemples en direct')}
            </span>
            <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              {t('demo.title', 'Voyez FakeTect en action')}
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              {t('demo.subtitle', 'Découvrez comment notre IA détecte les contenus générés. Cliquez sur un exemple pour voir le résultat détaillé.')}
            </p>
          </motion.div>
        </div>

        {/* Demo Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {demoExamples.map((example, idx) => (
            <motion.button
              key={example.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedDemo(example)}
              className={`card text-left transition-all border-2 ${
                selectedDemo?.id === example.id 
                  ? `${example.result.border} ${example.result.bg}` 
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              {/* Thumbnail */}
              <div className="w-full h-48 rounded-xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center mb-4 overflow-hidden">
                <span className="text-8xl">{example.thumbnail}</span>
              </div>

              {/* Type badge */}
              <div className="flex items-center gap-2 mb-3">
                {example.type === 'image' ? (
                  <Image size={16} className="text-blue-400" />
                ) : (
                  <Video size={16} className="text-purple-400" />
                )}
                <span className="text-xs text-white/40 uppercase">
                  {example.type === 'image' ? t('demo.image', 'Image') : t('demo.video', 'Vidéo')}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-white mb-2">
                {example.title}
              </h3>

              {/* Result preview */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${example.result.bg} ${example.result.border} border`}>
                <example.result.icon size={14} className={example.result.color} />
                <span className={`text-xs font-semibold ${example.result.color}`}>
                  {example.result.label}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Detailed Result */}
        {selectedDemo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`card border-2 ${selectedDemo.result.border} ${selectedDemo.result.bg}`}
          >
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Preview */}
              <div>
                <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center mb-4">
                  <span className="text-9xl">{selectedDemo.thumbnail}</span>
                </div>
                <p className="text-white/60 text-sm">
                  {selectedDemo.description}
                </p>
              </div>

              {/* Right: Analysis */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-16 h-16 rounded-full ${selectedDemo.result.bg} border-2 ${selectedDemo.result.border} flex items-center justify-center`}>
                    <ResultIcon size={32} className={selectedDemo.result.color} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {selectedDemo.result.label}
                    </h3>
                    <p className="text-sm text-white/40">
                      {selectedDemo.title}
                    </p>
                  </div>
                </div>

                {/* Scores */}
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/60">{t('demo.score', 'Score IA')}</span>
                      <span className="text-lg font-bold text-white">{selectedDemo.result.aiScore}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${selectedDemo.result.verdict === 'ai' ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${selectedDemo.result.aiScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/60">{t('demo.confidence', 'Confiance')}</span>
                      <span className="text-lg font-bold text-white">{selectedDemo.result.confidence}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${selectedDemo.result.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all flex items-center justify-center gap-2">
                    <Eye size={18} />
                    {t('demo.tryNow', 'Essayer maintenant')}
                  </button>
                  <button className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                    <Download size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-white/60 mb-4">
            {t('demo.cta', 'Prêt à tester avec vos propres fichiers ?')}
          </p>
          <a 
            href="/register" 
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-bold text-lg hover:shadow-2xl hover:shadow-primary/50 transition-all"
          >
            {t('demo.getStarted', 'Commencer gratuitement')}
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              →
            </motion.span>
          </a>
        </div>
      </div>
    </section>
  );
}
