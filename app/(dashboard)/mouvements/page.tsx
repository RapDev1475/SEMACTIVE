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
import { Plus, Search, History, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import type { Mouvement, Article, Personne } from "@/lib/types"

type MouvementWithRelations = Mouvement & {
  article?: { nom: string; numero_article: string }
  personne?: { nom: string; prenom?: string }
}

export default function MouvementsPage() {
  const [mouvements, setMouvements] = useState<MouvementWithRelations[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [articleSearch, setArticleSearch] = useState("")
  
  const [formData, setFormData] = useState({
    article_id: "",
    personne_id: "",
    type_mouvement: "reception" as "reception" | "sortie_technicien" | "installation_client" | "retour",
    quantite: 1,
    remarques: "",
  })

  useEffect(() => {
    fetchMouvements()
    fetchArticles()
    fetchPersonnes()
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
		.select('*')  // ← Changez ici
		.eq('type', 'technicien')
		.order('nom')
	
		setPersonnes(data || [])
	} catch (error) {
		console.error('Error fetching personnes:', error)
	}
	}

  async function searchArticles(searchValue: string) {
    if (!searchValue.trim()) {
      fetchArticles()
      return
    }

    try {
      // Rechercher d'abord par numéro de série ou MAC
      const { data: serialData } = await supabase
        .from('numeros_serie')
        .select('article_id')
        .or(`numero_serie.ilike.%${searchValue}%,adresse_mac.ilike.%${searchValue}%`)

      let articleIds: string[] = []
      
      if (serialData && serialData.length > 0) {
        articleIds = [...new Set(serialData.map(s => s.article_id))]
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
    } catch (error) {
      console.error('Error searching articles:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      // Insérer le mouvement
      const { error: mouvementError } = await supabase
        .from('mouvements')
        .insert([{
          ...formData,
          date_mouvement: new Date().toISOString(),
        }])

      if (mouvementError) throw mouvementError

      // Mettre à jour le stock de l'article
      const article = articles.find(a => a.id === formData.article_id)
      if (article) {
        let newQuantity = article.quantite_stock

        // Ajuster la quantité selon le type de mouvement
        if (formData.type_mouvement === 'reception') {
          newQuantity += formData.quantite
        } else if (formData.type_mouvement === 'sortie_technicien' || formData.type_mouvement === 'installation_client') {
          newQuantity -= formData.quantite
        } else if (formData.type_mouvement === 'retour') {
          newQuantity += formData.quantite
        }

        const { error: stockError } = await supabase
          .from('articles')
          .update({ quantite_stock: newQuantity })
          .eq('id', formData.article_id)

        if (stockError) throw stockError
      }

      setDialogOpen(false)
      fetchMouvements()
      fetchArticles()
      
      setFormData({
        article_id: "",
        personne_id: "",
        type_mouvement: "reception",
        quantite: 1,
        remarques: "",
      })
      setArticleSearch("")
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
    receptions: mouvements.filter(m => m.type_mouvement === 'reception').length,
    sorties: mouvements.filter(m => m.type_mouvement === 'sortie_technicien' || m.type_mouvement === 'installation_client').length,
    retours: mouvements.filter(m => m.type_mouvement === 'retour').length,
  }

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      reception: 'bg-green-100 text-green-800',
      sortie_technicien: 'bg-blue-100 text-blue-800',
      installation_client: 'bg-purple-100 text-purple-800',
      retour: 'bg-orange-100 text-orange-800',
    }
    return variants[type] || 'bg-gray-100 text-gray-800'
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      reception: TrendingUp,
      sortie_technicien: TrendingDown,
      installation_client: TrendingDown,
      retour: RefreshCw,
    }
    return icons[type] || History
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
            Historique complet des mouvements d'articles
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-shimmer">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau mouvement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enregistrer un mouvement</DialogTitle>
              <DialogDescription>
                Enregistrez une réception, sortie ou retour d'article
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type_mouvement">Type de mouvement *</Label>
                <Select 
                  value={formData.type_mouvement} 
                  onValueChange={(value: any) => setFormData({...formData, type_mouvement: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reception">Réception</SelectItem>
                    <SelectItem value="sortie_technicien">Sortie technicien</SelectItem>
                    <SelectItem value="installation_client">Installation client</SelectItem>
                    <SelectItem value="retour">Retour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="article_search">Article *</Label>
                <div className="space-y-2">
                  <Input
                    id="article_search"
                    placeholder="Rechercher par nom, numéro, n° série ou MAC..."
                    value={articleSearch}
                    onChange={(e) => {
                      setArticleSearch(e.target.value)
                      searchArticles(e.target.value)
                    }}
                  />
                  <Select 
                    value={formData.article_id} 
                    onValueChange={(value) => setFormData({...formData, article_id: value})}
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
                            {article.nom} ({article.numero_article})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.article_id && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  {(() => {
                    const selectedArticle = articles.find(a => a.id === formData.article_id)
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

              <div className="space-y-2">
                <Label htmlFor="personne_id">Technicien</Label>
                <Select 
				value={formData.personne_id || "none"}
				onValueChange={(value) => setFormData({...formData, personne_id: value === "none" ? "" : value})}  {/* ← Et ici */}
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
                <Label htmlFor="quantite">Quantité *</Label>
                <Input
                  id="quantite"
                  type="number"
                  min="1"
                  value={formData.quantite}
                  onChange={(e) => setFormData({...formData, quantite: parseInt(e.target.value)})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarques">Remarques</Label>
                <Input
                  id="remarques"
                  value={formData.remarques}
                  onChange={(e) => setFormData({...formData, remarques: e.target.value})}
                  placeholder="Notes supplémentaires..."
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  Enregistrer le mouvement
                </Button>
              </div>
            </form>
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
                <SelectItem value="reception">Réceptions</SelectItem>
                <SelectItem value="sortie_technicien">Sorties technicien</SelectItem>
                <SelectItem value="installation_client">Installations client</SelectItem>
                <SelectItem value="retour">Retours</SelectItem>
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
                          {mouvement.type_mouvement.replace(/_/g, ' ')}
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