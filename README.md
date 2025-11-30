# 📦 CODE SOURCE SEMACTIVE

Ce dossier contient **la structure de base complète** de l'application SEMACTIVE.

## 📁 STRUCTURE DU DOSSIER

```
semactive-code/
├── app/
│   ├── layout.tsx              # Layout principal avec fonts
│   ├── globals.css             # Design system complet
│   ├── providers.tsx           # Providers React Query
│   ├── page.tsx                # Page de connexion
│   └── (dashboard)/
│       ├── layout.tsx          # Layout du dashboard
│       └── dashboard/
│           └── page.tsx        # Page dashboard
├── components/
│   └── layout/
│       ├── Navbar.tsx          # Barre de navigation
│       └── Sidebar.tsx         # Menu latéral
└── lib/
    ├── types.ts                # Types TypeScript
    └── supabase/
        ├── client.ts           # Client Supabase (client-side)
        └── server.ts           # Client Supabase (server-side)
```

## 🚀 INSTALLATION

### Étape 1 : Copier les fichiers

Copiez **TOUS** les fichiers de ce dossier dans votre projet SEMACTIVE existant.

**Sur Windows :**
```cmd
# Copiez manuellement les dossiers app/, components/, lib/
# dans votre projet C:\Users\VotreNom\Documents\SEMACTIVE\
```

**Sur Mac/Linux :**
```bash
# Depuis le dossier où vous avez téléchargé les fichiers
cp -r semactive-code/* /chemin/vers/votre/projet/SEMACTIVE/
```

### Étape 2 : Installer les dépendances manquantes

```bash
cd SEMACTIVE

# Installer @supabase/ssr (nécessaire pour server.ts)
npm install @supabase/ssr

# Installer toutes les dépendances
npm install
```

### Étape 3 : Vérifier les variables d'environnement

Assurez-vous que votre fichier `.env.local` contient :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Étape 4 : Tester localement

```bash
npm run dev
```

Ouvrez http://localhost:3000 - vous devriez voir la page de connexion !

### Étape 5 : Déployer sur GitHub + Vercel

```bash
git add .
git commit -m "feat: Add complete app structure with dashboard"
git push
```

Vercel redéploiera automatiquement votre application en 2-3 minutes.

## ✅ CE QUI EST INCLUS

### Authentification
- ✅ Page de connexion moderne avec design professionnel
- ✅ Intégration Supabase Auth
- ✅ Redirection automatique vers /dashboard
- ✅ Gestion des erreurs

### Layout et Navigation
- ✅ Sidebar responsive (mobile + desktop)
- ✅ Navbar avec recherche et menu utilisateur
- ✅ Notifications (structure prête)
- ✅ Thème sombre/clair (prêt à être implémenté)

### Dashboard
- ✅ Statistiques en temps réel depuis Supabase
- ✅ Cartes animées pour les métriques clés
- ✅ Alertes de réapprovisionnement
- ✅ Derniers mouvements
- ✅ Design moderne avec animations

### Design System
- ✅ Couleurs et thème cohérents
- ✅ Animations fluides (fade-in, slide-up, etc.)
- ✅ Composants shadcn/ui intégrés
- ✅ Responsive design (mobile-first)
- ✅ Scrollbar personnalisée
- ✅ Effets hover et transitions

## 🎨 PERSONNALISATION

### Changer les couleurs

Éditez `app/globals.css` - section `:root` :

```css
:root {
  --primary: 221 83% 53%;        /* Bleu principal */
  --accent: 221 83% 53%;         /* Couleur d'accent */
  /* ... autres couleurs */
}
```

### Changer les fonts

Éditez `app/layout.tsx` :

```typescript
import { VotreFont } from "next/font/google"

const maFont = VotreFont({ subsets: ["latin"] })
```

## 🔧 STRUCTURE DES COMPOSANTS

### Ajouter une nouvelle page

1. Créez un dossier dans `app/(dashboard)/`
2. Ajoutez `page.tsx` :

```typescript
export default function MaPage() {
  return (
    <div>
      <h1>Ma Page</h1>
    </div>
  )
}
```

3. Ajoutez le lien dans `components/layout/Sidebar.tsx`

### Utiliser Supabase

```typescript
import { supabase } from "@/lib/supabase/client"

// Récupérer des données
const { data, error } = await supabase
  .from('articles')
  .select('*')
```

## 📊 DONNÉES DE TEST

Pour tester l'application, créez quelques données dans Supabase :

```sql
-- Insérer un fournisseur
INSERT INTO fournisseurs (nom, email) 
VALUES ('Fournisseur Test', 'test@exemple.com');

-- Insérer un article
INSERT INTO articles (numero_article, nom, quantite_stock, point_commande) 
VALUES ('ART-001', 'Article Test', 5, 10);
```

## 🐛 PROBLÈMES COURANTS

### Erreur : "Module not found @supabase/ssr"
```bash
npm install @supabase/ssr
```

### Erreur : "Invalid API key"
Vérifiez votre `.env.local` - les clés doivent correspondre à votre projet Supabase.

### La page est blanche
Vérifiez la console du navigateur (F12) pour voir les erreurs.

### Build error sur Vercel
Vérifiez que toutes les dépendances sont dans `package.json` et que les variables d'environnement sont configurées sur Vercel.

## 📝 PAGES RESTANTES À CRÉER

Les pages suivantes ne sont pas encore créées (mais la structure est prête) :

- Articles (liste + formulaire)
- Fournisseurs (liste + formulaire)
- Commandes (liste + création)
- Scanner (scan de codes-barres)
- Mouvements (historique)
- Stock Technicien
- Réceptions

**Voulez-vous que je les crée ?** Dites-le moi et je vous fournirai le code complet !

## 🎯 PROCHAINES ÉTAPES

1. ✅ Copiez les fichiers dans votre projet
2. ✅ Installez les dépendances
3. ✅ Testez localement avec `npm run dev`
4. ✅ Poussez sur GitHub
5. ✅ Vérifiez le déploiement sur Vercel
6. 🚀 Demandez-moi le code des autres pages !

## 💬 BESOIN D'AIDE ?

Si vous rencontrez un problème :

1. Vérifiez ce README
2. Consultez le fichier INSTALLATION_COMPLETE.md
3. Demandez-moi de l'aide avec le message d'erreur exact

Bon développement ! 🚀
