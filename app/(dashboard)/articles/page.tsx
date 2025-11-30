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

type ArticleWithFournisseur = Article & {
  fournisseur?: { nom: string }
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleWithFournisseur[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    fetchArticles()
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
        .order('nom')

      if (error) throw error
      setArticles(data || [])
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.numero_article.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.code_ean && article.code_ean.toLowerCase().includes(searchTerm.toLowerCase()))

    if (filterStatus === "all") return matchesSearch
    if (filterStatus === "alert") return matchesSearch && article.quantite_stock <= article.point_commande
    if (filterStatus === "low") return matchesSearch && article.quantite_stock <= article.stock_minimum
    return matchesSearch
  })

  const stats = {
    total: articles.length,
    alertes: articles.filter(a => a.quantite_stock <= a.point_commande).length,
    stockBas: articles.filter(a => a.quantite_stock <= a.stock_minimum).length,
  }

  const getStockStatus = (article: Article) => {
    if (article.quantite_stock <= article.stock_minimum) {
      return { badge: "bg-red-100 text-red-800", label: "Stock bas", icon: AlertTriangle }
    } else if (article.quantite_stock <= article.point_commande) {
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, numéro ou code EAN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
                          {article.fournisseur?.nom || 'Non défini'}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {article.quantite_stock}
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
