"use client"

import { useState, useEffect } from 'react'
// ✅ Import corrigé pour pointer vers le client Supabase
import { supabase } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, TrendingUp, TrendingDown, RefreshCw, History } from 'lucide-react'

// --- Types ---
interface Article {
  id: string
  nom: string
  numero_article: string
  quantite_stock: number
}

interface Personne {
  id: string
  nom: string
  prenom: string
  type: string
}

interface TypeMouvement {
  id: string
  nom: string
}

interface NumeroSerie {
  id: string
  numero_serie: string
  adresse_mac?: string
  article_id: string
  statut: string
  localisation?: string
}

interface StockTechnicien {
  id: string
  technicien_id: string
  article_id: string
  numero_serie_id?: string
  quantite: number
  localisation: string
  article: Article
  numero_serie?: NumeroSerie
}

interface Mouvement {
  id: string
  article_id: string // Clé étrangère vers la table articles
  numero_serie_id?: string // Clé étrangère vers la table numeros_serie
  personne_id?: string // Clé étrangère vers la table personnes
  personne_source_id?: string // Clé étrangère vers la table personnes
  type_mouvement: string
  localisation_origine?: string
  localisation_destination?: string
  remarques?: string
  date_mouvement: string
  quantite: number // Quantité pour *cette* ligne
  created_at: string
}

// Le type MouvementWithRelations est ajusté pour refléter la structure actuelle
// Chaque entrée de la table mouvements est une ligne de mouvement
interface MouvementWithRelations {
  id: string
  article_id: string
  numero_serie_id?: string
  personne_id?: string
  personne_source_id?: string
  type_mouvement: string
  localisation_origine?: string
  localisation_destination?: string
  remarques?: string
  date_mouvement: string
  quantite: number
  created_at: string
  // Données liées chargées via les relations Supabase
  article?: Article
  numero_serie?: NumeroSerie
  personne_source?: Personne
  personne_dest?: Personne
}

