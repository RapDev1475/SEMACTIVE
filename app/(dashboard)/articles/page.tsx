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
import { Plus, Search, Package, AlertTriangle, TrendingUp, FileDown } from "lucide-react"
import type { Article, Fournisseur } from "@/lib/types"

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    numero_article: "",
    code_ean: "",
    nom: "",
    conditionnement: "",
    fournisseur_id: "",
    reference_fournisseur: "",
    quantite_stock: 0,
    stock_minimum: 0,
    stock_maximum: 100,
    point_commande: 10,
    prix_achat: 0,
    prix_vente: 0,
    taux_tva: 21,
  })

  useEffect(() => {
    fetchArticles()
    fetchFournisseurs()
  }, [])

  async function fetchArticles() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          fournisseur:fournisseurs(nom)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setArticles(data || [])
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchFournisseurs() {
    try {
      const { data, error } = await supabase
        .from('fournisseurs')
        .select('*')
        .eq('actif', true)
        .order('nom')

      if (error) throw error
      setFournisseurs(data || [])
    } catch (error) {
      console.error('Error fetching fournisseurs:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('articles')
        .insert([formData])

      if (error) throw error

      setDialogOpen(false)
      fetchArticles()
      
      // Reset form
      setFormData({
        numero_article: "",
        code_ean: "",
        nom: "",
        conditionnement: "",
        fournisseur_id: "",
        reference_fournisseur: "",
        quantite_stock: 0,
        stock_minimum: 0,
        stock_maximum: 100,
        point_commande: 10,
        prix_achat: 0,
        prix_vente: 0,
        taux_tva: 21,
      })
    } catch (error: any) {
      alert("Erreur: " + error.message)
    }
  }

  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.numero_article.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.code_ean && article.code_ean.toLowerCase().includes(searchTerm.toLowerCase()))
    
    if (filterStatus === "all") return matchesSearch
    if (filterStatus === "alerte") return matchesSearch && article.quantite_stock <= article.point_commande
    if (filterStatus === "stock_bas") return matchesSearch && article.quantite_stock <= article.stock_minimum
    return matchesSearch
  })

  const stats = {
    total: articles.length,
    enAlerte: articles.filter(a => a.quantite_stock <= a.point_commande).length,
    stockBas: articles.filter(a => a.quantite_stock <= a.stock_minimum).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des articles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre catalogue d'articles et stocks
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-shimmer">
              <Plus className="mr-2 h-4 w-4" />
              Nouvel article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouvel article</DialogTitle>
              <DialogDescription>
                Ajoutez un nouvel article à votre catalogue
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_article">Numéro article *</Label>
                  <Input
                    id="numero_article"
                    value={formData.numero_article}
                    onChange={(e) => setFormData({...formData, numero_article: e.target.value})}
                    required
                    placeholder="ART-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code_ean">Code EAN</Label>
                  <Input
                    id="code_ean"
                    value={formData.code_ean}
                    onChange={(e) => setFormData({...formData, code_ean: e.target.value})}
                    placeholder="5412345678901"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">Nom de l'article *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  required
                  placeholder="Ex: Routeur WiFi AC1200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="conditionnement">Conditionnement</Label>
                  <Input
                    id="conditionnement"
                    value={formData.conditionnement}
                    onChange={(e) => setFormData({...formData, conditionnement: e.target.value})}
                    placeholder="Carton de 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fournisseur_id">Fournisseur</Label>
                  <Select 
                    value={formData.fournisseur_id} 
                    onValueChange={(value) => setFormData({...formData, fournisseur_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fournisseurs.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_fournisseur">Référence fournisseur</Label>
                <Input
                  id="reference_fournisseur"
                  value={formData.reference_fournisseur}
                  onChange={(e) => setFormData({...formData, reference_fournisseur: e.target.value})}
                  placeholder="REF-FOURN-123"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantite_stock">Stock actuel *</Label>
                  <Input
                    id="quantite_stock"
                    type="number"
                    min="0"
                    value={formData.quantite_stock}
                    onChange={(e) => setFormData({...formData, quantite_stock: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_minimum">Stock minimum *</Label>
                  <Input
                    id="stock_minimum"
                    type="number"
                    min="0"
                    value={formData.stock_minimum}
                    onChange={(e) => setFormData({...formData, stock_minimum: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_maximum">Stock maximum *</Label>
                  <Input
                    id="stock_maximum"
                    type="number"
                    min="0"
                    value={formData.stock_maximum}
                    onChange={(e) => setFormData({...formData, stock_maximum: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="point_commande">Point de commande *</Label>
                <Input
                  id="point_commande"
                  type="number"
                  min="0"
                  value={formData.point_commande}
                  onChange={(e) => setFormData({...formData, point_commande: parseInt(e.target.value)})}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Seuil déclenchant une alerte de réapprovisionnement
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prix_achat">Prix d'achat (€)</Label>
                  <Input
                    id="prix_achat"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.prix_achat}
                    onChange={(e) => setFormData({...formData, prix_achat: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prix_vente">Prix de vente (€)</Label>
                  <Input
                    id="prix_vente"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.prix_vente}
                    onChange={(e) => setFormData({...formData, prix_vente: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taux_tva">TVA (%)</Label>
                  <Select 
                    value={formData.taux_tva.toString()} 
                    onValueChange={(value) => setFormData({...formData, taux_tva: parseFloat(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="6">6%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="21">21%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  Créer l'article
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total articles
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertes stock
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enAlerte}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock bas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stockBas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, numéro ou code EAN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les articles</SelectItem>
                <SelectItem value="alerte">En alerte</SelectItem>
                <SelectItem value="stock_bas">Stock bas</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Numéro</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Nom</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Fournisseur</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Stock</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Min/Max</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Prix achat</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      Aucun article trouvé
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map((article) => (
                    <tr key={article.id} className="table-row-hover">
                      <td className="px-4 py-3 text-sm font-mono">{article.numero_article}</td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{article.nom}</div>
                          {article.code_ean && (
                            <div className="text-xs text-muted-foreground">EAN: {article.code_ean}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {article.fournisseur?.nom || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {article.quantite_stock}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {article.stock_minimum} / {article.stock_maximum}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {article.prix_achat ? `${article.prix_achat.toFixed(2)}€` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {article.quantite_stock <= article.stock_minimum ? (
                          <Badge variant="destructive">Stock bas</Badge>
                        ) : article.quantite_stock <= article.point_commande ? (
                          <Badge className="bg-orange-100 text-orange-800">Alerte</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">OK</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
