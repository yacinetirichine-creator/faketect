function getPurposeCopy(purpose) {
  const key = String(purpose || '').trim().toLowerCase();

  const COMMON = {
    methodology: [
      "Analyse multi-moteurs (providers externes) + indices EXIF.",
      "Résultat probabiliste: à interpréter avec prudence.",
      "Conserver l'original du fichier et son contexte de collecte."
    ],
    limitations: [
      "Faux positifs et faux négatifs possibles.",
      "Les performances varient selon compression, recadrage, captures d'écran, re-encodage.",
      "Un score élevé n'est pas une preuve absolue; un score faible n'exclut pas une manipulation."
    ]
  };

  const byPurpose = {
    media_presse: {
      label: 'Médias & presse',
      context: [
        "Vérifier rapidement l'authenticité avant publication.",
        "Prioriser les contenus viraux, images de conflit/catastrophe, personnalités publiques.",
        "Objectif: réduire le risque de publication d'une image trompeuse."
      ],
      recommendations: [
        "Recouper avec la source primaire (agence, auteur, fichier original).",
        "Vérifier date/lieu via OSINT (reverse image search, météo, points de repère).",
        "Documenter la chaîne de transmission (qui a envoyé quoi, quand)."
      ]
    },
    assurances: {
      label: 'Assurances',
      context: [
        "Aide à la détection de fraude sur sinistres (photos, constats, factures).",
        "Objectif: déclencher une revue humaine ou une expertise quand le risque est élevé."
      ],
      recommendations: [
        "Demander l'original (non compressé) + photos supplémentaires et angles différents.",
        "Comparer EXIF/horodatage avec la chronologie déclarée.",
        "En cas de doute: expertise terrain ou contrôle documentaire renforcé."
      ]
    },
    recrutement_rh: {
      label: 'Recrutement / RH',
      context: [
        "Aide au contrôle de documents et pièces (CV, diplômes, lettres, identité).",
        "Objectif: réduire le risque d'identité synthétique ou de documents altérés."
      ],
      recommendations: [
        "Demander une source vérifiable (école/organisme, références).",
        "Contrôler cohérence: dates, logos, signatures, police, mise en page.",
        "Privilégier la vérification à la source (attestation, portail diplômés)."
      ]
    },
    banques_fintech: {
      label: 'Banques / FinTech (KYC)',
      context: [
        "Aide à la conformité KYC/LCB-FT (pièce d'identité, justificatifs, bulletins).",
        "Objectif: signaler des éléments à risque pour revue renforcée."
      ],
      recommendations: [
        "Combiner avec contrôles KYC (liveness selfie, OCR, MRZ, cohérence doc).",
        "Exiger l'original + vérifier intégrité (hash) et canaux d'upload.",
        "En cas de score élevé: escalade vers contrôle manuel / service fraude."
      ]
    },
    juridique_investigations: {
      label: 'Juridique / investigations',
      context: [
        "Aide à qualifier des preuves numériques (photos, captures, documents).",
        "Objectif: produire un rapport traçable et vérifiable, utile à la préparation du dossier."
      ],
      recommendations: [
        "Préserver l'original et consigner la chaîne de conservation (collecte, stockage, accès).",
        "Si enjeu contentieux: envisager constat (commissaire de justice) et expertise.",
        "Conserver les hashes (fichier original, rapport) et l'URL de vérification."
      ]
    }
  };

  const entry = byPurpose[key] || {
    label: 'Usage général',
    context: [
      "Analyse d'authenticité de contenus (images/documents).",
      "Objectif: fournir un indicateur de risque et une traçabilité du résultat."
    ],
    recommendations: [
      "Recouper avec des sources indépendantes.",
      "Conserver l'original et les informations de contexte.",
      "En cas d'enjeu élevé: revue humaine/experte."
    ]
  };

  return {
    key,
    label: entry.label,
    context: entry.context,
    methodology: COMMON.methodology,
    recommendations: entry.recommendations,
    limitations: COMMON.limitations
  };
}

module.exports = { getPurposeCopy };
