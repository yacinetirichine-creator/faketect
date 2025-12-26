# 🔒 Guide de Sécurité pour Départements IT

## Vue d'ensemble

**FakeTect** est une plateforme de détection d'images générées par IA conçue avec la sécurité et la confidentialité comme priorités absolues. Ce document détaille nos pratiques de sécurité pour faciliter le déploiement en environnement entreprise.

---

## 🌐 Configuration Réseau

### Domaines à Whitelister

#### Production (Obligatoire)
```
https://faketect.com
https://api.faketect.com
https://*.supabase.co
```

#### Développement/Staging (Optionnel)
```
https://staging.faketect.com
https://dev-api.faketect.com
```

### Ports Requis
- **443 (HTTPS)** - Tout le trafic
- **80 (HTTP)** - Redirection automatique vers HTTPS

### Protocoles
- ✅ **TLS 1.2+** requis
- ✅ **TLS 1.3** recommandé
- ❌ TLS 1.0/1.1 désactivés
- ❌ SSL v2/v3 désactivés

---

## 🔐 Certificats SSL/TLS

### Détails du Certificat
- **Autorité** : Let's Encrypt / DigiCert
- **Type** : Domain Validated (DV) / Extended Validation (EV)
- **Algorithme** : RSA 2048-bit / ECDSA P-256
- **Validité** : Renouvelé automatiquement tous les 90 jours
- **Wildcard** : *.faketect.com

### Vérification du Certificat
```bash
# Via OpenSSL
openssl s_client -connect api.faketect.com:443 -showcerts

# Via curl
curl -vI https://api.faketect.com/api/health
```

### Pinning (Optionnel)
```
Public-Key-Pins: pin-sha256="base64+primary=="; 
                 pin-sha256="base64+backup=="; 
                 max-age=5184000; includeSubDomains
```

---

## 🛡️ En-têtes de Sécurité

### Headers HTTP Implémentés

```http
# Transport sécurisé
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# Protection XSS
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' https://www.googletagmanager.com

# Protection Clickjacking
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'

# MIME Sniffing
X-Content-Type-Options: nosniff

# Référence
Referrer-Policy: strict-origin-when-cross-origin

# Permissions
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Vérification
```bash
# Via curl
curl -I https://api.faketect.com/api/health | grep -E "^(Strict-Transport|X-Frame|X-XSS|Content-Security)"

