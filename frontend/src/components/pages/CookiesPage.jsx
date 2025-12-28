import { Cookie, Shield, Check, X } from 'lucide-react';

const CookiesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Cookie className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Politique de Gestion des Cookies
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Dernière mise à jour : 28 décembre 2024
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-3">Qu'est-ce qu'un cookie ?</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite d'un site web. 
              Il permet de reconnaître votre navigateur, mémoriser vos préférences et analyser l'utilisation du site.
            </p>
          </div>
        </section>

        {/* Types de cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Types de cookies utilisés</h2>
          
          <div className="space-y-4">
            {/* Cookies strictement nécessaires */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Cookies strictement nécessaires</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Indispensables au fonctionnement du site. Ne peuvent pas être désactivés.
                    </p>
                  </div>
                </div>
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-3 py-1 rounded-full whitespace-nowrap">
                  Toujours activé
                </span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 font-semibold">Cookie</th>
                      <th className="text-left py-2 font-semibold">Finalité</th>
                      <th className="text-left py-2 font-semibold">Durée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="py-2 font-mono text-xs">auth_token</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">Authentification</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">Session</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">refresh_token</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">Maintien connexion</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">7 jours</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">csrf_token</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">Protection CSRF</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">Session</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">cookie_consent</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">Choix cookies</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">13 mois</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cookies de préférences */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Cookie className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Cookies de préférences</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Mémorisent vos choix et préférences (langue, thème).
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 font-semibold">Cookie</th>
                      <th className="text-left py-2 font-semibold">Finalité</th>
                      <th className="text-left py-2 font-semibold">Durée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="py-2 font-mono text-xs">user_language</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">Langue préférée</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">12 mois</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">theme_preference</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">Thème (clair/sombre)</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">12 mois</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cookies analytiques */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Cookie className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Cookies analytiques (Google Analytics)</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Nous aident à comprendre l'utilisation du site. IP anonymisée.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 font-semibold">Cookie</th>
                      <th className="text-left py-2 font-semibold">Finalité</th>
                      <th className="text-left py-2 font-semibold">Durée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="py-2 font-mono text-xs">_ga</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">Distinction utilisateurs</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">2 ans</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">_gid</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">Distinction utilisateurs</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">24h</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">_gat</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">Limitation taux requêtes</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">1 min</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cookies Stripe */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Cookies de paiement (Stripe)</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Sécurisation des transactions et prévention de la fraude.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 font-semibold">Cookie</th>
                      <th className="text-left py-2 font-semibold">Finalité</th>
                      <th className="text-left py-2 font-semibold">Durée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="py-2 font-mono text-xs">__stripe_sid</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">Prévention fraude</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">30 min</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">__stripe_mid</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">Prévention fraude</td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">12 mois</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Gestion des cookies */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Gérer vos cookies</h2>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-3">Via le bandeau de consentement</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Vous pouvez modifier vos préférences à tout moment en cliquant sur le bouton ci-dessous :
              </p>
              <button
                onClick={() => {
                  localStorage.removeItem('cookie_consent');
                  window.location.reload();
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Cookie className="w-5 h-5" />
                Gérer mes préférences de cookies
              </button>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-3">Via votre navigateur</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Vous pouvez configurer votre navigateur pour refuser ou supprimer les cookies :
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><strong>Chrome :</strong> Menu → Paramètres → Confidentialité et sécurité → Cookies</li>
                <li><strong>Firefox :</strong> Menu → Paramètres → Vie privée et sécurité → Cookies</li>
                <li><strong>Safari :</strong> Préférences → Confidentialité → Cookies</li>
                <li><strong>Edge :</strong> Menu → Paramètres → Cookies et autorisations</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Conséquences du refus */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Conséquences du refus des cookies</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <X className="w-5 h-5 text-red-600" />
                Cookies nécessaires refusés
              </h3>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>❌ Impossible de se connecter</li>
                <li>❌ Pas d'accès aux services</li>
                <li>❌ Perte de protection CSRF</li>
              </ul>
            </div>

            <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Cookie className="w-5 h-5 text-amber-600" />
                Cookies optionnels refusés
              </h3>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>⚠️ Perte des préférences</li>
                <li>⚠️ Langue réinitialisée à chaque visite</li>
                <li>✅ Pas d'impact sur les fonctionnalités principales</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Conformité */}
        <section className="mb-8">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Check className="w-6 h-6 text-green-600" />
              Conformité CNIL et RGPD
            </h2>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>✅ Consentement préalable pour cookies non essentiels</p>
              <p>✅ Information claire et complète</p>
              <p>✅ Facilité de retrait du consentement</p>
              <p>✅ Durée de validité limitée à 13 mois</p>
              <p>✅ Respect du signal "Do Not Track"</p>
              <p>✅ Pas de "cookie wall" (accès possible sans cookies optionnels)</p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Contact</h2>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <p className="mb-2">
              Pour toute question relative aux cookies :
            </p>
            <p className="text-sm">
              <strong>Email :</strong>{' '}
              <a href="mailto:contact@faketect.com" className="text-blue-600 hover:underline">
                contact@faketect.com
              </a>
            </p>
            <p className="text-sm mt-2">
              <strong>DPO :</strong>{' '}
              <a href="mailto:dpo@faketect.com" className="text-blue-600 hover:underline">
                dpo@faketect.com
              </a>
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Version 1.0 - Conforme CNIL, RGPD et Directive ePrivacy</p>
        </div>
      </div>
    </div>
  );
};

export default CookiesPage;
