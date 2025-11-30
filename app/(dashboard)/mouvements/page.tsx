"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, History, Package, User, Calendar } from "lucide-react"
import type { Mouvement } from "@/lib/types"

export default function MouvementsPage() {
  const [mouvements, setMouvements] = useState<Mouvement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchMouvements()
  }, [])

  async function fetchMouvements() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('mouvements')
        .select(`
          *,
          article:articles(nom, numero_article),
          personne:personnes(nom, prenom)
        `)
        .order('date_mouvement', { ascending: false })
        .limit(100)

      if (error) throw error
      setMouvements(data || [])
    } catch (error) {
      console.error('Error fetching mouvements:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMouvements = mouvements.filter(m =>
    m.article?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.type_mouvement.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      reception: 'bg-green-100 text-green-800',
      sortie_technicien: 'bg-blue-100 text-blue-800',
      installation_client: 'bg-purple-100 text-purple-800',
      retour: 'bg-orange-100 text-orange-800',
    }
    return variants[type] || 'bg-gray-100 text-gray-800'
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
        <h1 className="text-3xl font-bold tracking-tight">Mouvements</h1>
        <p className="text-muted-foreground mt-1">
          Historique complet des mouvements de stock
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un mouvement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredMouvements.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun mouvement trouvé</p>
              </div>
            ) : (
              filteredMouvements.map((mouvement) => (
                <div key={mouvement.id} className="p-4 hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getTypeBadge(mouvement.type_mouvement)}>
                          {mouvement.type_mouvement.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(mouvement.date_mouvement).toLocaleDateString('fr-BE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {mouvement.article?.nom || 'Article inconnu'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({mouvement.article?.numero_article})
                        </span>
                      </div>
                      {mouvement.personne && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{mouvement.personne.nom} {mouvement.personne.prenom}</span>
                        </div>
                      )}
                      {mouvement.remarques && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {mouvement.remarques}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{mouvement.quantite}</p>
                      <p className="text-xs text-muted-foreground">unités</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
