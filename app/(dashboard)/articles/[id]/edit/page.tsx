// app/(dashboard)/articles/[id]/edit/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import type { Article } from "@/lib/types"

type Categorie = {
  id: string
  nom: string
}

export default function EditArticlePage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params?.id as string

  const [article, setArticle] = useState<Omit<Article, 'id'> | null>(null)
  const [categories, setCategories] = useState<Categorie[]>([])
  const [fournisseurs, setFournisseurs] = useState<{ id: string; nom: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!articleId) return

    const fetchArticle = async () => {
      try {
        // Charger les catégories
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('id, nom')
          .order('nom')
        if (catError) throw catError
        setCategories(catData || [])

        // Charger les fournisseurs
        const { data: fournData, error: fournError } = await supabase
          .from('fournisseurs')
          .select('id, nom')
          .order('nom')
        if (fournError) throw fournError
        setFournisseurs(fournData || [])

        // Charger l'article
        const { data: artData, error: artError } = await supabase
  .from('articles')
  .select(`
    *,
    fournisseur:fournisseurs(nom),
    categorie_info:categories!left(nom)
  `)
  .eq('id', articleId)
  .single()
        if (artError) throw artError

        setArticle({
          ...artData,
          gestion_par_serie: Boolean(artData.gestion_par_serie),
        })
      } catch (error) {
        console.error('Erreur chargement article:', error)
        toast.error("Impossible de charger l'article")
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [articleId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!article) return

    setSubmitting(true)

    try {
      const {
        nom,
        numero_article,
        code_ean,
        description,
        categorie, // Utiliser la catégorie sélectionnée
        fournisseur_id,
        quantite_stock,
        stock_minimum,
        stock_maximum,
        point_commande,
        prix_achat,
        prix_vente,
        gestion_par_serie
      } = article

      const updates: Partial<Article> = {
        nom,
        numero_article,
        code_ean: code_ean || null,
        description: description || null,
        categorie, // Utiliser la catégorie sélectionnée
        fournisseur_id: fournisseur_id || null,
        stock_minimum,
        stock_maximum,
        point_commande,
        prix_achat,
        prix_vente,
        gestion_par_serie,
      }

      if (!gestion_par_serie) {
        updates.quantite_stock = quantite_stock
      }

      const { error } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', articleId)

      if (error) throw error

      toast.success("Article mis à jour avec succès")
      router.push('/articles')
    } catch (error: any) {
      console.error('Erreur mise à jour:', error)
      toast.error("Erreur lors de la mise à jour : " + (error.message || "inconnue"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof Article, value: any) => {
    setArticle(prev => prev ? { ...prev, [field]: value } : null)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modifier l'article</h1>
        <p className="text-muted-foreground mt-1">
          Mettez à jour les informations de l'article
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails de l'article</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={article.nom}
                  onChange={(e) => handleInputChange('nom', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_article">Numéro article *</Label>
                <Input
                  id="numero_article"
                  value={article.numero_article}
                  onChange={(e) => handleInputChange('numero_article', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code_ean">Code EAN (optionnel)</Label>
                <Input
                  id="code_ean"
                  value={article.code_ean || ''}
                  onChange={(e) => handleInputChange('code_ean', e.target.value || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categorie">Catégorie *</Label>
                <Select
                  value={article.categorie}
                  onValueChange={(value) => handleInputChange('categorie', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.nom}>{cat.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fournisseur_id">Fournisseur</Label>
                <Select
                  value={article.fournisseur_id || "none"}
                  onValueChange={(value) => handleInputChange('fournisseur_id', value === "none" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {fournisseurs.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={article.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value || null)}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Gestion par série */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Gestion par numéro de série</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Activez ceci pour les articles traçables (ex: switchs, onduleurs). Désactivez pour les consommables (ex: RJ45).
                  </p>
                </div>
                <Switch
                  checked={article.gestion_par_serie}
                  onCheckedChange={(checked) => handleInputChange('gestion_par_serie', checked)}
                />
              </div>
            </div>

            {/* Stock - uniquement si gestion_par_serie = false */}
            {!article.gestion_par_serie && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Gestion du stock (quantité)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="quantite_stock">Stock actuel *</Label>
                    <Input
                      id="quantite_stock"
                      type="number"
                      min="0"
                      value={article.quantite_stock}
                      onChange={(e) => handleInputChange('quantite_stock', Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock_minimum">Stock minimum *</Label>
                    <Input
                      id="stock_minimum"
                      type="number"
                      min="0"
                      value={article.stock_minimum}
                      onChange={(e) => handleInputChange('stock_minimum', Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock_maximum">Stock maximum *</Label>
                    <Input
                      id="stock_maximum"
                      type="number"
                      min="0"
                      value={article.stock_maximum}
                      onChange={(e) => handleInputChange('stock_maximum', Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="point_commande">Point de commande *</Label>
                    <Input
                      id="point_commande"
                      type="number"
                      min="0"
                      value={article.point_commande}
                      onChange={(e) => handleInputChange('point_commande', Number(e.target.value))}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Prix */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Prix</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="prix_achat">Prix d'achat (€) *</Label>
                  <Input
                    id="prix_achat"
                    type="number"
                    step="0.01"
                    min="0"
                    value={article.prix_achat}
                    onChange={(e) => handleInputChange('prix_achat', Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prix_vente">Prix de vente (€) *</Label>
                  <Input
                    id="prix_vente"
                    type="number"
                    step="0.01"
                    min="0"
                    value={article.prix_vente}
                    onChange={(e) => handleInputChange('prix_vente', Number(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}