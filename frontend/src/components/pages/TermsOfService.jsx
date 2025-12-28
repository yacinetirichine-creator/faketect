import { useTranslation } from 'react-i18next';
import { Shield, Scale, Lock, Eye, Database, UserX, Mail, FileText } from 'lucide-react';

/**
 * Page Conditions Générales d'Utilisation (CGU)
 * Conformité RGPD et légale française
 */
export default function TermsOfService() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-4">
            <Scale size={16} />
            Document légal
          </div>
          <h1 className="text-4xl font-black text-white mb-4">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-white/60">
            Dernière mise à jour : 28 décembre 2025
          </p>
        </div>

        {/* Content */}
        <div className="card space-y-8">
          {/* 1. Présentation */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText size={24} className="text-primary" />
              1. Présentation du service
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>
                <strong className="text-white">FakeTect</strong> (ci-après "le Service") est une plateforme SaaS de détection 
                de contenus générés par intelligence artificielle, éditée par <strong className="text-white">JARVIS</strong>.
              </p>
              <p>
                <strong>Éditeur :</strong> JARVIS<br />
                <strong>Adresse :</strong> France<br />
                <strong>Email :</strong> contact@faketect.com<br />
                <strong>Hébergement :</strong> Render (backend) et Vercel (frontend)
              </p>
            </div>
          </section>

          {/* 2. Acceptation */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Check size={24} className="text-green-400" />
              2. Acceptation des CGU
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>
                L'utilisation du Service implique l'acceptation pleine et entière des présentes Conditions Générales d'Utilisation (CGU).
              </p>
              <p>
                En créant un compte ou en utilisant le Service, vous confirmez avoir lu, compris et accepté ces CGU ainsi que 
                notre <a href="/legal/privacy" className="text-primary hover:underline">Politique de Confidentialité</a>.
              </p>
            </div>
          </section>

          {/* 3. Services proposés */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield size={24} className="text-blue-400" />
              3. Description des services
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>FakeTect propose :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Analyse d'images</strong> : Détection IA sur formats JPEG, PNG, WEBP, GIF</li>
                <li><strong>Analyse de vidéos</strong> : Détection sur MP4, MOV, AVI (60 premières secondes)</li>
                <li><strong>Certificats PDF</strong> : Attestation d'authenticité téléchargeable</li>
                <li><strong>Historique</strong> : Conservation de vos analyses selon votre plan</li>
                <li><strong>API REST</strong> : Accès programmatique (plans PRO et supérieurs)</li>
              </ul>
            </div>
          </section>

          {/* 4. Inscription et compte */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <UserCheck size={24} className="text-purple-400" />
              4. Inscription et compte utilisateur
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>
                <strong>4.1. Éligibilité :</strong> Le Service est réservé aux personnes majeures (18 ans et plus) ou 
                aux mineurs avec autorisation parentale.
              </p>
              <p>
                <strong>4.2. Compte :</strong> Vous vous engagez à fournir des informations exactes lors de l'inscription 
                et à les maintenir à jour.
              </p>
              <p>
                <strong>4.3. Sécurité :</strong> Vous êtes responsable de la confidentialité de vos identifiants. 
                Toute utilisation de votre compte est présumée être effectuée par vous.
              </p>
              <p>
                <strong>4.4. Suppression :</strong> Vous pouvez supprimer votre compte à tout moment depuis vos paramètres. 
                Les données seront supprimées sous 30 jours conformément au RGPD.
              </p>
            </div>
          </section>

          {/* 5. Plans et tarifs */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard size={24} className="text-yellow-400" />
              5. Plans et tarification
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>
                <strong>5.1. Plan GRATUIT :</strong> 10 analyses sur 30 jours, historique 7 jours, images uniquement.
              </p>
              <p>
                <strong>5.2. Plans payants :</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>STARTER : 12€/mois - 100 analyses/mois</li>
                <li>PRO : 34€/mois - 500 analyses/mois + API</li>
                <li>BUSINESS : 89€/mois - 2000 analyses/mois + support prioritaire</li>
                <li>ENTERPRISE : 249€/mois - illimité + SLA</li>
              </ul>
              <p>
                <strong>5.3. Paiement :</strong> Les paiements sont traités par Stripe. Les prix sont TTC (TVA française 20%).
              </p>
              <p>
                <strong>5.4. Renouvellement :</strong> Les abonnements sont renouvelés automatiquement chaque mois 
                sauf résiliation avant la date d'échéance.
              </p>
              <p>
                <strong>5.5. Remboursement :</strong> Conformément au droit de rétractation, vous disposez de 14 jours 
                pour demander un remboursement intégral (hors utilisation du service).
              </p>
            </div>
          </section>

          {/* 6. Utilisation acceptable */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle size={24} className="text-red-400" />
              6. Utilisation acceptable
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>Vous vous engagez à NE PAS :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Uploader du contenu illégal, diffamatoire, pornographique ou violent</li>
                <li>Contourner les limitations de quota ou d'API</li>
                <li>Utiliser le Service pour harceler, spammer ou nuire à autrui</li>
                <li>Tenter de pirater, reverse-engineer ou compromettre le Service</li>
                <li>Revendre l'accès au Service sans autorisation écrite</li>
                <li>Utiliser le Service pour des activités illégales ou frauduleuses</li>
              </ul>
              <p className="text-yellow-400 font-semibold">
                ⚠️ Toute violation entraînera la suspension immédiate du compte sans remboursement.
              </p>
            </div>
          </section>

          {/* 7. Propriété intellectuelle */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Copyright size={24} className="text-cyan-400" />
              7. Propriété intellectuelle
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>
                <strong>7.1. Nos droits :</strong> FakeTect, son logo, sa technologie et son interface sont protégés 
                par les droits d'auteur et marques. Toute reproduction est interdite.
              </p>
              <p>
                <strong>7.2. Vos contenus :</strong> Vous conservez la propriété de vos fichiers uploadés. 
                Vous nous accordez une licence limitée pour les analyser.
              </p>
              <p>
                <strong>7.3. Suppression :</strong> Vos fichiers sont automatiquement supprimés après analyse 
                (sauf cache temporaire de 7 jours pour optimisation).
              </p>
            </div>
          </section>

          {/* 8. Limitation de responsabilité */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <ShieldAlert size={24} className="text-orange-400" />
              8. Limitation de responsabilité
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>
                <strong>8.1. Précision :</strong> Notre Service fournit une estimation probabiliste. 
                Les résultats ne sont PAS garantis à 100% et ne constituent pas une preuve légale absolue.
              </p>
              <p>
                <strong>8.2. Disponibilité :</strong> Nous nous efforçons d'assurer une disponibilité maximale, 
                mais ne garantissons pas un service ininterrompu (maintenance, pannes, etc.).
              </p>
              <p>
                <strong>8.3. Dommages :</strong> Nous ne sommes pas responsables des dommages indirects 
                (perte de données, manque à gagner) résultant de l'utilisation du Service.
              </p>
              <p className="text-white font-semibold">
                Le Service est fourni "tel quel" sans garantie d'exactitude absolue.
              </p>
            </div>
          </section>

          {/* 9. Résiliation */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <UserX size={24} className="text-red-400" />
              9. Résiliation
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>
                <strong>9.1. Par vous :</strong> Vous pouvez résilier votre abonnement à tout moment. 
                L'accès reste actif jusqu'à la fin de la période payée.
              </p>
              <p>
                <strong>9.2. Par nous :</strong> Nous pouvons suspendre ou résilier votre compte en cas de violation des CGU, 
                d'impayés ou d'activité suspecte.
              </p>
              <p>
                <strong>9.3. Effet :</strong> Après résiliation, vos données sont conservées 30 jours puis supprimées 
                définitivement (sauf obligation légale).
              </p>
            </div>
          </section>

          {/* 10. Loi applicable */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Landmark size={24} className="text-blue-400" />
              10. Loi applicable et juridiction
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>
                Les présentes CGU sont régies par le <strong className="text-white">droit français</strong>.
              </p>
              <p>
                En cas de litige, une solution amiable sera recherchée en priorité. À défaut, 
                les tribunaux français seront compétents.
              </p>
              <p>
                Conformément au RGPD, vous disposez de droits sur vos données personnelles 
                (voir notre <a href="/legal/privacy" className="text-primary hover:underline">Politique de Confidentialité</a>).
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="border-t border-white/10 pt-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Mail size={24} className="text-green-400" />
              Contact
            </h2>
            <div className="space-y-3 text-white/80 leading-relaxed">
              <p>Pour toute question concernant ces CGU :</p>
              <ul className="space-y-1">
                <li><strong>Email :</strong> <a href="mailto:contact@faketect.com" className="text-primary hover:underline">contact@faketect.com</a></li>
                <li><strong>Support :</strong> Disponible dans votre espace client</li>
                <li><strong>DPO (RGPD) :</strong> dpo@faketect.com</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer navigation */}
        <div className="mt-8 flex justify-center gap-4 text-sm">
          <a href="/legal/privacy" className="text-primary hover:underline">
            Politique de Confidentialité
          </a>
          <span className="text-white/20">•</span>
          <a href="/legal/cookies" className="text-primary hover:underline">
            Politique de Cookies
          </a>
          <span className="text-white/20">•</span>
          <a href="/" className="text-white/60 hover:text-white">
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}

// Imports manquants pour les icônes
import { Check, UserCheck, CreditCard, AlertCircle, Copyright, ShieldAlert, Landmark } from 'lucide-react';
