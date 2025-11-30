// Types pour l'application SEMACTIVE

// @/lib/types.ts

export type Article = {
  id: string
  nom: string
  numero_article: string
  code_ean: string | null
  description: string | null
  categorie: string
  fournisseur_id: string | null
  quantite_stock: number
  stock_minimum: number
  stock_maximum: number
  point_commande: number
  prix_achat: number
  prix_vente: number
  gestion_par_serie: boolean
}

export interface Fournisseur {
  id: string;
  nom: string;
  code_fournisseur?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  contact_principal?: string;
  numero_tva?: string;
  conditions_paiement?: string;
  delai_livraison_jours?: number;
  remarques?: string;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NumeroSerie {
  id: string;
  article_id: string;
  numero_serie: string;
  code_barre_serie?: string;
  adresse_mac?: string;
  code_barre_mac?: string;
  localisation: 'stock' | 'entrepose' | 'technicien' | 'client' | 'transport';
  statut: string;
  created_at?: string;
  updated_at?: string;
  article?: Article;
}

export type Personne = {
  id: string
  nom: string
  prenom?: string
  type: "technicien" | "client" | "gestionnaire" | "transporteur" | "fournisseur" | "autre"
  email?: string
  telephone?: string
  entreprise?: string
  remarques?: string
  numero_perid?: string    // ← Ajoutez cette ligne
  erp_id?: string          // ← Ajoutez cette ligne
  created_at: string
}

export interface Client {
  id: string;
  nom: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  created_at?: string;
}

export interface Mouvement {
  id: string;
  article_id?: string;
  numero_serie_id?: string;
  type_mouvement: 'reception' | 'sortie_technicien' | 'sortie_transport' | 'transfert_depot' | 'installation_client' | 'retour';
  localisation_origine?: string;
  localisation_destination?: string;
  personne_id?: string;
  quantite: number;
  remarques?: string;
  date_mouvement: string;
  created_at?: string;
  article?: Article;
  numero_serie?: NumeroSerie;
  personne?: Personne;
}

export interface StockTechnicien {
  id: string;
  technicien_id: string;
  article_id: string;
  numero_serie_id?: string;
  quantite: number;
  localisation: string;
  derniere_mise_a_jour: string;
  technicien?: Personne;
  article?: Article;
  numero_serie?: NumeroSerie;
}

export interface BonCommande {
  id: string;
  numero_commande: string;
  fournisseur_id: string;
  date_commande: string;
  date_livraison_prevue?: string;
  date_livraison_reelle?: string;
  statut: 'brouillon' | 'envoyee' | 'confirmee' | 'en_transit' | 'livree_partielle' | 'livree' | 'annulee';
  montant_total_ht?: number;
  montant_total_ttc?: number;
  remarques?: string;
  createur_id?: string;
  created_at?: string;
  updated_at?: string;
  fournisseur?: Fournisseur;
  lignes_commande?: LigneCommande[];
}

export interface LigneCommande {
  id: string;
  bon_commande_id: string;
  article_id: string;
  quantite_commandee: number;
  quantite_recue: number;
  prix_unitaire_ht?: number;
  taux_tva?: number;
  montant_total_ht?: number;
  montant_total_ttc?: number;
  remarques?: string;
  created_at?: string;
  article?: Article;
}

export interface ReceptionCommande {
  id: string;
  bon_commande_id: string;
  ligne_commande_id: string;
  article_id: string;
  quantite_recue: number;
  date_reception: string;
  recepteur_id?: string;
  remarques?: string;
  created_at?: string;
}

export interface InstallationClient {
  id: string;
  client_id: string;
  numero_serie_id: string;
  technicien_id?: string;
  date_installation: string;
  remarques?: string;
  client?: Client;
  numero_serie?: NumeroSerie;
  technicien?: Personne;
}

// Types pour les vues Supabase
export interface ArticleACommander {
  id: string;
  numero_article: string;
  nom: string;
  quantite_stock: number;
  stock_minimum: number;
  point_commande: number;
  fournisseur_id?: string;
  fournisseur_nom?: string;
  fournisseur_code_fournisseur?: string;
  quantite_suggeree: number;
}

export interface SuiviCommande {
  id: string;
  numero_commande: string;
  date_commande: string;
  date_livraison_prevue?: string;
  statut: string;
  fournisseur?: string;
  fournisseur_telephone?: string;
  nombre_lignes: number;
  quantite_totale_commandee: number;
  quantite_totale_recue: number;
  montant_total_ht?: number;
  montant_total_ttc?: number;
}

// Types pour les formulaires
export interface ArticleFormData {
  numero_article: string;
  code_ean?: string;
  nom: string;
  conditionnement?: string;
  fournisseur_id?: string;
  reference_fournisseur?: string;
  quantite_stock: number;
  stock_minimum: number;
  stock_maximum: number;
  point_commande: number;
  prix_achat?: number;
  prix_vente?: number;
  taux_tva?: number;
}

export interface FournisseurFormData {
  nom: string;
  code_fournisseur?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  contact_principal?: string;
  conditions_paiement?: string;
  delai_livraison_jours?: number;
  remarques?: string;
  actif: boolean;
}

// Types pour les statistiques du dashboard
export interface DashboardStats {
  total_articles: number;
  total_stock: number;
  articles_en_alerte: number;
  mouvements_aujourd_hui: number;
  valeur_stock_total: number;
  commandes_en_cours: number;
}

// Type pour les résultats de scan
export interface ScanResult {
  type: 'ean' | 'serie' | 'mac' | 'qr';
  value: string;
  article?: Article;
  numero_serie?: NumeroSerie;
}
