"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Package, History, Hash } from "lucide-react"
import Link from "next/link"
import type { Article, Mouvement } from "@/lib/types"

type ArticleWithRelations = Article & {
  fournisseur?: {   nom: string 
					numero_tva?: string
					email?: string
					telephone?: string
					}
}

type NumeroSerie = {
  id: string
  numero_serie: string
  adresse_mac?: string
  localisation?: string
  statut: string
}

export default function ArticleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<ArticleWithRelations | null>(null)
  const [mouvements, setMouvements] = useState<Mouvement[]>([])
  const [numerosSerie, setNumerosSerie] = useState<NumeroSerie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchArticleDetails()
    }
  }, [params.id])

  async function fetchArticleDetails() {
    setLoading(true)
    try {
      // Fetch article avec fournisseur
      const { data: articleData, error: articleError } = await supabase
        .from('articles')
        .select(`
          *,
          fournisseur:fournisseurs(nom, numero_tva, email, telephone)
        `)
        .eq('id', params.id)
        .single()

      if (articleError) throw articleError
      setArticle(articleData)

      // Fetch mouvements
      const { data: mouvementsData } = await supabase
        .from('mouvements')
        .select(`
          *,
          personne:personnes(nom, prenom)
        `)
        .eq('article_id', params.id)
        .order('date_mouvement', { ascending: false })
        .limit(20)

      setMouvements(mouvementsData || [])

      // Fetch numéros de série
      const { data: serialsData } = await supabase
        .from('numeros_serie')
        .select('*')
        .eq('article_id', params.id)
        .order('created_at', { ascending: false })

      setNumerosSerie(serialsData || [])

    } catch (error) {
      console.error('Error fetching article details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (quantite: number, min: number, max: number) => {
    if (quantite <= min) {
      return <Badge className="bg-red-100 text-red-800">Stock critique</Badge>
    } else if (quantite <= min * 1.5) {
      return <Badge className="bg-orange-100 text-orange-800">Stock bas</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800">Stock OK</Badge>
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
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Article non trouvé</p>
        <Link href="/articles">
          <Button className="mt-4">Retour aux articles</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{article.nom}</h1>
          <p className="text-muted-foreground mt-1">
            {article.numero_article} • {article.code_ean}
          </p>
        </div>
			<Button onClick={() => router.push(`/articles/${article.id}/edit`)}>
				<Edit className="mr-2 h-4 w-4" />
				Modifier
			</Button>
      </div>

      {/* Informations principales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock actuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{article.quantite_stock}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Min: {article.stock_minimum} • Max: {article.stock_maximum}
            </p>
            <div className="mt-2">
              {getStatusBadge(article.quantite_stock, article.stock_minimum, article.stock_maximum)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Point de commande
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{article.point_commande}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {article.conditionnement}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prix achat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{article.prix_achat?.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground mt-1">
              HT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prix vente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{article.prix_vente?.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground mt-1">
              TVA {article.taux_tva}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">
            <Package className="mr-2 h-4 w-4" />
            Détails
          </TabsTrigger>
          <TabsTrigger value="mouvements">
            <History className="mr-2 h-4 w-4" />
            Mouvements ({mouvements.length})
          </TabsTrigger>
          <TabsTrigger value="serials">
            <Hash className="mr-2 h-4 w-4" />
            N° Série ({numerosSerie.length})
          </TabsTrigger>
        </TabsList>

        {/* Onglet Détails */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Informations détaillées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Numéro article</p>
                  <p className="font-medium">{article.numero_article}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Code EAN</p>
                  <p className="font-medium font-mono">{article.code_ean}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fournisseur</p>
                  <p className="font-medium">{article.fournisseur?.nom || 'Non défini'}</p>
				    {article.fournisseur?.numero_tva && (
					<p className="text-xs text-muted-foreground mt-1">
					TVA: {article.fournisseur.numero_tva}
					</p>
				)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Référence fournisseur</p>
                  <p className="font-medium">{article.reference_fournisseur || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conditionnement</p>
                  <p className="font-medium">{article.conditionnement}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">TVA</p>
                  <p className="font-medium">{article.taux_tva}%</p>
                </div>
				<div>
					<p className="text-sm text-muted-foreground">Catégorie</p>
					<p className="font-medium">
						{article.categorie || 'Non classé'}
					</p>
				</div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Valeurs de stock</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valeur achat totale</p>
                    <p className="text-lg font-bold">
                      {(article.quantite_stock * (article.prix_achat || 0)).toFixed(2)}€
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valeur vente totale</p>
                    <p className="text-lg font-bold">
                      {(article.quantite_stock * (article.prix_vente || 0)).toFixed(2)}€
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Marge potentielle</p>
                    <p className="text-lg font-bold text-green-600">
                      {(article.quantite_stock * ((article.prix_vente || 0) - (article.prix_achat || 0))).toFixed(2)}€
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Mouvements */}
        <TabsContent value="mouvements">
          <Card>
            <CardHeader>
              <CardTitle>Historique des mouvements</CardTitle>
            </CardHeader>
            <CardContent>
              {mouvements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun mouvement enregistré</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mouvements.map((mouvement) => (
                    <div
                      key={mouvement.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {mouvement.type_mouvement}
                          </Badge>
                          <p className="text-sm font-medium">
                            Quantité: {mouvement.quantite}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {mouvement.personne?.nom || 'Système'} • {new Date(mouvement.date_mouvement).toLocaleString('fr-BE')}
                        </p>
                        {mouvement.remarques && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {mouvement.remarques}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Numéros de série */}
        <TabsContent value="serials">
          <Card>
            <CardHeader>
              <CardTitle>Numéros de série et adresses MAC</CardTitle>
            </CardHeader>
            <CardContent>
              {numerosSerie.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Hash className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun numéro de série enregistré</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {numerosSerie.map((serial) => (
                    <div
                      key={serial.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <p className="font-mono font-semibold">{serial.numero_serie}</p>
                        {serial.adresse_mac && (
                          <p className="text-sm text-muted-foreground font-mono">
                            MAC: {serial.adresse_mac}
                          </p>
                        )}
                        {serial.localisation && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📍 {serial.localisation}
                          </p>
                        )}
                      </div>
                      <Badge variant={serial.statut === 'disponible' ? 'default' : 'secondary'}>
                        {serial.statut}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}