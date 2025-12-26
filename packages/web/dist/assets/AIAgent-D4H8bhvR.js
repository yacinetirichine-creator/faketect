import{a as E,q as a,j as t}from"./index-I-XFLW4c.js";import{r as i}from"./react-vendor-CgvQDFxH.js";import{c as F}from"./supabase-BYjjVO41.js";import"./utils-BX0FgQz7.js";const h=F(void 0,void 0);function T({isOpen:u,onClose:I}){var P;const{user:d}=E(),[r,m]=i.useState([]),[o,p]=i.useState(""),[f,y]=i.useState(!1),[x]=i.useState(()=>`session_${Date.now()}_${Math.random().toString(36).substring(7)}`),b=i.useRef(null),j={detection:{patterns:["comment","fonctionne","detection","how","works","كيف","يعمل","como","funciona","如何","工作","wie","funktioniert","как","работает"],answer:e=>{const n={fr:`FakeTect utilise **2 moteurs d'IA** (Sightengine et Illuminarty) pour analyser vos images.

Nous détectons :
- Les patterns typiques des générateurs IA (Midjourney, DALL-E, Stable Diffusion)
- Les incohérences visuelles
- Les métadonnées EXIF
- Les artefacts de génération

Précision moyenne : **92%**`,en:`FakeTect uses **2 AI engines** (Sightengine and Illuminarty) to analyze your images.

We detect:
- Typical patterns from AI generators (Midjourney, DALL-E, Stable Diffusion)
- Visual inconsistencies
- EXIF metadata
- Generation artifacts

Average accuracy: **92%**`,ar:`يستخدم FakeTect **محركين للذكاء الاصطناعي** (Sightengine و Illuminarty) لتحليل صورك.

نكتشف:
- الأنماط النموذجية من مولدات الذكاء الاصطناعي (Midjourney، DALL-E، Stable Diffusion)
- التناقضات البصرية
- بيانات EXIF الوصفية
- آثار التوليد

متوسط الدقة: **92%**`,"ar-ma":`FakeTect كيستعمل **جوج محركات ديال الذكاء الاصطناعي** (Sightengine و Illuminarty) باش يحلل الصور.

كنكشفو:
- الأنماط النموذجية من مولدات الذكاء الاصطناعي (Midjourney، DALL-E، Stable Diffusion)
- التناقضات البصرية
- بيانات EXIF الوصفية
- آثار التوليد

متوسط الدقة: **92%**`,es:`FakeTect utiliza **2 motores de IA** (Sightengine e Illuminarty) para analizar tus imágenes.

Detectamos:
- Patrones típicos de generadores de IA (Midjourney, DALL-E, Stable Diffusion)
- Inconsistencias visuales
- Metadatos EXIF
- Artefactos de generación

Precisión promedio: **92%**`,zh:`FakeTect 使用 **2个AI引擎** (Sightengine 和 Illuminarty) 来分析您的图像。

我们检测:
- AI生成器的典型模式 (Midjourney、DALL-E、Stable Diffusion)
- 视觉不一致性
- EXIF元数据
- 生成伪影

平均准确率: **92%**`,de:`FakeTect verwendet **2 KI-Engines** (Sightengine und Illuminarty) zur Bildanalyse.

Wir erkennen:
- Typische Muster von KI-Generatoren (Midjourney, DALL-E, Stable Diffusion)
- Visuelle Inkonsistenzen
- EXIF-Metadaten
- Generierungsartefakte

Durchschnittliche Genauigkeit: **92%**`,pt:`FakeTect usa **2 motores de IA** (Sightengine e Illuminarty) para analisar suas imagens.

Detectamos:
- Padrões típicos de geradores de IA (Midjourney, DALL-E, Stable Diffusion)
- Inconsistências visuais
- Metadados EXIF
- Artefatos de geração

Precisão média: **92%**`,it:`FakeTect utilizza **2 motori IA** (Sightengine e Illuminarty) per analizzare le tue immagini.

Rileviamo:
- Pattern tipici dei generatori IA (Midjourney, DALL-E, Stable Diffusion)
- Incoerenze visive
- Metadati EXIF
- Artefatti di generazione

Precisione media: **92%**`,ru:`FakeTect использует **2 движка ИИ** (Sightengine и Illuminarty) для анализа изображений.

Мы обнаруживаем:
- Типичные паттерны ИИ-генераторов (Midjourney, DALL-E, Stable Diffusion)
- Визуальные несоответствия
- Метаданные EXIF
- Артефакты генерации

Средняя точность: **92%**`};return n[e]||n.en}},formats:{patterns:["format","fichier","taille","file","size","supported","تنسيق","ملف","حجم","formato","archivo","tamaño","格式","文件","大小","datei","größe","формат","файл","размер"],answer:e=>{const n={fr:`**Formats supportés** :
- Images : JPG, PNG, WEBP, GIF, BMP
- Taille max : **10 MB** (Web) / **5 MB** (Extension Chrome)

**Qualité recommandée** :
- Résolution minimale : 512x512 px
- Évitez les images trop compressées
- Format original préféré (sans retouche)`,en:`**Supported formats**:
- Images: JPG, PNG, WEBP, GIF, BMP
- Max size: **10 MB** (Web) / **5 MB** (Chrome Extension)

**Recommended quality**:
- Minimum resolution: 512x512 px
- Avoid over-compressed images
- Original format preferred (unedited)`,ar:`**التنسيقات المدعومة**:
- الصور: JPG, PNG, WEBP, GIF, BMP
- الحجم الأقصى: **10 ميجابايت** (الويب) / **5 ميجابايت** (إضافة Chrome)

**الجودة الموصى بها**:
- الدقة الدنيا: 512x512 بكسل
- تجنب الصور المضغوطة بشدة
- التنسيق الأصلي مفضل (بدون تعديل)`,es:`**Formatos soportados**:
- Imágenes: JPG, PNG, WEBP, GIF, BMP
- Tamaño máx: **10 MB** (Web) / **5 MB** (Extensión Chrome)

**Calidad recomendada**:
- Resolución mínima: 512x512 px
- Evita imágenes muy comprimidas
- Formato original preferido (sin editar)`,zh:`**支持的格式**:
- 图像: JPG, PNG, WEBP, GIF, BMP
- 最大尺寸: **10 MB** (网页) / **5 MB** (Chrome扩展)

**推荐质量**:
- 最小分辨率: 512x512 像素
- 避免过度压缩的图像
- 首选原始格式 (未编辑)`};return n[e]||n.en}},pricing:{patterns:["prix","tarif","abonnement","price","pricing","subscription","plan","سعر","اشتراك","precio","suscripción","价格","订阅","preis","abonnement","цена","подписка"],answer:e=>{const n={fr:`**Nos plans** :

🆓 **Gratuit**
- 10 analyses/jour
- Historique 30 jours
- Certificats basiques

⭐ **Starter - 9,99€/mois**
- 100 analyses/jour
- Historique illimité
- Certificats Pro + signature
- Support prioritaire

🚀 **Professional - 29,99€/mois**
- 500 analyses/jour
- API complète
- Support 24/7
- Analytics dashboard

✅ **14 jours** de garantie satisfait ou remboursé`,en:`**Our plans**:

🆓 **Free**
- 10 analyses/day
- 30-day history
- Basic certificates

⭐ **Starter - $9.99/month**
- 100 analyses/day
- Unlimited history
- Pro certificates + signature
- Priority support

🚀 **Professional - $29.99/month**
- 500 analyses/day
- Full API
- 24/7 support
- Analytics dashboard

✅ **14-day** money-back guarantee`};return n[e]||n.en}},certificates:{patterns:["certificat","certificate","rapport","report","pdf","شهادة","تقرير","certificado","informe","证书","报告","zertifikat","bericht","сертификат","отчет"],answer:e=>{const n={fr:`**Certificats authentifiés** :

📄 **Utilisateurs Starter/Pro** :
- Certificat PDF avec signature numérique
- Logo FakeTect + métadonnées d'analyse
- Valeur probatoire pour vos besoins légaux
- Téléchargement immédiat après analyse

🔐 **Sécurité** :
- Hash SHA-256 de l'image
- Horodatage certifié
- QR Code de vérification

✅ Utilisable pour :
- Réseaux sociaux (vérification)
- Médias (fact-checking)
- Tribunaux (expertise)`,en:`**Authenticated certificates**:

📄 **Starter/Pro users**:
- PDF certificate with digital signature
- FakeTect logo + analysis metadata
- Legal probative value
- Instant download after analysis

🔐 **Security**:
- Image SHA-256 hash
- Certified timestamp
- Verification QR Code

✅ Usable for:
- Social media (verification)
- Media (fact-checking)
- Courts (expertise)`};return n[e]||n.en}},accuracy:{patterns:["précision","fiable","confiance","accuracy","reliable","trust","دقة","موثوق","precisión","confiable","准确","可靠","genauigkeit","zuverlässig","точность","надежный"],answer:e=>{const n={fr:`**Précision de FakeTect** :

📊 **Statistiques globales** :
- Précision moyenne : **92%**
- Faux positifs : ~5%
- Faux négatifs : ~3%

⚠️ **Limites connues** :
- Images fortement compressées (JPEG qualité <70%)
- Contenus hybrides (IA + retouche humaine)
- Générateurs récents non entraînés

✅ **Meilleure performance** :
- Images originales (PNG/WEBP)
- Résolution > 1024x1024
- Générateurs populaires (Midjourney, DALL-E)

💡 **Conseil** : Combinez toujours avec votre jugement humain`,en:`**FakeTect accuracy**:

📊 **Global statistics**:
- Average accuracy: **92%**
- False positives: ~5%
- False negatives: ~3%

⚠️ **Known limitations**:
- Heavily compressed images (JPEG quality <70%)
- Hybrid content (AI + human editing)
- Recent untrained generators

✅ **Best performance**:
- Original images (PNG/WEBP)
- Resolution > 1024x1024
- Popular generators (Midjourney, DALL-E)

💡 **Tip**: Always combine with your human judgment`};return n[e]||n.en}},api:{patterns:["api","intégration","integration","développeur","developer","تكامل","مطور","integración","desarrollador","集成","开发者","entwickler","разработчик"],answer:e=>{const n={fr:`**API FakeTect** :

🔌 **Disponibilité** :
- Plan **Starter** : Accès bêta (limité)
- Plan **Professional** : API complète

📚 **Documentation** :
- Endpoint : \`https://api.faketect.com/v1/analyze\`
- Auth : Bearer Token (JWT)
- Rate limit : 100 req/min (Starter), 500 req/min (Pro)

**Exemple de requête** :
\`\`\`bash
curl -X POST https://api.faketect.com/v1/analyze \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -F 'image=@photo.jpg'
\`\`\`

📖 Docs complètes : [docs/api](/docs/api)`,en:`**FakeTect API**:

🔌 **Availability**:
- **Starter** plan: Beta access (limited)
- **Professional** plan: Full API

📚 **Documentation**:
- Endpoint: \`https://api.faketect.com/v1/analyze\`
- Auth: Bearer Token (JWT)
- Rate limit: 100 req/min (Starter), 500 req/min (Pro)

**Example request**:
\`\`\`bash
curl -X POST https://api.faketect.com/v1/analyze \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -F 'image=@photo.jpg'
\`\`\`

📖 Full docs: [docs/api](/docs/api)`};return n[e]||n.en}},support:{patterns:["support","aide","contact","help","assistance","دعم","مساعدة","اتصال","ayuda","contacto","支持","帮助","联系","hilfe","kontakt","поддержка","помощь","контакт"],answer:e=>{const n={fr:`**Besoin d'aide ?** 🤝

📧 **Email** :
- Support général : support@faketect.com
- DPO (RGPD) : dpo@faketect.com
- Juridique : legal@faketect.com
- Réclamations : complaints@faketect.com

⏱️ **Temps de réponse** :
- Gratuit : 48h
- Starter : 24h
- Professional : <6h (support prioritaire 24/7)

💬 **Chat en direct** :
- Disponible pour les plans Starter/Pro
- Lun-Ven 9h-18h CET

📍 **Adresse** :
JARVIS
123 Avenue des Champs-Élysées
75008 Paris, France`,en:`**Need help?** 🤝

📧 **Email**:
- General support: support@faketect.com
- DPO (GDPR): dpo@faketect.com
- Legal: legal@faketect.com
- Complaints: complaints@faketect.com

⏱️ **Response time**:
- Free: 48h
- Starter: 24h
- Professional: <6h (24/7 priority support)

💬 **Live chat**:
- Available for Starter/Pro plans
- Mon-Fri 9am-6pm CET

📍 **Address**:
JARVIS
123 Avenue des Champs-Élysées
75008 Paris, France`};return n[e]||n.en}}},A=e=>{const n=e.toLowerCase();for(const[g,l]of Object.entries(j))if(l.patterns.some(k=>n.includes(k)))return l.answer(a.getLocale());const c=a.getLocale(),s={fr:`Je n'ai pas compris votre question. Voici ce que je peux vous aider :

- Comment fonctionne la détection ?
- Quels formats sont supportés ?
- Quels sont les tarifs ?
- Comment obtenir un certificat ?
- Quelle est la précision ?
- Comment utiliser l'API ?
- Comment contacter le support ?

Posez votre question différemment ou tapez **'aide'** pour voir toutes les options.`,en:`I didn't understand your question. Here's what I can help with:

- How does detection work?
- What formats are supported?
- What are the prices?
- How to get a certificate?
- What's the accuracy?
- How to use the API?
- How to contact support?

Rephrase your question or type **'help'** to see all options.`,ar:`لم أفهم سؤالك. إليك ما يمكنني مساعدتك فيه:

- كيف يعمل الكشف؟
- ما التنسيقات المدعومة؟
- ما الأسعار؟
- كيف أحصل على شهادة؟
- ما الدقة؟
- كيف أستخدم API؟
- كيف أتواصل مع الدعم؟

أعد صياغة سؤالك أو اكتب **'مساعدة'** لرؤية جميع الخيارات.`};return s[c]||s.en};i.useEffect(()=>{u&&r.length===0&&m([{role:"assistant",content:a.t("chatbot.welcome"),timestamp:new Date}])},[u]),i.useEffect(()=>{var e;(e=b.current)==null||e.scrollIntoView({behavior:"smooth"})},[r]);const w=async e=>{try{if(!d)return;const n={user_id:d.id,user_email:d.email,session_id:x,messages:e.map(s=>({role:s.role,content:s.content,timestamp:s.timestamp.toISOString()})),last_message_at:new Date().toISOString(),status:"open"},{data:c}=await h.from("support_conversations").select("id").eq("session_id",x).single();c?await h.from("support_conversations").update(n).eq("id",c.id):await h.from("support_conversations").insert(n)}catch(n){console.error("Erreur sauvegarde conversation:",n)}},v=async()=>{if(!o.trim())return;const e={role:"user",content:o,timestamp:new Date},n=[...r,e];m(n),p(""),y(!0),await new Promise(l=>setTimeout(l,300));const s={role:"assistant",content:A(o),timestamp:new Date},g=[...n,s];m(g),y(!1),w(g)},S=e=>{e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),v())};return u?t.jsxs("div",{className:"fixed bottom-4 right-4 z-50 w-96 h-[600px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col",children:[t.jsxs("div",{className:"p-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-primary-500/10 to-purple-500/10",children:[t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx("div",{className:"w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center",children:t.jsx("span",{className:"text-xl",children:"🤖"})}),t.jsxs("div",{children:[t.jsx("h3",{className:"text-white font-semibold",children:a.t("chatbot.title")}),t.jsx("p",{className:"text-xs text-gray-400",children:a.t("common.appName")})]})]}),t.jsx("button",{onClick:I,className:"text-gray-400 hover:text-white transition","aria-label":a.t("common.close"),children:t.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:t.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),t.jsxs("div",{className:"flex-1 overflow-y-auto p-4 space-y-4",children:[r.map((e,n)=>t.jsx("div",{className:`flex ${e.role==="user"?"justify-end":"justify-start"}`,children:t.jsxs("div",{className:`max-w-[85%] rounded-2xl px-4 py-2 ${e.role==="user"?"bg-primary-500 text-white":"bg-gray-800 text-gray-100"}`,children:[t.jsx("div",{className:"whitespace-pre-wrap text-sm",dangerouslySetInnerHTML:{__html:e.content.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br />")}}),t.jsx("div",{className:"text-xs opacity-70 mt-1",children:e.timestamp.toLocaleTimeString(a.getLocale(),{hour:"2-digit",minute:"2-digit"})})]})},n)),f&&t.jsx("div",{className:"flex justify-start",children:t.jsx("div",{className:"bg-gray-800 rounded-2xl px-4 py-3",children:t.jsxs("div",{className:"flex gap-2",children:[t.jsx("div",{className:"w-2 h-2 bg-primary-400 rounded-full animate-bounce",style:{animationDelay:"0ms"}}),t.jsx("div",{className:"w-2 h-2 bg-primary-400 rounded-full animate-bounce",style:{animationDelay:"150ms"}}),t.jsx("div",{className:"w-2 h-2 bg-primary-400 rounded-full animate-bounce",style:{animationDelay:"300ms"}})]})})}),t.jsx("div",{ref:b})]}),r.length===1&&t.jsx("div",{className:"px-4 pb-2",children:t.jsx("div",{className:"flex flex-wrap gap-2",children:(P=a.getSection("chatbot").suggestions)==null?void 0:P.map((e,n)=>t.jsx("button",{onClick:()=>p(e),className:"text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full transition",children:e},n))})}),t.jsx("div",{className:"p-4 border-t border-gray-700",children:t.jsxs("div",{className:"flex gap-2",children:[t.jsx("input",{type:"text",value:o,onChange:e=>p(e.target.value),onKeyPress:S,placeholder:a.t("chatbot.placeholder"),className:"flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500",disabled:f}),t.jsx("button",{onClick:v,disabled:!o.trim()||f,className:"bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition","aria-label":a.t("chatbot.send"),children:t.jsx("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:t.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 19l9 2-9-18-9 18 9-2zm0 0v-8"})})})]})})]}):null}export{T as default};
