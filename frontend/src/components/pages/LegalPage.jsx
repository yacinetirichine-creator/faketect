import { FileText, Scale, Shield } from 'lucide-react';

const LegalPage = ({ type }) => {
  const content = {
    terms: {
      title: 'Conditions Générales d\'Utilisation (CGU)',
      icon: FileText,
      color: 'blue',
      description: 'Conditions d\'utilisation de la plateforme Faketect',
      file: '/CGU.md'
    },
    sales: {
      title: 'Conditions Générales de Vente (CGV)',
      icon: Scale,
      color: 'green',
      description: 'Conditions de vente des abonnements payants',
      file: '/CGV.md'
    },
    legal: {
      title: 'Mentions Légales',
      icon: Shield,
      color: 'purple',
      description: 'Informations légales obligatoires',
      file: '/MENTIONS_LEGALES.md'
    }
  };

  const current = content[type];
  const Icon = current.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Icon className={`w-16 h-16 text-${current.color}-600 mx-auto mb-4`} />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {current.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {current.description}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Dernière mise à jour : 28 décembre 2024
          </p>
        </div>

        {/* Informations société */}
        <section className="mb-8">
          <div className={`bg-${current.color}-50 dark:bg-${current.color}-900/20 border border-${current.color}-200 dark:border-${current.color}-800 rounded-lg p-6`}>
            <h2 className="text-xl font-bold mb-4">JARVIS</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Forme juridique :</strong> Société par actions simplifiée (SAS)</p>
              <p><strong>Capital social :</strong> 1 000 EUR</p>
              <p><strong>Siège social :</strong> 64 Avenue Marinville, 94100 Saint-Maur-des-Fossés</p>
              <p><strong>SIREN :</strong> 928 499 166</p>
              <p><strong>RCS :</strong> Créteil</p>
              <p><strong>Email :</strong> <a href="mailto:contact@faketect.com" className={`text-${current.color}-600 hover:underline`}>contact@faketect.com</a></p>
            </div>
          </div>
        </section>

        {/* Contenu spécifique selon le type */}
        {type === 'terms' && (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Objet</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Les présentes Conditions Générales d'Utilisation (CGU) définissent les conditions et modalités d'utilisation 
                de la plateforme <strong>Faketect</strong>, un service de détection de deepfakes par intelligence artificielle.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Services proposés</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🖼️ Analyse d'images</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Détection de manipulations par IA dans les images
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🎥 Analyse de vidéos</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Analyse image par image et détection d'anomalies
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">📝 Analyse de textes</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Détection de contenu généré par IA
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Usages interdits</h2>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">❌</span>
                    <span>Créer, diffuser ou promouvoir des deepfakes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">❌</span>
                    <span>Porter atteinte aux droits d'autrui</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">❌</span>
                    <span>Diffuser des contenus illégaux</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">❌</span>
                    <span>Contourner les mesures de sécurité</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-600 mr-2">❌</span>
                    <span>Revendre ou redistribuer les services</span>
                  </li>
                </ul>
              </div>
            </section>
          </>
        )}

        {type === 'sales' && (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Plans d'abonnement</h2>
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">Plan Free</h3>
                    <span className="text-2xl font-bold text-green-600">Gratuit</span>
                  </div>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li>✓ 10 analyses par mois</li>
                    <li>✓ Fichiers max : 10 MB</li>
                    <li>✓ Historique 30 jours</li>
                  </ul>
                </div>

                <div className="border border-blue-300 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">Plan Standard</h3>
                    <span className="text-2xl font-bold text-blue-600">€9.99/mois</span>
                  </div>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li>✓ 100 analyses par mois</li>
                    <li>✓ Fichiers max : 25 MB (images), 100 MB (vidéos)</li>
                    <li>✓ Historique 90 jours</li>
                    <li>✓ Support prioritaire (24h)</li>
                  </ul>
                </div>

                <div className="border border-purple-300 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">Plan Professional</h3>
                    <span className="text-2xl font-bold text-purple-600">€29.99/mois</span>
                  </div>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li>✓ 500 analyses par mois</li>
                    <li>✓ Fichiers max : 50 MB (images), 250 MB (vidéos)</li>
                    <li>✓ Historique illimité</li>
                    <li>✓ API access</li>
                    <li>✓ Rapports personnalisés</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Paiement et sécurité</h2>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <p className="mb-4">
                  <strong>🔒 Paiements sécurisés par Stripe</strong>
                </p>
                <ul className="space-y-2 text-sm">
                  <li>✓ Certifié PCI-DSS niveau 1</li>
                  <li>✓ Chiffrement SSL/TLS 256 bits</li>
                  <li>✓ 3D Secure pour les paiements UE</li>
                  <li>✓ Aucune donnée bancaire stockée sur nos serveurs</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Droit de rétractation</h2>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                <p className="mb-2">
                  <strong>Consommateurs : Délai de 14 jours</strong>
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Conformément au Code de la consommation, vous disposez de 14 jours pour exercer votre droit de rétractation.
                  Toutefois, ce droit ne s'applique pas si vous avez demandé l'exécution immédiate du service et commencé à utiliser vos crédits d'analyse.
                </p>
              </div>
            </section>
          </>
        )}

        {type === 'legal' && (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Hébergeurs</h2>
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Vercel Inc.</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hébergement Frontend<br />
                    340 S Lemon Ave #4133, Walnut, CA 91789, USA<br />
                    <a href="https://vercel.com" className="text-blue-600 hover:underline">vercel.com</a>
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Render Services Inc.</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hébergement Backend<br />
                    525 Brannan Street, San Francisco, CA 94107, USA<br />
                    <a href="https://render.com" className="text-blue-600 hover:underline">render.com</a>
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Supabase Inc.</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Stockage et Base de données<br />
                    970 Toa Payoh North, Singapore 318992<br />
                    <a href="https://supabase.com" className="text-blue-600 hover:underline">supabase.com</a>
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Protection des données</h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <p className="mb-4">
                  <strong>Responsable du traitement :</strong> JARVIS<br />
                  <strong>DPO :</strong> <a href="mailto:dpo@faketect.com" className="text-blue-600 hover:underline">dpo@faketect.com</a>
                </p>
                <p className="text-sm">
                  Conformément au RGPD, vous disposez des droits d'accès, rectification, effacement, limitation, 
                  portabilité et opposition. Voir notre <a href="/legal/privacy" className="text-blue-600 hover:underline">Politique de Confidentialité</a>.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Réclamation CNIL</h2>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Commission Nationale de l'Informatique et des Libertés</strong><br />
                  3 Place de Fontenoy, TSA 80715<br />
                  75334 PARIS CEDEX 07<br />
                  Tél : 01 53 73 22 22<br />
                  Site : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.cnil.fr</a>
                </p>
              </div>
            </section>
          </>
        )}

        {/* Limitation de responsabilité (commune à tous) */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">⚠️ Limitation de responsabilité</h2>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <p className="font-semibold mb-2">Nature probabiliste des résultats</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Les résultats fournis par Faketect sont de nature <strong>probabiliste</strong> et ne constituent 
              <strong> PAS une preuve absolue</strong>. Les scores de détection peuvent comporter des faux positifs 
              ou faux négatifs. JARVIS ne saurait être tenu responsable des décisions prises sur la base des résultats d'analyse.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Contact</h2>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <p className="mb-2">
              <strong>Email :</strong>{' '}
              <a href="mailto:contact@faketect.com" className="text-blue-600 hover:underline">
                contact@faketect.com
              </a>
            </p>
            <p>
              <strong>Courrier :</strong> JARVIS, 64 Avenue Marinville, 94100 Saint-Maur-des-Fossés
            </p>
          </div>
        </section>

        {/* Téléchargement */}
        <div className="text-center mt-8">
          <a
            href={current.file}
            download
            className={`inline-flex items-center px-6 py-3 bg-${current.color}-600 text-white rounded-lg hover:bg-${current.color}-700 transition-colors`}
          >
            <FileText className="w-5 h-5 mr-2" />
            Télécharger la version complète
          </a>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Version 1.0 - Conforme au droit français et RGPD</p>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