# Via securityheaders.com
https://securityheaders.com/?q=https://api.faketect.com
```

---

## 🔒 Chiffrement

### En Transit
- **TLS 1.3** avec Perfect Forward Secrecy (PFS)
- **Ciphers autorisés** :
  ```
  TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
  TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
  TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256
  ```
- **Courbes elliptiques** : X25519, P-256, P-384
- **Hash** : SHA-256 minimum

### Au Repos
- **AES-256-GCM** pour les données sensibles
- **Argon2id** pour les mots de passe
- **Chiffrement database** : Transparent Data Encryption (TDE)

### Keys Management
- Rotation automatique tous les 90 jours
- Keys stockées dans AWS KMS / HashiCorp Vault
- Pas de clés hardcodées dans le code

---

## 🔍 Authentification & Autorisation

### Méthodes Supportées
1. **OAuth 2.0** - Google, Microsoft, GitHub
2. **JWT** - JSON Web Tokens (HS256, RS256)
3. **API Keys** - Pour intégrations programmatiques
4. **SSO/SAML** - Disponible en Enterprise

### Token JWT
```json
{
  "alg": "HS256",
  "typ": "JWT",
  "exp": 3600,
  "iss": "faketect.com",
  "aud": "api.faketect.com"
}
```

### Rate Limiting
- **Par défaut** : 60 requêtes/minute
- **Upload** : 10 fichiers/15 minutes
- **API** : 1000 requêtes/heure (Enterprise)

---

## 🛠️ APIs & Intégrations

### Endpoints Publics
```
GET  /api/health        - Health check (no auth)
GET  /api/quota         - Quota info (optional auth)
```

### Endpoints Protégés
```
POST /api/analyze/*     - Analyse (auth required)
GET  /api/history       - Historique (auth required)
POST /api/billing/*     - Facturation (auth required)
GET  /api/admin/*       - Administration (admin only)
```

### Headers Requis
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
User-Agent: VotreApp/1.0
```

### Exemple d'Appel
```bash
curl -X POST https://api.faketect.com/api/analyze/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@image.jpg"
```

---

## 🗄️ Données & Confidentialité

### Stockage des Données
- **Localisation** : Union Européenne (GDPR compliant)
- **Provider** : AWS eu-west-1 / Supabase EU
- **Backup** : Quotidien, chiffré, 30 jours de rétention
- **Disaster Recovery** : RTO 4h, RPO 1h

### Données Collectées
| Type | Durée | Chiffrement | But |
|------|-------|-------------|-----|
| Images uploadées | 24h | AES-256 | Analyse |
| Résultats analyse | 90 jours | AES-256 | Historique |
| Logs techniques | 30 jours | - | Monitoring |
| Données factu | 7 ans | AES-256 | Légal |

### Droits Utilisateurs (RGPD)
- ✅ Droit d'accès
- ✅ Droit de rectification
- ✅ Droit à l'effacement
- ✅ Droit à la portabilité
- ✅ Droit d'opposition

### Suppression des Données
```bash
# Via API
DELETE /api/user/data

# Via interface
Settings > Privacy > Delete My Data
```

---

## 🔐 Conformité & Certifications

### Réglementations
- ✅ **RGPD** (General Data Protection Regulation)
- ✅ **ePrivacy** Directive
- ✅ **CCPA** (California Consumer Privacy Act)
- ✅ **PIPEDA** (Canada)

### Certifications (en cours)
- 🔄 **ISO 27001** - Sécurité de l'information
- 🔄 **SOC 2 Type II** - Contrôles de sécurité
- 🔄 **PCI DSS** - Paiements (si applicable)
- ✅ **OWASP Top 10** - Coverage complète

### Audits
- **Penetration Testing** : Trimestriel
- **Code Review** : Continu (automatisé)
- **Vulnerability Scanning** : Quotidien
- **Audit externe** : Annuel

---

## 🚨 Incident Response

### Temps de Réponse
- **Critique** : < 1 heure
- **Haute** : < 4 heures
- **Moyenne** : < 24 heures
- **Basse** : < 7 jours

### Contact Sécurité
```
Email : security@faketect.com
PGP Key : https://faketect.com/.well-known/pgp-key.txt
Phone : +33 (0)1 XX XX XX XX (urgences uniquement)
Bug Bounty : https://faketect.com/security/bug-bounty
```

### Divulgation Responsable
Nous encourageons la divulgation responsable :
1. Envoyez un email à `security@faketect.com`
2. Incluez les détails de la vulnérabilité
3. Nous répondons sous 24-48h
4. Nous corrigeons sous 7-14 jours
5. Publication coordonnée après correction

---

## 📊 Monitoring & Logging

### Métriques Surveillées
- Tentatives d'authentification échouées
- Anomalies de trafic (DDoS)
- Erreurs 500 (bugs serveur)
- Temps de réponse API
- Taux d'erreur par endpoint

### Logs Conservés
```
[2024-12-20 10:30:15] INFO  | 192.168.1.100 | POST /api/analyze/upload | 200 | 1.2s
[2024-12-20 10:30:16] WARN  | 192.168.1.101 | Failed auth | 401
[2024-12-20 10:30:17] ERROR | 192.168.1.102 | Rate limit exceeded | 429
```

### SIEM Integration
Support pour :
- Splunk
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Datadog
- New Relic
- AWS CloudWatch

---

## 🔧 Configuration Proxy/Firewall

### Proxy d'Entreprise

#### Configuration Proxy Forward
```nginx
# Nginx
location /faketect/ {
    proxy_pass https://api.faketect.com/;
    proxy_ssl_verify on;
    proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
    proxy_ssl_protocols TLSv1.2 TLSv1.3;
    
    # Headers
    proxy_set_header Host api.faketect.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### Apache
```apache
<VirtualHost *:443>
    SSLEngine on
    SSLProxyEngine on
    SSLProxyVerify require
    SSLProxyCheckPeerCN on
    SSLProxyCheckPeerName on
    
    ProxyPass /faketect/ https://api.faketect.com/
    ProxyPassReverse /faketect/ https://api.faketect.com/
    
    RequestHeader set X-Forwarded-Proto "https"
</VirtualHost>
```

### Règles Firewall

#### IPTables
```bash
# Autoriser HTTPS sortant vers FakeTect
iptables -A OUTPUT -p tcp -d api.faketect.com --dport 443 -j ACCEPT
```

#### pfSense / OPNsense
```
Action: Pass
Interface: WAN
Protocol: TCP
Destination: faketect.com, api.faketect.com
Destination Port: 443 (HTTPS)
```

---

## 📝 Checklist Déploiement

### Avant le Déploiement
- [ ] Whitelister domaines dans firewall
- [ ] Vérifier certificat SSL/TLS
- [ ] Configurer proxy si nécessaire
- [ ] Tester connectivité : `curl https://api.faketect.com/api/health`
- [ ] Vérifier headers de sécurité
- [ ] Définir ALLOWED_ORIGINS en production

### Après le Déploiement
- [ ] Monitorer logs pendant 48h
- [ ] Vérifier rate limiting
- [ ] Tester SSO/SAML (si applicable)
- [ ] Former les utilisateurs
- [ ] Mettre à jour documentation interne

### Tests de Validation
```bash
# 1. Health check
curl https://api.faketect.com/api/health

# 2. Vérifier TLS
openssl s_client -connect api.faketect.com:443 -tls1_2

# 3. Tester upload
curl -X POST https://api.faketect.com/api/analyze/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test.jpg"

# 4. Vérifier headers sécurité
curl -I https://api.faketect.com | grep Strict-Transport-Security
```

---

## 🆘 Support & Assistance

### Contacts
- **Support Technique** : support@faketect.com
- **Sécurité** : security@faketect.com
- **Commercial** : sales@faketect.com
- **DPO** : dpo@faketect.com

### SLA (Service Level Agreement)
| Plan | Disponibilité | Support | Temps Réponse |
|------|---------------|---------|---------------|
| Free | 99% | Email | 48h |
| Pro | 99.5% | Email + Chat | 8h |
| Enterprise | 99.9% | Email + Chat + Phone | 1h |

### Documentation
- 📚 Docs : https://docs.faketect.com
- 🔐 Security : https://faketect.com/security
- 📖 API Reference : https://api.faketect.com/docs
- ❓ FAQ : https://faketect.com/faq

---

## 🔄 Mises à Jour

### Fréquence
- **Patches sécurité** : Immédiat
- **Minor updates** : Mensuel
- **Major updates** : Trimestriel

### Notification
- Email 7 jours avant (breaking changes)
- Changelog : https://faketect.com/changelog
- Status page : https://status.faketect.com

---

**Version** : 1.0  
**Date** : 20 décembre 2024  
**Contact** : it-support@faketect.com
