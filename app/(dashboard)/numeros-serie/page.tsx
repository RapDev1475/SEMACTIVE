"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Hash, MapPin, Package } from "lucide-react"

type NumeroSerieWithArticle = {
  id: string
  numero_serie: string
  adresse_mac?: string
  localisation?: string
  statut: string
  created_at: string
  dernier_mouvement?: string
  article?: {
    nom: string
    numero_article: string
    code_ean: string
  }
}

export default function NumerosSeriesPage() {
  const [numerosSerie, setNumerosSerie] = useState<NumeroSerieWithArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatut, setFilterStatut] = useState<string>("all")
  const [filterLocalisation, setFilterLocalisation] = useState<string>("all")
  const [localisations, setLocalisations] = useState<string[]>([])

  useEffect(() => {
    fetchNumerosSerie()
    fetchLocalisations()
  }, [])

  async function fetchNumerosSerie() {
    setLoading(true)
    try {
      const { data: seriesData, error: seriesError } = await supabase
        .from('numeros_serie')
        .select(`
          *,
          article:articles(nom, numero_article, code_ean)
        `)
        .order('created_at', { ascending: false })

      if (seriesError) throw seriesError

      const { data: mouvementsData } = await supabase
        .from('mouvements')
        .select('numero_serie_id, type_mouvement, date_mouvement')
        .not('numero_serie_id', 'is', null)
        .order('date_mouvement', { ascending: false })

      const dernierMouvementMap = new Map()
      mouvementsData?.forEach(mouv => {
        if (!dernierMouvementMap.has(mouv.numero_serie_id)) {
          dernierMouvementMap.set(mouv.numero_serie_id, mouv.type_mouvement)
        }
      })

      const seriesWithStatut = (seriesData || []).map(serie => {
        const dernierMouvement = dernierMouvementMap.get(serie.id)
        let statut = 'disponible'

        if (dernierMouvement) {
          switch (dernierMouvement) {
            case 'reception':
              statut = 'disponible'
              break
            case 'sortie_technicien':
              statut = 'en_utilisation'
              break
            case 'sortie_transport':
              statut = 'en_transport'
              break
            case 'installation_client':
              statut = 'chez_client'
              break
            case 'retour':
              statut = 'disponible'
              break
            case 'transfert_depot':
              statut = 'disponible'
              break
            default:
              statut = 'disponible'
          }
        }

        return {
          ...serie,
          statut,
          dernier_mouvement: dernierMouvement
        }
      })

      setNumerosSerie(seriesWithStatut)
    } catch (error) {
      console.error('Error fetching numeros serie:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchLocalisations() {
    try {
      const { data } = await supabase
        .from('numeros_serie')
        .select('localisation')
        .not('localisation', 'is', null)

      if (data) {
        const uniqueLocalisations = Array.from(new Set(data.map(d => d.localisation).filter(Boolean)))
        setLocalisations(uniqueLocalisations as string[])
      }
    } catch (error) {
      console.error('Error fetching localisations:', error)
    }
  }

  const filteredSeries = numerosSerie.filter(serie => {
    const matchesSearch = 
      serie.numero_serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (serie.adresse_mac && serie.adresse_mac.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (serie.article?.nom && serie.article.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (serie.article?.numero_article && serie.article.numero_article.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatut = filterStatut === "all" || serie.statut === filterStatut
    const matchesLocalisation = filterLocalisation === "all" || serie.localisation === filterLocalisation

    return matchesSearch && matchesStatut && matchesLocalisation
  })

  const stats = {
    total: numerosSerie.length,
    disponible: numerosSerie.filter(s => s.statut === 'disponible').length,
    utilise: numerosSerie.filter(s => s.statut === 'en_utilisation' || s.statut === 'en_transport').length,
    client: numerosSerie.filter(s => s.statut === 'chez_client').length,
  }

  const getStatusBadge = (statut: string) => {
    const variants: Record<string, string> = {
      disponible: 'bg-green-100 text-green-800',
      en_utilisation: 'bg-blue-100 text-blue-800',
      en_transport: 'bg-purple-100 text-purple-800',
      chez_client: 'bg-orange-100 text-orange-800',
    }
    return variants[statut] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (statut: string) => {
    const labels: Record<string, string> = {
      disponible: 'Disponible',
      en_utilisation: 'En utilisation',
      en_transport: 'En transport',
      chez_client: 'Chez client',
    }
    return labels[statut] || statut
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
          <h1 className="text-3xl font-bold tracking-tight">Numéros de série</h1>
          <p className="text-muted-foreground mt-1">
            Gestion et traçabilité des numéros de série et adresses MAC
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
            <Hash className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disponibles
            </CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.disponible}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En utilisation
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.utilise}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chez client
            </CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.client}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par n° série, MAC, article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="en_utilisation">En utilisation</SelectItem>
                <SelectItem value="en_transport">En transport</SelectItem>
                <SelectItem value="chez_client">Chez client</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLocalisation} onValueChange={setFilterLocalisation}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Localisation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes localisations</SelectItem>
                {localisations.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {filteredSeries.length} numéro{filteredSeries.length > 1 ? 's' : ''} de série
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSeries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun numéro de série trouvé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSeries.map((serie) => (
                <div
                  key={serie.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-mono font-bold text-lg">{serie.numero_serie}</p>
                      <Badge className={getStatusBadge(serie.statut)}>
                        {getStatusLabel(serie.statut)}
                      </Badge>
                    </div>
                    
                    {serie.adresse_mac && (
                      <p className="text-sm text-muted-foreground font-mono mb-1">
                        <strong>MAC:</strong> {serie.adresse_mac}
                      </p>
                    )}

                    {serie.article && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Article:</strong> {serie.article.nom} ({serie.article.numero_article})
                      </p>
                    )}

                    {serie.localisation && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {serie.localisation}
                      </div>
                    )}
                  </div>

                  <div className="text-right text-sm text-muted-foreground">
                    <p>Ajouté le</p>
                    <p className="font-medium">
                      {new Date(serie.created_at).toLocaleDateString('fr-BE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}