// --- Composant Principal ---
export default function MouvementsPage() {
  const [mouvements, setMouvements] = useState<MouvementWithRelations[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [typesMouvement, setTypesMouvement] = useState<TypeMouvement[]>([])
  const [emplacements, setEmplacements] = useState<{id: string, nom: string}[]>([])
  const [scenarios, setScenarios] = useState<any[]>([]) // À typer plus précisément si nécessaire
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  // --- États du Formulaire de Mouvement ---
  const [mouvementData, setMouvementData] = useState({
    personne_id: "",
    personne_source_id: "",
    type_mouvement: typesMouvement[0]?.nom || "",
    localisation_origine: "",
    localisation_destination: "",
    remarques: "",
  })
  // Maintenant, lignesMouvement correspond directement aux entrées de la table mouvements en attente
  const [lignesMouvement, setLignesMouvement] = useState<Mouvement[]>([])
  const [stockTechnicienSource, setStockTechnicienSource] = useState<StockTechnicien[]>([])

  // --- États du Formulaire d'Ajout de Ligne ---
  const [ligneFormData, setLigneFormData] = useState({
    article_id: "",
    quantite: 1,
  })
  const [articleSearch, setArticleSearch] = useState("")
  const [articleSearchSelect, setArticleSearchSelect] = useState("")
  const [numerosSerieDisponibles, setNumerosSerieDisponibles] = useState<NumeroSerie[]>([])
  const [numeroSerieSelectionne, setNumeroSerieSelectionne] = useState("")
  // --- NOUVEAU : États pour le nouveau numéro de série ---
  const [nouveauNumeroSerie, setNouveauNumeroSerie] = useState<string>("")
  const [nouvelleAdresseMac, setNouvelleAdresseMac] = useState<string>("")

  // --- États des Filtres ---
  const [filterSearch, setFilterSearch] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterTechnicien, setFilterTechnicien] = useState("")
  const [filterDateDebut, setFilterDateDebut] = useState("")
  const [filterDateFin, setFilterDateFin] = useState("")

  // --- Chargement Initial ---
  useEffect(() => {
    fetchMouvements()
    fetchArticles()
    fetchPersonnes()
    fetchTypesMouvement()
    fetchEmplacements()
    fetchScenarios()
  }, [])

  // --- Fonctions de Chargement ---
  // ✅ CORRIGÉ : Utilise la structure de la table mouvements
  async function fetchMouvements() {
    try {
      // Charger les mouvements avec les relations
      const { data, error } = await supabase
        .from('mouvements')
        .select(`
          *,
          article:articles(nom, numero_article, quantite_stock),
          numero_serie:numeros_serie(numero_serie, adresse_mac),
          personne_source:personnes!personne_source_id(nom, prenom),
          personne_dest:personnes!personne_id(nom, prenom)
        `)
        .order('date_mouvement', { ascending: false })
        .order('created_at', { ascending: true }) // Pour ordonner les lignes d'un même mouvement

      if (error) {
        console.error('❌ Erreur lors du chargement:', error)
        throw error
      }

      console.log(`✅ ${data.length || 0} lignes de mouvement chargées`)
      console.log('Premières lignes:', data.slice(0, 2))
      // Les données sont déjà au bon format
      setMouvements(data as MouvementWithRelations[])
    } catch (error) {
      console.error('Error fetching mouvements:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchArticles() {
    try {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .order('nom')
      setArticles(data || [])
    } catch (error) {
      console.error('Error fetching articles:', error)
    }
  }

  async function fetchPersonnes() {
    try {
      const { data } = await supabase
        .from('personnes')
        .select('*')
      setPersonnes(data || [])
    } catch (error) {
      console.error('Error fetching personnes:', error)
    }
  }

  async function fetchTypesMouvement() {
    try {
      const { data } = await supabase
        .from('types_mouvement')
        .select('*')
      setTypesMouvement(data || [])
    } catch (error) {
      console.error('Error fetching types mouvement:', error)
    }
  }

  async function fetchEmplacements() {
    try {
      const { data } = await supabase
        .from('emplacements')
        .select('id, nom')
      setEmplacements(data || [])
    } catch (error) {
      console.error('Error fetching emplacements:', error)
    }
  }

  async function fetchScenarios() {
    try {
      const { data, error } = await supabase
        .from('scenarios_mouvement')
        .select('*')
        .order('emplacement_origine, type_mouvement')
      if (error) throw error
      setScenarios(data || [])
      console.log('Scénarios chargés:', data?.length)
    } catch (error) {
      console.error('Error fetching scenarios:', error)
    }
  }

  async function fetchStockTechnicienSource(technicienId: string) {
    if (!technicienId) {
      setStockTechnicienSource([])
      return
    }
    try {
      const { data, error } = await supabase
        .from('stock_technicien')
        .select(`
          *,
          article:articles(*),
          numero_serie:numeros_serie(*)
        `)
        .eq('technicien_id', technicienId)
        .gt('quantite', 0)
      if (error) throw error
      setStockTechnicienSource(data || [])
      console.log(`Stock technicien source chargé: ${data?.length} entrées`)
    } catch (error) {
      console.error('Error fetching stock technicien source:', error)
      setStockTechnicienSource([])
    }
  }

  // --- Fonctions Utilitaires ---
  function needsTechnicienSource(): boolean {
    return mouvementData.localisation_origine === "Stock Technicien"
  }

  function needsTechnicienDestination(): boolean {
    return mouvementData.localisation_destination === "Stock Technicien"
  }

  function isTransfertEntreTechniciens(): boolean {
    return mouvementData.localisation_origine === "Stock Technicien" && mouvementData.localisation_destination === "Stock Technicien"
  }

  function mapTypeToConstraint(typeNom: string): string {
    const standardMappings: Record<string, string> = {
      'réception': 'reception',
      'sortie technicien': 'sortie_technicien',
      'sortie transport': 'sortie_transport',
      'transfert depot': 'transfert_depot',
      'transfert dépôt': 'transfert_depot',
      'installation client': 'installation_client',
      'Transfert_depot': 'transfert_depot',
    }

    if (standardMappings[typeNom]) {
      return standardMappings[typeNom]
    }

    const lowerNom = typeNom.toLowerCase().trim()
    const lowerStandardMappings: Record<string, string> = {
      'réception': 'reception',
      'sortie technicien': 'sortie_technicien',
      'sortie transport': 'sortie_transport',
      'transfert depot': 'transfert_depot',
      'transfert dépôt': 'transfert_depot',
      'installation client': 'installation_client',
    }

    if (lowerStandardMappings[lowerNom]) {
      return lowerStandardMappings[lowerNom]
    }

    if (typeNom === 'Transfert_Stock') {
      return typeNom
    }
    return typeNom
  }

  // --- Fonctions de Recherche ---
  async function searchArticles(searchValue: string) {
    if (!searchValue.trim()) {
      if (isTransfertEntreTechniciens() && mouvementData.personne_source_id) {
        const articlesDisponibles = stockTechnicienSource.map(s => s.article).filter(Boolean) as Article[]
        setArticles(articlesDisponibles)
      } else {
        fetchArticles()
      }
      return
    }

    try {
      let isSerialOrMacSearch = false
      let foundNumeroSerie: NumeroSerie | null = null

      if (isTransfertEntreTechniciens() && mouvementData.personne_source_id) {
        const { data: serialData } = await supabase
          .from('numeros_serie')
          .select('*, article:articles(*)')
          .or(`numero_serie.ilike.%${searchValue}%,adresse_mac.ilike.%${searchValue}%`)

        if (serialData && serialData.length > 0) {
          const stockEntry = stockTechnicienSource.find(s =>
            s.numero_serie_id === serialData[0].id
          )
          if (stockEntry) {
            isSerialOrMacSearch = true
            foundNumeroSerie = serialData[0] as NumeroSerie
            setArticles([serialData[0].article as Article])
            setTimeout(() => {
              ajouterLigneAuto(serialData[0].article as Article, foundNumeroSerie!)
            }, 100)
            return
          } else {
            alert(`Ce numéro de série n'est pas dans le stock du technicien source`)
            setArticles([])
            return
          }
        } else {
          // Si pas trouvé dans les séries, chercher dans les articles du stock
          const articlesDisponibles = stockTechnicienSource.filter(s =>
            s.article && s.article.nom.toLowerCase().includes(searchValue.toLowerCase())
          ).map(s => s.article).filter(Boolean) as Article[]
          const uniqueArticles = Array.from(new Map(articlesDisponibles.map(a => [a.id, a])).values())
          setArticles(uniqueArticles)
          return
        }
      }

      // Pour les autres types de mouvements, chercher dans tous les articles
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .or(`nom.ilike.%${searchValue}%,numero_article.ilike.%${searchValue}%`)
      if (error) throw error

      let articleIds: string[] = []
      if (serialData && serialData.length > 0) {
        articleIds = serialData.map(s => s.article_id)
      }

      if (data && data.length === 1 && !isSerialOrMacSearch) {
        const article = data[0]
        setLigneFormData({...ligneFormData, article_id: article.id})
        setArticleSearchSelect("") // Reset recherche Select après sélection
        // ✅ Appel à loadNumerosSerieForArticle après scan
        loadNumerosSerieForArticle(article.id)
        if (isSerialOrMacSearch && foundNumeroSerie) {
          setTimeout(() => {
            ajouterLigneAuto(article, foundNumeroSerie!)
          }, 100)
        }
      } else {
        setArticles(data || [])
      }
    } catch (error) {
      console.error('Error searching articles:', error)
    }
  }

  async function loadNumerosSerieForArticle(articleId: string) {
    if (!articleId) {
      setNumerosSerieDisponibles([])
      setNumeroSerieSelectionne("")
      return
    }
    try {
      // Si transfert entre techniciens, charger uniquement depuis le stock source
      if (isTransfertEntreTechniciens() && mouvementData.personne_source_id) {
        const seriesInStock = stockTechnicienSource.filter(s =>
          s.article_id === articleId &&
          s.numero_serie_id !== null
        )
        setNumerosSerieDisponibles(seriesInStock.map(s => s.numero_serie).filter(Boolean) as NumeroSerie[])
      } else {
        // Pour les réceptions, charger TOUS les numéros de série de cet article, quel que soit leur statut
        if (mouvementData.type_mouvement?.toLowerCase().includes('reception')) {
          const { data } = await supabase
            .from('numeros_serie')
            .select('*')
            .eq('article_id', articleId)
          setNumerosSerieDisponibles(data || [])
        } else {
          // Pour les autres types de mouvements, charger uniquement les séries disponibles
          const { data } = await supabase
            .from('numeros_serie')
            .select('*')
            .eq('article_id', articleId)
            .eq('statut', 'disponible')
          setNumerosSerieDisponibles(data || [])
        }
      }
    } catch (error) {
      console.error('Error loading numeros serie:', error)
      setNumerosSerieDisponibles([])
    }
  }

  // --- Fonctions d'Ajout de Ligne ---
  function ajouterLigneAuto(article: Article, numeroSerie?: NumeroSerie) {
    // Vérifier si le technicien source a cet article en stock (pour transfert)
    if (isTransfertEntreTechniciens() && mouvementData.personne_source_id) {
      const stockEntry = stockTechnicienSource.find(s =>
        s.article_id === article.id &&
        (!numeroSerie || s.numero_serie_id === numeroSerie.id)
      )
      if (!stockEntry) {
        alert(`Cet article n'est pas dans le stock du technicien source`)
        setArticleSearch("")
        setLigneFormData({ article_id: "", quantite: 1 })
        return
      }
      if (stockEntry.quantite < 1) {
        alert(`Stock insuffisant pour le technicien source (stock actuel: ${stockEntry.quantite})`)
        setArticleSearch("")
        setLigneFormData({ article_id: "", quantite: 1 })
        return
      }
    }

    const nouvelleLigne: Mouvement = {
      id: crypto.randomUUID(), // ID temporaire pour la liste
      article_id: article.id,
      numero_serie_id: numeroSerie?.id,
      // Les personnes sont définies dans le formulaire principal
      personne_id: mouvementData.personne_id,
      personne_source_id: mouvementData.personne_source_id,
      type_mouvement: mouvementData.type_mouvement,
      localisation_origine: mouvementData.localisation_origine,
      localisation_destination: mouvementData.localisation_destination,
      remarques: mouvementData.remarques,
      // Date sera définie lors de la validation
      date_mouvement: "", // sera rempli plus tard
      quantite: 1,
      created_at: "", // sera rempli plus tard
    }
    setLignesMouvement([...lignesMouvement, nouvelleLigne])

    // IMPORTANT: Recharger TOUS les articles disponibles après le scan
    if (isTransfertEntreTechniciens() && mouvementData.personne_source_id) {
      // Pour transfert entre techniciens: tous les articles du stock source
      const articlesDisponibles = stockTechnicienSource.map(s => s.article).filter(Boolean) as Article[]
      const uniqueArticles = Array.from(new Map(articlesDisponibles.map(a => [a.id, a])).values())
      setArticles(uniqueArticles)
    } else {
      // Pour les autres cas: tous les articles
      fetchArticles()
    }

    // Réinitialiser les champs
    setArticleSearch("")
    setArticleSearchSelect("")
    setLigneFormData({ article_id: "", quantite: 1 })
    setNumerosSerieDisponibles([])
    setNumeroSerieSelectionne("")
    // ✅ Réinitialiser aussi les nouveaux champs
    setNouveauNumeroSerie("")
    setNouvelleAdresseMac("")
  }

  function ajouterLigne(e: React.FormEvent) {
    e.preventDefault()
    if (!ligneFormData.article_id || ligneFormData.quantite < 1) {
      alert("Veuillez sélectionner un article et une quantité valide")
      return
    }
    const article = articles.find(a => a.id === ligneFormData.article_id)
    if (!article) return

    // --- LOGIQUE MODIFIÉE POUR RÉCEPTION ---
    if (mouvementData.type_mouvement?.toLowerCase().includes('reception')) {
      // Pour une réception, on privilégie le nouveau numéro de série saisi
      if (nouveauNumeroSerie.trim()) {
        // On crée la ligne avec les infos du nouveau numéro, l'ID sera créé plus tard
        const nouvelleLigne: Mouvement = {
          id: crypto.randomUUID(), // ID temporaire pour la liste
          article_id: ligneFormData.article_id,
          numero_serie_id: undefined, // Sera créé dans validerMouvement
          // Les personnes sont définies dans le formulaire principal
          personne_id: mouvementData.personne_id,
          personne_source_id: mouvementData.personne_source_id,
          type_mouvement: mouvementData.type_mouvement,
          localisation_origine: mouvementData.localisation_origine,
          localisation_destination: mouvementData.localisation_destination,
          remarques: mouvementData.remarques,
          // Date sera définie lors de la validation
          date_mouvement: "", // sera rempli plus tard
          quantite: ligneFormData.quantite,
          created_at: "", // sera rempli plus tard
        }
        setLignesMouvement([...lignesMouvement, nouvelleLigne])
      } else if (numeroSerieSelectionne && numeroSerieSelectionne !== "none") {
        // Sinon, on peut quand même sélectionner un numéro existant
        const serieInfo = numerosSerieDisponibles.find(s => s.id === numeroSerieSelectionne)
        const nouvelleLigne: Mouvement = {
          id: crypto.randomUUID(), // ID temporaire pour la liste
          article_id: ligneFormData.article_id,
          numero_serie_id: serieInfo?.id,
          // Les personnes sont définies dans le formulaire principal
          personne_id: mouvementData.personne_id,
          personne_source_id: mouvementData.personne_source_id,
          type_mouvement: mouvementData.type_mouvement,
          localisation_origine: mouvementData.localisation_origine,
          localisation_destination: mouvementData.localisation_destination,
          remarques: mouvementData.remarques,
          // Date sera définie lors de la validation
          date_mouvement: "", // sera rempli plus tard
          quantite: ligneFormData.quantite,
          created_at: "", // sera rempli plus tard
        }
        setLignesMouvement([...lignesMouvement, nouvelleLigne])
      } else {
        // Aucun numéro de série fourni
        alert("Veuillez saisir ou sélectionner un numéro de série pour la réception.")
        return
      }
    } else {
      // Pour les autres types de mouvements, on utilise la logique existante
      let serieInfo = null
      if (numeroSerieSelectionne && numeroSerieSelectionne !== "none") {
        serieInfo = numerosSerieDisponibles.find(s => s.id === numeroSerieSelectionne)
      }

      const nouvelleLigne: Mouvement = {
        id: crypto.randomUUID(), // ID temporaire pour la liste
        article_id: ligneFormData.article_id,
        numero_serie_id: serieInfo?.id,
        // Les personnes sont définies dans le formulaire principal
        personne_id: mouvementData.personne_id,
        personne_source_id: mouvementData.personne_source_id,
        type_mouvement: mouvementData.type_mouvement,
        localisation_origine: mouvementData.localisation_origine,
        localisation_destination: mouvementData.localisation_destination,
        remarques: mouvementData.remarques,
        // Date sera définie lors de la validation
        date_mouvement: "", // sera rempli plus tard
        quantite: ligneFormData.quantite,
        created_at: "", // sera rempli plus tard
      }
      setLignesMouvement([...lignesMouvement, nouvelleLigne])
    }

    // Réinitialiser TOUS les champs
    setLigneFormData({
      article_id: "",
      quantite: 1,
    })
    setArticleSearch("")
    setArticleSearchSelect("")
    setNumerosSerieDisponibles([])
    setNumeroSerieSelectionne("")
    setNouveauNumeroSerie("") // ✅ Réinitialiser le champ de nouveau numéro
    setNouvelleAdresseMac("") // ✅ Réinitialiser le champ de nouvelle adresse MAC
  }

  function supprimerLigne(ligneId: string) {
    setLignesMouvement(lignesMouvement.filter(l => l.id !== ligneId))
  }

  // --- Fonction de Validation ---
  async function validerMouvement() {
    if (lignesMouvement.length === 0) {
      alert("Veuillez ajouter au moins une ligne avant de valider")
      return
    }
    if (!mouvementData.type_mouvement) {
      alert("Veuillez sélectionner un type de mouvement")
      return
    }
    if (mouvementData.localisation_origine === "Stock Technicien" && !mouvementData.personne_source_id) {
      alert("Veuillez sélectionner le technicien source")
      return
    }
    if (mouvementData.localisation_destination === "Stock Technicien" && !mouvementData.personne_id) {
      alert("Veuillez sélectionner le technicien destination")
      return
    }
    if (isTransfertEntreTechniciens() && mouvementData.personne_source_id === mouvementData.personne_id) {
      alert("Le technicien source et destination doivent être différents")
      return
    }

    try {
      // --- NOUVEAU : Créer les numéros de série manquants ---
      const lignesAMettreAJour = [...lignesMouvement]; // Copie du tableau
      for (let i = 0; i < lignesAMettreAJour.length; i++) {
        const ligne = lignesAMettreAJour[i];
        const nouveauxNumerosSerieEnAttente: Record<string, { numero: string, mac?: string }> = {};
        type LigneMouvementAvecNouveau = Mouvement & { nouveau_numero_serie?: string, nouvelle_adresse_mac?: string };
        const lignesAvecInfosNouvelles: LigneMouvementAvecNouveau[] = lignesAMettreAJour.map(l => ({...l}));
        const [nouveauxNumerosSeriePourLigne, setNouveauxNumerosSeriePourLigne] = useState<Record<string, { numero: string, mac?: string }>>({});
        interface LigneMouvementAvecNouveau extends Omit<Mouvement, 'numero_serie_id'> { numero_serie_id?: string; nouveau_numero_serie?: string; nouvelle_adresse_mac?: string; }
        for (let i = 0; i < lignesAMettreAJour.length; i++) {
          const ligne = lignesAMettreAJour[i] as LigneMouvementAvecNouveau; // On le cast pour accéder aux champs temporaires
          // Si la ligne a un nouveau_numero_serie mais pas de numero_serie_id, c'est un nouveau (pour réception)
          if (ligne.numero_serie_id === undefined && ligne.nouveau_numero_serie) {
            // Vérifier s'il existe déjà dans la base pour éviter les doublons
            const { data: serieExistante } = await supabase
              .from('numeros_serie')
              .select('id')
              .eq('numero_serie', ligne.nouveau_numero_serie)
              .eq('article_id', ligne.article_id)
              .maybeSingle();

            let nouvelleSerieId;
            if (serieExistante) {
              // Si le numéro de série existe déjà pour cet article, on l'utilise
              nouvelleSerieId = serieExistante.id;
              console.warn(`Le numéro de série ${ligne.nouveau_numero_serie} existait déjà pour l'article ${ligne.article_id}, utilisation de l'ID existant.`);
            } else {
              // Sinon, on le crée
              const { data: nouvelleSerie, error: createError } = await supabase
                .from('numeros_serie')
                .insert([{
                  article_id: ligne.article_id,
                  numero_serie: ligne.nouveau_numero_serie,
                  adresse_mac: ligne.nouvelle_adresse_mac || null,
                  statut: 'disponible', // Ou 'reçu', à vous de voir
                  localisation: mouvementData.localisation_destination || 'inconnue', // Initialiser la localisation
                }])
                .select('id')
                .single();

              if (createError) throw createError;
              nouvelleSerieId = nouvelleSerie.id;
              console.log(`✅ Nouveau numéro de série créé: ${ligne.nouveau_numero_serie} avec ID ${nouvelleSerieId}`);
            }
            // Mettre à jour la ligne avec le nouvel ID
            (lignesAMettreAJour[i] as LigneMouvementAvecNouveau).numero_serie_id = nouvelleSerieId;
            // Supprimer les champs temporaires pour la requête finale
            delete (lignesAMettreAJour[i] as any).nouveau_numero_serie;
            delete (lignesAMettreAJour[i] as any).nouvelle_adresse_mac;
          }
        }

        // Maintenant, `lignesAMettreAJour` contient toutes les lignes avec un `numero_serie_id` valide
        const dateMouvement = new Date().toISOString()
        console.log('DEBUG - Valeur de mouvementData.type_mouvement AVANT mapping:', mouvementData.type_mouvement)
        const typeMapped = mapTypeToConstraint(mouvementData.type_mouvement)
        console.log('DEBUG - Valeur de typeMapped APRES mapping:', typeMapped)
        let remarquesFinales = mouvementData.remarques
        if (mouvementData.personne_source_id && mouvementData.personne_id) {
          const techSource = personnes.find(p => p.id === mouvementData.personne_source_id)
          const techDest = personnes.find(p => p.id === mouvementData.personne_id)
          const infoTransfert = `Transfert: ${techSource?.nom} ${techSource?.prenom || ''} → ${techDest?.nom} ${techDest?.prenom || ''}`
          remarquesFinales = remarquesFinales ? `${infoTransfert} | ${remarquesFinales}` : infoTransfert
        }

        // Utiliser `lignesAMettreAJour` au lieu de `lignesMouvement`
        const mouvementsToInsert = lignesAMettreAJour.map(ligne => ({
          article_id: ligne.article_id,
          numero_serie_id: ligne.numero_serie_id || null, // Utiliser l'ID potentiellement créé
          personne_id: ligne.personne_id || mouvementData.personne_id || mouvementData.personne_source_id || null, // Utiliser l'ID de la ligne ou du formulaire
          personne_source_id: ligne.personne_source_id || mouvementData.personne_source_id || null, // Utiliser l'ID de la ligne ou du formulaire
          type_mouvement: ligne.type_mouvement || typeMapped, // Utiliser le type de la ligne ou du formulaire
          localisation_origine: ligne.localisation_origine || mouvementData.localisation_origine || null, // Utiliser l'origine de la ligne ou du formulaire
          localisation_destination: ligne.localisation_destination || mouvementData.localisation_destination || null, // Utiliser la destination de la ligne ou du formulaire
          quantite: ligne.quantite,
          remarques: ligne.remarques || remarquesFinales, // Utiliser les remarques de la ligne ou du formulaire
          date_mouvement: dateMouvement,
        }))

        console.log('DEBUG - Valeur de type_mouvement dans le premier objet à insérer:', mouvementsToInsert[0]?.type_mouvement)
        console.log('Données à insérer:', mouvementsToInsert)

        const { error: mouvementError } = await supabase
          .from('mouvements')
          .insert(mouvementsToInsert)
        if (mouvementError) throw mouvementError

        // --- La boucle de mise à jour du stock commence ici ---
        for (const ligne of lignesAMettreAJour) { // Toujours utiliser `lignesAMettreAJour`
          const article = articles.find(a => a.id === ligne.article_id)
          if (!article) continue

          let newQuantity = article.quantite_stock
          const typeMvt = typesMouvement.find(t => t.nom === (ligne.type_mouvement || mouvementData.type_mouvement))
          if (typeMvt) {
            if (typeMvt.nom.toLowerCase().includes('reception') || typeMvt.nom.toLowerCase().includes('retour')) {
              newQuantity += ligne.quantite
            } else if (typeMvt.nom.toLowerCase().includes('sortie') || typeMvt.nom.toLowerCase().includes('installation')) {
              newQuantity -= ligne.quantite
            }
          }

          const { error: stockError } = await supabase
            .from('articles')
            .update({ quantite_stock: newQuantity })
            .eq('id', ligne.article_id)
          if (stockError) throw stockError

          if (ligne.numero_serie_id && (ligne.localisation_destination || mouvementData.localisation_destination)) {
            try {
              const destination = ligne.localisation_destination || mouvementData.localisation_destination;
              const { error: updateSerieError } = await supabase
                .from('numeros_serie')
                .update({
                  localisation: destination,
                  updated_at: new Date().toISOString()
                })
                .eq('id', ligne.numero_serie_id)

              if (updateSerieError) {
                console.error('Erreur mise à jour emplacement série:', updateSerieError)
              } else {
                console.log(`✅ Emplacement mis à jour pour série ${ligne.numero_serie_id}: ${destination}`)
              }
            } catch (error) {
              console.error('Erreur lors de la mise à jour de l\'emplacement:', error)
            }
          }

          // Gestion du stock technique
          const sourceId = ligne.personne_source_id || mouvementData.personne_source_id;
          if (sourceId && (ligne.localisation_origine || mouvementData.localisation_origine) === "Stock Technicien") {
            try {
              let queryStock = supabase
                .from('stock_technicien')
                .select('*')
                .eq('technicien_id', sourceId)
                .eq('article_id', ligne.article_id)
              if (ligne.numero_serie_id) {
                queryStock = queryStock.eq('numero_serie_id', ligne.numero_serie_id)
              } else {
                queryStock = queryStock.is('numero_serie_id', null)
              }
              const { data: existingStock } = await queryStock.maybeSingle()

              if (existingStock) {
                const newQty = existingStock.quantite - ligne.quantite
                if (newQty >= 0) {
                  await supabase
                    .from('stock_technicien')
                    .update({
                      quantite: newQty,
                      derniere_mise_a_jour: new Date().toISOString()
                    })
                    .eq('id', existingStock.id)
                } else {
                  throw new Error(`Stock insuffisant pour le technicien source: ${existingStock.quantite}`)
                }
              }
            } catch (error: any) {
              alert("Erreur mise à jour stock source: " + error.message)
            }
          }

          const destId = ligne.personne_id || mouvementData.personne_id;
          if (destId && (ligne.localisation_destination || mouvementData.localisation_destination) === "Stock Technicien") {
            try {
              let queryStock = supabase
                .from('stock_technicien')
                .select('*')
                .eq('technicien_id', destId)
                .eq('article_id', ligne.article_id)
              if (ligne.numero_serie_id) {
                queryStock = queryStock.eq('numero_serie_id', ligne.numero_serie_id)
              } else {
                queryStock = queryStock.is('numero_serie_id', null)
              }
              const { data: existingStock } = await queryStock.maybeSingle()

              if (existingStock) {
                await supabase
                  .from('stock_technicien')
                  .update({
                    quantite: existingStock.quantite + ligne.quantite,
                    derniere_mise_a_jour: new Date().toISOString()
                  })
                  .eq('id', existingStock.id)
              } else {
                console.log('Création nouvelle entrée stock_technicien destination pour:', article.nom)
                await supabase
                  .from('stock_technicien')
                  .insert({
                    technicien_id: destId,
                    article_id: ligne.article_id,
                    numero_serie_id: ligne.numero_serie_id || null,
                    quantite: ligne.quantite,
                    localisation: (ligne.localisation_destination || mouvementData.localisation_destination) || 'camionnette',
                  })
              }
            } catch (error: any) {
              alert("Erreur mise à jour stock destination: " + error.message)
            }
          }
        }

        // Réinitialisation du formulaire
        setShowForm(false)
        fetchMouvements() // Recharge la liste des mouvements
        fetchArticles() // Recharge les stocks
        setLignesMouvement([]) // Réinitialise la liste des lignes en cours
        setMouvementData({
          personne_id: "",
          personne_source_id: "",
          type_mouvement: typesMouvement[0]?.nom || "",
          localisation_origine: "",
          localisation_destination: "",
          remarques: "",
        })
        setLigneFormData({
          article_id: "",
          quantite: 1,
        })
        setArticleSearch("")
        alert(`${lignesAMouvement.length} ligne(s) de mouvement enregistrée(s) avec succès !`)
    } catch (error: any) {
      alert("Erreur: " + error.message)
    }
  }
  const filteredMouvements = mouvements.filter(m => {
    const matchesSearch = !filterSearch || (
      m.article?.nom.toLowerCase().includes(filterSearch.toLowerCase()) ||
      m.article?.numero_article.toLowerCase().includes(filterSearch.toLowerCase()) ||
      m.numero_serie?.numero_serie?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      m.numero_serie?.adresse_mac?.toLowerCase().includes(filterSearch.toLowerCase())
    )
    const matchesType = !filterType || m.type_mouvement.toLowerCase().includes(filterType.toLowerCase())
    const matchesTechnicien = !filterTechnicien || (
      (m as any).personne_source_id === filterTechnicien ||
      m.personne_id === filterTechnicien
    )
    let matchesDate = true
    if (filterDateDebut || filterDateFin) {
      const mouvementDate = new Date(m.date_mouvement)
      if (filterDateDebut) {
        const dateDebut = new Date(filterDateDebut)
        dateDebut.setHours(0, 0, 0, 0)
        matchesDate = matchesDate && mouvementDate >= dateDebut
      }
      if (filterDateFin) {
        const dateFin = new Date(filterDateFin)
        dateFin.setHours(23, 59, 59, 999)
        matchesDate = matchesDate && mouvementDate <= dateFin
      }
    }
    return matchesSearch && matchesType && matchesTechnicien && matchesDate
  })
  const stats = {
    receptions: mouvements.filter(m => m.type_mouvement?.toLowerCase().includes('reception')).length,
    sorties: mouvements.filter(m => m.type_mouvement?.toLowerCase().includes('sortie')).length,
    installations: mouvements.filter(m => m.type_mouvement?.toLowerCase().includes('installation')).length,
    retours: mouvements.filter(m => m.type_mouvement?.toLowerCase().includes('retour')).length,
  }

  const getTypeBadge = (type: string) => {
    if (type.toLowerCase().includes('reception')) {
      return 'bg-green-100 text-green-800'
    } else if (type.toLowerCase().includes('sortie') || type.toLowerCase().includes('installation')) {
      return 'bg-blue-100 text-blue-800'
    } else if (type.toLowerCase().includes('retour')) {
      return 'bg-orange-100 text-orange-800'
    } else {
      return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('reception')) {
      return TrendingUp
    } else if (type.toLowerCase().includes('sortie') || type.toLowerCase().includes('installation')) {
      return TrendingDown
    } else if (type.toLowerCase().includes('retour')) {
      return RefreshCw
    } else {
      return History
    }
  }

  // --- Affichage ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Nouveau Mouvement</h1>
            <p className="text-muted-foreground">Ajouter un mouvement de stock</p>
          </div>
          <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
        </div>

        {/* Formulaire Principal */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du Mouvement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base mb-2 block">Type de mouvement</Label>
                <Select
                  value={mouvementData.type_mouvement}
                  onValueChange={(value) => setMouvementData({...mouvementData, type_mouvement: value})}
                >
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {typesMouvement.map((type) => (
                      <SelectItem key={type.id} value={type.nom}>{type.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-base mb-2 block">Localisation d'origine</Label>
                <Select
                  value={mouvementData.localisation_origine}
                  onValueChange={(value) => setMouvementData({...mouvementData, localisation_origine: value})}
                >
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {emplacements.map((emp) => (
                      <SelectItem key={emp.id} value={emp.nom}>{emp.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-base mb-2 block">Technicien source</Label>
                <Select
                  value={mouvementData.personne_source_id}
                  onValueChange={(value) => {
                    const newValue = value === "none" ? "" : value
                    setMouvementData({...mouvementData, personne_source_id: newValue})
                    fetchStockTechnicienSource(newValue) // Charger le stock du technicien source
                  }}
                >
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {personnes.filter(p => p.type === 'technicien').map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nom} {p.prenom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-base mb-2 block">Localisation de destination</Label>
                <Select
                  value={mouvementData.localisation_destination}
                  onValueChange={(value) => setMouvementData({...mouvementData, localisation_destination: value})}
                >
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {emplacements.map((emp) => (
                      <SelectItem key={emp.id} value={emp.nom}>{emp.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-base mb-2 block">Technicien destination</Label>
                <Select
                  value={mouvementData.personne_id}
                  onValueChange={(value) => setMouvementData({...mouvementData, personne_id: value === "none" ? "" : value})}
                >
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {personnes.filter(p => p.type === 'technicien' && p.id !== mouvementData.personne_source_id).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nom} {p.prenom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-base mb-2 block">Remarques</Label>
              <Input
                className="h-14 text-lg"
                placeholder="Remarques optionnelles..."
                value={mouvementData.remarques}
                onChange={(e) => setMouvementData({...mouvementData, remarques: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Formulaire d'Ajout de Ligne */}
        <Card>
          <CardHeader>
            <CardTitle>Ajouter un Article</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base mb-2 block">Rechercher / Scanner Article</Label>
              <Input
                className="h-14 text-lg"
                placeholder="Scanner ou rechercher par nom ou numéro..."
                value={articleSearch}
                onChange={(e) => searchArticles(e.target.value)}
              />
            </div>

            <form onSubmit={ajouterLigne} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-base mb-2 block">Article sélectionné</Label>
                  <Select
                    value={ligneFormData.article_id}
                    onValueChange={(value) => {
                      setLigneFormData({...ligneFormData, article_id: value})
                      setArticleSearchSelect("") // Reset recherche Select après sélection
                      loadNumerosSerieForArticle(value) // Charger les séries pour cet article
                    }}
                  >
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Sélectionnez un article" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 sticky top-0 bg-background z-10">
                        <Input
                          placeholder="Rechercher par nom..."
                          value={articleSearchSelect}
                          onChange={(e) => {
                            e.stopPropagation()
                            setArticleSearchSelect(e.target.value)
                          }}
                          className="h-10 mb-2"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      {articles.filter(article =>
                        article.nom.toLowerCase().includes(articleSearchSelect.toLowerCase()) ||
                        article.numero_article.toLowerCase().includes(articleSearchSelect.toLowerCase())
                      ).map((article) => (
                        <SelectItem key={article.id} value={article.id}>
                          <div className="flex flex-col py-1">
                            <span className="font-semibold">{article.nom}</span>
                            <span className="text-xs text-muted-foreground">
                              {article.numero_article} • Stock: {article.quantite_stock}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* --- NOUVEAU BLOC POUR LE NOUVEAU NUMÉRO DE SÉRIE --- */}
                {ligneFormData.article_id && (
                  <div>
                    <Label className="text-base mb-2 block">Nouveau N° de série / MAC (à créer)</Label>
                    <Input
                      className="h-14 text-lg"
                      placeholder="Scanner ou saisir le N° de série..."
                      value={nouveauNumeroSerie}
                      onChange={(e) => setNouveauNumeroSerie(e.target.value)}
                    />
                    {/* Champ optionnel pour l'adresse MAC */}
                    <Label className="text-base mb-2 block mt-2">Nouvelle Adresse MAC (facultatif)</Label>
                    <Input
                      className="h-14 text-lg"
                      placeholder="Scanner ou saisir l'adresse MAC..."
                      value={nouvelleAdresseMac}
                      onChange={(e) => setNouvelleAdresseMac(e.target.value)}
                    />
                  </div>
                )}
                {/* --- FIN NOUVEAU BLOC --- */}

                {/* Ancien bloc pour sélectionner un numéro existant */}
                {ligneFormData.article_id && numerosSerieDisponibles.length > 0 && (
                  <div>
                    <Label className="text-base mb-2 block">Ou Sélectionner un N° de série existant</Label>
                    <Select
                      value={numeroSerieSelectionne}
                      onValueChange={setNumeroSerieSelectionne}
                    >
                      <SelectTrigger className="h-14 text-lg">
                        <SelectValue placeholder="Sélectionnez un numéro" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Filtrer les séries avec un ID non vide */}
                        {numerosSerieDisponibles.filter(serie => serie.id && serie.id.trim() !== "").map((serie) => (
                          <SelectItem key={serie.id} value={serie.id}>
                            {serie.numero_serie} {serie.adresse_mac ? `(${serie.adresse_mac})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-base mb-2 block">Quantité</Label>
                  <Input
                    className="h-14 text-lg"
                    type="number"
                    min="1"
                    value={ligneFormData.quantite}
                    onChange={(e) => setLigneFormData({...ligneFormData, quantite: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="h-12 px-8 text-lg">
                  Ajouter à la liste
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Liste des Lignes Ajoutées */}
        {lignesMouvement.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Lignes du Mouvement ({lignesMouvement.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-4 text-left">Article</th>
                      <th className="p-4 text-left">N° Article</th>
                      <th className="p-4 text-left">N° de Série</th>
                      <th className="p-4 text-left">Adresse MAC</th>
                      <th className="p-4 text-center">Quantité</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignesMouvement.map((ligne) => {
                      // Trouver les infos de l'article et du numéro de série pour cette ligne temporaire
                      const article = articles.find(a => a.id === ligne.article_id);
                      // Si la ligne a un nouveau numéro de série en attente, on l'affiche
                      const numeroSerieAffiche = ligne.numero_serie_id ? (numerosSerieDisponibles.find(s => s.id === ligne.numero_serie_id)?.numero_serie || 'Inconnu') : (ligne as any).nouveau_numero_serie || 'Nouveau à créer';
                      const adresseMacAffiche = ligne.numero_serie_id ? (numerosSerieDisponibles.find(s => s.id === ligne.numero_serie_id)?.adresse_mac || '-') : (ligne as any).nouvelle_adresse_mac || '-';

                      return (
                        <tr key={ligne.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div>
                              <p className="font-bold text-base">{article?.nom || 'Article inconnu'}</p>
                              <p className="text-xs text-muted-foreground">{article?.numero_article || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground font-mono text-sm">{article?.numero_article || 'N/A'}</td>
                          <td className="p-4 text-sm font-mono">{numeroSerieAffiche}</td>
                          <td className="p-4 text-sm font-mono">{adresseMacAffiche}</td>
                          <td className="p-4 text-center font-bold text-xl text-blue-600">{ligne.quantite}</td>
                          <td className="p-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => supprimerLigne(ligne.id)}
                            >
                              <Trash2 className="h-5 w-5 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bouton de Validation */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            size="lg"
            className="h-14 px-8 text-lg"
            onClick={() => {
              setShowForm(false)
              setLignesMouvement([])
              setMouvementData({
                personne_id: "",
                personne_source_id: "",
                type_mouvement: typesMouvement[0]?.nom || "",
                localisation_origine: "",
                localisation_destination: "",
                remarques: "",
              })
              setLigneFormData({
                article_id: "",
                quantite: 1,
              })
              setArticleSearch("")
            }}
          >
            Annuler
          </Button>
          <Button
            size="lg"
            className="h-14 px-8 text-lg"
            onClick={validerMouvement}
          >
            Valider le mouvement ({lignesMouvement.length} ligne{lignesMouvement.length > 1 ? 's' : ''})
          </Button>
        </div>
      </div>
    )
  }

  // --- Affichage de la Liste des Mouvements ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mouvements de stock</h1>
          <p className="text-muted-foreground mt-1">Historique complet des mouvements d'articles</p>
        </div>
        <Button className="btn-shimmer" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nouveau mouvement
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Réceptions</p>
                <p className="text-2xl font-bold">{stats.receptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <TrendingDown className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sorties</p>
                <p className="text-2xl font-bold">{stats.sorties}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <TrendingDown className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Installations</p>
                <p className="text-2xl font-bold">{stats.installations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-orange-100 p-3 mr-4">
                <RefreshCw className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retours</p>
                <p className="text-2xl font-bold">{stats.retours}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-base mb-2 block">Recherche</Label>
              <Input
                placeholder="Rechercher dans les articles, séries, MAC..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-base mb-2 block">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les types</SelectItem>
                  <SelectItem value="reception">Réception</SelectItem>
                  <SelectItem value="sortie">Sortie</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="retour">Retour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-base mb-2 block">Technicien Source</Label>
              <Select value={filterTechnicien} onValueChange={setFilterTechnicien}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les techniciens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les techniciens</SelectItem>
                  {personnes.filter(p => p.type === 'technicien').map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nom} {p.prenom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-base mb-2 block">Date (du)</Label>
              <Input
                type="date"
                value={filterDateDebut}
                onChange={(e) => setFilterDateDebut(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-base mb-2 block">Date (au)</Label>
              <Input
                type="date"
                value={filterDateFin}
                onChange={(e) => setFilterDateFin(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mouvements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Origine</th>
                  <th className="p-4 text-left">Destination</th>
                  <th className="p-4 text-left">Personne Source</th>
                  <th className="p-4 text-left">Personne Destination</th>
                  <th className="p-4 text-left">Article</th>
                  <th className="p-4 text-left">Série</th>
                  <th className="p-4 text-left">Quantité</th>
                  <th className="p-4 text-left">Remarques</th>
                </tr>
              </thead>
              <tbody>
                {filteredMouvements.map((mouvement) => {
                  const Icon = getTypeIcon(mouvement.type_mouvement)
                  return (
                    <tr key={mouvement.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{new Date(mouvement.date_mouvement).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(mouvement.type_mouvement)}`}>
                          <Icon className="mr-1 h-3 w-3" />
                          {mouvement.type_mouvement}
                        </span>
                      </td>
                      <td className="p-4">{mouvement.localisation_origine}</td>
                      <td className="p-4">{mouvement.localisation_destination}</td>
                      <td className="p-4">{mouvement.personne_source ? `${mouvement.personne_source.nom} ${mouvement.personne_source.prenom}` : '-'}</td>
                      <td className="p-4">{mouvement.personne_dest ? `${mouvement.personne_dest.nom} ${mouvement.personne_dest.prenom}` : '-'}</td>
                      <td className="p-4">{mouvement.article?.nom || 'Inconnu'}</td>
                      <td className="p-4">{mouvement.numero_serie?.numero_serie || '-'}</td>
                      <td className="p-4 text-center font-bold">{mouvement.quantite}</td>
                      <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">{mouvement.remarques}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}