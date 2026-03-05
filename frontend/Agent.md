# AGENT.md — FRONTEND DESIGN SYSTEM

## Product Context

Ce produit est un SaaS destiné aux organisateurs d’événements permettant de :

- créer des briefings événementiels
- gérer le staff terrain
- assigner des missions
- centraliser les informations logistiques
- générer des exports PDF

Le produit doit résoudre des problèmes fréquents dans l’événementiel :

- manque d’informations claires
- mauvaise communication entre organisateurs et équipes
- difficulté à trouver les accès
- missions mal définies
- informations dispersées dans Excel ou WhatsApp

L’interface doit être :

- claire
- rapide
- lisible sur le terrain
- efficace pour les managers

---

# DESIGN PHILOSOPHY

Le design doit ressembler à un SaaS moderne inspiré de :

- Notion
- Linear
- Slack
- Vercel Dashboard

Principes :

- minimaliste
- lisible
- beaucoup d’espace
- animations fluides
- priorité à l’information

---

# DESIGN TOKENS

## Colors

--color-bg-primary: #0F1117  
--color-bg-surface: #1A1D27  

--color-border: #2A2D3E  

--color-text-primary: #F0F2F8  
--color-text-secondary: #8B8FA8  

--color-accent-primary: #6C63FF  
--color-accent-secondary: #00D4AA  

--color-success: #22C55E  
--color-warning: #F59E0B  
--color-danger: #EF4444  
--color-info: #3B82F6  

---

# TYPOGRAPHY

Fonts

Body  
DM Sans

Headings  
Syne

Rules

Titles → font-bold  
Subtitles → font-semibold  
Body → font-normal  
Secondary text → text-secondary  

---

# SPACING SYSTEM

Spacing scale

4px  
8px  
12px  
16px  
24px  
32px  
48px  
64px  

Rules

- spacing basé sur multiples de 8px
- padding cartes : 24px
- gap sections : 32px

---

# BORDER RADIUS

Utiliser :

rounded-xl  
rounded-2xl  

Tous les composants doivent être arrondis.

---

# SHADOW SYSTEM

shadow-lg avec teinte violette légère

Utilisé pour :

- cartes
- modales
- dropdowns

---

# TRANSITIONS

transition-all duration-300 ease-in-out

Hover interactions

scale-102

Modal animations

fade + scale

---

# GRID SYSTEM

Container

max-width: 1280px  
margin: auto  
padding: 32px  

Dashboard grid

12 colonnes

Stats cards

desktop → 4 colonnes  
tablet → 2 colonnes  
mobile → 1 colonne  

---

# RESPONSIVE BREAKPOINTS

mobile < 640px  
tablet ≥ 640px  
laptop ≥ 1024px  
desktop ≥ 1280px  

---

# CORE UI COMPONENTS

Composants disponibles

Button  
Card  
Input  
Textarea  
Select  
Checkbox  
Toggle  
Badge  
Avatar  
Modal  
Dropdown  
Drawer  
Toast  
Table  
Tabs  
Pagination  
Search Input  
Tag  

---

# CARD COMPONENT

background: #1A1D27  
border: #2A2D3E  
border-radius: rounded-2xl  
padding: 24px  
shadow: shadow-lg  

---

# BUTTON SYSTEM

Primary Button

background: accent-primary  
text: white  
radius: rounded-xl  
padding: 12px 20px  

States

hover → lighten 5%  
active → darken 10%  
disabled → opacity 40%  
loading → spinner + disabled  

Secondary Button

background: transparent  
border: #2A2D3E  

---

# BADGES (STATUTS)

Draft → grey  
Published → teal  
Archived → orange  
Error → red  

---

# UI STATES

Tous les composants doivent gérer

hover  
focus  
active  
disabled  
loading  
error  
success  
empty  

---

# EMPTY STATES

Si aucune donnée existe afficher :

- icône
- message explicatif
- bouton CTA

Exemple

