/**
 * Interpréteur pédagogique des résultats d'analyse
 * Transforme les données techniques en langage grand public
 */

/**
 * Détermine le niveau de confiance en langage simple
 * @param {number} aiScore - Score IA (0-100)
 * @returns {object} - { level: 'real'|'uncertain'|'fake', color, icon, realPercentage }
 */
export function interpretResult(aiScore) {
  const score = Number(aiScore) || 0;
  const realScore = 100 - score; // Inverser pour avoir le % de "vraie photo"
  
  if (score <= 30) {
    // 0-30% IA = Vraie photo (70-100% réel)
    return {
      level: 'real',
      color: 'green',
      icon: '✓',
      emoji: '✅',
      realPercentage: realScore,
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      barColor: 'bg-green-500'
    };
  } else if (score <= 70) {
    // 30-70% IA = Douteux
    return {
      level: 'uncertain',
      color: 'orange',
      icon: '⚠',
      emoji: '⚠️',
      realPercentage: realScore,
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-400',
      barColor: 'bg-orange-500'
    };
  } else {
    // 70-100% IA = Faux/IA
    return {
      level: 'fake',
      color: 'red',
      icon: '✗',
      emoji: '❌',
      realPercentage: realScore,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      barColor: 'bg-red-500'
    };
  }
}

/**
 * Génère un message pédagogique selon le résultat
 * @param {string} level - 'real', 'uncertain', 'fake'
 * @param {string} lang - Code langue
 * @returns {object} - { title, explanation }
 */
export function getSimpleMessage(level, lang = 'fr') {
  const messages = {
    fr: {
      real: {
        title: 'VRAIE PHOTO',
        explanation: 'Cette image semble authentique. Nos détecteurs n\'ont pas trouvé de signes évidents de manipulation par intelligence artificielle.'
      },
      uncertain: {
        title: 'RÉSULTAT INCERTAIN',
        explanation: 'Difficile à dire. L\'image pourrait être retouchée ou générée par IA. Soyez prudent avant de lui faire confiance.'
      },
      fake: {
        title: 'GÉNÉRÉE PAR IA',
        explanation: 'Cette image a très probablement été créée par une intelligence artificielle. Elle n\'est pas une vraie photo.'
      }
    },
    en: {
      real: {
        title: 'REAL PHOTO',
        explanation: 'This image appears authentic. Our detectors found no obvious signs of AI manipulation.'
      },
      uncertain: {
        title: 'UNCERTAIN RESULT',
        explanation: 'Hard to tell. The image might be edited or AI-generated. Be careful before trusting it.'
      },
      fake: {
        title: 'AI GENERATED',
        explanation: 'This image was most likely created by artificial intelligence. It\'s not a real photo.'
      }
    },
    es: {
      real: {
        title: 'FOTO REAL',
        explanation: 'Esta imagen parece auténtica. Nuestros detectores no encontraron signos evidentes de manipulación por IA.'
      },
      uncertain: {
        title: 'RESULTADO INCIERTO',
        explanation: 'Difícil de decir. La imagen podría estar editada o generada por IA. Ten cuidado antes de confiar en ella.'
      },
      fake: {
        title: 'GENERADA POR IA',
        explanation: 'Esta imagen fue muy probablemente creada por inteligencia artificial. No es una foto real.'
      }
    },
    de: {
      real: {
        title: 'ECHTES FOTO',
        explanation: 'Dieses Bild scheint authentisch zu sein. Unsere Detektoren haben keine offensichtlichen Anzeichen von KI-Manipulation gefunden.'
      },
      uncertain: {
        title: 'UNSICHERES ERGEBNIS',
        explanation: 'Schwer zu sagen. Das Bild könnte bearbeitet oder von KI generiert sein. Seien Sie vorsichtig, bevor Sie ihm vertrauen.'
      },
      fake: {
        title: 'KI GENERIERT',
        explanation: 'Dieses Bild wurde höchstwahrscheinlich von künstlicher Intelligenz erstellt. Es ist kein echtes Foto.'
      }
    },
    pt: {
      real: {
        title: 'FOTO REAL',
        explanation: 'Esta imagem parece autêntica. Nossos detectores não encontraram sinais óbvios de manipulação por IA.'
      },
      uncertain: {
        title: 'RESULTADO INCERTO',
        explanation: 'Difícil dizer. A imagem pode estar editada ou gerada por IA. Tenha cuidado antes de confiar nela.'
      },
      fake: {
        title: 'GERADA POR IA',
        explanation: 'Esta imagem foi muito provavelmente criada por inteligência artificial. Não é uma foto real.'
      }
    },
    it: {
      real: {
        title: 'FOTO VERA',
        explanation: 'Questa immagine sembra autentica. I nostri rilevatori non hanno trovato segni evidenti di manipolazione da IA.'
      },
      uncertain: {
        title: 'RISULTATO INCERTO',
        explanation: 'Difficile da dire. L\'immagine potrebbe essere modificata o generata da IA. Sii prudente prima di fidarti.'
      },
      fake: {
        title: 'GENERATA DA IA',
        explanation: 'Questa immagine è stata molto probabilmente creata da intelligenza artificiale. Non è una foto vera.'
      }
    }
  };

  return messages[lang]?.[level] || messages['fr'][level];
}

/**
 * Génère un message rassurant pour la confiance
 * @param {number} confidence - Niveau de confiance (0-100)
 * @param {string} lang - Code langue
 * @returns {string}
 */
export function getConfidenceMessage(confidence, lang = 'fr') {
  const conf = Number(confidence) || 0;
  
  const messages = {
    fr: {
      high: 'Nous sommes très sûrs de ce résultat.',
      medium: 'Nous sommes assez confiants dans ce résultat.',
      low: 'Ce résultat est une estimation, prenez-le avec prudence.'
    },
    en: {
      high: 'We are very confident in this result.',
      medium: 'We are quite confident in this result.',
      low: 'This result is an estimate, take it with caution.'
    },
    es: {
      high: 'Estamos muy seguros de este resultado.',
      medium: 'Estamos bastante seguros de este resultado.',
      low: 'Este resultado es una estimación, tómalo con precaución.'
    },
    de: {
      high: 'Wir sind sehr sicher über dieses Ergebnis.',
      medium: 'Wir sind ziemlich sicher über dieses Ergebnis.',
      low: 'Dieses Ergebnis ist eine Schätzung, seien Sie vorsichtig.'
    },
    pt: {
      high: 'Estamos muito confiantes neste resultado.',
      medium: 'Estamos bastante confiantes neste resultado.',
      low: 'Este resultado é uma estimativa, tome com cuidado.'
    },
    it: {
      high: 'Siamo molto sicuri di questo risultato.',
      medium: 'Siamo abbastanza sicuri di questo risultato.',
      low: 'Questo risultato è una stima, prendilo con cautela.'
    }
  };

  const level = conf >= 70 ? 'high' : conf >= 40 ? 'medium' : 'low';
  return messages[lang]?.[level] || messages['fr'][level];
}
