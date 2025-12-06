// app/(dashboard)/mouvements/page.tsx
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
}

type TypeMouvement = {
  id: string
  nom: string
  description: string | null
}

// Type pour une ligne de mouvement temporaire
type LigneMouvement = {
  id: string // ID temporaire unique
  article_id: string
  article_nom: string
  article_numero: string
  quantite: number
  stock_actuel: number
}

export default function MouvementsPage() {
  const [mouvements, setMouvements] = useState<MouvementWithRelations[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [typesMouvement, setTypesMouvement] = useState<TypeMouvement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [articleSearch, setArticleSearch] = useState("")
  
  // État pour les lignes de mouvement temporaires
  const [lignesMouvement, setLignesMouvement] = useState<LigneMouvement[]>([])
  
  // Données communes à toutes les lignes du mouvement
  const [mouvementData, setMouvementData] = useState({
    personne_id: "",
    type_mouvement: "",
    remarques: "",
  })
  
  // Formulaire pour ajouter une ligne
  const [ligneFormData, setLigneFormData] = useState({
    article_id: "",
    quantite: 1,
  })

  useEffect(() => {
    fetchMouvements()
    fetchArticles()
    fetchPersonnes()
    fetchTypesMouvement()
  }, [])

  async function fetchMouvements() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('mouvements')
        .select(`
          *,
          article:articles(nom, numero_article),
          personne:personnes(nom, prenom)
        `)
        .order('date_mouvement', { ascending: false })
        .limit(100)

      if (error) throw error
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
      
      // Si des types existent, sélectionner le premier par défaut
      if (data && data.length > 0) {
        setMouvementData(prev => ({ ...prev, type_mouvement: data[0].nom }))
      }
    } catch (error) {
      console.error('Error fetching types de mouvement:', error)
    }
  }

  async function searchArticles(searchValue: string) {
    if (!searchValue.trim()) {
      fetchArticles()
      return
    }

    try {
      let isSerialOrMacSearch = false
      
      // Rechercher d'abord par numéro de série ou MAC
      const { data: serialData } = await supabase
        .from('numeros_serie')
        .select('article_id')
        .or(`numero_serie.ilike.%${searchValue}%,adresse_mac.ilike.%${searchValue}%`)

      let articleIds: string[] = []
      
      if (serialData && serialData.length > 0) {
        articleIds = [...new Set(serialData.map(s => s.article_id))]
        isSerialOrMacSearch = true
      }

      // Rechercher les articles
      let query = supabase
        .from('articles')
        .select('*')
        .order('nom')

      // Si on a des IDs depuis les numéros de série, les inclure
      // Sinon chercher par nom ou numéro article
      if (articleIds.length > 0) {
        query = query.in('id', articleIds)
      } else {
        query = query.or(`nom.ilike.%${searchValue}%,numero_article.ilike.%${searchValue}%`)
      }

      const { data } = await query
      setArticles(data || [])
      
      // AUTO-SÉLECTION ET AUTO-AJOUT : Si un seul résultat
      if (data && data.length === 1) {
        const article = data[0]
        setLigneFormData({...ligneFormData, article_id: article.id})
        
        // Si recherche par série/MAC, ajouter automatiquement la ligne
        if (isSerialOrMacSearch) {
          setTimeout(() => {
            ajouterLigneAuto(article)
          }, 100)
        }
      }
    } catch (error) {
      console.error('Error searching articles:', error)
    }
  }

  // Ajouter une ligne automatiquement (lors du scan)
  function ajouterLigneAuto(article: Article) {
    // Vérifier si l'article n'est pas déjà dans les lignes
    const dejaPresent = lignesMouvement.find(l => l.article_id === article.id)
    if (dejaPresent) {
      alert("Cet article est déjà dans la liste.")
      setArticleSearch("")
      setLigneFormData({ article_id: "", quantite: 1 })
      return
    }

    const nouvelleLigne: LigneMouvement = {
      id: crypto.randomUUID(),
      article_id: article.id,
      article_nom: article.nom,
      article_numero: article.numero_article,
      quantite: 1,
      stock_actuel: article.quantite_stock,
    }

    setLignesMouvement([...lignesMouvement, nouvelleLigne])
    
    // Réinitialiser
    setArticleSearch("")
    setLigneFormData({ article_id: "", quantite: 1 })
  }

  // Ajouter une ligne au mouvement
  function ajouterLigne(e: React.FormEvent) {
    e.preventDefault()
    
    if (!ligneFormData.article_id || ligneFormData.quantite < 1) {
      alert("Veuillez sélectionner un article et une quantité valide")
      return
    }

    const article = articles.find(a => a.id === ligneFormData.article_id)
    if (!article) return

    // Vérifier si l'article n'est pas déjà dans les lignes
    const dejaPresent = lignesMouvement.find(l => l.article_id === ligneFormData.article_id)
    if (dejaPresent) {
      alert("Cet article est déjà dans la liste. Supprimez-le d'abord si vous voulez le modifier.")
      return
    }

    const nouvelleLigne: LigneMouvement = {
      id: crypto.randomUUID(),
      article_id: ligneFormData.article_id,
      article_nom: article.nom,
      article_numero: article.numero_article,
      quantite: ligneFormData.quantite,
      stock_actuel: article.quantite_stock,
    }

    setLignesMouvement([...lignesMouvement, nouvelleLigne])
    
    // Réinitialiser le formulaire de ligne
    setLigneFormData({
      article_id: "",
      quantite: 1,
    })
    setArticleSearch("")
  }

  // Supprimer une ligne
  function supprimerLigne(ligneId: string) {
    setLignesMouvement(lignesMouvement.filter(l => l.id !== ligneId))
  }

  // Valider tout le mouvement
  async function validerMouvement() {
    if (lignesMouvement.length === 0) {
      alert("Veuillez ajouter au moins une ligne avant de valider")
      return
    }

    if (!mouvementData.type_mouvement) {
      alert("Veuillez sélectionner un type de mouvement")
      return
    }

    try {
      const dateMouvement = new Date().toISOString()

      // Préparer toutes les lignes de mouvement à insérer
      const mouvementsToInsert = lignesMouvement.map(ligne => ({
        article_id: ligne.article_id,
        personne_id: mouvementData.personne_id || null,
        type_mouvement: mouvementData.type_mouvement,
        quantite: ligne.quantite,
        remarques: mouvementData.remarques,
        date_mouvement: dateMouvement,
      }))

      // Insérer tous les mouvements
      const { error: mouvementError } = await supabase
        .from('mouvements')
        .insert(mouvementsToInsert)

      if (mouvementError) throw mouvementError

      // Mettre à jour le stock pour chaque article
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
      }

      // Fermer le dialog et réinitialiser
      setDialogOpen(false)
      fetchMouvements()
      fetchArticles()
      
      // Réinitialiser tous les états
      setLignesMouvement([])
      setMouvementData({
        personne_id: "",
        type_mouvement: typesMouvement[0]?.nom || "",
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

  const filteredMouvements = mouvements.filter(m => {
    const matchesSearch = 
      (m.article?.nom && m.article.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.personne?.nom && m.personne.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.type_mouvement.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterType === "all") return matchesSearch
    return matchesSearch && m.type_mouvement === filterType
  })

  const stats = {
    total: mouvements.length,
    receptions: mouvements.filter(m => m.type_mouvement.toLowerCase().includes('reception')).length,
    sorties: mouvements.filter(m => m.type_mouvement.toLowerCase().includes('sortie') || m.type_mouvement.toLowerCase().includes('installation')).length,
    retours: mouvements.filter(m => m.type_mouvement.toLowerCase().includes('retour')).length,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mouvements de stock</h1>
          <p className="text-muted-foreground mt-1">
            Historique complet des mouvements d&apos;articles
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-shimmer">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau mouvement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enregistrer un mouvement</DialogTitle>
              <DialogDescription>
                Ajoutez plusieurs lignes puis validez le mouvement en une fois
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Informations communes */}
              <div className="p-4 bg-muted rounded-lg space-y-4">
                <h3 className="font-semibold">Informations du mouvement</h3>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="type_mouvement">Type de mouvement *</Label>
                    <Select 
                      value={mouvementData.type_mouvement} 
                      onValueChange={(value) => setMouvementData({...mouvementData, type_mouvement: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {typesMouvement.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            Aucun type de mouvement défini
                          </div>
                        ) : (
                          typesMouvement.map((type) => (
                            <SelectItem key={type.id} value={type.nom}>
                              {type.nom} {type.description && `(${type.description})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personne_id">Technicien</Label>
                    <Select 
                      value={mouvementData.personne_id || "none"}
                      onValueChange={(value) => setMouvementData({...mouvementData, personne_id: value === "none" ? "" : value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un technicien (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {personnes.map((personne) => (
                          <SelectItem key={personne.id} value={personne.id}>
                            {personne.nom} {personne.prenom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarques">Remarques globales</Label>
                    <Input
                      id="remarques"
                      value={mouvementData.remarques}
                      onChange={(e) => setMouvementData({...mouvementData, remarques: e.target.value})}
                      placeholder="Notes supplémentaires..."
                    />
                  </div>
                </div>
              </div>

              {/* Formulaire pour ajouter une ligne */}
              <div className="p-4 border rounded-lg space-y-4">
                <h3 className="font-semibold">Ajouter un article</h3>
                
                <form onSubmit={ajouterLigne} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="article_search">Rechercher article *</Label>
                      <Input
                        id="article_search"
                        placeholder="Scanner EAN / MAC / Série ou rechercher..."
                        value={articleSearch}
                        onChange={(e) => {
                          setArticleSearch(e.target.value)
                          searchArticles(e.target.value)
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantite">Quantité</Label>
                      <Input
                        id="quantite"
                        type="number"
                        min="1"
                        value={ligneFormData.quantite}
                        onChange={(e) => setLigneFormData({...ligneFormData, quantite: parseInt(e.target.value) || 1})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="article_select">Article sélectionné</Label>
                    <Select 
                      value={ligneFormData.article_id} 
                      onValueChange={(value) => setLigneFormData({...ligneFormData, article_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un article" />
                      </SelectTrigger>
                      <SelectContent>
                        {articles.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            {articleSearch ? 'Aucun article trouvé' : 'Commencez à taper pour rechercher'}
                          </div>
                        ) : (
                          articles.map((article) => (
                            <SelectItem key={article.id} value={article.id}>
                              {article.nom} ({article.numero_article}) - Stock: {article.quantite_stock}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {ligneFormData.article_id && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      {(() => {
                        const selectedArticle = articles.find(a => a.id === ligneFormData.article_id)
                        if (!selectedArticle) return null
                        
                        return (
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">{selectedArticle.nom}</p>
                            <p className="text-xs text-muted-foreground">
                              N° article: {selectedArticle.numero_article} • 
                              Stock actuel: {selectedArticle.quantite_stock}
                            </p>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  <Button type="submit" className="w-full" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter cette ligne
                  </Button>
                </form>
              </div>

              {/* Liste des lignes ajoutées */}
              {lignesMouvement.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Lignes du mouvement ({lignesMouvement.length})</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setLignesMouvement([])}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Tout effacer
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {lignesMouvement.map((ligne) => (
                      <div
                        key={ligne.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{ligne.article_nom}</p>
                          <p className="text-xs text-muted-foreground">
                            {ligne.article_numero} • Stock actuel: {ligne.stock_actuel} • Quantité: {ligne.quantite}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => supprimerLigne(ligne.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Boutons de validation */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setDialogOpen(false)
                    setLignesMouvement([])
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  type="button"
                  onClick={validerMouvement}
                  disabled={lignesMouvement.length === 0}
                >
                  Valider le mouvement ({lignesMouvement.length} ligne{lignesMouvement.length > 1 ? 's' : ''})
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par article, personne ou type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
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
                const Icon = getTypeIcon(mouvement.type_mouvement)
                return (
                  <div
                    key={mouvement.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getTypeBadge(mouvement.type_mouvement)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getTypeBadge(mouvement.type_mouvement)}>
                          {mouvement.type_mouvement}
                        </Badge>
                        <span className="font-semibold">Quantité: {mouvement.quantite}</span>
                      </div>
                      <p className="text-sm font-medium">
                        {mouvement.article?.nom || 'Article inconnu'} ({mouvement.article?.numero_article})
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