Vous n'avez encore créé aucun briefing

CTA

Créer un briefing

---

# LOADING STATES

Utiliser

skeleton loaders

ou

spinner minimal

Durée transitions

200–300ms

---

# NOTIFICATIONS

Toast notifications

Types

Success  
Error  
Warning  
Info  

Position

top-right

Durée

4 secondes

---

# ACCESSIBILITY

Respecter

- contraste WCAG AA
- navigation clavier
- focus visible
- labels associés aux inputs

---

# APPLICATION STRUCTURE

## Sidebar

Sidebar gauche

largeur par défaut : 64px  
largeur hover : 220px  
pleine hauteur  

Navigation

🏠 Tableau de bord  
📋 Briefings  
👥 Staff  
💳 Facturation  
⚙️ Paramètres  

Navigation centrée verticalement.

---

# HEADER

Header en haut du contenu.

Contient

- cloche notifications
- paramètres
- avatar utilisateur

Avatar ouvre dropdown

Profil  
Paramètres  
Déconnexion  

Background

semi-transparent  
backdrop-blur  

---

# PAGES

## AUTHENTIFICATION

Layout

2 panneaux

Gauche

- visuel brand
- gradient
- logo
- tagline

Droite

formulaire

Modes

Connexion  
Inscription  
Mot de passe oublié  

Inscription

Étape 1

Nom  
Email  
Organisation  
Mot de passe  
Confirmation  

Étape 2

Choix plan

Free  
Pro  
Enterprise  

---

# DASHBOARD

Titre

Bonjour, [Prénom] 👋

Cartes statistiques

Briefings ce mois  
Briefings à venir  
Staff actif  
Quota restant  

Section

Activité récente

CTA principal

Créer un briefing

---

# BRIEFINGS

Page listing

Filtres

Recherche  
Statut  
Tri date  

Carte briefing

Titre  
Date  
Statut  
Participants  
Actions  

Actions

éditer  
dupliquer  
supprimer  

---

# BRIEFING EDITOR

Champs

Titre  
Description  
Date  
Lieu  
Type événement  

Sections

Staff assigné  
Notes internes  

Boutons

Enregistrer brouillon  
Publier  

---

# STAFF

Table staff

Colonnes

Avatar  
Nom  
Rôle  
Email  
Tags  
Compétences  
Disponibilité  
Actions  

Actions

éditer  
supprimer  
assigner  

Import CSV

drag & drop  
preview lignes  
mapping colonnes  

---

# FACTURATION

Cartes KPI

Abonnement actif  
Factures en attente  
Factures en retard  
Total payé  

Table factures

Date  
Référence  
Montant  
Statut  
Télécharger PDF  

---

# PARAMÈTRES

Organisation

nom  
logo  
timezone  
langue  

Abonnement

plan  
quota briefings  
changer plan  

Notifications

email  
digest hebdo  
push  

Sécurité

activer 2FA  
changer mot de passe  

---

# PROFIL

Carte identité

avatar  
nom  
email  
rôle  
dernière connexion  

Formulaire

prénom  
nom  
téléphone  
bio  

---

# NOTIFICATION CENTER

Drawer latéral droit.

Contenu

liste notifications  
timestamp relatif  
type icône  

Actions

marquer comme lu  

Badge compteur sur cloche.

---

# UX PRINCIPLES

Le produit doit :

- permettre les actions principales en moins de 3 clics
- éviter les pages vides
- prioriser les actions principales
- utiliser des modales pour actions rapides
- garder navigation constante

---

# DOMAIN RULES

Les briefings doivent être lisibles rapidement sur mobile.

Sections critiques

Lieu  
Accès  
Horaire  
Mission  
Matériel  
Contact responsable  

Ces sections doivent être visuellement prioritaires.

Le MVP doit inclure

- gestion staff
- assignations
- planning
- génération de briefing
- export PDF

S'il un bouton mmais qu'il n'a pas encore d'effet tu mets un notification Bientot disponible 
