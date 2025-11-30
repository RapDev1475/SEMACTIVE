// app/(dashboard)/articles/[id]/edit/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Package } from "lucide-react"
import Link from "next/link"
import type { Article } from "@/lib/types"

export default function EditArticlePage() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Partial<Article>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchArticle()
    }
  }, [params.id])

  async function fetchArticle() {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error(error)
      return
    }

    setArticle(data)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!params.id) return

    setSaving(true)
    const { error } = await supabase
      .from('articles')
      .update({
        nom: article.nom,
        numero_article: article.numero_article,
        code_ean: article.code_ean || null,
        quantite_stock: Number(article.quantite_stock),
        stock_minimum: Number(article.stock_minimum),
        stock_maximum: Number(article.stock_maximum),
        point_commande: Number(article.point_commande),
        prix_achat: article.prix_achat ? Number(article.prix_achat) : null,
        prix_vente: article.prix_vente ? Number(article.prix_vente) : null,
        taux_tva: article.taux_tva ? Number(article.taux_tva) : null,
        conditionnement: article.conditionnement || null,
        reference_fournisseur: article.reference_fournisseur || null,
        fournisseur_id: article.fournisseur_id || null,
      })
      .eq('id', params.id)

    if (error) {
      alert("Erreur lors de la sauvegarde : " + error.message)
    } else {
      router.push(`/articles/${params.id}`)
      router.refresh()
    }
    setSaving(false)
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
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <AlertTriangle className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Modifier l'article</h1>
          <p className="text-muted-foreground">Modifiez les informations de l'article</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de base</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Numéro article *</label>
                <Input
                  value={article.numero_article || ''}
                  onChange={(e) => setArticle({ ...article, numero_article: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nom *</label>
                <Input
                  value={article.nom || ''}
                  onChange={(e) => setArticle({ ...article, nom: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Code EAN</label>
                <Input
                  value={article.code_ean || ''}
                  onChange={(e) => setArticle({ ...article, code_ean: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Conditionnement</label>
                <Input
                  value={article.conditionnement || ''}
                  onChange={(e) => setArticle({ ...article, conditionnement: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
              <div>
                <label className="text-sm font-medium">Stock actuel</label>
                <Input
                  type="number"
                  value={article.quantite_stock || ''}
                  onChange={(e) => setArticle({ ...article, quantite_stock: e.target.valueAsNumber })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Stock min</label>
                <Input
                  type="number"
                  value={article.stock_minimum || ''}
                  onChange={(e) => setArticle({ ...article, stock_minimum: e.target.valueAsNumber })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Stock max</label>
                <Input
                  type="number"
                  value={article.stock_maximum || ''}
                  onChange={(e) => setArticle({ ...article, stock_maximum: e.target.valueAsNumber })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Point commande</label>
                <Input
                  type="number"
                  value={article.point_commande || ''}
                  onChange={(e) => setArticle({ ...article, point_commande: e.target.valueAsNumber })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <label className="text-sm font-medium">Prix achat (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={article.prix_achat || ''}
                  onChange={(e) => setArticle({ ...article, prix_achat: e.target.valueAsNumber })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Prix vente (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={article.prix_vente || ''}
                  onChange={(e) => setArticle({ ...article, prix_vente: e.target.valueAsNumber })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Taux TVA (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={article.taux_tva || ''}
                  onChange={(e) => setArticle({ ...article, taux_tva: e.target.valueAsNumber })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Sauvegarde..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}