"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PackageCheck, ScanLine, Plus } from "lucide-react"
import type { ReceptionCommande, BonCommande } from "@/lib/types"

export default function ReceptionsPage() {
  const [receptions, setReceptions] = useState<ReceptionCommande[]>([])
  const [commandesEnCours, setCommandesEnCours] = useState<BonCommande[]>([])
  const [loading, setLoading] = useState(true)
  const [scanMode, setScanMode] = useState(false)
  const [scannedCode, setScannedCode] = useState("")

  useEffect(() => {
    fetchReceptions()
    fetchCommandesEnCours()
  }, [])

  async function fetchReceptions() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('receptions_commande')
        .select(`
          *,
          bon_commande:bons_commande(numero_commande),
          article:articles(nom, numero_article)
        `)
        .order('date_reception', { ascending: false })
        .limit(50)

      if (error) throw error
      setReceptions(data || [])
    } catch (error) {
      console.error('Error fetching receptions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCommandesEnCours() {
    try {
      const { data, error } = await supabase
        .from('bons_commande')
        .select(`
          *,
          fournisseur:fournisseurs(nom)
        `)
        .in('statut', ['confirmee', 'en_transit'])
        .order('date_livraison_prevue')

      if (error) throw error
      setCommandesEnCours(data || [])
    } catch (error) {
      console.error('Error fetching commandes:', error)
    }
  }

  const stats = {
    receptions_aujourd_hui: receptions.filter(r => 
      new Date(r.date_reception).toDateString() === new Date().toDateString()
    ).length,
    total_articles: receptions.reduce((sum, r) => sum + r.quantite_recue, 0),
    commandes_en_attente: commandesEnCours.length,
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
          <h1 className="text-3xl font-bold tracking-tight">Réceptions</h1>
          <p className="text-muted-foreground mt-1">
            Réceptionnez vos marchandises et mettez à jour le stock
          </p>
        </div>
        <Button 
          onClick={() => setScanMode(!scanMode)} 
          className="btn-shimmer"
        >
          <ScanLine className="mr-2 h-4 w-4" />
          {scanMode ? 'Fermer le scanner' : 'Scanner réception'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Réceptions aujourd'hui
            </CardTitle>
            <PackageCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.receptions_aujourd_hui}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Articles reçus (total)
            </CardTitle>
            <PackageCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_articles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Commandes en attente
            </CardTitle>
            <PackageCheck className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.commandes_en_attente}</div>
          </CardContent>
        </Card>
      </div>

      {scanMode && (
        <Card className="animate-slide-down border-primary">
          <CardHeader>
            <CardTitle>Scanner une réception</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scan-code">Code-barres / Numéro de série</Label>
              <Input
                id="scan-code"
                placeholder="Scannez ou saisissez le code..."
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                className="font-mono"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1">
                <PackageCheck className="mr-2 h-4 w-4" />
                Valider la réception
              </Button>
              <Button variant="outline" onClick={() => setScanMode(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {commandesEnCours.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Commandes en attente de livraison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {commandesEnCours.map((commande) => (
                <div 
                  key={commande.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div>
                    <div className="font-medium">{commande.numero_commande}</div>
                    <div className="text-sm text-muted-foreground">
                      {commande.fournisseur?.nom || 'Fournisseur inconnu'}
                    </div>
                  </div>
                  <div className="text-right">
                    {commande.date_livraison_prevue && (
                      <div className="text-sm">
                        Prévue le {new Date(commande.date_livraison_prevue).toLocaleDateString('fr-BE')}
                      </div>
                    )}
                    <Badge className="bg-orange-100 text-orange-800 mt-1">
                      {commande.statut === 'en_transit' ? 'En transit' : 'Confirmée'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dernières réceptions</CardTitle>
        </CardHeader>
        <CardContent>
          {receptions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <PackageCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune réception enregistrée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {receptions.map((reception) => (
                <div 
                  key={reception.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="font-medium">{reception.article?.nom || 'Article inconnu'}</div>
                    <div className="text-sm text-muted-foreground">
                      Commande: {reception.bon_commande?.numero_commande || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(reception.date_reception).toLocaleDateString('fr-BE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{reception.quantite_recue}</p>
                    <p className="text-xs text-muted-foreground">reçus</p>
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
