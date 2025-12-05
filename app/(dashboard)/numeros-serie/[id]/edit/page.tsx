"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type NumeroSerieData = {
  id: string
  article_id: string
  numero_serie: string
  adresse_mac: string | null
  localisation: string
  article?: { nom: string; numero_article: string }
  dernier_mouvement?: { personne?: { nom: string; prenom?: string } }
}

const LOCALISATIONS = [
  'Entrepot',
  'Technicien',
  'Installation',
  'Retour',
  'Warehouse',
  'Warehouse Seneffe',
  'Warehouse Houthalen',
  'Stock Technicien',
  'Warehouse Seneffe OBE KIT16'
]

export default function EditNumeroSeriePage() {
  const router = useRouter()
  const params = useParams()
  const serieId = params?.id as string

  const [serie, setSerie] = useState<NumeroSerieData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!serieId) return
    fetchSerie()
  }, [serieId])

  async function fetchSerie() {
    setLoading(true)
    try {
      const { data: serieData, error: serieError } = await supabase
        .from('numeros_serie')
        .select(`
          *,
          article:articles(nom, numero_article)
        `)
        .eq('id', serieId)
        .single()

      if (serieError) throw serieError

      const { data: mouvementData } = await supabase
        .from('mouvements')
        .select(`
          personne:personnes(nom, prenom)
        `)
        .eq('numero_serie_id', serieId)
        .order('date_mouvement', { ascending: false })
        .limit(1)
        .single()

      setSerie({
        ...serieData,
        dernier_mouvement: mouvementData
      })
    } catch (error) {
      console.error('Erreur chargement série:', error)
      toast.error("Impossible de charger le numéro de série")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serie) return

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('numeros_serie')
        .update({
          numero_serie: serie.numero_serie,
          adresse_mac: serie.adresse_mac || null,
          localisation: serie.localisation,
        })
        .eq('id', serieId)

      if (error) throw error

      toast.success("Numéro de série mis à jour")
      router.push('/numeros-serie')
    } catch (error: any) {
      console.error('Erreur mise à jour:', error)
      toast.error("Erreur lors de la mise à jour : " + (error.message || "inconnue"))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!serie) {
    return <div className="p-6">Numéro de série non trouvé</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modifier le numéro de série</h1>
        <p className="text-muted-foreground mt-1">
          {serie.article?.nom} ({serie.article?.numero_article})
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="article">Article</Label>
              <Input
                id="article"
                value={`${serie.article?.nom} (${serie.article?.numero_article})`}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_serie">Numéro de série *</Label>
              <Input
                id="numero_serie"
                value={serie.numero_serie}
                onChange={(e) => setSerie({ ...serie, numero_serie: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse_mac">Adresse MAC</Label>
              <Input
                id="adresse_mac"
                value={serie.adresse_mac || ''}
                onChange={(e) => setSerie({ ...serie, adresse_mac: e.target.value || null })}
                placeholder="00:00:00:00:00:00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="localisation">Localisation *</Label>
              <Select
                value={serie.localisation}
                onValueChange={(value) => setSerie({ ...serie, localisation: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALISATIONS.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {serie.dernier_mouvement?.personne && (
              <div className="space-y-2">
                <Label>Dernier mouvement effectué par</Label>
                <Input
                  value={`${serie.dernier_mouvement.personne.nom} ${serie.dernier_mouvement.personne.prenom || ''}`}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}

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