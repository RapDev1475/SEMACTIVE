"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Users, Package, MapPin } from "lucide-react"
import type { StockTechnicien, Personne } from "@/lib/types"

export default function StockTechnicienPage() {
  const [stocks, setStocks] = useState<StockTechnicien[]>([])
  const [techniciens, setTechniciens] = useState<Personne[]>([])
  const [selectedTechnicien, setSelectedTechnicien] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTechniciens()
    fetchStocks()
  }, [])

  async function fetchTechniciens() {
    try {
      const { data, error } = await supabase
        .from('personnes')
        .select('*')
        .eq('type', 'technicien')
        .order('nom')

      if (error) throw error
      setTechniciens(data || [])
    } catch (error) {
      console.error('Error fetching techniciens:', error)
    }
  }

  async function fetchStocks() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('stock_technicien')
        .select(`
          *,
          technicien:personnes!technicien_id(nom, prenom),
          article:articles(nom, numero_article),
          numero_serie:numeros_serie(numero_serie, adresse_mac)
        `)
        .order('derniere_mise_a_jour', { ascending: false })

      if (error) throw error
      setStocks(data || [])
    } catch (error) {
      console.error('Error fetching stocks:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStocks = selectedTechnicien === "all" 
    ? stocks 
    : stocks.filter(s => s.technicien_id === selectedTechnicien)

  const groupedByTechnicien = filteredStocks.reduce((acc, stock) => {
    const key = stock.technicien_id
    if (!acc[key]) {
      acc[key] = {
        technicien: stock.technicien,
        stocks: []
      }
    }
    acc[key].stocks.push(stock)
    return acc
  }, {} as Record<string, { technicien: any, stocks: StockTechnicien[] }>)

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
          <h1 className="text-3xl font-bold tracking-tight">Stock Technicien</h1>
          <p className="text-muted-foreground mt-1">
            Inventaire du matériel par technicien
          </p>
        </div>
        <Select value={selectedTechnicien} onValueChange={setSelectedTechnicien}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Tous les techniciens" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les techniciens</SelectItem>
            {techniciens.map((tech) => (
              <SelectItem key={tech.id} value={tech.id}>
                {tech.nom} {tech.prenom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Techniciens
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(groupedByTechnicien).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Articles différents
            </CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredStocks.map(s => s.article_id)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total unités
            </CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStocks.reduce((sum, s) => sum + s.quantite, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {Object.keys(groupedByTechnicien).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun stock technicien</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByTechnicien).map(([techId, { technicien, stocks }]) => (
          <Card key={techId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {technicien.nom} {technicien.prenom}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stocks.length} article{stocks.length > 1 ? 's' : ''} • {' '}
                    {stocks.reduce((sum, s) => sum + s.quantite, 0)} unités
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  Technicien
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stocks.map((stock) => (
                  <div 
                    key={stock.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{stock.article?.nom || 'Article inconnu'}</span>
                        <span className="text-xs text-muted-foreground">
                          ({stock.article?.numero_article})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{stock.localisation}</span>
                        </div>
                        {stock.numero_serie?.numero_serie && (
                          <span className="text-xs font-mono">
                            Série: {stock.numero_serie.numero_serie}
                          </span>
                        )}
                        {stock.numero_serie?.adresse_mac && (
                          <span className="text-xs font-mono">
                            MAC: {stock.numero_serie.adresse_mac}
                          </span>
                        )}
                        <span className="text-xs">
                          • {new Date(stock.derniere_mise_a_jour).toLocaleDateString('fr-BE')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{stock.quantite}</p>
                      <p className="text-xs text-muted-foreground">unités</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}