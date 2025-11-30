"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScanLine, Camera, Package, CheckCircle, XCircle, Loader2 } from "lucide-react"
import type { Article, NumeroSerie } from "@/lib/types"

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [manualInput, setManualInput] = useState("")
  const [result, setResult] = useState<{
    type: string
    value: string
    article?: Article
    numeroSerie?: NumeroSerie
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [recentScans, setRecentScans] = useState<any[]>([])

  async function handleSearch(code: string) {
    if (!code) return
    
    setLoading(true)
    try {
      // Recherche par code EAN
      const { data: articleByEan } = await supabase
        .from('articles')
        .select('*')
        .eq('code_ean', code)
        .single()

      if (articleByEan) {
        setResult({
          type: 'ean',
          value: code,
          article: articleByEan
        })
        addToRecentScans({ type: 'ean', value: code, article: articleByEan })
        return
      }

      // Recherche par numéro de série
      const { data: numeroSerie } = await supabase
        .from('numeros_serie')
        .select(`
          *,
          article:articles(*)
        `)
        .eq('numero_serie', code)
        .single()

      if (numeroSerie) {
        setResult({
          type: 'serie',
          value: code,
          numeroSerie: numeroSerie,
          article: numeroSerie.article
        })
        addToRecentScans({ type: 'serie', value: code, numeroSerie, article: numeroSerie.article })
        return
      }

      // Recherche par numéro d'article
      const { data: articleByNumber } = await supabase
        .from('articles')
        .select('*')
        .eq('numero_article', code)
        .single()

      if (articleByNumber) {
        setResult({
          type: 'numero',
          value: code,
          article: articleByNumber
        })
        addToRecentScans({ type: 'numero', value: code, article: articleByNumber })
        return
      }

      // Aucun résultat
      setResult({
        type: 'unknown',
        value: code
      })
    } catch (error) {
      console.error('Search error:', error)
      setResult({
        type: 'error',
        value: code
      })
    } finally {
      setLoading(false)
    }
  }

  function addToRecentScans(scan: any) {
    setRecentScans(prev => [
      { ...scan, timestamp: new Date().toISOString() },
      ...prev.slice(0, 4)
    ])
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleSearch(manualInput)
  }

  function startScanning() {
    setScanning(true)
    // Note: L'implémentation complète du scanner nécessiterait html5-qrcode
    // Pour cette démo, on utilise l'input manuel
    alert("La fonctionnalité de scan caméra sera activée dans une prochaine version. Utilisez la saisie manuelle pour l'instant.")
    setScanning(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scanner</h1>
        <p className="text-muted-foreground mt-1">
          Scannez les codes-barres, QR codes et numéros de série
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scanner Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scanner de codes</CardTitle>
              <CardDescription>
                Utilisez votre caméra ou saisissez manuellement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Scanner */}
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                {scanning ? (
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Scan en cours...</p>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <Button onClick={startScanning} className="btn-shimmer">
                      <ScanLine className="mr-2 h-4 w-4" />
                      Activer la caméra
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                      Autorisez l'accès à la caméra dans votre navigateur
                    </p>
                  </div>
                )}
              </div>

              {/* Manual Input */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou saisissez manuellement
                  </span>
                </div>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-code">Code-barres / Numéro de série</Label>
                  <Input
                    id="manual-code"
                    placeholder="Saisissez ou collez le code..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!manualInput || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Recherche...
                    </>
                  ) : (
                    <>
                      <ScanLine className="mr-2 h-4 w-4" />
                      Rechercher
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Scan Result */}
          {result && (
            <Card className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Résultat du scan</CardTitle>
                  {result.article ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {result.article ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <Package className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{result.article.nom}</h3>
                        <p className="text-sm text-muted-foreground">
                          {result.article.numero_article}
                        </p>
                        {result.type === 'ean' && result.value && (
                          <p className="text-sm text-muted-foreground">
                            EAN: {result.value}
                          </p>
                        )}
                        {result.type === 'serie' && result.numeroSerie && (
                          <div className="mt-2">
                            <Badge>N° Série: {result.numeroSerie.numero_serie}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Localisation: {result.numeroSerie.localisation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Stock actuel</p>
                        <p className="text-2xl font-bold">{result.article.quantite_stock}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Stock minimum</p>
                        <p className="text-2xl font-bold">{result.article.stock_minimum}</p>
                      </div>
                    </div>

                    {result.article.prix_achat && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">Prix d'achat</p>
                        <p className="text-xl font-semibold">{result.article.prix_achat.toFixed(2)}€</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" className="flex-1">
                        Voir la fiche
                      </Button>
                      <Button className="flex-1">
                        Enregistrer mouvement
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Code non trouvé</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Aucun article ne correspond au code : <br />
                      <span className="font-mono font-semibold">{result.value}</span>
                    </p>
                    <Button variant="outline" onClick={() => setResult(null)}>
                      Nouveau scan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Scans */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Scans récents</CardTitle>
              <CardDescription>
                Historique de votre session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentScans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ScanLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun scan effectué</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentScans.map((scan, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => setResult(scan)}
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        scan.article ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        {scan.article ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {scan.article ? (
                          <>
                            <p className="font-medium truncate">{scan.article.nom}</p>
                            <p className="text-xs text-muted-foreground">
                              {scan.type === 'ean' && `EAN: ${scan.value}`}
                              {scan.type === 'serie' && `N° Série: ${scan.value}`}
                              {scan.type === 'numero' && `N° Article: ${scan.value}`}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-red-600">Code non trouvé</p>
                            <p className="text-xs text-muted-foreground font-mono">{scan.value}</p>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(scan.timestamp).toLocaleTimeString('fr-BE', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Session actuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{recentScans.length}</p>
                  <p className="text-xs text-muted-foreground">Scans totaux</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {recentScans.filter(s => s.article).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Trouvés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
