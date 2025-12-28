const nodemailer = require('nodemailer');

/**
 * Service d'envoi d'emails via Google Workspace (Gmail)
 * Fallback gracieux : si non configuré, l'app continue sans emails
 */

let transporter = null;
let emailEnabled = false;

// Initialiser le transporteur email
function initEmail() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailFrom = process.env.EMAIL_FROM || emailUser;

  if (!emailUser || !emailPass) {
    console.log('⚠️  Email non configuré - notifications désactivées (mode dégradé)');
    return;
  }

  try {
    // Configuration pour Google Workspace
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true pour 465, false pour autres ports
      auth: {
        user: emailUser,
        pass: emailPass // Mot de passe du compte Google Workspace
      },
      tls: {
        rejectUnauthorized: false // Pour éviter les erreurs de certificat
      }
    });

    // Vérifier la connexion
    transporter.verify((error) => {
      if (error) {
        console.error('❌ Erreur configuration email:', error.message);
        emailEnabled = false;
      } else {
        emailEnabled = true;
        console.log('✅ Email configuré - notifications activées');
      }
    });

  } catch (error) {
    console.error('❌ Erreur initialisation email:', error.message);
    emailEnabled = false;
  }
}

/**
 * Envoyer un email
 * @param {object} options - Options de l'email
 * @param {string} options.to - Destinataire
 * @param {string} options.subject - Sujet
 * @param {string} options.html - Contenu HTML
 * @param {string} options.text - Contenu texte (optionnel)
 * @returns {Promise<boolean>}
 */
async function sendEmail({ to, subject, html, text }) {
  if (!emailEnabled || !transporter) {
    console.log(`⚠️  Email non envoyé (désactivé): ${subject} → ${to}`);
    return false;
  }

  try {
    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    
    const mailOptions = {
      from: `"FakeTect" <${emailFrom}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Fallback texte simple
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé: ${subject} → ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur envoi email: ${error.message}`);
    return false;
  }
}

/**
 * Email de bienvenue après inscription
 */
async function sendWelcomeEmail(user) {
  const subject = user.language === 'fr' ? '🎉 Bienvenue sur FakeTect !' : '🎉 Welcome to FakeTect!';
  
  const messages = {
    fr: {
      title: 'Bienvenue sur FakeTect !',
      intro: `Bonjour ${user.name || 'Utilisateur'},`,
      text1: 'Merci de vous être inscrit sur <strong>FakeTect</strong>, votre plateforme de détection de contenu généré par IA.',
      text2: 'Avec votre compte <strong>FREE</strong>, vous bénéficiez de :',
      feature1: '✅ 10 tests d\'analyse gratuits',
      feature2: '📅 Valables pendant 30 jours',
      feature3: '🔍 Détection avancée d\'images, vidéos et textes',
      cta: 'Commencer l\'analyse',
      footer: 'Si vous avez des questions, répondez simplement à cet email.'
    },
    en: {
      title: 'Welcome to FakeTect!',
      intro: `Hello ${user.name || 'User'},`,
      text1: 'Thank you for signing up for <strong>FakeTect</strong>, your AI-generated content detection platform.',
      text2: 'With your <strong>FREE</strong> account, you get:',
      feature1: '✅ 10 free analysis tests',
      feature2: '📅 Valid for 30 days',
      feature3: '🔍 Advanced detection for images, videos and texts',
      cta: 'Start analyzing',
      footer: 'If you have any questions, just reply to this email.'
    }
  };

  const lang = user.language || 'fr';
  const msg = messages[lang] || messages.fr;
  const frontendUrl = process.env.FRONTEND_URL || 'https://faketect.vercel.app';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .feature { padding: 10px 0; }
    .cta { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🛡️ ${msg.title}</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 10px;">${msg.intro}</p>
      <p>${msg.text1}</p>
      <p>${msg.text2}</p>
      
      <div class="features">
        <div class="feature">${msg.feature1}</div>
        <div class="feature">${msg.feature2}</div>
        <div class="feature">${msg.feature3}</div>
      </div>

      <div class="cta">
        <a href="${frontendUrl}/dashboard" class="button">${msg.cta}</a>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">${msg.footer}</p>
    </div>
    <div class="footer">
      <p>FakeTect - Détection IA Professionnelle<br>
      <a href="${frontendUrl}/legal/privacy" style="color: #667eea;">Politique de confidentialité</a> | 
      <a href="${frontendUrl}/legal/cgu" style="color: #667eea;">CGU</a></p>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html
  });
}

/**
 * Email d'alerte limite FREE atteinte (10/10)
 */
