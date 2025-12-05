// app/(dashboard)/articles/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, AlertTriangle, TrendingDown, Hash, Wifi, Calendar, MapPin } from "lucide-react"
import Link from "next/link"
import type { Article } from "@/lib/types"

type ArticleWithRelations = Article & {
  fournisseur?: { nom: string }
  categorie_info?: { nom: string } // Nouvelle relation
  quantite_stock_reelle: number
}

type NumeroSerie = {
  id: string
  numero_serie: string | null
  adresse_mac: string | null
  localisation: string
  date_creation: string
}

export default function ArticleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params?.id as string

  const [article, setArticle] = useState<ArticleWithRelations | null>(null)
  const [numerosSerie, setNumerosSerie] = useState<NumeroSerie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!articleId) return
    fetchArticle()
  }, [articleId])

  async function fetchArticle() {
    setLoading(true)
    try {
      // Charger l'article avec fournisseur
      const { data: artData, error: artError } = await supabase
        .from('articles')
        .select(`
          *,
          fournisseur:fournisseurs(nom)
        `)
        .eq('id', articleId)
        .single()

      if (artError) throw artError

      // Charger la catégorie correspondante
      let categorie_info = null
      if (artData.categorie_id) {
        const {  catData, error: catError } = await supabase
          .from('categories')
          .select('nom')
          .eq('id', artData.categorie_id)
          .single()

        if (!catError) {
          categorie_info = catData
        }
      }

      // Charger le stock réel (via vue)
      let quantite_stock_reelle = 0
      if (artData.gestion_par_serie) {
        const {  stockData, error: stockError } = await supabase
          .from('v_stock_warehouse_seneffe')
          .select('quantite_en_stock')
          .eq('article_id', articleId)
          .single()

        if (stockError) {
          console.warn('Erreur chargement stock série:', stockError)
        }
        quantite_stock_reelle = stockData?.quantite_en_stock || 0
      } else {
        quantite_stock_reelle = artData.quantite_stock || 0
      }

      const articleWithStock: ArticleWithRelations = {
        ...artData,
        categorie_info,
        quantite_stock_reelle,
      }

      setArticle(articleWithStock)

      // Si traçable, charger les numéros de série
      if (artData.gestion_par_serie) {
        const {  serieData, error: serieError } = await supabase
          .from('numeros_serie')
          .select('*')
          .eq('article_id', articleId)
          .order('date_creation', { ascending: false })

        if (serieError) {
          console.error('Erreur chargement numéros de série:', serieError)
        } else {
          setNumerosSerie(serieData || [])
        }
      }
    } catch (error) {
      console.error('Erreur chargement article:', error)
      alert("Impossible de charger l'article")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!article) {
    return <div className="p-6">Article non trouvé</div>
  }

  const getStockStatus = () => {
    if (article.quantite_stock_reelle <= article.stock_minimum) {
      return { badge: "bg-red-100 text-red-800", label: "Stock bas", icon: AlertTriangle }
    } else if (article.quantite_stock_reelle <= article.point_commande) {
      return { badge: "bg-orange-100 text-orange-800", label: "Alerte", icon: TrendingDown }
    } else {
      return { badge: "bg-green-100 text-green-800", label: "OK", icon: Package }
    }
  }

  const status = getStockStatus()
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{article.nom}</h1>
          <p className="text-muted-foreground mt-1">
            {article.numero_article} • {article.categorie_info?.nom || article.categorie || 'Non classé'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/articles">Retour à la liste</Link>
          </Button>
          <Button asChild>
            <Link href={`/articles/${article.id}/edit`}>Modifier</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Numéro article</p>
              <p className="font-mono">{article.numero_article}</p>
            </div>
            {article.code_ean && (
              <div>
                <p className="text-sm text-muted-foreground">Code EAN</p>
                <p className="font-mono">{article.code_ean}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Catégorie</p>
              <p>{article.categorie_info?.nom || article.categorie || 'Non classé'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fournisseur</p>
              <p>{article.fournisseur?.nom || 'Non défini'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p>{article.description || 'Aucune'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gestion par série</p>
              <Badge variant={article.gestion_par_serie ? "default" : "secondary"}>
                {article.gestion_par_serie ? "Oui (traçable)" : "Non (quantité)"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock et prix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={status.badge}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{article.quantite_stock_reelle}</p>
              <p className="text-sm text-muted-foreground">
                {article.gestion_par_serie 
                  ? "Unités disponibles (Warehouse Seneffe)" 
                  : "Quantité en stock"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Seuil minimum</p>
                <p>{article.stock_minimum}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Point commande</p>
                <p>{article.point_commande}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Prix d'achat</p>
                <p className="font-semibold">{article.prix_achat?.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prix de vente</p>
                <p className="font-semibold">{article.prix_vente?.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Numéros de série (uniquement si traçable) */}
      {article.gestion_par_serie && (
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Numéros de série / Adresses MAC
              </div>
            </CardTitle>
            <CardDescription>
              {numerosSerie.length} unité(s) enregistrée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {numerosSerie.length === 0 ? (
              <p className="text-muted-foreground py-4">Aucun numéro de série associé à cet article.</p>
            ) : (
              <div className="space-y-3">
                {numerosSerie.map((ns) => (
                  <div key={ns.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {ns.numero_serie ? (
                        <div className="flex items-center gap-1">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{ns.numero_serie}</span>
                        </div>
                      ) : ns.adresse_mac ? (
                        <div className="flex items-center gap-1">
                          <Wifi className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{ns.adresse_mac}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Aucun identifiant</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{ns.localisation || 'Inconnue'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(ns.date_creation).toLocaleDateString('fr-BE')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button asChild size="sm">
                <Link href={`/numeros-serie?article_id=${article.id}`}>
                  Gérer les numéros de série
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <div className="flex gap-3 justify-end">
        <Button asChild variant="outline">
          <Link href={`/mouvements?article_id=${article.id}`}>
            Voir les mouvements
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/mouvements/new?article_id=${article.id}`}>
            Nouveau mouvement
          </Link>
        </Button>
      </div>
    </div>
  )
}