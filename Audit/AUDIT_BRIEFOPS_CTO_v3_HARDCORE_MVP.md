# Audit Complet BriefOPS

Date: 2026-04-28
Auteur: CTO Audit (MVP terrain)
Contexte: audit orienté fiabilite reelle (terrain degrade: pluie, faible batterie, reseau instable)

## Cadre MVP strict utilise pour cet audit

MVP autorise uniquement:
- creation de briefing
- activation/desactivation de modules
- export PDF
- partage du briefing
- restriction simple par abonnement (Stripe)

Tout le reste est traite comme hors-scope MVP potentiel.

---

## 1. Audit Architecture & Product Engineering

### 🟢 Points de force
- Monorepo unifie avec Next.js App Router + API routes en place.
- Dossier `archive/` isole le legacy au lieu de le melanger dans le runtime actif.
- Separation marketing/app deja pensee via `middleware.ts` + routage multi-host.
- APIs critiques MVP existent: `briefings`, `modules`, `pdf`, `share`, `stripe`.

### 🔴 Risques critiques & dette
- Architecture hybride lourde: Next App Router + SPA React Router catch-all (`app/[[...slug]]/spa-page.tsx`, `src/router.tsx`). Dette cognitive immediate.
- Duplication de paradigmes front: pages server Next + shell client SPA. Risque de regressions de navigation et de perf mobile.
- Routes MVP dupliquees pour PDF/export:
  - `GET /api/pdf/:id`
  - `POST /api/briefings/:id/export`
  - `POST /api/briefings/:id/export/:exportId/generate`
  - `GET /api/briefing-exports/:id/download`
  Complexite inutile pour un MVP.
- Drift de nomenclature `org` vs `workspace` encore visible dans SQL/types/API. Source de bugs subtils.
- Gros perimetre fonctionnel hors MVP deja en prod (staff, support, status, docs, notifications, settings etendues).

### ⚡ Quick wins (actionnables)
- Nommer officiellement une seule voie PDF MVP (ex: `/api/pdf/:id`) et marquer les autres routes comme "non supportees MVP".
- Introduire une checklist anti-duplication pour toute nouvelle route API.
- Geler toute nouvelle feature hors scope jusqu'a stabilisation des flux critiques.
- Ajouter un document `MVP_SCOPE.md` versionne, relie aux PR.

### 🗑️ Suggestions de suppression
- Mettre hors menu UI (feature flag) les ecrans non MVP: `Staff`, `Notifications`, `Help/Support` (optionnel), `Status`.
- Supprimer du parcours principal tout ce qui n'ameliore pas creation brief + export + partage + billing.
- Retirer les variantes de flux export qui ne sont pas utilisees dans le chemin principal utilisateur.

---

## 2. Audit Base de Donnees & Securite (Supabase)

### 🟢 Points de force
- RLS activee et forcee sur tables critiques (`profiles`, `workspaces`, `memberships`, `briefings`, etc.).
- Policies structurees par role (`owner/admin/member`) et par appartenance workspace.
- Fonctions SQL de garde-fou pour controle d'appartenance/role.
- Tokens de liens publics non triviaux (`randomBytes(24)` -> base64url).

### 🔴 Risques critiques & dette
- `schema.sql` melange etat legacy/compat (forte presence `org_id`) alors que le runtime app parle `workspace_id`. Gros risque de drift schema/environnements.
- Usage large du service role dans de nombreuses routes. Si une verification applicative est oubliee, RLS est contournee.
- Politique anon de lecture via token (`public_links`, `briefings`, `briefing_modules`) est legitime pour partage public, mais augmente fortement la surface d'exposition en cas de fuite URL.
- Table `memberships` impose `unique(user_id)`: un utilisateur = un seul workspace. OK pour MVP ultra strict, mais verrou produit fort.
- Rate limit in-memory uniquement (pas distribue): inefficace en multi-instance Vercel contre abus reels.

### ⚡ Quick wins (actionnables)
- Declarer `supabase/schema.sql` comme artefact historique et s'appuyer uniquement sur migrations ordonnees pour prod.
- Ajouter un audit automatise qui detecte references legacy `org_id` dans code runtime.
- Passer les endpoints sensibles a un rate limit distribue (Redis/KV) pour partage, PDF, auth hint.
- Tracer explicitement tous les chemins service-role avec tests d'autorisation par endpoint.

### 🗑️ Suggestions de suppression
- Supprimer wrappers compat `org` quand migration totale `workspace` est terminee.
- Eliminer policies/fonctions SQL redondantes encore presentes pour compat legacy des qu'inutiles.

---

## 3. Audit Flux de Paiement (Stripe)

