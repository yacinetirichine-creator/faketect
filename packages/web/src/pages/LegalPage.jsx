import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LegalPage({ type }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const legalDocs = {
    'mentions-legales': {
      title: 'Mentions Légales',
      file: 'MENTIONS-LEGALES.md'
    },
    'confidentialite': {
      title: 'Politique de Confidentialité',
      file: 'POLITIQUE-CONFIDENTIALITE.md'
    },
    'cgu': {
      title: 'Conditions Générales d\'Utilisation',
      file: 'CGU.md'
    },
    'cgv': {
      title: 'Conditions Générales de Vente',
      file: 'CGV.md'
    },
    'cookies': {
      title: 'Politique de Cookies',
      file: 'POLITIQUE-COOKIES.md'
    }
  };

  const doc = legalDocs[type] || legalDocs['mentions-legales'];

  useEffect(() => {
    // En production, charger depuis le serveur ou utiliser des composants statiques
    setLoading(false);
  }, [type]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-primary-950">
      {/* Header */}
      <header className="border-b border-primary-500/20 bg-dark-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">Fake<span className="text-primary-500">Tect</span></span>
            </Link>
            <Link to="/" className="text-gray-300 hover:text-white transition-colors">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="glass-card p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
            {doc.title}
          </h1>

          <div className="prose prose-invert prose-primary max-w-none">
            <LegalContent type={type} />
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Autres documents juridiques</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(legalDocs).map(([key, value]) => (
              key !== type && (
                <Link
                  key={key}
                  to={`/legal/${key}`}
                  className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
                >
                  → {value.title}
                </Link>
              )
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 glass-card p-6 bg-primary-500/10">
          <h2 className="text-lg font-semibold text-white mb-3">Questions juridiques ?</h2>
          <p className="text-gray-300 text-sm mb-4">
            Pour toute question concernant nos documents juridiques ou l'exercice de vos droits :
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-gray-300">
              <span className="font-semibold text-white">Email juridique :</span>{' '}
              <a href="mailto:legal@faketect.com" className="text-primary-400 hover:underline">
                legal@faketect.com
              </a>
            </p>
            <p className="text-gray-300">
              <span className="font-semibold text-white">DPO (Données personnelles) :</span>{' '}
              <a href="mailto:dpo@faketect.com" className="text-primary-400 hover:underline">
                dpo@faketect.com
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <LegalFooter />
    </div>
  );
}

function LegalContent({ type }) {
  // Contenu simplifié pour chaque page
  // En production, utiliser un parser Markdown ou des composants complets
  
  const content = {
    'mentions-legales': <MentionsLegales />,
    'confidentialite': <PolitiqueConfidentialite />,
    'cgu': <CGU />,
    'cgv': <CGV />,
    'cookies': <PolitiqueCookies />
  };

  return content[type] || content['mentions-legales'];
}

function MentionsLegales() {
  return (
    <>
      <h2>1. Informations légales</h2>
      <h3>Éditeur du site</h3>
      <p>
        <strong>Nom de l'entreprise :</strong> JARVIS<br />
        <strong>Forme juridique :</strong> SAS (Société par Actions Simplifiée)<br />
        <strong>Capital social :</strong> 10 000€<br />
        <strong>Siège social :</strong> 123 Avenue des Champs-Élysées, 75008 Paris, France<br />
        <strong>SIRET :</strong> 123 456 789 00012<br />
        <strong>RCS :</strong> Paris B 123 456 789<br />
        <strong>TVA intracommunautaire :</strong> FR12345678900<br />
        <strong>Email :</strong> contact@faketect.com<br />
        <strong>Téléphone :</strong> +33 1 XX XX XX XX<br />
        <strong>Directeur de la publication :</strong> Yacine Tirichine, Président
      </p>

      <h3>Hébergement</h3>
      <p>
        <strong>Hébergeur API :</strong> Render (https://render.com)<br />
        <strong>Hébergeur Front-end :</strong> Vercel Inc.
      </p>

      <h2>2. Propriété intellectuelle</h2>
      <p>
        L'ensemble du contenu de ce site (structure, textes, logos, images, code source) est la propriété
        exclusive de JARVIS. Toute reproduction est interdite sans autorisation écrite préalable.
      </p>

      <h2>3. Responsabilité</h2>
      <p>
        Les résultats d'analyse fournis par Faketect sont donnés à titre informatif et ne constituent pas
        une preuve légale. JARVIS ne peut être tenu responsable des décisions prises sur la base des
        résultats d'analyse.
      </p>

      <h2>4. Données personnelles</h2>
      <p>
        Le traitement des données personnelles est conforme au RGPD. Pour toute question :
        <a href="mailto:dpo@faketect.com" className="text-primary-400 hover:underline ml-1">
          dpo@faketect.com
        </a>
      </p>

      <h2>5. Droit applicable</h2>
      <p>
        Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux
        compétents français seront saisis.
      </p>

      <h2>6. Protection des données personnelles</h2>
      <p>
        <strong>DPO (Délégué à la Protection des Données) :</strong><br />
        Yacine Tirichine<br />
        Email : <a href="mailto:dpo@faketect.com" className="text-primary-400 hover:underline">dpo@faketect.com</a><br />
        Courrier : JARVIS - DPO, 123 Avenue des Champs-Élysées, 75008 Paris
      </p>

      <h2>7. Conformité IA Act (Règlement UE 2024/1689)</h2>
      <p>
        FakeTect utilise des systèmes d'IA pour la détection de contenus générés. Conformément au
        Règlement européen sur l'IA :
      </p>
      <ul>
        <li>Système classé "risque limité" - Obligation de transparence respectée</li>
        <li>Les utilisateurs sont informés qu'ils interagissent avec un système d'IA</li>
        <li>Documentation technique disponible sur demande</li>
        <li>Mécanismes de contrôle humain en place</li>
      </ul>

      <p className="text-sm text-gray-400 mt-8">
        <strong>Dernière mise à jour :</strong> 20 décembre 2025 | <strong>Version :</strong> 2.0
      </p>
    </>
  );
}

function PolitiqueConfidentialite() {
  return (
    <>
      <h2>1. Introduction</h2>
      <p>
        JARVIS s'engage à protéger vos données personnelles conformément au :
      </p>
      <ul>
        <li><strong>RGPD</strong> (Règlement UE 2016/679)</li>
        <li><strong>Loi Informatique et Libertés</strong> (modifiée 2018/2019)</li>
        <li><strong>IA Act</strong> (Règlement UE 2024/1689)</li>
        <li><strong>Digital Services Act</strong> (DSA - Règlement UE 2022/2065)</li>
      </ul>
      <p className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 my-4">
        <strong className="text-primary-400">⚙️ Utilisation de l'IA</strong><br />
        FakeTect utilise des algorithmes d'intelligence artificielle pour analyser vos images.
        Ces systèmes sont transparents, auditables et respectent les normes européennes.
      </p>

      <h2>2. Données collectées</h2>
      <h3>Données d'inscription</h3>
      <ul>
        <li>Adresse email</li>
        <li>Mot de passe (hashé)</li>
        <li>Date de création du compte</li>
      </ul>

      <h3>Données d'utilisation</h3>
      <ul>
        <li>Images et documents analysés (temporaires)</li>
        <li>Historique des analyses</li>
        <li>Résultats d'analyse</li>
        <li>Métadonnées techniques</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <ul>
        <li>Fourniture du service d'analyse</li>
        <li>Gestion de votre compte</li>
        <li>Amélioration de la qualité du service</li>
        <li>Sécurité et prévention des abus</li>
      </ul>

      <h2>4. Durée de conservation</h2>
      <ul>
        <li><strong>Compte actif :</strong> Durée de la relation + 3 ans</li>
        <li><strong>Historique analyses :</strong> 12 mois maximum</li>
        <li><strong>Images :</strong> Suppression immédiate après analyse (max 24h)</li>
        <li><strong>Logs :</strong> 12 mois</li>
      </ul>

      <h2>5. Sécurité des données</h2>
      <ul>
        <li>Chiffrement des communications (HTTPS/TLS)</li>
        <li>Chiffrement des mots de passe (bcrypt)</li>
        <li>Authentification sécurisée (JWT)</li>
        <li>Sauvegardes régulières chiffrées</li>
      </ul>

      <h2>6. Vos droits (RGPD)</h2>
      <p>Vous disposez des droits suivants :</p>
      <ul>
        <li><strong>Droit d'accès</strong> (Article 15) - Accéder à vos données</li>
        <li><strong>Droit de rectification</strong> (Article 16) - Corriger vos données</li>
        <li><strong>Droit à l'effacement</strong> (Article 17) - Supprimer vos données</li>
        <li><strong>Droit à la limitation</strong> (Article 18) - Limiter le traitement</li>
        <li><strong>Droit à la portabilité</strong> (Article 20) - Récupérer vos données</li>
        <li><strong>Droit d'opposition</strong> (Article 21) - S'opposer au traitement</li>
      </ul>

      <p className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 my-6">
        <strong className="text-primary-400">Exercer vos droits :</strong><br />
        Email : <a href="mailto:dpo@faketect.com" className="text-primary-400 hover:underline">dpo@faketect.com</a><br />
        Délai de réponse : maximum 1 mois
      </p>

      <h2>7. Transferts de données</h2>
      <p>Nous utilisons des sous-traitants certifiés :</p>
      <ul>
        <li><strong>Supabase</strong> - Authentification et base de données (USA, clauses types)</li>
        <li><strong>Render</strong> - Hébergement API (USA, clauses types)</li>
        <li><strong>Vercel</strong> - Hébergement Front-end (USA, clauses types)</li>
        <li><strong>Sightengine</strong> - Analyse d'images (USA/EU, accord DPA)</li>
        <li><strong>Illuminarty</strong> - Détection IA (USA/EU, accord DPA)</li>
      </ul>

      <h2>8. Cookies</h2>
      <p>
        Nous utilisons des cookies essentiels (authentification) et analytiques (avec consentement).
        Consultez notre <Link to="/legal/cookies" className="text-primary-400 hover:underline">Politique de Cookies</Link>.
      </p>

      <h2>9. IA et Prise de Décision Automatisée</h2>
      <p>
        Nos algorithmes d'IA détectent automatiquement les contenus générés. Vous avez le droit de :
      </p>
      <ul>
        <li>Contester une décision automatisée (Article 22 RGPD)</li>
        <li>Obtenir une intervention humaine</li>
        <li>Exprimer votre point de vue</li>
      </ul>
      <p>
        Email révision manuelle : <a href="mailto:review@faketect.com" className="text-primary-400 hover:underline">review@faketect.com</a>
      </p>

      <h2>10. Réclamation</h2>
      <p>
        Vous pouvez déposer une réclamation auprès de la CNIL :<br />
        <strong>CNIL</strong> - 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07<br />
        Tél : 01 53 73 22 22<br />
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
          www.cnil.fr
        </a>
      </p>

      <h2>11. Registre des Traitements</h2>
      <p>
        Conformément à l'article 30 du RGPD, nous tenons un registre des activités de traitement.
        Disponible sur demande auprès du DPO.
      </p>

      <p className="text-sm text-gray-400 mt-8">
        <strong>Dernière mise à jour :</strong> 20 décembre 2025 | <strong>Version :</strong> 2.1
      </p>
    </>
  );
}

function CGU() {
  return (
    <>
      <h2>Préambule</h2>
      <p>
        Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme
        Faketect exploitée par JARVIS.
      </p>

      <h2>Article 1 - Définitions</h2>
      <ul>
        <li><strong>Service :</strong> Plateforme Faketect de détection de contenus IA</li>
        <li><strong>Utilisateur :</strong> Toute personne utilisant le Service</li>
        <li><strong>Contenu :</strong> Images, documents soumis pour analyse</li>
        <li><strong>Certificat :</strong> Document attestant du résultat d'analyse</li>
      </ul>

      <h2>Article 2 - Accès au Service</h2>
      <p>Le Service est accessible :</p>
      <ul>
        <li>24/7 (sauf interruption programmée)</li>
        <li>Via le site web ou l'extension navigateur</li>
        <li>Avec ou sans compte (accès limité sans compte)</li>
      </ul>

      <h2>Article 3 - Fonctionnalités</h2>
      <ul>
        <li>Analyse d'images pour détecter les contenus générés par IA</li>
        <li>Analyse de documents PDF</li>
        <li>Vérification des métadonnées EXIF</li>
        <li>Génération de certificats d'authenticité</li>
        <li>Historique des analyses (compte requis)</li>
      </ul>

      <h2>Article 4 - Quotas et Limitations</h2>
      <h3>Utilisateurs invités (sans compte)</h3>
      <ul>
        <li>3 analyses/jour maximum</li>
        <li>Pas d'historique conservé</li>
        <li>Pas de certificats</li>
      </ul>

      <h3>Utilisateurs inscrits (gratuit)</h3>
      <ul>
        <li>10 analyses/jour maximum</li>
        <li>Historique 30 jours</li>
        <li>Certificats basiques</li>
      </ul>

      <h3>Abonnement Starter (9,99€/mois)</h3>
      <ul>
        <li>100 analyses/jour</li>
        <li>Historique illimité</li>
        <li>Certificats pro + signature</li>
        <li>Support email</li>
      </ul>

      <h3>Abonnement Professional (29,99€/mois)</h3>
      <ul>
        <li>500 analyses/jour</li>
        <li>API access</li>
        <li>Support prioritaire 24/7</li>
        <li>Certificats personnalisés</li>
      </ul>

      <h3>Limitations techniques</h3>
      <ul>
        <li>Taille max : 10 MB</li>
        <li>Formats : JPG, PNG, WebP, PDF</li>
      </ul>

      <h2>Article 5 - Obligations de l'Utilisateur</h2>
      <p>L'Utilisateur s'engage à :</p>
      <ul>
        <li>Utiliser le Service conformément à sa destination</li>
        <li>Respecter les lois en vigueur</li>
        <li>Ne pas porter atteinte aux droits de tiers</li>
        <li>Ne pas contourner les limitations techniques</li>
      </ul>

      <h3>Interdictions</h3>
      <ul>
        <li>Utilisation de bots ou scripts automatisés</li>
        <li>Tentative d'accès non autorisé</li>
        <li>Soumission de contenus illégaux</li>
        <li>Revente du Service sans autorisation</li>
      </ul>

      <h2>Article 6 - Propriété Intellectuelle</h2>
      <p>
        Le Service et tous ses éléments sont la propriété exclusive de JARVIS. L'Utilisateur conserve
        les droits sur les contenus qu'il soumet.
      </p>

      <h2>Article 7 - Résultats d'Analyse et IA</h2>
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 my-6">
        <p className="font-semibold text-yellow-400 mb-2">⚠️ Avertissement important</p>
        <p className="text-gray-300">
          Les résultats sont générés par des <strong>systèmes d'intelligence artificielle</strong> et
          sont de nature <strong>purement informative</strong>. Ils ne constituent pas une preuve légale
          absolue. La détection peut contenir des erreurs (faux positifs/négatifs).
          L'Utilisateur est seul responsable des décisions prises sur la base des résultats.
        </p>
      </div>

      <h3>Transparence IA (IA Act - Art. 13 & 52)</h3>
      <ul>
        <li>Les analyses sont effectuées par des algorithmes d'IA (Sightengine, Illuminarty)</li>
        <li>Les scores de confiance sont indicatifs (précision ~85-95%)</li>
        <li>Possibilité de faux positifs et faux négatifs</li>
        <li>Révision manuelle disponible sur demande</li>
        <li>Documentation technique accessible : <a href="/docs/api" className="text-primary-400 hover:underline">docs/api</a></li>
      </ul>

      <h3>Limites connues</h3>
      <ul>
        <li>Difficulté avec images fortement compressées</li>
        <li>Précision réduite sur contenus hybrides (IA + retouche humaine)</li>
        <li>Évolution constante des techniques de génération IA</li>
      </ul>

      <h2>Article 8 - Responsabilité</h2>
      <p>JARVIS ne peut être tenu responsable :</p>
      <ul>
        <li>Des décisions prises sur la base des résultats</li>
        <li>Des dommages indirects</li>
        <li>Des interruptions de service hors de son contrôle</li>
        <li>Des contenus soumis par les Utilisateurs</li>
      </ul>

      <p className="text-sm bg-dark-900/50 border border-primary-500/20 rounded-lg p-4 mt-6">
        <strong>Plafond de responsabilité :</strong> La responsabilité totale ne pourra excéder 100€
        pour les comptes gratuits.
      </p>

      <h2>Article 9 - Suspension et Résiliation</h2>
      <p>Le compte peut être suspendu en cas de :</p>
      <ul>
        <li>Violation des CGU</li>
        <li>Activité frauduleuse</li>
        <li>Risque pour la sécurité</li>
      </ul>

      <h2>Article 10 - Modifications</h2>
      <p>
        JARVIS peut modifier les CGU à tout moment. Les modifications entrent en vigueur dès publication.
        L'utilisation continue vaut acceptation.
      </p>

      <h2>Article 11 - Loi Applicable</h2>
      <p>
        <strong>Droit applicable :</strong> Droit français<br />
        <strong>Juridiction :</strong> Tribunaux compétents français<br />
        <strong>Médiation :</strong> En cas de litige, possibilité de recours à un médiateur de la consommation
      </p>

      <h2>Article 12 - Contact</h2>
      <p>
        Email : <a href="mailto:legal@faketect.com" className="text-primary-400 hover:underline">legal@faketect.com</a>
      </p>

      <h2>Article 12 - Propriété Intellectuelle des Résultats</h2>
      <p>
        Les résultats d'analyse et certificats générés vous appartiennent. Vous pouvez les utiliser
        librement sous réserve de mentionner "Analyse FakeTect" lors de leur diffusion publique.
      </p>

      <p className="text-sm text-gray-400 mt-8">
        <strong>Date d'entrée en vigueur :</strong> 20 décembre 2025 | <strong>Version :</strong> 2.0
      </p>

      <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-6 mt-8">
        <p className="text-center text-white">
          <strong>En utilisant FakeTect, vous acceptez les présentes CGU.</strong>
        </p>
        <p className="text-center text-gray-400 text-sm mt-2">
          Conforme : RGPD • IA Act • DSA • Code de la consommation
        </p>
      </div>
    </>
  );
}

function CGV() {
  return (
    <>
      <h2>Préambule</h2>
      <p>
        Les présentes Conditions Générales de Vente (CGV) s'appliquent aux services payants de Faketect.
      </p>

      <h2>Article 1 - Services Proposés</h2>
      
      <h3>Offre Gratuite</h3>
      <ul>
        <li>20 analyses/jour</li>
        <li>Fonctionnalités de base</li>
        <li>Historique 12 mois</li>
      </ul>

      <h3>Offre Starter (exemple)</h3>
      <ul>
        <li>100 analyses/jour</li>
        <li>Toutes fonctionnalités</li>
        <li>Support email</li>
        <li><strong>Prix :</strong> 9,99€/mois ou 99€/an</li>
      </ul>

      <h3>Offre Professional (exemple)</h3>
      <ul>
        <li>500 analyses/jour</li>
        <li>API access</li>
        <li>Support prioritaire</li>
        <li>Certificats personnalisés</li>
        <li><strong>Prix :</strong> 29,99€/mois ou 299€/an</li>
      </ul>

      <h2>Article 2 - Prix</h2>
      <p>
        Les prix sont indiqués en euros TTC (TVA 20%). Pour les modifications de prix, un préavis de 30
        jours est notifié avec possibilité de résiliation sans frais.
      </p>

      <h2>Article 3 - Paiement</h2>
      <h3>Moyens acceptés</h3>
      <ul>
        <li>Carte bancaire (Visa, Mastercard, Amex)</li>
        <li>PayPal</li>
        <li>Apple Pay / Google Pay</li>
      </ul>

      <h3>Renouvellement automatique</h3>
      <p>
        Les abonnements se renouvellent automatiquement. Vous pouvez résilier au moins 48h avant
        l'échéance. Notification envoyée 7 jours avant.
      </p>

      <h2>Article 4 - Facturation</h2>
      <p>
        Une facture est émise pour chaque commande et envoyée par email. Conservation : 10 ans.
      </p>

      <h2>Article 5 - Droit de Rétractation</h2>
      <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 my-6">
        <p className="font-semibold text-primary-400 mb-2">Consommateurs</p>
        <p className="text-gray-300">
          Délai de rétractation : <strong>14 jours</strong> à compter de la souscription.<br />
          En acceptant le démarrage immédiat du service, vous renoncez à ce droit.
        </p>
      </div>

      <h3>Exercer le droit</h3>
      <p>
        Email : <a href="mailto:refunds@faketect.com" className="text-primary-400 hover:underline">refunds@faketect.com</a><br />
        Remboursement sous 14 jours
      </p>

      <h2>Article 6 - Garanties</h2>
      <ul>
        <li>Garantie légale de conformité (Code de la consommation)</li>
        <li>Garantie des vices cachés (Code civil)</li>
        <li>Taux de disponibilité : 99% (hors maintenance)</li>
      </ul>

      <h2>Article 7 - Résiliation</h2>
      <h3>Par le Client</h3>
      <p>
        Depuis les paramètres du compte ou par email à{' '}
        <a href="mailto:cancel@faketect.com" className="text-primary-400 hover:underline">
          cancel@faketect.com
        </a>
      </p>

      <h3>Par le Vendeur</h3>
      <p>Possible en cas de violation des CGU ou défaut de paiement (préavis 30 jours).</p>

      <h2>Article 8 - Médiation</h2>
      <p>
        En cas de litige, recours gratuit à un médiateur de la consommation conformément à l'article
        L.612-1 du Code de la consommation.
      </p>
      <p>
        Plateforme européenne :{' '}
        <a
          href="https://ec.europa.eu/consumers/odr/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:underline"
        >
          ec.europa.eu/consumers/odr
        </a>
      </p>

      <h2>Article 9 - Droit Applicable</h2>
      <p>
        <strong>Droit applicable :</strong> Droit français<br />
        <strong>Juridiction :</strong> Tribunaux compétents français
      </p>

      <h2>Article 10 - Contact</h2>
      <ul>
        <li>Commandes : orders@faketect.com</li>
        <li>Support : support@faketect.com</li>
        <li>Réclamations : complaints@faketect.com</li>
        <li>Résiliation : cancel@faketect.com</li>
      </ul>

      <h2>Article 11 - Conformité DSA</h2>
      <p>
        Conformément au Digital Services Act, JARVIS s'engage à :
      </p>
      <ul>
        <li>Traiter rapidement les demandes de retrait de contenu illicite</li>
        <li>Fournir des mécanismes de réclamation transparents</li>
        <li>Publier des rapports de transparence annuels</li>
      </ul>

      <p className="text-sm text-gray-400 mt-8">
        <strong>Date d'entrée en vigueur :</strong> 20 décembre 2025 | <strong>Version :</strong> 2.0
      </p>

      <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 mt-6">
        <p className="text-sm text-center text-white">
          <strong>Conformité 2025 :</strong> RGPD • IA Act • DSA • DMA • Code de la consommation
        </p>
      </div>
    </>
  );
}

function PolitiqueCookies() {
  return (
    <>
      <h2>1. Qu'est-ce qu'un cookie ?</h2>
      <p>
        Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite d'un site web.
      </p>

      <h2>2. Cookies utilisés sur Faketect</h2>

      <h3>Cookies strictement nécessaires (pas de consentement requis)</h3>
      <table className="w-full text-sm my-4 border border-gray-700">
        <thead className="bg-dark-900">
          <tr>
            <th className="border border-gray-700 px-3 py-2 text-left">Cookie</th>
            <th className="border border-gray-700 px-3 py-2 text-left">Finalité</th>
            <th className="border border-gray-700 px-3 py-2 text-left">Durée</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-700 px-3 py-2">sb-access-token</td>
            <td className="border border-gray-700 px-3 py-2">Authentification</td>
            <td className="border border-gray-700 px-3 py-2">Session</td>
          </tr>
          <tr>
            <td className="border border-gray-700 px-3 py-2">sb-refresh-token</td>
            <td className="border border-gray-700 px-3 py-2">Renouvellement session</td>
            <td className="border border-gray-700 px-3 py-2">30 jours</td>
          </tr>
          <tr>
            <td className="border border-gray-700 px-3 py-2">csrf-token</td>
            <td className="border border-gray-700 px-3 py-2">Protection CSRF</td>
            <td className="border border-gray-700 px-3 py-2">Session</td>
          </tr>
          <tr>
            <td className="border border-gray-700 px-3 py-2">cookie-consent</td>
            <td className="border border-gray-700 px-3 py-2">Consentement cookies</td>
            <td className="border border-gray-700 px-3 py-2">13 mois</td>
          </tr>
        </tbody>
      </table>

      <h3>Cookies analytiques (consentement requis)</h3>
      <p>
        Si activés avec votre consentement : Google Analytics pour statistiques d'utilisation anonymisées.
      </p>

      <h2>3. Gestion de vos cookies</h2>

      <h3>Via notre bandeau</h3>
      <p>
        Lors de votre première visite, vous pouvez accepter, refuser ou personnaliser vos choix.
        Modifiez vos préférences via le lien "Gérer les cookies" en bas de page.
      </p>

      <h3>Via votre navigateur</h3>
      <ul>
        <li><strong>Chrome :</strong> Menu &gt; Paramètres &gt; Confidentialité &gt; Cookies</li>
        <li><strong>Firefox :</strong> Menu &gt; Options &gt; Vie privée &gt; Cookies</li>
        <li><strong>Safari :</strong> Préférences &gt; Confidentialité</li>
        <li><strong>Edge :</strong> Paramètres &gt; Confidentialité &gt; Cookies</li>
      </ul>

      <h2>4. Services tiers</h2>
      <p>Services utilisant des cookies :</p>
      <ul>
        <li><strong>Supabase</strong> - Authentification</li>
        <li><strong>Google Analytics</strong> - Statistiques (si consentement)</li>
      </ul>

      <h2>5. Vos droits RGPD</h2>
      <p>
        Les données collectées via cookies sont soumises au RGPD. Vous disposez des mêmes droits
        (accès, rectification, effacement, etc.).
      </p>
      <p>
        Contact : <a href="mailto:dpo@faketect.com" className="text-primary-400 hover:underline">dpo@faketect.com</a>
      </p>

      <h2>6. Conformité</h2>
      <p>Cette politique est conforme à :</p>
      <ul>
        <li>RGPD (UE 2016/679)</li>
        <li>Loi Informatique et Libertés</li>
        <li>Directive ePrivacy (2002/58/CE)</li>
        <li>Lignes directrices CNIL (septembre 2020)</li>
      </ul>

      <h2>7. Contact</h2>
      <p>
        DPO : <a href="mailto:dpo@faketect.com" className="text-primary-400 hover:underline">dpo@faketect.com</a><br />
        Support : <a href="mailto:support@faketect.com" className="text-primary-400 hover:underline">support@faketect.com</a>
      </p>

      <h2>8. Conservation des préférences</h2>
      <p>
        Vos choix en matière de cookies sont conservés pendant 13 mois. Passé ce délai, votre
        consentement vous sera redemandé.
      </p>

      <p className="text-sm text-gray-400 mt-8">
        <strong>Dernière mise à jour :</strong> 20 décembre 2025 | <strong>Version :</strong> 2.0
      </p>

      <div className="flex gap-3 mt-6 flex-wrap">
        <button onClick={() => window.dispatchEvent(new CustomEvent('openCookieSettings'))} className="btn-secondary text-sm">
          Gérer mes préférences
        </button>
        <button onClick={() => window.dispatchEvent(new CustomEvent('rejectCookies'))} className="btn-outline text-sm">
          Tout refuser
        </button>
        <button onClick={() => window.dispatchEvent(new CustomEvent('acceptCookies'))} className="btn-primary text-sm">
          Tout accepter
        </button>
      </div>
    </>
  );
}

function LegalFooter() {
  return (
    <footer className="border-t border-primary-500/20 bg-dark-900/50 backdrop-blur-sm mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">JARVIS</h3>
            <p className="text-gray-400 text-sm">
              SAS au capital de 10 000€<br />
              SIRET : 123 456 789 00012<br />
              RCS Paris B 123 456 789<br />
              123 Avenue des Champs-Élysées<br />
              75008 Paris, France
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Documents juridiques</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/legal/mentions-legales" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Mentions Légales
                </Link>
              </li>
              <li>
                <Link to="/legal/confidentialite" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Politique de Confidentialité
                </Link>
              </li>
              <li>
                <Link to="/legal/cgu" className="text-gray-400 hover:text-primary-400 transition-colors">
                  CGU
                </Link>
              </li>
              <li>
                <Link to="/legal/cgv" className="text-gray-400 hover:text-primary-400 transition-colors">
                  CGV
                </Link>
              </li>
              <li>
                <Link to="/legal/cookies" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Politique de Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="mailto:contact@faketect.com" className="hover:text-primary-400 transition-colors">
                  contact@faketect.com
                </a>
              </li>
              <li>
                <a href="mailto:dpo@faketect.com" className="hover:text-primary-400 transition-colors">
                  DPO : dpo@faketect.com
                </a>
              </li>
              <li>
                <a href="mailto:legal@faketect.com" className="hover:text-primary-400 transition-colors">
                  Juridique : legal@faketect.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright & Compliance */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded text-xs text-primary-400">RGPD</span>
            <span className="px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded text-xs text-primary-400">IA Act</span>
            <span className="px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded text-xs text-primary-400">DSA</span>
            <span className="px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded text-xs text-primary-400">ISO 27001</span>
            <span className="px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded text-xs text-primary-400">ePrivacy</span>
          </div>
          <p className="text-gray-400 text-sm mb-2 text-center">
            © {new Date().getFullYear()} JARVIS. Tous droits réservés.
          </p>
          <p className="text-gray-500 text-xs text-center">
            Hébergement : Render (API) • Vercel (Frontend) • Supabase (Données)
          </p>
        </div>
      </div>
    </footer>
  );
}
