const { body, param, query, validationResult } = require('express-validator');
const logger = require('../config/logger');

// Middleware pour vérifier les résultats de validation
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      errors: errors.array(),
      url: req.originalUrl,
      body: req.body
    });
    return res.status(400).json({ 
      error: 'Données invalides', 
      details: errors.array() 
    });
  }
  next();
};

// Validations pour l'authentification
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email trop long'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Le nom contient des caractères invalides'),
  body('language')
    .optional()
    .isIn(['fr', 'en', 'es', 'de', 'pt', 'it'])
    .withMessage('Langue non supportée'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Numéro de téléphone invalide'),
  body('acceptMarketing')
    .optional()
    .isBoolean()
    .withMessage('acceptMarketing doit être un booléen'),
  validate
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis'),
  validate
];

// Validations pour les analyses
const analysisValidation = [
  body('type')
    .optional()
    .isIn(['image', 'video', 'text', 'url'])
    .withMessage('Type d\'analyse invalide'),
  validate
];

const textAnalysisValidation = [
  body('text')
    .notEmpty()
    .withMessage('Texte requis')
    .isLength({ min: 10, max: 10000 })
    .withMessage('Le texte doit contenir entre 10 et 10000 caractères')
    .trim(),
  validate
];

// Validations pour les paramètres d'URL
const idValidation = [
  param('id')
    .isUUID()
    .withMessage('ID invalide'),
  validate
];

// Validations pour les profils
const profileUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Le nom contient des caractères invalides'),
  body('language')
    .optional()
    .isIn(['fr', 'en', 'es', 'de', 'pt', 'it'])
    .withMessage('Langue non supportée'),
  validate
];

// Validations pour Stripe
const stripeCheckoutValidation = [
  body('planId')
    .isIn(['STANDARD', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'])
    .withMessage('Plan invalide'),
  body('billing')
    .isIn(['monthly', 'yearly'])
    .withMessage('Mode de facturation invalide'),
  body('locale')
    .optional()
    .isIn(['fr', 'en', 'es', 'de', 'pt', 'it'])
    .withMessage('Locale invalide'),
  validate
];

// Validations pour l'admin
const updatePlanValidation = [
  param('userId')
    .isUUID()
    .withMessage('ID utilisateur invalide'),
  body('plan')
    .isIn(['FREE', 'STANDARD', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'])
    .withMessage('Plan invalide'),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  analysisValidation,
  textAnalysisValidation,
  idValidation,
  profileUpdateValidation,
  stripeCheckoutValidation,
  updatePlanValidation
};