### 🟢 Points de force
- Signature webhook verifiee.
- Protection anti doublon webhook via table `stripe_webhook_events` (idempotence de base).
- Synchronisation plan/subscription/customer prevue dans `src/stripe/webhook.ts`.
- Checkout + portal + webhook separes proprement.

### 🔴 Risques critiques & dette
- Incoherence produit/prix: `bodySchema` accepte `guest/funder/enterprise`, mais `getStripePriceIdForPlan` ne mappe vraiment que `starter` et `pro`. Risque de confusion commerciale.
- Logique Stripe devenue massive avec branches fallback legacy (colonnes manquantes, tables absentes), signe de dette forte.
- En cas d'erreur pendant traitement webhook, l'event est "release" (delete), donc retraitement possible infini si bug persistant.
- Endpoint appele par le front inexistant: `POST /api/onboarding/activate-plan` est utilise cote client mais route absente en actif. C'est une rupture directe du parcours onboarding payant.

### ⚡ Quick wins (actionnables)
- Corriger immediatement le contrat plan/prix: n'exposer que les plans reellement facturables MVP.
- Ajouter tests d'integration webhook pour cycles reessai et echec persistant.
- Creer la route manquante `POST /api/onboarding/activate-plan` ou supprimer son usage front aujourd'hui.
- Afficher des erreurs billing explicites cote UI (plan indisponible, incoherence prix, customer absent).

### 🗑️ Suggestions de suppression
- Retirer les plans non MVP tant qu'ils ne sont pas actives de bout en bout (pricing + checkout + webhook + quotas).
- Retirer branches fallback legacy Stripe une fois migration schema finalisee.

---

## 4. Audit UX Terrain (Mobile-First)

### 🟢 Points de force
- UI globalement lisible et orientee cartes/actions.
- Creation de briefing rapide accessible depuis la page briefings.
- Download PDF direct depuis l'app, usage simple.
- Pages publiques de briefing existent pour partage rapide sans auth.

### 🔴 Risques critiques & dette
- Poids et complexite du shell SPA dans Next peuvent penaliser time-to-interactive sur reseau faible.
- Le mode fallback "demo data" en cas d'erreur API (ex: `getBriefingsWithFallback`) peut masquer un incident reel a l'utilisateur terrain.
- Multiples ecrans non MVP augmentent la charge mentale mobile (navigation plus lourde).
- Absence de vraie strategie offline/poor-network (pas de mode degrade explicite, pas de cache resilient cible metier).

### ⚡ Quick wins (actionnables)
- Prioriser en UI un "mode terrain": 3 actions en haut (ouvrir briefing, exporter PDF, partager).
- Afficher un bandeau clair "Connexion instable - donnees potentiellement non a jour" au lieu d'un fallback silencieux.
- Limiter les chargements critiques au strict necessaire sur route `briefings/:id`.
- Ajouter un timer/perf budget: info cle <10s en 4G mediocre.

### 🗑️ Suggestions de suppression
- Cacher temporairement les vues secondaires (staff/docs/notifications) en mobile tant que MVP non stabilise.
- Retirer effets/surcouches UI non necessaires sur les ecrans ops critiques.

---

## 5. Audit Generation PDF & Storage

### 🟢 Points de force
- Pipeline PDF operationnel avec upload storage et URL signee.
- Quotas PDF et watermark plan integres.
- Liens equipes/audience existants pour partage cible.

### 🔴 Risques critiques & dette
- Deux pipelines de generation PDF coexistent (direct + export job): risque de divergence fonctionnelle.
- `puppeteer-core + @sparticuz/chromium` sur serverless: couteux et sensible aux timeouts/froids demarrages.
- Dans `POST /api/briefings/:id/export/:exportId/generate`, le quota est incremente avant la fin complete du pipeline; en cas d'echec apres increment, le quota peut etre "mange".
- Aucune file de jobs robuste (retry structure, backoff, dead-letter) pour gros volume.

### ⚡ Quick wins (actionnables)
- Garder un seul flux PDF MVP et instrumenter strictement sa latence et ses erreurs.
- Inverser l'ordre quota: consommer quota uniquement apres upload reussi + statut `ready` persiste.
- Ajouter retry simple avec borne (ex: 2 essais) sur upload storage.
- Ajouter metriques: temps render, taille pdf, taux echec par plan.

### 🗑️ Suggestions de suppression
- Supprimer les endpoints export redondants si le flux direct couvre deja le besoin MVP.
- Desactiver options PDF non essentielles (variantes non critiques) tant que stabilite non prouvee.

---

## 6. Audit Gestion d'Erreurs & Monitoring

