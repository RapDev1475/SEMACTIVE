// app/(dashboard)/articles/page.tsx
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Search, Package, AlertTriangle, TrendingDown } from "lucide-react"
import type { Article } from "@/lib/types"

type ArticleWithRelations = Article & {
  fournisseur?: { nom: string }
  categorie_info?: { nom: string } // Nouvelle relation
  quantite_stock_reelle: number
}

type Categorie = {
  id: string
  nom: string
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleWithRelations[]>([])
  const [categories, setCategories] = useState<Categorie[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCategorie, setFilterCategorie] = useState<string>("all")

  useEffect(() => {
    fetchArticles()
    fetchCategories()
  }, [])

  async function fetchArticles() {
    setLoading(true)
    try {
      // 1. Charger les articles avec catégorie
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select(`
          *,
          fournisseur:fournisseurs(nom),
          categorie_info:categories(nom)
        `)
        .order('nom')

      if (articlesError) throw articlesError

      // 2. Charger le stock des articles traçables
      const { data: stockSerieData } = await supabase
        .from('v_stock_warehouse_seneffe')
        .select('article_id, quantite_en_stock')

      const stockMap = new Map(
        (stockSerieData || []).map(item => [item.article_id, item.quantite_en_stock])
      )

      // 3. Mapper avec le vrai stock
      const articlesWithRealStock: ArticleWithRelations[] = (articlesData || []).map(article => {
        if (article.gestion_par_serie) {
          return {
            ...article,
            quantite_stock_reelle: stockMap.get(article.id) || 0,
          }
        } else {
          return {
            ...article,
            quantite_stock_reelle: article.quantite_stock || 0,
          }
        }
      })

      setArticles(articlesWithRealStock)
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('nom')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  async function searchBySerialOrMac(searchValue: string) {
    if (!searchValue.trim()) {
      fetchArticles()
      return
    }

    setLoading(true)
    try {
      const { data: serialData } = await supabase
        .from('numeros_serie')
        .select('article_id')
        .or(`numero_serie.ilike.%${searchValue}%,adresse_mac.ilike.%${searchValue}%`)

      if (serialData && serialData.length > 0) {
        const articleIds = [...new Set(serialData.map(s => s.article_id))]

        const { data: articlesData, error: articlesError } = await supabase
          .from('articles')
          .select(`
            *,
            fournisseur:fournisseurs(nom),
            categorie_info:categories(nom)
          `)
          .in('id', articleIds)
          .order('nom')

        if (articlesError) throw articlesError

        const { data: stockSerieData } = await supabase
          .from('v_stock_warehouse_seneffe')
          .select('article_id, quantite_en_stock')

        const stockMap = new Map(
          (stockSerieData || []).map(item => [item.article_id, item.quantite_en_stock])
        )

        const articlesWithRealStock: ArticleWithRelations[] = (articlesData || []).map(article => {
          if (article.gestion_par_serie) {
            return {
              ...article,
              quantite_stock_reelle: stockMap.get(article.id) || 0,
            }
          } else {
            return {
              ...article,
              quantite_stock_reelle: article.quantite_stock || 0,
            }
          }
        })

        setArticles(articlesWithRealStock)
      } else {
        setArticles([])
      }
    } catch (error) {
      console.error('Error searching by serial/MAC:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.numero_article.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.code_ean && article.code_ean.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "alert" && article.quantite_stock_reelle <= article.point_commande) ||
      (filterStatus === "low" && article.quantite_stock_reelle <= article.stock_minimum)

    const matchesCategorie = 
      filterCategorie === "all" || 
      article.categorie === filterCategorie || 
      article.categorie_info?.nom === filterCategorie

    return matchesSearch && matchesStatus && matchesCategorie
  })

  const stats = {
    total: articles.length,
    alertes: articles.filter(a => a.quantite_stock_reelle <= a.point_commande).length,
    stockBas: articles.filter(a => a.quantite_stock_reelle <= a.stock_minimum).length,
  }

  const getStockStatus = (article: ArticleWithRelations) => {
    if (article.quantite_stock_reelle <= article.stock_minimum) {
      return { badge: "bg-red-100 text-red-800", label: "Stock bas", icon: AlertTriangle }
    } else if (article.quantite_stock_reelle <= article.point_commande) {
      return { badge: "bg-orange-100 text-orange-800", label: "Alerte", icon: TrendingDown }
    } else {
      return { badge: "bg-green-100 text-green-800", label: "OK", icon: Package }
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
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre catalogue d'articles et stocks
          </p>
        </div>
        <Button asChild>
          <Link href="/articles/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvel article
          </Link>
        </Button>
      </div>

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
            <div className="text-2xl font-bold">{stats.alertes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock bas
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stockBas}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, numéro ou code EAN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par n° série ou MAC..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      searchBySerialOrMac((e.target as HTMLInputElement).value)
                    }
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
              >
                Tous
              </Button>
              <Button 
                variant={filterStatus === "alert" ? "default" : "outline"}
                onClick={() => setFilterStatus("alert")}
              >
                En alerte
              </Button>
              <Button 
                variant={filterStatus === "low" ? "default" : "outline"}
                onClick={() => setFilterStatus("low")}
              >
                Stock bas
              </Button>
              <select
                value={filterCategorie}
                onChange={(e) => setFilterCategorie(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Toutes catégories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.nom}>{cat.nom}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{filteredArticles.length} articles</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun article trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Numéro</th>
                    <th className="text-left p-3 font-medium">Nom</th>
                    <th className="text-left p-3 font-medium">Catégorie</th>
                    <th className="text-left p-3 font-medium">Fournisseur</th>
                    <th className="text-right p-3 font-medium">Stock</th>
                    <th className="text-right p-3 font-medium">Min/Max</th>
                    <th className="text-right p-3 font-medium">Prix achat</th>
                    <th className="text-center p-3 font-medium">Statut</th>
                    <th className="text-center p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map((article) => {
                    const status = getStockStatus(article)
                    const StatusIcon = status.icon
                    return (
                      <tr 
                        key={article.id} 
                        className="border-b hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/articles/${article.id}`}
                      >
                        <td className="p-3 font-mono text-sm">{article.numero_article}</td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{article.nom}</p>
                            <p className="text-xs text-muted-foreground">{article.code_ean}</p>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {article.categorie_info?.nom || 'Non classé'}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {article.fournisseur?.nom || 'Non défini'}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {article.quantite_stock_reelle}
                        </td>
                        <td className="p-3 text-right text-sm text-muted-foreground">
                          {article.stock_minimum} / {article.stock_maximum}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {article.prix_achat?.toFixed(2)}€
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Badge className={status.badge}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3">
                          <Link href={`/articles/${article.id}`}>
                            <Button size="sm" variant="ghost">
                              Voir détails
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}