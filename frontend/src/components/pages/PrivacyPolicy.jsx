import { useTranslation } from 'react-i18next';
import { Shield, Lock, Database, UserCheck, Mail, FileText } from 'lucide-react';

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('legal.privacy.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Dernière mise à jour : 28 décembre 2024
          </p>
        </div>

        {/* Informations légales */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            Informations Légales
          </h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <p className="font-semibold mb-2">JARVIS</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Société par actions simplifiée au capital de 1 000 EUR<br />
              Siège social : 64 Avenue Marinville, 94100 Saint-Maur-des-Fossés<br />
              SIREN : 928 499 166<br />
              RCS Créteil
            </p>
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
              <p className="text-sm">
                <strong>Email :</strong> <a href="mailto:contact@faketect.com" className="text-blue-600 hover:underline">contact@faketect.com</a><br />
                <strong>DPO :</strong> <a href="mailto:dpo@faketect.com" className="text-blue-600 hover:underline">dpo@faketect.com</a>
              </p>
            </div>
          </div>
        </section>

        {/* Données collectées */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Database className="w-6 h-6 mr-2" />
            Données Personnelles Collectées
          </h2>
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Données d'identification</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Mot de passe (chiffré avec bcrypt)</li>
                <li>Langue préférée</li>
                <li>Statut d'abonnement</li>
              </ul>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Données de paiement</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Informations de facturation</li>
                <li>Historique des transactions</li>
                <li>Identifiant client Stripe</li>
              </ul>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                ⚠️ Les données bancaires ne sont jamais stockées sur nos serveurs. Elles sont traitées directement par Stripe (certifié PCI-DSS niveau 1).
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Données d'utilisation</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>Fichiers téléversés pour analyse (images, vidéos, textes)</li>
                <li>Résultats des analyses effectuées</li>
                <li>Historique des détections</li>
                <li>Certificats d'authenticité générés</li>
              </ul>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                📅 Les fichiers sont supprimés automatiquement après 90 jours.
              </p>
            </div>
          </div>
        </section>

        {/* Vos droits RGPD */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <UserCheck className="w-6 h-6 mr-2" />
            Vos Droits (RGPD)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">✓ Droit d'accès</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Obtenir une copie de vos données personnelles
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">✓ Droit de rectification</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Corriger vos données inexactes ou incomplètes
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">✓ Droit à l'effacement</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Demander la suppression de vos données (droit à l'oubli)
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">✓ Droit à la portabilité</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Recevoir vos données dans un format structuré (JSON, CSV)
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">✓ Droit d'opposition</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                S'opposer au traitement de vos données
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2">✓ Droit de limitation</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Demander le gel temporaire du traitement
              </p>
            </div>
          </div>
        </section>

        {/* Sécurité */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Lock className="w-6 h-6 mr-2" />
            Sécurité des Données
          </h2>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">🔒</span>
                <span><strong>Chiffrement HTTPS/TLS</strong> pour toutes les communications</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">🔐</span>
                <span><strong>Mots de passe chiffrés</strong> avec bcrypt + salage</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">🛡️</span>
                <span><strong>Pare-feu WAF</strong> et protection DDoS</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">💾</span>
                <span><strong>Sauvegardes quotidiennes</strong> chiffrées</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">🔍</span>
                <span><strong>Audits de sécurité</strong> réguliers</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Mail className="w-6 h-6 mr-2" />
            Exercer vos Droits
          </h2>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Pour toute question ou pour exercer vos droits :
            </p>
            <div className="space-y-2">
              <p>
                <strong>Email DPO :</strong>{' '}
                <a href="mailto:dpo@faketect.com" className="text-blue-600 hover:underline">
                  dpo@faketect.com
                </a>
              </p>
              <p>
                <strong>Email contact :</strong>{' '}
                <a href="mailto:contact@faketect.com" className="text-blue-600 hover:underline">
                  contact@faketect.com
                </a>
              </p>
              <p>
                <strong>Courrier :</strong> JARVIS - DPO, 64 Avenue Marinville, 94100 Saint-Maur-des-Fossés
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Délai de réponse :</strong> 1 mois (prorogeable de 2 mois si complexité)
              </p>
            </div>
          </div>
        </section>

        {/* Réclamation CNIL */}
        <section className="mb-8">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">Réclamation auprès de la CNIL</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL :
            </p>
            <p className="text-sm">
              <strong>CNIL</strong><br />
              3 Place de Fontenoy, TSA 80715<br />
              75334 PARIS CEDEX 07<br />
              Tél : 01 53 73 22 22<br />
              Site : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.cnil.fr</a>
            </p>
          </div>
        </section>

        {/* Bouton télécharger */}
        <div className="text-center mt-8">
          <a
            href="/POLITIQUE_CONFIDENTIALITE.md"
            download
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-5 h-5 mr-2" />
            Télécharger la version complète (PDF)
          </a>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Version 1.0 - Conforme RGPD et Loi Informatique et Libertés</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
