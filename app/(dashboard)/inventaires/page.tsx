// app/(dashboard)/inventaires/page.tsx
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
import { 
  Plus, 
  Search, 
  ClipboardCheck, 
  X, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Package,
  Barcode
} from "lucide-react"
import type { Article, Personne } from "@/lib/types"

type Inventaire = {
  id: string
  date_inventaire: string
  technicien_id?: string
  localisation: string
  statut: 'en_cours' | 'validé' | 'annulé'
  remarques?: string
  validé_par?: string
  date_validation?: string
  technicien?: Personne
  validateur?: Personne
}

type LigneInventaire = {
  id: string
  inventaire_id?: string
  article_id: string
  article_nom: string
  article_numero: string
  numero_serie_id?: string
  numero_serie?: string
  adresse_mac?: string
  quantite_comptée: number
  quantite_système: number
  ecart: number
  remarques?: string
}

export default function InventairesPage() {
  const [inventaires, setInventaires] = useState<Inventaire[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [emplacements, setEmplacements] = useState<{id: string, nom: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [scanInput, setScanInput] = useState("")
  const [lignesInventaire, setLignesInventaire] = useState<LigneInventaire[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatut, setFilterStatut] = useState<string>("all")

  const [inventaireData, setInventaireData] = useState({
    technicien_id: "",
    localisation: "",
    remarques: "",
  })

  useEffect(() => {
    fetchInventaires()
    fetchArticles()
    fetchPersonnes()
    fetchEmplacements()
  }, [])

  async function fetchInventaires() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('inventaires')
        .select(`
          *,
          technicien:personnes!inventaires_technicien_id_fkey(nom, prenom),
          validateur:personnes!inventaires_validé_par_fkey(nom, prenom)
        `)
        .order('date_inventaire', { ascending: false })
        .limit(100)
      if (error) throw error
      setInventaires(data || [])
    } catch (error) {
      console.error('Error fetching inventaires:', error)
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

async function scanArticleOuSerie(searchValue: string) {
  if (!searchValue.trim()) return

  try {
    // D'abord chercher dans les numéros de série
    const { data: serialData } = await supabase
      .from('numeros_serie')
      .select('*, article:articles(*)')
      .or(`numero_serie.ilike.%${searchValue}%,adresse_mac.ilike.%${searchValue}%`)
      .limit(1)

    if (serialData && serialData.length > 0) {
      const serie = serialData[0]
      const article = serie.article as Article
      
      // Vérifier si déjà scanné
      const dejaScan = lignesInventaire.find(l => l.numero_serie_id === serie.id)
      if (dejaScan) {
        alert(`Ce numéro de série a déjà été scanné`)
        setScanInput("")
        return
      }

      // Récupérer la quantité système
      let quantiteSysteme = 0
      if (inventaireData.localisation === "Stock Technicien" && inventaireData.technicien_id) {
        const { data: stockData } = await supabase
          .from('stock_technicien')
          .select('quantite')
          .eq('technicien_id', inventaireData.technicien_id)
          .eq('numero_serie_id', serie.id)
          .maybeSingle()
        quantiteSysteme = stockData?.quantite || 0
      } else {
        // Pour warehouse, on considère qu'il y a 1 unité si le N° série existe
        quantiteSysteme = 1
      }

      const nouvelleLigne: LigneInventaire = {
        id: crypto.randomUUID(),
        article_id: article.id,
        article_nom: article.nom,
        article_numero: article.numero_article,
        numero_serie_id: serie.id,
        numero_serie: serie.numero_serie,
        adresse_mac: serie.adresse_mac,
        quantite_comptée: 1,
        quantite_système: quantiteSysteme,
        ecart: 1 - quantiteSysteme,
      }
      setLignesInventaire([...lignesInventaire, nouvelleLigne])
      setScanInput("")
      return
    }

    // Si pas trouvé en série, chercher dans les articles par code EAN/numéro
    const { data: articleData } = await supabase
      .from('articles')
      .select('*')
      .or(`numero_article.ilike.%${searchValue}%,code_ean.ilike.%${searchValue}%`)
      .limit(1)

    if (articleData && articleData.length > 0) {
      const article = articleData[0]
      
      // ✅ NOUVEAU : Vérifier si l'article a des numéros de série
      const { data: seriesExistantes } = await supabase
        .from('numeros_serie')
        .select('id')
        .eq('article_id', article.id)
        .limit(1)

      if (seriesExistantes && seriesExistantes.length > 0) {
        // ⚠️ Article avec N° série : obliger le scan individuel
        alert(`⚠️ Cet article a des numéros de série. Veuillez scanner chaque N° série ou MAC individuellement.`)
        setScanInput("")
        return
      }

      // Article SANS numéro de série : permettre le comptage groupé
      
      // Vérifier si déjà dans la liste
      const dejaScan = lignesInventaire.find(l => 
        l.article_id === article.id && !l.numero_serie_id
      )
      if (dejaScan) {
        // Incrémenter la quantité comptée
        setLignesInventaire(lignesInventaire.map(l => 
          l.article_id === article.id && !l.numero_serie_id
            ? { ...l, quantite_comptée: l.quantite_comptée + 1, ecart: (l.quantite_comptée + 1) - l.quantite_système }
            : l
        ))
        setScanInput("")
        return
      }

      // ✅ CORRIGÉ : Récupérer la quantité système correctement
      let quantiteSysteme = 0
      if (inventaireData.localisation === "Stock Technicien" && inventaireData.technicien_id) {
        // Charger le stock du technicien pour cet article (sans N° série)
        const { data: stockData } = await supabase
          .from('stock_technicien')
          .select('quantite')
          .eq('technicien_id', inventaireData.technicien_id)
          .eq('article_id', article.id)
          .is('numero_serie_id', null)
          .maybeSingle()
        
        quantiteSysteme = stockData?.quantite || 0
        console.log(`📦 Stock technicien pour ${article.nom}:`, quantiteSysteme)
      } else {
        // Pour warehouse
        quantiteSysteme = article.quantite_stock
      }

      const nouvelleLigne: LigneInventaire = {
        id: crypto.randomUUID(),
        article_id: article.id,
        article_nom: article.nom,
        article_numero: article.numero_article,
        quantite_comptée: 1,
        quantite_système: quantiteSysteme,
        ecart: 1 - quantiteSysteme,
      }
      setLignesInventaire([...lignesInventaire, nouvelleLigne])
      setScanInput("")
      return
    }

    alert("Article ou numéro de série non trouvé")
    setScanInput("")
  } catch (error) {
    console.error('Error scanning:', error)
    alert("Erreur lors du scan")
  }
}

  function supprimerLigne(ligneId: string) {
    setLignesInventaire(lignesInventaire.filter(l => l.id !== ligneId))
  }

  function modifierQuantite(ligneId: string, nouvelleQuantite: number) {
    setLignesInventaire(lignesInventaire.map(l => 
      l.id === ligneId 
        ? { ...l, quantite_comptée: nouvelleQuantite, ecart: nouvelleQuantite - l.quantite_système }
        : l
    ))
  }

  async function enregistrerInventaire() {
    if (lignesInventaire.length === 0) {
      alert("Veuillez scanner au moins un article")
      return
    }
    if (!inventaireData.localisation) {
      alert("Veuillez sélectionner un emplacement")
      return
    }
    if (inventaireData.localisation === "Stock Technicien" && !inventaireData.technicien_id) {
      alert("Veuillez sélectionner un technicien")
      return
    }

    try {
      // Créer l'inventaire
      const { data: inventaire, error: invError } = await supabase
        .from('inventaires')
        .insert([{
          technicien_id: inventaireData.technicien_id || null,
          localisation: inventaireData.localisation,
          statut: 'en_cours',
          remarques: inventaireData.remarques,
        }])
        .select()
        .single()

      if (invError) throw invError

      // Insérer les lignes
      const lignesAInserer = lignesInventaire.map(ligne => ({
        inventaire_id: inventaire.id,
        article_id: ligne.article_id,
        numero_serie_id: ligne.numero_serie_id || null,
        quantite_comptée: ligne.quantite_comptée,
        quantite_système: ligne.quantite_système,
        remarques: ligne.remarques,
      }))

      const { error: lignesError } = await supabase
        .from('lignes_inventaire')
        .insert(lignesAInserer)

      if (lignesError) throw lignesError

      alert(`Inventaire enregistré avec succès ! ${lignesInventaire.length} ligne(s)`)
      setShowForm(false)
      setLignesInventaire([])
      setInventaireData({
        technicien_id: "",
        localisation: "",
        remarques: "",
      })
      fetchInventaires()
    } catch (error: any) {
      console.error('Error saving inventaire:', error)
      alert("Erreur lors de l'enregistrement : " + error.message)
    }
  }

  async function validerInventaire(inventaireId: string) {
    if (!confirm("Êtes-vous sûr de vouloir valider cet inventaire ? Cette action mettra à jour tous les stocks.")) {
      return
    }

    try {
      // Charger les lignes de l'inventaire
      const { data: lignes, error: lignesError } = await supabase
        .from('lignes_inventaire')
        .select('*')
        .eq('inventaire_id', inventaireId)

      if (lignesError) throw lignesError
      if (!lignes || lignes.length === 0) {
        alert("Aucune ligne trouvée pour cet inventaire")
        return
      }

      // Charger l'inventaire pour connaître la localisation
      const { data: inventaire, error: invError } = await supabase
        .from('inventaires')
        .select('*')
        .eq('id', inventaireId)
        .single()

      if (invError) throw invError

      // Mettre à jour chaque ligne
      for (const ligne of lignes) {
        if (ligne.ecart !== 0) {
          // Mettre à jour stock articles si pas de N° série
          if (!ligne.numero_serie_id) {
            if (inventaire.localisation === "Stock Technicien" && inventaire.technicien_id) {
              // Mettre à jour stock technicien
              const { data: existingStock } = await supabase
                .from('stock_technicien')
                .select('*')
                .eq('technicien_id', inventaire.technicien_id)
                .eq('article_id', ligne.article_id)
                .is('numero_serie_id', null)
                .maybeSingle()

              if (existingStock) {
                await supabase
                  .from('stock_technicien')
                  .update({ 
                    quantite: ligne.quantite_comptée,
                    derniere_mise_a_jour: new Date().toISOString()
                  })
                  .eq('id', existingStock.id)
              } else if (ligne.quantite_comptée > 0) {
                await supabase
                  .from('stock_technicien')
                  .insert({
                    technicien_id: inventaire.technicien_id,
                    article_id: ligne.article_id,
                    quantite: ligne.quantite_comptée,
                    localisation: 'camionnette',
                  })
              }
            } else {
              // Mettre à jour stock warehouse
              const { data: article } = await supabase
                .from('articles')
                .select('quantite_stock')
                .eq('id', ligne.article_id)
                .single()

              if (article) {
                await supabase
                  .from('articles')
                  .update({ 
                    quantite_stock: ligne.quantite_comptée
                  })
                  .eq('id', ligne.article_id)
              }
            }
          } else {
            // Article avec N° série - vérifier cohérence
            if (inventaire.localisation === "Stock Technicien" && inventaire.technicien_id) {
              const { data: existingStock } = await supabase
                .from('stock_technicien')
                .select('*')
                .eq('technicien_id', inventaire.technicien_id)
                .eq('numero_serie_id', ligne.numero_serie_id)
                .maybeSingle()

              if (ligne.quantite_comptée > 0 && !existingStock) {
                // Créer l'entrée si comptée mais pas dans le système
                await supabase
                  .from('stock_technicien')
                  .insert({
                    technicien_id: inventaire.technicien_id,
                    article_id: ligne.article_id,
                    numero_serie_id: ligne.numero_serie_id,
                    quantite: 1,
                    localisation: 'camionnette',
                  })
              } else if (ligne.quantite_comptée === 0 && existingStock) {
                // Supprimer si pas comptée mais dans le système
                await supabase
                  .from('stock_technicien')
                  .delete()
                  .eq('id', existingStock.id)
              }
            }
          }
        }
      }

      // Marquer l'inventaire comme validé
      const { error: updateError } = await supabase
        .from('inventaires')
        .update({
          statut: 'validé',
          date_validation: new Date().toISOString(),
          // validé_par: userId // À compléter avec l'authentification
        })
        .eq('id', inventaireId)

      if (updateError) throw updateError

      alert("Inventaire validé avec succès ! Les stocks ont été mis à jour.")
      fetchInventaires()
    } catch (error: any) {
      console.error('Error validating inventaire:', error)
      alert("Erreur lors de la validation : " + error.message)
    }
  }

  async function afficherDetailsInventaire(inventaireId: string) {
    try {
      const { data: lignes, error } = await supabase
        .from('lignes_inventaire')
        .select(`
          *,
          article:articles(nom, numero_article),
          numero_serie:numeros_serie(numero_serie, adresse_mac)
        `)
        .eq('inventaire_id', inventaireId)

      if (error) throw error

      // Afficher dans la console pour l'instant (vous pouvez créer un modal)
      console.log('Détails inventaire:', lignes)
      alert(`${lignes?.length || 0} ligne(s) - Voir la console pour les détails`)
    } catch (error) {
      console.error('Error fetching details:', error)
    }
  }

  const filteredInventaires = inventaires.filter(inv => {
    const matchesSearch = 
      inv.localisation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.technicien?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatut = filterStatut === "all" || inv.statut === filterStatut
    
    return matchesSearch && matchesStatut
  })

  // Calcul des statistiques des écarts
  const statsEcarts = lignesInventaire.reduce((acc, ligne) => {
    if (ligne.ecart > 0) acc.surplus++
    if (ligne.ecart < 0) acc.manquant++
    if (ligne.ecart === 0) acc.correct++
    return acc
  }, { surplus: 0, manquant: 0, correct: 0 })

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
            <h1 className="text-3xl font-bold">Nouvel Inventaire</h1>
            <p className="text-muted-foreground mt-1">
              Scannez les articles et numéros de série
            </p>
          </div>
          <Button variant="outline" onClick={() => {
            setShowForm(false)
            setLignesInventaire([])
          }}>
            <X className="mr-2 h-4 w-4" />
            Fermer
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Emplacement</Label>
                <Select 
                  value={inventaireData.localisation}
                  onValueChange={(value) => setInventaireData({...inventaireData, localisation: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {emplacements.map((emp) => (
                      <SelectItem key={emp.id} value={emp.nom}>
                        {emp.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {inventaireData.localisation === "Stock Technicien" && (
                <div>
                  <Label>Technicien</Label>
                  <Select 
                    value={inventaireData.technicien_id}
                    onValueChange={(value) => setInventaireData({...inventaireData, technicien_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {personnes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nom} {p.prenom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Remarques</Label>
                <Input
                  value={inventaireData.remarques}
                  onChange={(e) => setInventaireData({...inventaireData, remarques: e.target.value})}
                  placeholder="Notes optionnelles..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Articles scannés</span>
                  <Badge variant="secondary" className="text-lg">
                    {lignesInventaire.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">Conformes</span>
                  <Badge className="bg-green-100 text-green-800">
                    {statsEcarts.correct}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-600">Surplus</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    +{statsEcarts.surplus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600">Manquants</span>
                  <Badge className="bg-red-100 text-red-800">
                    {statsEcarts.manquant}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scanner articles / N° série / MAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  className="h-16 text-xl"
                  placeholder="Scanner un code-barres, N° série ou MAC..."
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      scanArticleOuSerie(scanInput)
                    }
                  }}
                  autoFocus
                />
              </div>
              <Button 
                size="lg" 
                className="h-16 px-8"
                onClick={() => scanArticleOuSerie(scanInput)}
              >
                <Barcode className="mr-2 h-5 w-5" />
                Scanner
              </Button>
            </div>
          </CardContent>
        </Card>

        {lignesInventaire.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Articles comptés ({lignesInventaire.length})</CardTitle>
                <Button 
                  variant="ghost" 
                  onClick={() => setLignesInventaire([])}
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
                      <th className="text-left p-4">Article</th>
                      <th className="text-left p-4">N° Série</th>
                      <th className="text-left p-4">MAC</th>
                      <th className="text-center p-4">Qté Système</th>
                      <th className="text-center p-4">Qté Comptée</th>
                      <th className="text-center p-4">Écart</th>
                      <th className="text-center p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignesInventaire.map((ligne, idx) => (
                      <tr key={ligne.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                        <td className="p-4">
                          <div>
                            <p className="font-bold">{ligne.article_nom}</p>
                            <p className="text-xs text-muted-foreground">{ligne.article_numero}</p>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-sm">{ligne.numero_serie || '-'}</td>
                        <td className="p-4 font-mono text-sm">{ligne.adresse_mac || '-'}</td>
                        <td className="p-4 text-center font-semibold">{ligne.quantite_système}</td>
                        <td className="p-4 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={ligne.quantite_comptée}
                            onChange={(e) => modifierQuantite(ligne.id, parseInt(e.target.value) || 0)}
                            className="w-20 text-center font-bold"
                          />
                        </td>
                        <td className="p-4 text-center">
                          <Badge className={
                            ligne.ecart > 0 
                              ? 'bg-blue-100 text-blue-800' 
                              : ligne.ecart < 0 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }>
                            {ligne.ecart > 0 ? '+' : ''}{ligne.ecart}
                          </Badge>
                        </td>
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
            onClick={() => {
              setShowForm(false)
              setLignesInventaire([])
            }}
          >
            Annuler
          </Button>
          <Button 
            size="lg"
            onClick={enregistrerInventaire}
            disabled={lignesInventaire.length === 0}
          >
            <Package className="mr-2 h-5 w-5" />
            Enregistrer l&apos;inventaire ({lignesInventaire.length} ligne{lignesInventaire.length > 1 ? 's' : ''})
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventaires</h1>
          <p className="text-muted-foreground mt-1">
            Gérer les inventaires de stock
          </p>
        </div>
        <Button className="btn-shimmer" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel inventaire
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un inventaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <Label>Statut</Label>
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="validé">Validé</SelectItem>
                  <SelectItem value="annulé">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{filteredInventaires.length} inventaire(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInventaires.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun inventaire trouvé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInventaires.map((inventaire) => (
                <div
                  key={inventaire.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    inventaire.statut === 'validé' 
                      ? 'bg-green-100 text-green-800'
                      : inventaire.statut === 'en_cours'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={
                        inventaire.statut === 'validé' 
                          ? 'bg-green-100 text-green-800'
                          : inventaire.statut === 'en_cours'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }>
                        {inventaire.statut}
                      </Badge>
                      <span className="font-semibold">{inventaire.localisation}</span>
                    </div>
                    <p className="text-sm">
                      {inventaire.technicien?.nom || 'Warehouse'} • {new Date(inventaire.date_inventaire).toLocaleString('fr-BE')}
                    </p>
                    {inventaire.remarques && (
                      <p className="text-xs text-muted-foreground mt-1">
                        💬 {inventaire.remarques}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => afficherDetailsInventaire(inventaire.id)}
                    >
                      Détails
                    </Button>
                    {inventaire.statut === 'en_cours' && (
                      <Button
                        size="sm"
                        onClick={() => validerInventaire(inventaire.id)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Valider
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}