### 🟢 Points de force
- `HttpError` + mapping code applicatif presents.
- Sentry integre client/serveur/API.
- `request_id` retourne dans les erreurs API (bon pour support).

### 🔴 Risques critiques & dette
- Captures Sentry nombreuses mais risque de bruit eleve sans budget d'alertes bien calibre.
- Plusieurs handlers renvoient des erreurs generiques qui n'aident pas l'operateur terrain.
- Fallback demo data en prod peut retarder detection d'incident reel.

### ⚡ Quick wins (actionnables)
- Definir 5 alertes critiques seulement (Auth down, PDF fail spike, Webhook fail spike, Storage fail, RLS denied spike).
- Uniformiser les messages utilisateurs sur actions terrain critiques.
- Ajouter un event analytique explicite "fallback_demo_mode_entered" pour differencier simulation et panne.

### 🗑️ Suggestions de suppression
- Retirer tout logging non actionnable dans les chemins frequents.
- Supprimer les captures d'erreur faibles sans valeur operationnelle.

---

## 7. Audit Landing Page & Conversion

### 🟢 Points de force
- Proposition de valeur lisible, structure hero/features/workflow claire.
- Localisation FR/NL/EN en place.
- CTA directs vers login/register app.

### 🔴 Risques critiques & dette
- Le message conversion est bon, mais l'app derriere expose encore trop de surface non MVP, ce qui augmente la friction post-click.
- Credibilite "terrain critique" pas assez renforcee par preuves concretes (fiabilite, SLA implicite, retours ops, etc.).
- Risque de promesse marketing > fiabilite runtime actuelle (notamment onboarding payant casse).

### ⚡ Quick wins (actionnables)
- Aligner promesse landing sur le MVP reel: "briefing + PDF + partage + controle abonnement".
- Ajouter preuves courtes: rapidite d'acces, usage mobile terrain, export robuste.
- Ajouter un CTA unique principal (demarrer) + secondaire discret.

### 🗑️ Suggestions de suppression
- Supprimer tout wording impliquant une suite fonctionnelle non disponible de maniere fiable.
- Eviter de pousser des parcours secondaires avant activation premier briefing.

---

## 8. Audit Parcours Utilisateur End-to-End

Parcours simule: landing -> compte -> briefing -> edition -> PDF -> partage

### 🟢 Points de force
- Creation briefing et edition modulaires couvrent bien le coeur de valeur.
- Export PDF et partage existent techniquement.
- Test e2e present sur flux principal (mocke).

### 🔴 Risques critiques & dette
- Rupture immediate possible en onboarding payant: front appelle `/api/onboarding/activate-plan`, route absente.
- Presence de fallback demo peut masquer une vraie panne API et induire l'utilisateur en erreur.
- Trop de noeuds decisionnels autour export PDF (routes multiples) pour un parcours qui devrait etre lineaire.
- Partage equipe depend d'un PDF d'equipe pre-genere, ce qui ajoute une etape implicite potentiellement incomprise.

### ⚡ Quick wins (actionnables)
- Corriger endpoint onboarding manquant avant toute autre optimisation.
- Simplifier le bouton "Exporter/Partager" en sequence explicite avec etat clair (genere -> pret -> copie lien).
- Ajouter tests e2e reels (pas seulement mock) pour le parcours complet critique.

### 🗑️ Suggestions de suppression
- Retirer etapes implicites non visibles utilisateur dans le flow de partage.
- Supprimer transitions non essentielles (redirections/etats intermediaires) dans le funnel principal.

---

## 9. Audit Couts & Risques Financiers

### 🟢 Points de force
- Quotas planifies (briefings, PDF, storage) existent deja.
- Separation bucket storage relativement propre.

### 🔴 Risques critiques & dette
- Poste cout majeur: render PDF headless Chromium (CPU + cold starts + temps serverless).
- Rate limit memoire non distribue: en attaque ou pic legitime, cout infra peut grimper sans vrai frein.
- Duplications de flux augmentent le cout de maintenance et les risques de regressions cheres.
- Stockage exports peut croitre vite sans politique de retention automatique forte.

### ⚡ Quick wins (actionnables)
- Ajouter retention exports (ex: purger versions > N ou age > X jours selon plan).
- Mettre des hard caps operationnels par workspace (burst/jour) sur generation PDF.
- Standardiser 1 seul pipeline PDF pour reduire maintenance et incidents.
- Monitorer cout unitaire par export (ms CPU + taille + taux retry).

### 🗑️ Suggestions de suppression
- Retirer toute fonctionnalite de stockage non necessaire au MVP immediat.
- Couper les routes/process inutilisees qui consomment du temps d'observabilite/support.

