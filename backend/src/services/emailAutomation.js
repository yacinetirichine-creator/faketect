const nodemailer = require('nodemailer');
const _prisma = require('../config/db');
const logger = require('../config/logger');

// Configuration email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://faketect.com';

/**
 * SÉQUENCE BIENVENUE
 * J0: Email immédiat après inscription
 */
async function sendWelcomeEmail(user) {
  const templates = {
    fr: {
      subject: '🎉 Bienvenue sur FakeTect !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Bienvenue ${user.name || 'cher utilisateur'} ! 🎉</h1>
          </div>

          <div style="padding: 40px 20px;">
            <p style="font-size: 16px; color: #333;">Merci d'avoir rejoint <strong>FakeTect</strong>, votre solution de détection de deepfakes par IA.</p>

            <h2 style="color: #6366f1;">🚀 Premiers pas</h2>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>1.</strong> Analysez votre première image ou vidéo</p>
              <p style="margin: 0 0 10px 0;"><strong>2.</strong> Consultez le rapport détaillé</p>
              <p style="margin: 0 0 10px 0;"><strong>3.</strong> Téléchargez votre certificat PDF</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${FRONTEND_URL}/dashboard?utm_source=email&utm_medium=welcome_d0&utm_campaign=onboarding"
                 style="background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Commencer maintenant
              </a>
            </div>

            <h3 style="color: #333;">📊 Votre plan : ${user.plan}</h3>
            <p>Vous avez <strong>${getPlanLimits(user.plan).monthly} analyses/mois</strong> disponibles.</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 14px; color: #666;">
              Une question ? Répondez à cet email, notre équipe est là pour vous aider.<br>
              L'équipe FakeTect
            </p>
          </div>
        </div>
      `,
    },
    en: {
      subject: '🎉 Welcome to FakeTect!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome ${user.name || 'dear user'}! 🎉</h1>
          </div>

          <div style="padding: 40px 20px;">
            <p style="font-size: 16px; color: #333;">Thank you for joining <strong>FakeTect</strong>, your AI-powered deepfake detection solution.</p>

            <h2 style="color: #6366f1;">🚀 Getting Started</h2>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>1.</strong> Analyze your first image or video</p>
              <p style="margin: 0 0 10px 0;"><strong>2.</strong> Review the detailed report</p>
              <p style="margin: 0 0 10px 0;"><strong>3.</strong> Download your PDF certificate</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${FRONTEND_URL}/dashboard?utm_source=email&utm_medium=welcome_d0&utm_campaign=onboarding"
                 style="background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Get Started
              </a>
            </div>

            <h3 style="color: #333;">📊 Your plan: ${user.plan}</h3>
            <p>You have <strong>${getPlanLimits(user.plan).monthly} analyses/month</strong> available.</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 14px; color: #666;">
              Questions? Reply to this email, our team is here to help.<br>
              The FakeTect Team
            </p>
          </div>
        </div>
      `,
    },
  };

  const template = templates[user.language] || templates.fr;

  try {
    await transporter.sendMail({
      from: `"FakeTect" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    logger.info('Welcome email sent', { userId: user.id, email: user.email });
    return true;
  } catch (error) {
    logger.error('Welcome email error', { error: error.message, userId: user.id });
    return false;
  }
}

/**
 * SÉQUENCE BIENVENUE - J3
 * Email si l'utilisateur n'a fait AUCUNE analyse
 */
async function sendDay3EngagementEmail(user) {
  const templates = {
    fr: {
      subject: '🔍 Avez-vous testé votre première analyse ?',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 40px 20px;">
            <h2 style="color: #6366f1;">Bonjour ${user.name || 'cher utilisateur'},</h2>

            <p style="font-size: 16px; color: #333;">
              Nous avons remarqué que vous n'avez pas encore analysé de média.
              Nous aimerions vous aider à commencer ! 🚀
            </p>

            <h3 style="color: #333;">💡 Pourquoi utiliser FakeTect ?</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li><strong>Journalistes</strong> : Vérifiez l'authenticité des images avant publication</li>
              <li><strong>Recruteurs</strong> : Détectez les photos truquées sur LinkedIn</li>
              <li><strong>Particuliers</strong> : Protégez-vous des deepfakes</li>
            </ul>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>⚡ Astuce :</strong> Glissez-déposez n'importe quelle image JPG/PNG dans le dashboard.
                Résultat en 5 secondes !
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${FRONTEND_URL}/dashboard?utm_source=email&utm_medium=engagement_d3&utm_campaign=onboarding"
                 style="background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Faire ma première analyse
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Besoin d'aide ? Discutez avec notre assistant IA en bas à droite du dashboard.<br>
              L'équipe FakeTect
            </p>
          </div>
        </div>
      `,
    },
    en: {
      subject: '🔍 Have you tried your first analysis?',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 40px 20px;">
            <h2 style="color: #6366f1;">Hello ${user.name || 'dear user'},</h2>

            <p style="font-size: 16px; color: #333;">
              We noticed you haven't analyzed any media yet.
              We'd love to help you get started! 🚀
            </p>

            <h3 style="color: #333;">💡 Why use FakeTect?</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li><strong>Journalists</strong>: Verify image authenticity before publishing</li>
              <li><strong>Recruiters</strong>: Detect fake photos on LinkedIn</li>
              <li><strong>Individuals</strong>: Protect yourself from deepfakes</li>
            </ul>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>⚡ Tip:</strong> Drag and drop any JPG/PNG image in the dashboard.
                Results in 5 seconds!
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${FRONTEND_URL}/dashboard?utm_source=email&utm_medium=engagement_d3&utm_campaign=onboarding"
                 style="background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Start my first analysis
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Need help? Chat with our AI assistant at the bottom right of the dashboard.<br>
              The FakeTect Team
            </p>
          </div>
        </div>
      `,
    },
  };

  const template = templates[user.language] || templates.fr;

  try {
    await transporter.sendMail({
      from: `"FakeTect" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    logger.info('Day 3 engagement email sent', { userId: user.id });
    return true;
  } catch (error) {
    logger.error('Day 3 email error', { error: error.message, userId: user.id });
    return false;
  }
}

/**
 * SÉQUENCE BIENVENUE - J7
 * Email conversion vers PRO
 */
async function sendDay7ConversionEmail(user) {
  const templates = {
    fr: {
      subject: '🎁 Offre spéciale : -30% sur le plan PRO',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 40px 20px;">
            <h2 style="color: #6366f1;">Vous adorez FakeTect ? Passez au PRO ! 🚀</h2>

            <p style="font-size: 16px; color: #333;">
              Après 7 jours d'utilisation, nous espérons que FakeTect vous aide à détecter les deepfakes.
            </p>

            <div style="background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); color: white; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
              <h3 style="margin: 0 0 10px 0; font-size: 24px;">🎁 OFFRE EXCLUSIVE</h3>
              <p style="margin: 0; font-size: 32px; font-weight: bold;">-30% SUR LE PLAN PRO</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Réservé aux nouveaux utilisateurs</p>
            </div>

            <h3 style="color: #333;">✨ Avec PRO, débloquez :</h3>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;">✅ <strong>100 analyses/mois</strong> (vs 10 en FREE)</p>
              <p style="margin: 0 0 10px 0;">✅ <strong>Analyse vidéo MP4/MOV</strong></p>
              <p style="margin: 0 0 10px 0;">✅ <strong>API access</strong> pour intégrations</p>
              <p style="margin: 0 0 10px 0;">✅ <strong>Support prioritaire</strong></p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 18px; color: #666; margin-bottom: 10px;">
                <span style="text-decoration: line-through; color: #999;">14,99€/mois</span>
                <strong style="color: #6366f1; font-size: 28px; margin-left: 10px;">10,49€/mois</strong>
              </p>
              <a href="${FRONTEND_URL}/pricing?promo=WELCOME30&utm_source=email&utm_medium=conversion_d7&utm_campaign=onboarding"
                 style="background: #6366f1; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 18px;">
                Profiter de -30%
              </a>
              <p style="font-size: 12px; color: #999; margin-top: 10px;">Offre valable 48h</p>
            </div>

            <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
              Restons en FREE ? Pas de problème, continuez à utiliser FakeTect gratuitement.<br>
              L'équipe FakeTect
            </p>
          </div>
        </div>
      `,
    },
    en: {
      subject: '🎁 Special offer: -30% on PRO plan',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 40px 20px;">
            <h2 style="color: #6366f1;">Love FakeTect? Upgrade to PRO! 🚀</h2>

            <p style="font-size: 16px; color: #333;">
              After 7 days of use, we hope FakeTect helps you detect deepfakes.
            </p>

            <div style="background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%); color: white; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
              <h3 style="margin: 0 0 10px 0; font-size: 24px;">🎁 EXCLUSIVE OFFER</h3>
              <p style="margin: 0; font-size: 32px; font-weight: bold;">-30% ON PRO PLAN</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">For new users only</p>
            </div>

            <h3 style="color: #333;">✨ With PRO, unlock:</h3>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;">✅ <strong>100 analyses/month</strong> (vs 10 FREE)</p>
              <p style="margin: 0 0 10px 0;">✅ <strong>Video analysis MP4/MOV</strong></p>
              <p style="margin: 0 0 10px 0;">✅ <strong>API access</strong> for integrations</p>
              <p style="margin: 0 0 10px 0;">✅ <strong>Priority support</strong></p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 18px; color: #666; margin-bottom: 10px;">
                <span style="text-decoration: line-through; color: #999;">$14.99/month</span>
                <strong style="color: #6366f1; font-size: 28px; margin-left: 10px;">$10.49/month</strong>
              </p>
              <a href="${FRONTEND_URL}/pricing?promo=WELCOME30&utm_source=email&utm_medium=conversion_d7&utm_campaign=onboarding"
                 style="background: #6366f1; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 18px;">
                Get -30% discount
              </a>
              <p style="font-size: 12px; color: #999; margin-top: 10px;">Offer valid for 48h</p>
            </div>

            <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
              Staying FREE? No problem, keep using FakeTect for free.<br>
              The FakeTect Team
            </p>
          </div>
        </div>
      `,
    },
  };

  const template = templates[user.language] || templates.fr;

  try {
    await transporter.sendMail({
      from: `"FakeTect" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    logger.info('Day 7 conversion email sent', { userId: user.id });
    return true;
  } catch (error) {
    logger.error('Day 7 email error', { error: error.message, userId: user.id });
    return false;
  }
}

/**
 * RE-ENGAGEMENT INACTIFS - J30
 * Email si aucune analyse depuis 30 jours
 */
async function sendInactiveUserEmail(user) {
  const templates = {
    fr: {
      subject: '😢 Vous nous manquez ! Revenez sur FakeTect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 40px 20px;">
            <h2 style="color: #6366f1;">Nous ne vous avons pas vu depuis un moment...</h2>

            <p style="font-size: 16px; color: #333;">
              Bonjour ${user.name || 'cher utilisateur'},
            </p>

            <p style="color: #555;">
              Cela fait 30 jours que vous n'avez pas utilisé FakeTect.
              Les deepfakes sont plus répandus que jamais, et nous aimerions vous aider à rester protégé.
            </p>

            <h3 style="color: #333;">🆕 Ce qui a changé récemment :</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li>🤖 <strong>Assistant IA</strong> : Posez vos questions en direct</li>
              <li>📝 <strong>Analyse de texte</strong> : Détectez les contenus générés par IA</li>
              <li>🎬 <strong>Analyse vidéo 60s</strong> : Deepfakes vidéo détectés</li>
              <li>🌍 <strong>6 langues</strong> : Interface multilingue</li>
            </ul>

            <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #0c4a6e;">
                <strong>💡 Le saviez-vous ?</strong> 67% des deepfakes sont utilisés pour des arnaques en 2025.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${FRONTEND_URL}/dashboard?utm_source=email&utm_medium=reengagement_d30&utm_campaign=winback"
                 style="background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Revenir sur FakeTect
              </a>
            </div>

            <p style="font-size: 14px; color: #666; text-align: center;">
              Votre compte reste actif avec <strong>${getPlanLimits(user.plan).monthly} analyses/mois</strong>.<br>
              L'équipe FakeTect
            </p>
          </div>
        </div>
      `,
    },
    en: {
      subject: '😢 We miss you! Come back to FakeTect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 40px 20px;">
            <h2 style="color: #6366f1;">We haven't seen you in a while...</h2>

            <p style="font-size: 16px; color: #333;">
              Hello ${user.name || 'dear user'},
            </p>

            <p style="color: #555;">
              It's been 30 days since you last used FakeTect.
              Deepfakes are more widespread than ever, and we'd love to help you stay protected.
            </p>

            <h3 style="color: #333;">🆕 What's new recently:</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li>🤖 <strong>AI Assistant</strong>: Ask questions in real-time</li>
              <li>📝 <strong>Text analysis</strong>: Detect AI-generated content</li>
              <li>🎬 <strong>60s video analysis</strong>: Video deepfakes detected</li>
              <li>🌍 <strong>6 languages</strong>: Multilingual interface</li>
            </ul>

            <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #0c4a6e;">
                <strong>💡 Did you know?</strong> 67% of deepfakes are used for scams in 2025.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${FRONTEND_URL}/dashboard?utm_source=email&utm_medium=reengagement_d30&utm_campaign=winback"
                 style="background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Return to FakeTect
              </a>
            </div>

            <p style="font-size: 14px; color: #666; text-align: center;">
              Your account remains active with <strong>${getPlanLimits(user.plan).monthly} analyses/month</strong>.<br>
              The FakeTect Team
            </p>
          </div>
        </div>
      `,
    },
  };

  const template = templates[user.language] || templates.fr;

  try {
    await transporter.sendMail({
      from: `"FakeTect" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    logger.info('Inactive user email sent', { userId: user.id });
    return true;
  } catch (error) {
    logger.error('Inactive user email error', { error: error.message, userId: user.id });
    return false;
  }
}

/**
 * RAPPEL QUOTA - 75% utilisé
 * Email quand l'utilisateur atteint 75% de son quota mensuel
 */
async function sendQuotaWarningEmail(user) {
  const planLimits = getPlanLimits(user.plan);
  const percentUsed = Math.round((user.usedMonth / planLimits.monthly) * 100);

  const templates = {
    fr: {
      subject: `⚠️ Vous avez utilisé ${percentUsed}% de votre quota`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 40px 20px;">
            <h2 style="color: #f59e0b;">⚠️ Attention à votre quota !</h2>

            <p style="font-size: 16px; color: #333;">
              Bonjour ${user.name || 'cher utilisateur'},
            </p>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #92400e; font-size: 18px;">
                <strong>Vous avez utilisé ${user.usedMonth}/${planLimits.monthly} analyses ce mois</strong>
              </p>
              <div style="background: #fde68a; border-radius: 8px; height: 20px; overflow: hidden;">
                <div style="background: #f59e0b; height: 100%; width: ${percentUsed}%;"></div>
              </div>
              <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">
                ${percentUsed}% de votre quota mensuel
              </p>
            </div>

            ${user.plan === 'FREE' ? `
              <h3 style="color: #333;">🚀 Passez à PRO pour plus d'analyses</h3>
              <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;">✅ <strong>100 analyses/mois</strong> (vs 10 en FREE)</p>
                <p style="margin: 0 0 10px 0;">✅ <strong>Analyse vidéo</strong> MP4/MOV</p>
                <p style="margin: 0 0 10px 0;">✅ <strong>API access</strong></p>
                <p style="margin: 0; color: #6366f1; font-size: 20px; font-weight: bold;">14,99€/mois</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${FRONTEND_URL}/pricing?utm_source=email&utm_medium=quota_warning&utm_campaign=upgrade"
                   style="background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Passer à PRO
                </a>
              </div>
            ` : `
              <h3 style="color: #333;">💡 Conseils pour optimiser votre quota :</h3>
              <ul style="color: #555; line-height: 1.8;">
                <li>Analysez uniquement les médias suspects</li>
                <li>Utilisez l'assistant IA pour des questions rapides</li>
                <li>Consultez l'historique pour les analyses déjà faites</li>
              </ul>

              ${user.plan === 'PRO' ? `
                <p style="color: #666;">
                  Besoin de plus ? Le plan <strong>BUSINESS</strong> offre 500 analyses/mois.<br>
                  <a href="${FRONTEND_URL}/pricing" style="color: #6366f1;">Voir les plans</a>
                </p>
              ` : ''}
            `}

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Votre quota se renouvelle le <strong>${getResetDate()}</strong>.<br>
              L'équipe FakeTect
            </p>
          </div>
        </div>
      `,
    },
    en: {
      subject: `⚠️ You've used ${percentUsed}% of your quota`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 40px 20px;">
            <h2 style="color: #f59e0b;">⚠️ Watch your quota!</h2>

            <p style="font-size: 16px; color: #333;">
              Hello ${user.name || 'dear user'},
            </p>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #92400e; font-size: 18px;">
                <strong>You've used ${user.usedMonth}/${planLimits.monthly} analyses this month</strong>
              </p>
              <div style="background: #fde68a; border-radius: 8px; height: 20px; overflow: hidden;">
                <div style="background: #f59e0b; height: 100%; width: ${percentUsed}%;"></div>
              </div>
              <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">
                ${percentUsed}% of your monthly quota
              </p>
            </div>

            ${user.plan === 'FREE' ? `
              <h3 style="color: #333;">🚀 Upgrade to PRO for more analyses</h3>
              <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;">✅ <strong>100 analyses/month</strong> (vs 10 FREE)</p>
                <p style="margin: 0 0 10px 0;">✅ <strong>Video analysis</strong> MP4/MOV</p>
                <p style="margin: 0 0 10px 0;">✅ <strong>API access</strong></p>
                <p style="margin: 0; color: #6366f1; font-size: 20px; font-weight: bold;">$14.99/month</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${FRONTEND_URL}/pricing?utm_source=email&utm_medium=quota_warning&utm_campaign=upgrade"
                   style="background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Upgrade to PRO
                </a>
              </div>
            ` : `
              <h3 style="color: #333;">💡 Tips to optimize your quota:</h3>
              <ul style="color: #555; line-height: 1.8;">
                <li>Analyze only suspicious media</li>
                <li>Use the AI assistant for quick questions</li>
                <li>Check history for already analyzed files</li>
              </ul>

              ${user.plan === 'PRO' ? `
                <p style="color: #666;">
                  Need more? The <strong>BUSINESS</strong> plan offers 500 analyses/month.<br>
                  <a href="${FRONTEND_URL}/pricing" style="color: #6366f1;">See plans</a>
                </p>
              ` : ''}
            `}

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Your quota renews on <strong>${getResetDate()}</strong>.<br>
              The FakeTect Team
            </p>
          </div>
        </div>
      `,
    },
  };

  const template = templates[user.language] || templates.fr;

  try {
    await transporter.sendMail({
      from: `"FakeTect" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    logger.info('Quota warning email sent', { userId: user.id, usedMonth: user.usedMonth });
    return true;
  } catch (error) {
    logger.error('Quota warning email error', { error: error.message, userId: user.id });
    return false;
  }
}

// Helper functions
function getPlanLimits(plan) {
  const limits = {
    FREE: { daily: 3, monthly: 10 },
    PRO: { daily: 10, monthly: 100 },
    BUSINESS: { daily: 50, monthly: 500 },
  };
  return limits[plan] || limits.FREE;
}

function getResetDate() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

module.exports = {
  sendWelcomeEmail,
  sendDay3EngagementEmail,
  sendDay7ConversionEmail,
  sendInactiveUserEmail,
  sendQuotaWarningEmail,
};
