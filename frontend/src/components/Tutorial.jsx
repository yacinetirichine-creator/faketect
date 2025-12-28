import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Eye, Download, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

/**
 * Tutoriel interactif premier usage
 * S'affiche automatiquement pour les nouveaux utilisateurs
 */
export default function Tutorial({ onClose, autoShow = true }) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Afficher le tutoriel si l'utilisateur est nouveau
    const hasSeenTutorial = localStorage.getItem('faketect_tutorial_seen');
    if (autoShow && !hasSeenTutorial) {
      setIsVisible(true);
    }
  }, [autoShow]);

  const steps = [
    {
      icon: Sparkles,
      title: t('tutorial.welcome.title', 'Bienvenue sur FakeTect !'),
      description: t('tutorial.welcome.desc', 'Détectez en quelques secondes si une image ou vidéo a été générée par IA. Voici comment ça marche.'),
      image: '🎉',
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      icon: Upload,
      title: t('tutorial.upload.title', 'Étape 1 : Upload'),
      description: t('tutorial.upload.desc', 'Glissez-déposez ou cliquez pour uploader votre fichier. Images (JPG, PNG, WEBP) ou vidéos (MP4, MOV) jusqu\'à 100 MB.'),
      image: '📤',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      tip: t('tutorial.upload.tip', 'Astuce : Les vidéos longues sont analysées sur les 60 premières secondes pour optimiser les coûts.')
    },
    {
      icon: Eye,
      title: t('tutorial.analyze.title', 'Étape 2 : Analyse'),
      description: t('tutorial.analyze.desc', 'Notre IA analyse votre fichier en quelques secondes. Nous utilisons plusieurs modèles pour une précision maximale.'),
      image: '🔍',
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      tip: t('tutorial.analyze.tip', 'Plusieurs sources : Sightengine, Illuminarty, et OpenAI pour un résultat fiable.')
    },
    {
      icon: CheckCircle2,
      title: t('tutorial.result.title', 'Étape 3 : Résultat'),
      description: t('tutorial.result.desc', 'Obtenez un score de confiance et un verdict clair : RÉEL, IA, ou INCERTAIN. Téléchargez un certificat PDF pour prouver l\'authenticité.'),
      image: '✅',
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      tip: t('tutorial.result.tip', 'Le certificat PDF inclut un QR code et est idéal pour les documents officiels.')
    },
    {
      icon: Download,
      title: t('tutorial.ready.title', 'Vous êtes prêt !'),
      description: t('tutorial.ready.desc', 'Plan GRATUIT : 10 analyses sur 30 jours. Passez à un plan payant pour plus d\'analyses et des fonctionnalités avancées.'),
      image: '🚀',
      color: 'text-orange-400',
      bg: 'bg-orange-400/10'
    }
  ];

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('faketect_tutorial_seen', 'true');
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="card max-w-2xl w-full relative overflow-hidden"
        >
          {/* Header */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-10"
          >
            <X size={20} className="text-white/60" />
          </button>

          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="pt-12 pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Icon/Emoji */}
                <div className={`w-24 h-24 mx-auto rounded-full ${currentStepData.bg} flex items-center justify-center mb-6`}>
                  <span className="text-6xl">{currentStepData.image}</span>
                </div>

                {/* Title */}
                <h2 className={`text-3xl font-bold ${currentStepData.color} mb-4`}>
                  {currentStepData.title}
                </h2>

                {/* Description */}
                <p className="text-lg text-white/80 mb-6 max-w-xl mx-auto leading-relaxed">
                  {currentStepData.description}
                </p>

                {/* Tip */}
                {currentStepData.tip && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                    <Sparkles size={16} />
                    <span>{currentStepData.tip}</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <div className="flex gap-2">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentStep 
                      ? 'bg-primary w-8' 
                      : idx < currentStep 
                        ? 'bg-primary/50' 
                        : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  {t('tutorial.previous', 'Précédent')}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <CheckCircle2 size={18} />
                    {t('tutorial.start', 'Commencer')}
                  </>
                ) : (
                  <>
                    {t('tutorial.next', 'Suivant')}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Skip option */}
          <div className="text-center mt-4">
            <button
              onClick={handleClose}
              className="text-sm text-white/40 hover:text-white/60 transition-colors"
            >
              {t('tutorial.skip', 'Passer le tutoriel')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
