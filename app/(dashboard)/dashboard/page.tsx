"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  ArrowUpRight,
  ShoppingCart,
  PackageCheck,
  Activity
} from "lucide-react"
import Link from "next/link"
import type { DashboardStats, ArticleACommander, Mouvement } from "@/lib/types"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_articles: 0,
    total_stock: 0,
    articles_en_alerte: 0,
    mouvements_aujourd_hui: 0,
    valeur_stock_total: 0,
    commandes_en_cours: 0,
  })
  const [articlesACommander, setArticlesACommander] = useState<ArticleACommander[]>([])
  const [derniersmouvements, setDerniersMovements] = useState<Mouvement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)
    try {
      // Fetch stats
      const [articlesRes, alertesRes, mouvementsRes, commandesRes] = await Promise.all([
        supabase.from('articles').select('quantite_stock, prix_achat', { count: 'exact' }),
        supabase.from('articles').select('*', { count: 'exact' }).lte('quantite_stock', supabase.rpc('point_commande')),
        supabase.from('mouvements').select('*', { count: 'exact' }).gte('date_mouvement', new Date().toISOString().split('T')[0]),
        supabase.from('bons_commande').select('*', { count: 'exact' }).in('statut', ['envoyee', 'confirmee', 'en_transit']),
      ])

      const totalStock = articlesRes.data?.reduce((sum, a) => sum + (a.quantite_stock || 0), 0) || 0
      const valeurStock = articlesRes.data?.reduce((sum, a) => sum + ((a.quantite_stock || 0) * (a.prix_achat || 0)), 0) || 0

      setStats({
        total_articles: articlesRes.count || 0,
        total_stock: totalStock,
        articles_en_alerte: alertesRes.count || 0,
        mouvements_aujourd_hui: mouvementsRes.count || 0,
        valeur_stock_total: valeurStock,
        commandes_en_cours: commandesRes.count || 0,
      })

      // Fetch articles à commander
      const { data: alertes } = await supabase
        .from('articles')
        .select(`
          *,
          fournisseur:fournisseurs(nom)
        `)
        .lte('quantite_stock', 'point_commande')
        .limit(5)

      setArticlesACommander((alertes || []) as any)

      // Fetch derniers mouvements
      const { data: mouvements } = await supabase
        .from('mouvements')
        .select(`
          *,
          article:articles(nom, numero_article),
          personne:personnes(nom, prenom)
        `)
        .order('date_mouvement', { ascending: false })
        .limit(5)

      setDerniersMovements((mouvements || []) as any)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Articles totaux",
      value: stats.total_articles,
      icon: Package,
      description: `${stats.total_stock} unités en stock`,
      trend: "+12% ce mois",
      color: "blue",
    },
    {
      title: "Alertes de stock",
      value: stats.articles_en_alerte,
      icon: AlertTriangle,
      description: "Articles à commander",
      trend: stats.articles_en_alerte > 0 ? "Action requise" : "Tout va bien",
      color: stats.articles_en_alerte > 0 ? "red" : "green",
    },
    {
      title: "Valeur du stock",
      value: `${(stats.valeur_stock_total / 1000).toFixed(1)}k€`,
      icon: TrendingUp,
      description: "Valeur totale",
      trend: "+8.2% ce mois",
      color: "green",
    },
    {
      title: "Mouvements",
      value: stats.mouvements_aujourd_hui,
      icon: Activity,
      description: "Aujourd'hui",
      trend: "5.2 par jour en moyenne",
      color: "purple",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de votre inventaire et activités
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/scanner">
            <Button className="btn-shimmer">
              <PackageCheck className="mr-2 h-4 w-4" />
              Scanner
            </Button>
          </Link>
          <Link href="/commandes/nouvelle">
            <Button variant="outline">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Nouvelle commande
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`h-10 w-10 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20 flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">
                    {stat.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Alertes de réapprovisionnement */}
        <Card className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Alertes de réapprovisionnement</CardTitle>
              <Badge variant="destructive" className="badge-pulse">
                {stats.articles_en_alerte}
              </Badge>
            </div>
            <CardDescription>
              Articles dont le stock est sous le point de commande
            </CardDescription>
          </CardHeader>
          <CardContent>
            {articlesACommander.length > 0 ? (
              <div className="space-y-3">
                {articlesACommander.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{article.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        {article.numero_article} • {article.fournisseur_nom || 'Pas de fournisseur'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">
                        {article.quantite_stock} / {article.point_commande}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Commander {article.quantite_suggeree}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href="/articles">
                  <Button variant="outline" className="w-full mt-2">
                    Voir tous les articles
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune alerte de stock</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Derniers mouvements */}
        <Card className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <CardHeader>
            <CardTitle>Derniers mouvements</CardTitle>
            <CardDescription>
              Les 5 dernières transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {derniersmouvements.length > 0 ? (
              <div className="space-y-3">
                {derniersmouvements.map((mouvement) => (
                  <div
                    key={mouvement.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      mouvement.type_mouvement === 'reception' ? 'bg-green-100 dark:bg-green-900/20' :
                      mouvement.type_mouvement === 'installation_client' ? 'bg-blue-100 dark:bg-blue-900/20' :
                      'bg-orange-100 dark:bg-orange-900/20'
                    }`}>
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {mouvement.article?.nom || 'Article inconnu'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mouvement.type_mouvement} • {mouvement.personne?.nom || 'Système'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(mouvement.date_mouvement).toLocaleDateString('fr-BE', { month: 'short', day: 'numeric' })}
                    </Badge>
                  </div>
                ))}
                <Link href="/mouvements">
                  <Button variant="outline" className="w-full mt-2">
                    Voir l'historique complet
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun mouvement récent</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
