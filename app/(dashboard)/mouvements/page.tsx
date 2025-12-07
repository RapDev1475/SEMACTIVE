// app/(dashboard)/mouvements/page.tsx
"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, History, TrendingUp, TrendingDown, RefreshCw, X, Trash2 } from "lucide-react"
import type { Mouvement, Article, Personne } from "@/lib/types"

type MouvementWithRelations = Mouvement & {
  article?: { nom: string; numero_article: string }
  personne?: { nom: string; prenom?: string }
  numero_serie?: { numero_serie: string; adresse_mac: string | null }
}

type TypeMouvement = {
  id: string
  nom: string
  description: string | null
}

type Scenario = {
  id: string
  origine_type: string
  emplacement_origine: string
  action_origine: string
  type_mouvement: string
  action_destination: string
  emplacement_destination: string
  personne_type: string
  resume_action: string
}

type LigneMouvement = {
  id: string
  article_id: string
  article_nom: string
  article_numero: string
  numero_serie_id?: string
  numero_serie?: string
  adresse_mac?: string
  quantite: number
  stock_actuel: number
}

export default function MouvementsPage() {
  const [mouvements, setMouvements] = useState<MouvementWithRelations[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [typesMouvement, setTypesMouvement] = useState<TypeMouvement[]>([])
  const [emplacements, setEmplacements] = useState<{id: string, nom: string}[]>([])
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [stockTechnicienSource, setStockTechnicienSource] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterDateDebut, setFilterDateDebut] = useState("")
  const [filterDateFin, setFilterDateFin] = useState("")
  const [filterTechnicien, setFilterTechnicien] = useState<string>("all")
  const [searchTechnicien, setSearchTechnicien] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [articleSearch, setArticleSearch] = useState("")
  const [lignesMouvement, setLignesMouvement] = useState<LigneMouvement[]>([])
  const [articleSearchSelect, setArticleSearchSelect] = useState("")
  const [numerosSerieDisponibles, setNumerosSerieDisponibles] = useState<any[]>([])
  const [numeroSerieSelectionne, setNumeroSerieSelectionne] = useState<string>("")

  const [mouvementData, setMouvementData] = useState({
    personne_id: "",
    personne_source_id: "",
    type_mouvement: "",
    localisation_origine: "",
    localisation_destination: "",
    remarques: "",
  })

  const [ligneFormData, setLigneFormData] = useState({
    article_id: "",
    quantite: 1,
  })

  useEffect(() => {
    fetchMouvements()
    fetchArticles()
    fetchPersonnes()
    fetchTypesMouvement()
    fetchEmplacements()
    fetchScenarios()
  }, [])

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

  async function fetchEmplacements() {
    try {
      const { data, error } = await supabase
        .from('emplacements')
        .select('id, nom')
        .order('nom')
      if (error) throw error
      setEmplacements(data || [])
    } catch (error) {
      console.error('Error fetching emplacements:', error)
    }
  }

  async function fetchMouvements() {
    setLoading(true)
    try {
      console.log('🔄 Chargement des mouvements...')
      const { data, error } = await supabase
        .from('mouvements')
        .select(`
          *,
          article:articles(nom, numero_article),
          personne:personnes!mouvements_personne_id_fkey(nom, prenom),
          personne_source:personnes!mouvements_personne_source_id_fkey(nom, prenom),
          numero_serie:numeros_serie(numero_serie, adresse_mac)
        `)
        .order('date_mouvement', { ascending: false })
        .limit(100)
      if (error) {
        console.error('❌ Erreur lors du chargement:', error)
        throw error
      }
      console.log(`✅ ${data?.length || 0} mouvements chargés`)
      console.log('Premier mouvement:', data?.[0])
      setMouvements(data || [])
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
        .eq('type', 'technicien')
        .order('nom')
      setPersonnes(data || [])
    } catch (error) {
      console.error('Error fetching personnes:', error)
    }
  }

  async function fetchTypesMouvement() {
    try {
      const { data, error } = await supabase
        .from('types_mouvement')
        .select('*')
        .order('nom')
      if (error) throw error
      setTypesMouvement(data || [])
      if (data && data.length > 0) {
        setMouvementData(prev => ({ ...prev, type_mouvement: data[0].nom }))
      }
    } catch (error) {
      console.error('Error fetching types de mouvement:', error)
    }
  }

  function getOriginesDisponibles(): string[] {
    const origines = new Set(scenarios.map(s => s.emplacement_origine))
    return Array.from(origines).sort()
  }

  function getTypesMouvementDisponibles(origine: string): Scenario[] {
    return scenarios.filter(s => s.emplacement_origine === origine)
  }

  function getScenario(origine: string, typeMouvement: string): Scenario | null {
    return scenarios.find(s => 
      s.emplacement_origine === origine && 
      s.type_mouvement === typeMouvement
    ) || null
  }

  function appliquerScenario(origine: string, typeMouvement: string) {
    const scenario = getScenario(origine, typeMouvement)
    if (scenario) {
      setMouvementData(prev => ({
        ...prev,
        localisation_origine: scenario.emplacement_origine,
        type_mouvement: scenario.type_mouvement,
        localisation_destination: scenario.emplacement_destination,
        personne_id: "",
        personne_source_id: "",
      }))
      console.log('Scénario appliqué:', scenario)
    } else {
      setMouvementData(prev => ({
        ...prev,
        type_mouvement: typeMouvement,
      }))
      console.log('Scénario non trouvé pour:', { origine, typeMouvement })
    }
  }

  function needsTechnicienSource(): boolean {
    return mouvementData.localisation_origine === "Stock Technicien"
  }

  function needsTechnicienDestination(): boolean {
    return mouvementData.localisation_destination === "Stock Technicien"
  }

  function isTransfertEntreTechniciens(): boolean {
    return mouvementData.localisation_origine === "Stock Technicien" && 
           mouvementData.localisation_destination === "Stock Technicien"
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

  async function searchArticles(searchValue: string) {
    if (!searchValue.trim()) {
      if (isTransfertEntreTechniciens() && mouvementData.personne_source_id) {
        const articlesDisponibles = stockTechnicienSource.map(s => s.article).filter(Boolean)
        setArticles(articlesDisponibles)
      } else {
        fetchArticles()
      }
      return
    }
    try {
      let isSerialOrMacSearch = false
      let foundNumeroSerie: any = null
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
            foundNumeroSerie = serialData[0]
            setArticles([serialData[0].article])
			// ✅ Mettre à jour le formData et charger les séries pour cet article
			const article = serialData[0].article;
			setLigneFormData({...ligneFormData, article_id: article.id});
			loadNumerosSerieForArticle(article.id);
            setTimeout(() => {
              ajouterLigneAuto(serialData[0].article, foundNumeroSerie)
            }, 100)
            return
          } else {
            alert(`Ce numéro de série n'est pas dans le stock du technicien source`)
            setArticles([])
            return
          }
        } else {
          const articlesDisponibles = stockTechnicienSource
            .filter(s => s.article && s.article.nom.toLowerCase().includes(searchValue.toLowerCase()))
            .map(s => s.article)
            .filter(Boolean)
          const uniqueArticles = Array.from(new Map(articlesDisponibles.map(a => [a.id, a])).values())
          setArticles(uniqueArticles)
          return
        }
      }
      const { data: serialData } = await supabase
        .from('numeros_serie')
        .select('*, article:articles(*)')
        .or(`numero_serie.ilike.%${searchValue}%,adresse_mac.ilike.%${searchValue}%`)
      let articleIds: string[] = []
      if (serialData && serialData.length > 0) {
        articleIds = [...new Set(serialData.map(s => s.article_id))]
        isSerialOrMacSearch = true
        foundNumeroSerie = serialData[0]
      }
      let query = supabase
        .from('articles')
        .select('*')
        .order('nom')
      if (articleIds.length > 0) {
        query = query.in('id', articleIds)
      } else {
        query = query.or(`nom.ilike.%${searchValue}%,numero_article.ilike.%${searchValue}%`)
      }
      const { data } = await query
      setArticles(data || [])
      if (data && data.length === 1) {
        const article = data[0]
        setLigneFormData({...ligneFormData, article_id: article.id})
		loadNumerosSerieForArticle(article.id)
        if (isSerialOrMacSearch && foundNumeroSerie) {
          setTimeout(() => {
            ajouterLigneAuto(article, foundNumeroSerie)
          }, 100)
        }
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
      setNumerosSerieDisponibles(seriesInStock.map(s => s.numero_serie).filter(Boolean))
    } else {
      // Sinon, charger tous les numéros de série de cet article
      const { data } = await supabase
        .from('numeros_serie')
        .select('*')
        .eq('article_id', articleId)
        .eq('statut', 'disponible')
      setNumerosSerieDisponibles(data || [])
    }
  } catch (error) {
    console.error('Error loading numeros serie:', error)
    setNumerosSerieDisponibles([])
  }
}
  function ajouterLigneAuto(article: Article, numeroSerie?: any) {
    if (numeroSerie && lignesMouvement.find(l => l.numero_serie_id === numeroSerie.id)) {
      alert("Ce numéro de série est déjà dans la liste.")
	  setLignesMouvement([...lignesMouvement, nouvelleLigne])
		// Recharger tous les articles pour le Select
		if (isTransfertEntreTechniciens() && mouvementData.personne_source_id) {
		const articlesDisponibles = stockTechnicienSource.map(s => s.article).filter(Boolean)
		const uniqueArticles = Array.from(new Map(articlesDisponibles.map(a => [a.id, a])).values())
		setArticles(uniqueArticles)
		} else {
		fetchArticles()
		}
		setArticleSearch("")
		setArticleSearchSelect("")
		setLigneFormData({ article_id: "", quantite: 1 })
      return
    }
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
 const nouvelleLigne: LigneMouvement = {
    id: crypto.randomUUID(),
    article_id: article.id,
    article_nom: article.nom,
    article_numero: article.numero_article,
    numero_serie_id: numeroSerie?.id,
    numero_serie: numeroSerie?.numero_serie,
    adresse_mac: numeroSerie?.adresse_mac,
    quantite: 1,
    stock_actuel: article.quantite_stock,
  }
  setLignesMouvement([...lignesMouvement, nouvelleLigne])
  
  // IMPORTANT: Recharger TOUS les articles disponibles après le scan
  if (isTransfertEntreTechniciens() && mouvementData.personne_source_id) {
    // Pour transfert entre techniciens: tous les articles du stock source
    const articlesDisponibles = stockTechnicienSource.map(s => s.article).filter(Boolean)
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
}

function ajouterLigne(e: React.FormEvent) {
  e.preventDefault()
  if (!ligneFormData.article_id || ligneFormData.quantite < 1) {
    alert("Veuillez sélectionner un article et une quantité valide")
    return
  }
  const article = articles.find(a => a.id === ligneFormData.article_id)
  if (!article) return

  // Récupérer les infos du numéro de série si sélectionné
  let serieInfo = null
  if (numeroSerieSelectionne && numeroSerieSelectionne !== "none") {
    serieInfo = numerosSerieDisponibles.find(s => s.id === numeroSerieSelectionne)
  }

  const nouvelleLigne: LigneMouvement = {
    id: crypto.randomUUID(),
    article_id: ligneFormData.article_id,
    article_nom: article.nom,
    article_numero: article.numero_article,
    numero_serie_id: serieInfo?.id,
    numero_serie: serieInfo?.numero_serie,
    adresse_mac: serieInfo?.adresse_mac,
    quantite: ligneFormData.quantite,
    stock_actuel: article.quantite_stock,
  }
  setLignesMouvement([...lignesMouvement, nouvelleLigne])
  setLigneFormData({
    article_id: "",
    quantite: 1,
  })
  setArticleSearch("")
  setArticleSearchSelect("")
  setNumerosSerieDisponibles([])
  setNumeroSerieSelectionne("")
}

  function supprimerLigne(ligneId: string) {
    setLignesMouvement(lignesMouvement.filter(l => l.id !== ligneId))
  }

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

      const mouvementsToInsert = lignesMouvement.map(ligne => ({
        article_id: ligne.article_id,
        numero_serie_id: ligne.numero_serie_id || null,
        personne_id: mouvementData.personne_id || mouvementData.personne_source_id || null,
        type_mouvement: typeMapped,
        localisation_origine: mouvementData.localisation_origine || null,
        localisation_destination: mouvementData.localisation_destination || null,
        quantite: ligne.quantite,
        remarques: remarquesFinales,
        date_mouvement: dateMouvement,
      }))
      console.log('DEBUG - Valeur de type_mouvement dans le premier objet à insérer:', mouvementsToInsert[0]?.type_mouvement)
      console.log('Données à insérer:', mouvementsToInsert)

      const { error: mouvementError } = await supabase
        .from('mouvements')
        .insert(mouvementsToInsert)
      if (mouvementError) throw mouvementError

      const typeMvt = typesMouvement.find(t => t.nom === mouvementData.type_mouvement)
      for (const ligne of lignesMouvement) {
        const article = articles.find(a => a.id === ligne.article_id)
        if (!article) continue
        let newQuantity = article.quantite_stock
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

        if (ligne.numero_serie_id && mouvementData.localisation_destination) {
          try {
            const { error: updateSerieError } = await supabase
              .from('numeros_serie')
              .update({ 
                localisation: mouvementData.localisation_destination,
                updated_at: new Date().toISOString()
              })
              .eq('id', ligne.numero_serie_id)
            if (updateSerieError) {
              console.error('Erreur mise à jour emplacement série:', updateSerieError)
            } else {
              console.log(`✅ Emplacement mis à jour pour série ${ligne.numero_serie}: ${mouvementData.localisation_destination}`)
            }
          } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'emplacement:', error)
          }
        }

        if (mouvementData.personne_source_id && mouvementData.localisation_origine === "Stock Technicien") {
          try {
            let queryStock = supabase
              .from('stock_technicien')
              .select('*')
              .eq('technicien_id', mouvementData.personne_source_id)
              .eq('article_id', ligne.article_id)
            if (ligne.numero_serie_id) {
              queryStock = queryStock.eq('numero_serie_id', ligne.numero_serie_id)
            } else {
              queryStock = queryStock.is('numero_serie_id', null)
            }
            const { data: existingStock } = await queryStock.maybeSingle()
            if (existingStock) {
              const newQty = existingStock.quantite - ligne.quantite
              console.log(`Retrait stock technicien source: ${existingStock.quantite} - ${ligne.quantite} = ${newQty}`)
              if (newQty <= 0) {
                await supabase
                  .from('stock_technicien')
                  .delete()
                  .eq('id', existingStock.id)
              } else {
                await supabase
                  .from('stock_technicien')
                  .update({ 
                    quantite: newQty,
                    derniere_mise_a_jour: new Date().toISOString()
                  })
                  .eq('id', existingStock.id)
              }
            }
          } catch (error) {
            console.error('Erreur retrait stock_technicien source:', error)
            alert(`Erreur lors du retrait du stock technicien pour ${ligne.article_nom}`)
          }
        }

        if (mouvementData.personne_id && mouvementData.localisation_destination === "Stock Technicien") {
          try {
            let queryStock = supabase
              .from('stock_technicien')
              .select('*')
              .eq('technicien_id', mouvementData.personne_id)
              .eq('article_id', ligne.article_id)
            if (ligne.numero_serie_id) {
              queryStock = queryStock.eq('numero_serie_id', ligne.numero_serie_id)
            } else {
              queryStock = queryStock.is('numero_serie_id', null)
            }
            const { data: existingStock } = await queryStock.maybeSingle()
            if (existingStock) {
              console.log(`Ajout stock technicien destination: ${existingStock.quantite} + ${ligne.quantite}`)
              await supabase
                .from('stock_technicien')
                .update({ 
                  quantite: existingStock.quantite + ligne.quantite,
                  derniere_mise_a_jour: new Date().toISOString()
                })
                .eq('id', existingStock.id)
            } else {
              console.log('Création nouvelle entrée stock_technicien destination pour:', ligne.article_nom)
              await supabase
                .from('stock_technicien')
                .insert({
                  technicien_id: mouvementData.personne_id,
                  article_id: ligne.article_id,
                  numero_serie_id: ligne.numero_serie_id || null,
                  quantite: ligne.quantite,
                  localisation: mouvementData.localisation_destination || 'camionnette',
                })
            }
          } catch (error: any) {
            alert("Erreur: " + error.message)
          }
        }
      }

      setShowForm(false)
      fetchMouvements()
      fetchArticles()
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
      alert(`${lignesMouvement.length} ligne(s) de mouvement enregistrée(s) avec succès !`)
    } catch (error: any) {
      alert("Erreur: " + error.message)
    }
  }
	const articlesForSelect = articles.filter(article => 
	article.nom.toLowerCase().includes(articleSearchSelect.toLowerCase()) ||
	article.numero_article.toLowerCase().includes(articleSearchSelect.toLowerCase())
	)
  const filteredMouvements = mouvements.filter(m => {
    const matchesSearch = 
      (m.article?.nom && m.article.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.personne?.nom && m.personne.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.type_mouvement && m.type_mouvement.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = filterType === "all" || m.type_mouvement === filterType
    
    const matchesTechnicien = filterTechnicien === "all" || 
      m.personne_id === filterTechnicien ||
      (m as any).personne_source_id === filterTechnicien
    
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

  const filteredPersonnes = personnes.filter(p => 
    p.nom.toLowerCase().includes(searchTechnicien.toLowerCase()) ||
    (p.prenom && p.prenom.toLowerCase().includes(searchTechnicien.toLowerCase()))
  )

  console.log(`📊 Mouvements totaux: ${mouvements.length}, Filtrés: ${filteredMouvements.length}`)
  console.log(`🔍 Recherche: "${searchTerm}", Filtre type: "${filterType}"`)

  const stats = {
    total: mouvements.length,
    receptions: mouvements.filter(m => m.type_mouvement?.toLowerCase().includes('reception')).length,
    sorties: mouvements.filter(m => m.type_mouvement?.toLowerCase().includes('sortie') || m.type_mouvement?.toLowerCase().includes('installation')).length,
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
            <h1 className="text-3xl font-bold">Enregistrer un mouvement</h1>
            <p className="text-muted-foreground mt-1">
              Ajoutez plusieurs lignes puis validez le mouvement
            </p>
          </div>
          <Button variant="outline" onClick={() => {
            setShowForm(false)
            setLignesMouvement([])
          }}>
            <X className="mr-2 h-4 w-4" />
            Fermer
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Étape 1 : Sélectionnez l&apos;emplacement d&apos;origine</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={mouvementData.localisation_origine} 
              onValueChange={(value) => {
                setMouvementData({
                  ...mouvementData,
                  localisation_origine: value,
                  type_mouvement: "",
                  localisation_destination: "",
                })
              }}
            >
              <SelectTrigger className="h-14 text-lg">
                <SelectValue placeholder="Choisissez un emplacement" />
              </SelectTrigger>
              <SelectContent>
                {getOriginesDisponibles().map((origine) => (
                  <SelectItem key={origine} value={origine}>
                    {origine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {mouvementData.localisation_origine && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Étape 2 : Sélectionnez le type de mouvement</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={mouvementData.type_mouvement} 
                onValueChange={(value) => {
                  appliquerScenario(mouvementData.localisation_origine, value)
                }}
              >
                <SelectTrigger className="h-14 text-lg">
                  <SelectValue placeholder="Choisissez un type de mouvement" />
                </SelectTrigger>
                <SelectContent>
                  {getTypesMouvementDisponibles(mouvementData.localisation_origine).map((scenario) => (
                    <SelectItem key={scenario.id} value={scenario.type_mouvement}>
                      {scenario.type_mouvement}
                      {scenario.resume_action && (
                        <span className="text-xs text-muted-foreground ml-2">
                          → {scenario.emplacement_destination}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {mouvementData.type_mouvement && (
          <>
            {isTransfertEntreTechniciens() ? (
              <div className="grid grid-cols-4 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">Origine</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-14 flex items-center px-4 bg-green-50 rounded-lg border-2 border-green-200">
                      <p className="font-semibold">{mouvementData.localisation_origine}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">Technicien source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select 
                      value={mouvementData.personne_source_id || "none"}
                      onValueChange={(value) => {
                        const newValue = value === "none" ? "" : value
                        setMouvementData({...mouvementData, personne_source_id: newValue})
                        fetchStockTechnicienSource(newValue)
                      }}
                    >
                      <SelectTrigger className="h-14 text-lg">
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {personnes.filter(p => p.type === 'technicien').map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nom} {p.prenom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-600">Destination</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-14 flex items-center px-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <p className="font-semibold">{mouvementData.localisation_destination}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-600">Technicien destination</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select 
                      value={mouvementData.personne_id || "none"}
                      onValueChange={(value) => setMouvementData({...mouvementData, personne_id: value === "none" ? "" : value})}
                    >
                      <SelectTrigger className="h-14 text-lg">
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {personnes.filter(p => p.type === 'technicien' && p.id !== mouvementData.personne_source_id).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nom} {p.prenom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className={`grid ${needsTechnicienSource() || needsTechnicienDestination() ? 'grid-cols-3' : 'grid-cols-2'} gap-6`}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">Origine</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-14 flex items-center px-4 bg-green-50 rounded-lg border-2 border-green-200">
                      <p className="font-semibold">{mouvementData.localisation_origine}</p>
                    </div>
                  </CardContent>
                </Card>
                {needsTechnicienSource() && !needsTechnicienDestination() && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-green-600">De quel technicien ?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select 
                        value={mouvementData.personne_source_id || "none"}
                        onValueChange={(value) => {
                          const newValue = value === "none" ? "" : value
                          setMouvementData({...mouvementData, personne_source_id: newValue})
                          fetchStockTechnicienSource(newValue)
                        }}
                      >
                        <SelectTrigger className="h-14 text-lg">
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun</SelectItem>
                          {personnes.filter(p => p.type === 'technicien').map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nom} {p.prenom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-600">Destination</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-14 flex items-center px-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <p className="font-semibold">{mouvementData.localisation_destination}</p>
                    </div>
                  </CardContent>
                </Card>
                {needsTechnicienDestination() && !needsTechnicienSource() && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-600">Vers quel technicien ?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select 
                        value={mouvementData.personne_id || "none"}
                        onValueChange={(value) => setMouvementData({...mouvementData, personne_id: value === "none" ? "" : value})}
                      >
                        <SelectTrigger className="h-14 text-lg">
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun</SelectItem>
                          {personnes.filter(p => p.type === 'technicien').map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nom} {p.prenom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {mouvementData.type_mouvement && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Remarques</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                className="h-14 text-lg"
                value={mouvementData.remarques}
                onChange={(e) => setMouvementData({...mouvementData, remarques: e.target.value})}
                placeholder="Notes supplémentaires..."
              />
            </CardContent>
          </Card>
        )}

{mouvementData.type_mouvement && (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Étape 3 : Ajouter des articles</CardTitle>
    </CardHeader>
    <CardContent>
      <form onSubmit={ajouterLigne} className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <Label className="text-base mb-2 block">Rechercher article (Scanner EAN / MAC / Série)</Label>
            <Input
              className="h-16 text-xl"
              placeholder="Scanner ou rechercher..."
              value={articleSearch}
              onChange={(e) => {
                setArticleSearch(e.target.value)
                searchArticles(e.target.value)
              }}
              autoFocus
            />
          </div>
          <div className="col-span-2">
            <Label className="text-base mb-2 block">Quantité</Label>
            <Input
              className="h-16 text-xl text-center"
              type="number"
              min="1"
              value={ligneFormData.quantite}
              onChange={(e) => setLigneFormData({...ligneFormData, quantite: parseInt(e.target.value) || 1})}
            />
          </div>
          <div className="col-span-2">
            <Label className="text-base mb-2 block opacity-0">Action</Label>
            <Button type="submit" className="w-full h-16 text-lg" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Affichage visuel de l'article sélectionné */}
        {ligneFormData.article_id && (() => {
          const art = articles.find(a => a.id === ligneFormData.article_id)
          if (!art) return null
          return (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl border-2 border-blue-300 dark:border-blue-700">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-2xl">
                  {art.nom.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{art.nom}</p>
                  <div className="flex gap-4 mt-1 text-sm text-blue-700 dark:text-blue-300">
                    <span className="font-mono font-semibold">N°: {art.numero_article}</span>
                    <span>•</span>
                    <span className="font-semibold">Stock disponible: {art.quantite_stock}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        <div className="grid grid-cols-2 gap-6">
<div>
  <Label className="text-base mb-2 block">Article sélectionné</Label>
  <Select 
    value={ligneFormData.article_id} 
    onValueChange={(value) => {
      setLigneFormData({...ligneFormData, article_id: value})
      setArticleSearchSelect("") // Reset recherche Select après sélection
	  loadNumerosSerieForArticle(value)
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
      {articlesForSelect.length === 0 ? (
        <div className="p-4 text-muted-foreground text-center">
          {articleSearchSelect ? 'Aucun résultat' : articles.length === 0 ? 'Recherchez d\'abord un article ci-dessus' : 'Aucun article trouvé'}
        </div>
      ) : (
        articlesForSelect.map((article) => (
          <SelectItem key={article.id} value={article.id}>
            <div className="flex flex-col py-1">
              <span className="font-semibold">{article.nom}</span>
              <span className="text-xs text-muted-foreground">
                {article.numero_article} • Stock: {article.quantite_stock}
              </span>
            </div>
          </SelectItem>
        ))
      )}
    </SelectContent>
  </Select>
</div>
{ligneFormData.article_id && numerosSerieDisponibles.length > 0 && (
  <div>
    <Label className="text-base mb-2 block">Numéro de série / MAC</Label>
    <Select 
      value={numeroSerieSelectionne} 
      onValueChange={setNumeroSerieSelectionne}
    >
      <SelectTrigger className="h-14 text-lg">
        <SelectValue placeholder="Sélectionnez un N° série (optionnel)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Aucun (article sans série)</SelectItem>
        {numerosSerieDisponibles.map((serie) => (
          <SelectItem key={serie.id} value={serie.id}>
            <div className="flex flex-col py-1">
              <span className="font-semibold font-mono">{serie.numero_serie}</span>
              {serie.adresse_mac && (
                <span className="text-xs text-muted-foreground font-mono">
                  MAC: {serie.adresse_mac}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}
        </div>
      </form>
    </CardContent>
  </Card>
)}

        {mouvementData.type_mouvement && lignesMouvement.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Lignes du mouvement ({lignesMouvement.length})</CardTitle>
                <Button 
                  variant="ghost" 
                  onClick={() => setLignesMouvement([])}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Tout effacer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
				<div className="border rounded-lg overflow-hidden">
				<table className="w-full">
					<thead className="bg-muted">
					<tr>
						<th className="text-left p-4 font-semibold text-base">Article</th>
						<th className="text-left p-4 font-semibold text-base">N° Article</th>
						<th className="text-left p-4 font-semibold text-base">N° Série</th>
						<th className="text-left p-4 font-semibold text-base">Adresse MAC</th>
						<th className="text-center p-4 font-semibold text-base">Stock</th>
						<th className="text-center p-4 font-semibold text-base">Qté</th>
						<th className="text-center p-4 font-semibold text-base w-24">Action</th>
					</tr>
					</thead>
					<tbody>
					{lignesMouvement.map((ligne, idx) => (
						<tr key={ligne.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
						<td className="p-4">
							<div>
							<p className="font-bold text-base">{ligne.article_nom}</p>
							<p className="text-xs text-muted-foreground">{ligne.article_numero}</p>
							</div>
						</td>
						<td className="p-4 text-muted-foreground font-mono text-sm">{ligne.article_numero}</td>
						<td className="p-4 text-sm font-mono">{ligne.numero_serie || '-'}</td>
						<td className="p-4 text-sm font-mono">{ligne.adresse_mac || '-'}</td>
						<td className="p-4 text-center text-base font-semibold">{ligne.stock_actuel}</td>
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
					))}
						</tbody>
				</table>
				</div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 justify-end">
          <Button 
            variant="outline"
            size="lg"
            className="h-14 px-8 text-lg"
            onClick={() => {
              setShowForm(false)
              setLignesMouvement([])
            }}
          >
            Annuler
          </Button>
          <Button 
            size="lg"
            className="h-14 px-8 text-lg"
            onClick={validerMouvement}
            disabled={lignesMouvement.length === 0}
          >
            Valider le mouvement ({lignesMouvement.length} ligne{lignesMouvement.length > 1 ? 's' : ''})
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mouvements de stock</h1>
          <p className="text-muted-foreground mt-1">
            Historique complet des mouvements d&apos;articles
          </p>
        </div>
        <Button className="btn-shimmer" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau mouvement
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total mouvements
            </CardTitle>
            <History className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Réceptions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.receptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sorties
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sorties}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Retours
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.retours}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par article, personne ou type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-debut" className="text-sm font-medium">
                  Date début
                </Label>
                <Input
                  id="date-debut"
                  type="date"
                  value={filterDateDebut}
                  onChange={(e) => setFilterDateDebut(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-fin" className="text-sm font-medium">
                  Date fin
                </Label>
                <Input
                  id="date-fin"
                  type="date"
                  value={filterDateFin}
                  onChange={(e) => setFilterDateFin(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type de mouvement</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {typesMouvement.map((type) => (
                      <SelectItem key={type.id} value={type.nom}>
                        {type.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Technicien</Label>
                <Select value={filterTechnicien} onValueChange={setFilterTechnicien}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les techniciens" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Rechercher..."
                        value={searchTechnicien}
                        onChange={(e) => setSearchTechnicien(e.target.value)}
                        className="h-8 mb-2"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <SelectItem value="all">Tous les techniciens</SelectItem>
                    {filteredPersonnes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nom} {p.prenom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {(filterDateDebut || filterDateFin || filterType !== "all" || filterTechnicien !== "all" || searchTerm) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterDateDebut("")
                  setFilterDateFin("")
                  setFilterType("all")
                  setFilterTechnicien("all")
                  setSearchTerm("")
                  setSearchTechnicien("")
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{filteredMouvements.length} mouvements</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMouvements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun mouvement trouvé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMouvements.map((mouvement) => {
                const Icon = getTypeIcon(mouvement.type_mouvement || '')
                return (
                  <div
                    key={mouvement.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getTypeBadge(mouvement.type_mouvement || '')}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getTypeBadge(mouvement.type_mouvement || '')}>
                          {mouvement.type_mouvement}
                        </Badge>
                        <span className="font-semibold">Quantité: {mouvement.quantite}</span>
                      </div>
                      <p className="text-sm font-medium">
                        {mouvement.article?.nom || 'Article inconnu'} ({mouvement.article?.numero_article})
                        {mouvement.numero_serie && (
                          <span className="ml-2 text-xs">
                            • Série: {mouvement.numero_serie.numero_serie}
                            {mouvement.numero_serie.adresse_mac && ` • MAC: ${mouvement.numero_serie.adresse_mac}`}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mouvement.personne?.nom || 'Système'} • {new Date(mouvement.date_mouvement).toLocaleString('fr-BE')}
                      </p>
                      {mouvement.remarques && (
                        <p className="text-xs text-muted-foreground mt-1">
                          💬 {mouvement.remarques}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}