// Template pour app/(dashboard)/stock-technicien/page.tsx
// Ce template montre comment afficher les numéros de série et adresses MAC

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function StockTechnicienPage() {
  const supabase = createClient()
  const [stockData, setStockData] = useState<any[]>([])
  const [personnes, setPersonnes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTechnicien, setSelectedTechnicien] = useState<string>('all')

  useEffect(() => {
    fetchPersonnes()
    fetchStockTechnicien()
  }, [])

  async function fetchPersonnes() {
    try {
      const { data, error } = await supabase
        .from('personnes')
        .select('*')
        .eq('type', 'technicien')
        .order('nom')

      if (error) throw error
      setPersonnes(data || [])
    } catch (error) {
      console.error('Error fetching personnes:', error)
    }
  }

  async function fetchStockTechnicien() {
    setLoading(true)
    try {
      // ✅ IMPORTANT : Inclure numero_serie dans le select
      const { data, error } = await supabase
        .from('stock_technicien')
        .select(`
          *,
          article:articles(nom, numero_article),
          personne:personnes(nom, prenom),
          numero_serie:numeros_serie(numero_serie, adresse_mac)
        `)
        .gt('quantite', 0)
        .order('technicien_id')

      if (error) throw error
      setStockData(data || [])
      console.log('Stock technicien chargé:', data?.length, 'entrées')
    } catch (error) {
      console.error('Error fetching stock technicien:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les données
  const filteredData = stockData.filter(item => {
    const matchesSearch = 
      (item.article?.nom?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.article?.numero_article?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.numero_serie?.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.numero_serie?.adresse_mac?.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTechnicien = 
      selectedTechnicien === 'all' || 
      item.technicien_id === selectedTechnicien

    return matchesSearch && matchesTechnicien
  })

  // Calculer les statistiques
  const stats = {
    totalArticles: filteredData.reduce((sum, item) => sum + item.quantite, 0),
    totalLignes: filteredData.length,
    techniciens: new Set(filteredData.map(item => item.technicien_id)).size
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
          <h1 className="text-3xl font-bold tracking-tight">Stock Technicien</h1>
          <p className="text-muted-foreground mt-1">
            Matériel en possession des techniciens
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalArticles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lignes de stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLignes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Techniciens actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.techniciens}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par article, numéro de série, MAC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border rounded-lg"
              value={selectedTechnicien}
              onChange={(e) => setSelectedTechnicien(e.target.value)}
            >
              <option value="all">Tous les techniciens</option>
              {personnes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} {p.prenom}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredData.length} entrée(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold">Article</th>
                  <th className="text-left p-4 font-semibold">N° Article</th>
                  <th className="text-left p-4 font-semibold">N° Série</th>
                  <th className="text-left p-4 font-semibold">Adresse MAC</th>
                  <th className="text-center p-4 font-semibold">Quantité</th>
                  <th className="text-left p-4 font-semibold">Technicien</th>
                  <th className="text-left p-4 font-semibold">Localisation</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      Aucun stock trouvé
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <tr 
                      key={item.id} 
                      className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                    >
                      <td className="p-4 font-medium">
                        {item.article?.nom || 'Article inconnu'}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {item.article?.numero_article || '-'}
                      </td>
                      <td className="p-4">
                        {item.numero_serie?.numero_serie ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.numero_serie.numero_serie}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {item.numero_serie?.adresse_mac ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.numero_serie.adresse_mac}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-semibold">
                        {item.quantite}
                      </td>
                      <td className="p-4">
                        {item.personne?.nom} {item.personne?.prenom || ''}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {item.localisation || 'camionnette'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}