async function sendLimitReachedEmail(user) {
  const subject = user.language === 'fr' ? '⚠️ Limite FREE atteinte - Passez à un plan supérieur' : '⚠️ FREE limit reached - Upgrade your plan';
  
  const messages = {
    fr: {
      title: 'Limite atteinte !',
      intro: `Bonjour ${user.name || 'Utilisateur'},`,
      text1: 'Vous avez utilisé vos <strong>10 tests gratuits</strong>. 🎉',
      text2: 'Pour continuer à analyser vos contenus, passez à un plan payant :',
      plan1: '<strong>STANDARD</strong> - 9,99€ HT/mois - 10 analyses/jour',
      plan2: '<strong>PROFESSIONAL</strong> - 29,99€ HT/mois - 50 analyses/jour',
      plan3: '<strong>BUSINESS</strong> - 89€ HT/mois - 200 analyses/jour',
      cta: 'Voir les plans',
      footer: 'Votre compte FREE reste valide 30 jours après inscription.'
    },
    en: {
      title: 'Limit reached!',
      intro: `Hello ${user.name || 'User'},`,
      text1: 'You have used your <strong>10 free tests</strong>. 🎉',
      text2: 'To continue analyzing your content, upgrade to a paid plan:',
      plan1: '<strong>STANDARD</strong> - €9.99 excl. VAT/month - 10 analyses/day',
      plan2: '<strong>PROFESSIONAL</strong> - €29.99 excl. VAT/month - 50 analyses/day',
      plan3: '<strong>BUSINESS</strong> - €89 excl. VAT/month - 200 analyses/day',
      cta: 'View plans',
      footer: 'Your FREE account remains valid for 30 days after registration.'
    }
  };

  const lang = user.language || 'fr';
  const msg = messages[lang] || messages.fr;
  const frontendUrl = process.env.FRONTEND_URL || 'https://faketect.vercel.app';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .plans { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .plan { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .plan:last-child { border-bottom: none; }
    .cta { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">⚠️ ${msg.title}</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 10px;">${msg.intro}</p>
      <p>${msg.text1}</p>
      <p>${msg.text2}</p>
      
      <div class="plans">
        <div class="plan">${msg.plan1}</div>
        <div class="plan">${msg.plan2}</div>
        <div class="plan">${msg.plan3}</div>
      </div>

      <div class="cta">
        <a href="${frontendUrl}/pricing" class="button">${msg.cta}</a>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">${msg.footer}</p>
    </div>
    <div class="footer">
      <p>FakeTect - Détection IA Professionnelle</p>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html
  });
}

/**
 * Email de rappel 7 jours avant suppression compte inactif
 */
async function sendDeletionWarningEmail(user, daysUntilDeletion = 7) {
  const subject = user.language === 'fr' 
    ? `⏰ Votre compte FakeTect sera supprimé dans ${daysUntilDeletion} jours` 
    : `⏰ Your FakeTect account will be deleted in ${daysUntilDeletion} days`;
  
  const messages = {
    fr: {
      title: 'Compte inactif',
      intro: `Bonjour ${user.name || 'Utilisateur'},`,
      text1: `Votre compte FREE est inactif depuis plus de ${30 - daysUntilDeletion} jours.`,
      text2: `Conformément à notre politique, les comptes FREE inactifs sont supprimés après 30 jours.`,
      text3: `Votre compte sera supprimé dans <strong>${daysUntilDeletion} jours</strong> si vous ne vous connectez pas.`,
      action: 'Pour conserver votre compte, il suffit de vous connecter ou de passer à un plan payant.',
      cta: 'Me connecter',
      footer: 'Si vous ne souhaitez pas conserver ce compte, ignorez cet email.'
    },
    en: {
      title: 'Inactive account',
      intro: `Hello ${user.name || 'User'},`,
      text1: `Your FREE account has been inactive for more than ${30 - daysUntilDeletion} days.`,
      text2: `According to our policy, inactive FREE accounts are deleted after 30 days.`,
      text3: `Your account will be deleted in <strong>${daysUntilDeletion} days</strong> if you don't log in.`,
      action: 'To keep your account, just log in or upgrade to a paid plan.',
      cta: 'Log in',
      footer: 'If you don\'t want to keep this account, ignore this email.'
    }
  };

  const lang = user.language || 'fr';
  const msg = messages[lang] || messages.fr;
  const frontendUrl = process.env.FRONTEND_URL || 'https://faketect.vercel.app';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .cta { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">⏰ ${msg.title}</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 10px;">${msg.intro}</p>
      <p>${msg.text1}</p>
      <p>${msg.text2}</p>
      
      <div class="warning">
        <p style="margin: 0;">${msg.text3}</p>
      </div>

      <p>${msg.action}</p>

      <div class="cta">
        <a href="${frontendUrl}/login" class="button">${msg.cta}</a>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">${msg.footer}</p>
    </div>
    <div class="footer">
      <p>FakeTect - Détection IA Professionnelle</p>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html
  });
}

/**
 * Vérifier si les emails sont activés
 */
function isEnabled() {
  return emailEnabled;
}

module.exports = {
  initEmail,
  sendEmail,
  sendWelcomeEmail,
  sendLimitReachedEmail,
  sendDeletionWarningEmail,
  isEnabled
};