---

## 10. Audit Failure Modes (Critique Terrain)

Scenarios: perte reseau, timeout API, erreur PDF, webhook Stripe en echec

### 🟢 Points de force
- Gestion d'erreurs API centralisee avec codes.
- Webhooks Stripe verifies et de-dupliques.
- Pages fallback pour liens publics invalides.

### 🔴 Risques critiques & dette
- Perte reseau cote client: peu de mecanismes explicites de reprise/metier (file locale, retry user-guided).
- Timeout PDF: pas de job queue solide, donc comportement potentiellement fragile en charge.
- Rate limiting non distribue: inefficace contre abus reels multi-instance.
- En echec webhook repete, l'etat billing peut rester incoherent (ex: plan app != etat Stripe attendu).

### ⚡ Quick wins (actionnables)
- Ajouter strategie retry visible utilisateur pour actions critiques (save briefing, export PDF, partage lien).
- Afficher etat de synchronisation billing ("en attente Stripe", "actif", "a verifier").
- Ajouter routine de reconciliation Stripe quotidienne (lecture subscriptions -> correction base) simple et brute.
- Ajouter mode degrade UX avec actions minimales encore possibles.

### 🗑️ Suggestions de suppression
- Supprimer les branches de gestion d'erreur trop generiques qui n'offrent pas d'issue utilisateur.
- Eviter les fallback silencieux qui maquillent les pannes reelles.

---

## Scope Creep detecte (hors MVP strict)

Hors scope ou tres secondaire a ce stade:
- staff management complet
- support email app natif
- status admin endpoint
- notifications/settings etendus
- logique marketing/SEO avancee pendant stabilisation coeur produit
- multi-routes export PDF paralleles

Recommendation brutale: garder, mais masquer derriere feature flags, et sortir du parcours principal tant que le coeur n'est pas indestructible.

---

## Resume Executif

- Sante Technique: **5.5/10**
- Sante Produit: **6/10**
- Risque de securite: **Moyen**
- Dette Cognitive: **Elevee**

Lecture rapide:
- Le produit a de bonnes bases (RLS, structure API, Stripe webhook),
- mais il est trop complexe pour son MVP cible,
- et il contient au moins un break de parcours critique (endpoint onboarding absent).

---

## Top 10 des priorites

Formule priorite: `Impact utilisateur / Effort dev`

| # | Action | Impact (1-5) | Effort (1-5) | Priorite (ratio) |
|---|---|---:|---:|---:|
| 1 | Corriger l'endpoint manquant `/api/onboarding/activate-plan` ou supprimer son appel front | 5 | 1 | **5.0** |
| 2 | Unifier le flux PDF MVP en un seul pipeline | 5 | 2 | **2.5** |
| 3 | Desactiver du parcours principal les features hors scope MVP | 4 | 2 | **2.0** |
| 4 | Remplacer rate limit memoire par rate limit distribue (PDF/share/auth hint) | 5 | 3 | **1.67** |
| 5 | Supprimer la confusion plans Stripe (n'exposer que plans reellement supportes) | 4 | 2 | **2.0** |
| 6 | Consommer quota PDF uniquement apres succes complet du pipeline | 4 | 2 | **2.0** |
| 7 | Ajouter reconciliation Stripe -> Supabase quotidienne | 4 | 3 | **1.33** |
| 8 | Eliminer progressivement la dualite `org`/`workspace` du runtime | 4 | 3 | **1.33** |
| 9 | Retention automatique des exports PDF pour contenir les couts | 3 | 2 | **1.5** |
| 10 | Tests e2e reels du parcours critique (non mockes) | 5 | 4 | **1.25** |

Classement operationnel recommande immediat: 1 -> 2 -> 3 -> 5 -> 6 -> 4 -> 9 -> 7 -> 8 -> 10.

---

## Verdict Final

- Produit pret pour usage terrain reel critique aujourd'hui ? **NON**
- Est-ce que je lui ferais confiance pour un evenement critique maintenant ? **NON**
- Est-ce que je paierais aujourd'hui ? **NON**

Justification courte et brutale:
- Le coeur est prometteur, mais la fiabilite terrain n'est pas encore au niveau "indestructible".
- Il y a trop de complexite hors MVP et au moins une rupture de parcours paiement/onboarding.
- Tant que le flux principal n'est pas simplifie et durci, c'est encore un risque operationnel.

---

## Note d'execution de cet audit

Audit realise par lecture du code et des routes actives (architecture, SQL/RLS, Stripe, PDF, UX flow), sans execution de charge en environnement prod.
