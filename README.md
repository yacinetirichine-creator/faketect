# 🔍 FakeTect - Détection IA & Deepfakes

## 📁 Structure
```
faketect/
├── backend/         # API Express + Prisma
├── frontend/        # React + Vite + Tailwind
└── README.md
```

## 🚀 Installation VS Code

### Prérequis
- Node.js 18+ (https://nodejs.org)
- Compte Supabase gratuit (https://supabase.com)

### Extensions VS Code recommandées
- ESLint, Prettier, Tailwind CSS IntelliSense, Prisma

## ⚙️ Configuration

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# Éditez .env avec vos clés Supabase
npx prisma generate
npx prisma db push
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Ouvrir http://localhost:5173

## 🔑 Configuration .env (backend)
```env
DATABASE_URL="postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres"
JWT_SECRET=votre-secret-32-caracteres
PORT=3001
FRONTEND_URL=http://localhost:5173
# Optionnel
STRIPE_SECRET_KEY=sk_test_xxx
SIGHTENGINE_USER=xxx
SIGHTENGINE_SECRET=xxx
```

## 💰 Plans
| Plan | Prix | Analyses |
|------|------|----------|
| Free | 0€ | 3/jour |
| Starter | 12€/mois | 100/mois |
| Pro | 34€/mois | 500/mois |
| Business | 89€/mois | 2000/mois |
| Enterprise | 249€/mois | Illimité |

## 📋 Fonctionnalités
- ✅ Auth JWT, Multi-langue (9 langues), Dashboard user/admin
- ✅ Analyse images IA, Historique, Plans Stripe

## 🛠️ Commandes
```bash
# Backend
npm run dev          # Dev
npx prisma studio    # BDD

# Frontend  
npm run dev          # Dev
npm run build        # Prod
```
