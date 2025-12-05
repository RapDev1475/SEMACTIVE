// app/(dashboard)/articles/new/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

const CATEGORIES = [
  "Signalisation",
  "Outils",
  "Matériel",
  "EPI",
  "Consommables",
  "Électronique",
  "Réseau",
  "Câblage",
  "Connectique",
  "Autre"
]

export default function NewArticlePage() {
  const router = useRouter()

  const [formData, setFormData] = useState<Omit<Article, 'id'>>({
    nom: "",
    numero_article: "",
    code_ean: null,
    description: null,
    categorie: "Autre",
    fournisseur_id: null,
    quantite_stock: 0,
    stock_minimum: 0,
    stock_maximum: 0,
    point_commande: 0,
    prix_achat: 0,
    prix_vente: 0,
    gestion_par_serie: false,
  })
  
  const [fournisseurs, setFournisseurs] = useState<{ id: string; nom: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Charger les fournisseurs au montage
  useState(() => {
    const fetchFournisseurs = async () => {
      try {
        const { data, error } = await supabase
          .from('fournisseurs')
          .select('id, nom')
          .order('nom')

        if (error) throw error
        setFournisseurs(data || [])
      } catch (error: any) {
        console.error('Erreur chargement fournisseurs:', error)
        toast.error("Impossible de charger les fournisseurs")
      } finally {
        setLoading(false)
      }
    }

    fetchFournisseurs()
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setSubmitting(true)

    try {
const {
  nom,
  numero_article,
  code_ean,
  description,
  categorie,
  fournisseur_id,
  quantite_stock,
  stock_minimum,
  stock_maximum,
  point_commande,
  prix_achat,
  prix_vente,
  gestion_par_serie
} = formData

// Vérifier que le numéro d'article est unique
const { data: existingArticle, error: checkError } = await supabase
  .from('articles')
  .select('id')
  .eq('numero_article', numero_article)
  .single()

if (existingArticle) {
  toast.error("Un article avec ce numéro existe déjà")
  setSubmitting(false)
  return
}

// Toujours inclure quantite_stock dans l'objet initial
const newArticle: Omit<Article, 'id'> = {
  nom,
  numero_article,
  code_ean: code_ean || null,
  description: description || null,
  categorie,
  fournisseur_id: fournisseur_id || null,
  quantite_stock: gestion_par_serie ? 0 : quantite_stock, // Valeur conditionnelle dès le début
  stock_minimum,
  stock_maximum,
  point_commande,
  prix_achat,
  prix_vente,
  gestion_par_serie,
}

const { error } = await supabase
  .from('articles')
  .insert([newArticle])

      if (error) throw error

      toast.success("Article créé avec succès")
      router.push('/articles')
    } catch (error: any) {
      console.error('Erreur création:', error)
      toast.error("Erreur lors de la création : " + (error.message || "inconnue"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nouvel article</h1>
        <p className="text-muted-foreground mt-1">
          Créez un nouvel article dans le catalogue
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
                  value={formData.nom}
                  onChange={(e) => handleInputChange('nom', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_article">Numéro article *</Label>
                <Input
                  id="numero_article"
                  value={formData.numero_article}
                  onChange={(e) => handleInputChange('numero_article', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code_ean">Code EAN (optionnel)</Label>
                <Input
                  id="code_ean"
                  value={formData.code_ean || ''}
                  onChange={(e) => handleInputChange('code_ean', e.target.value || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categorie">Catégorie *</Label>
                <Select
                  value={formData.categorie}
                  onValueChange={(value) => handleInputChange('categorie', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fournisseur_id">Fournisseur</Label>
                <Select
                  value={formData.fournisseur_id || "none"}
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
                  value={formData.description || ''}
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
                  checked={formData.gestion_par_serie}
                  onCheckedChange={(checked) => handleInputChange('gestion_par_serie', checked)}
                />
              </div>
            </div>

            {/* Stock - affiché pour tous mais initialisé différemment */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Gestion du stock</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="quantite_stock">Stock initial *</Label>
                  <Input
                    id="quantite_stock"
                    type="number"
                    min="0"
                    value={formData.quantite_stock}
                    onChange={(e) => handleInputChange('quantite_stock', Number(e.target.value))}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Quantité initiale en stock (sera remise à zéro pour les articles traçables)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock_minimum">Stock minimum *</Label>
                  <Input
                    id="stock_minimum"
                    type="number"
                    min="0"
                    value={formData.stock_minimum}
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
                    value={formData.stock_maximum}
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
                    value={formData.point_commande}
                    onChange={(e) => handleInputChange('point_commande', Number(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>

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
                    value={formData.prix_achat}
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
                    value={formData.prix_vente}
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
                {submitting ? "Création en cours..." : "Créer l'article"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}