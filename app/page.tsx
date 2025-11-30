"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, BarChart3, Scan, TrendingUp, Shield, Zap } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message || "Une erreur est survenue lors de la connexion")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />
      
      <div className="relative flex min-h-screen">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8 animate-slide-down">
              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center">
                <Package className="h-7 w-7 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold">SEMACTIVE</h1>
            </div>
            
            <div className="space-y-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div>
                <h2 className="text-4xl font-bold mb-4 leading-tight">
                  Gestion d'inventaire intelligente
                </h2>
                <p className="text-blue-100 text-lg">
                  Traçabilité complète, scanner de codes-barres, et suivi en temps réel de vos stocks
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <FeatureItem 
              icon={<Scan className="h-5 w-5" />}
              title="Scanner intégré"
              description="Scannez les codes EAN, QR codes et numéros de série instantanément"
            />
            <FeatureItem 
              icon={<BarChart3 className="h-5 w-5" />}
              title="Tableaux de bord"
              description="Visualisez vos statistiques et suivez vos performances en temps réel"
            />
            <FeatureItem 
              icon={<TrendingUp className="h-5 w-5" />}
              title="Gestion automatisée"
              description="Alertes de réapprovisionnement et bons de commande automatiques"
            />
            <FeatureItem 
              icon={<Shield className="h-5 w-5" />}
              title="Traçabilité totale"
              description="Suivez chaque article de la réception à l'installation client"
            />
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl animate-scale-in">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex lg:hidden items-center gap-2 mb-6">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">SEMACTIVE</span>
              </div>
              <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
              <CardDescription>
                Connectez-vous pour accéder à votre espace de gestion
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="animate-slide-down">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-modern"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <a 
                      href="#" 
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      Mot de passe oublié ?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-modern"
                    autoComplete="current-password"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium h-11 btn-shimmer"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connexion...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Se connecter
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
                <p>Démo : test@semactive.be / demo123</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex gap-4 items-start group">
      <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-blue-100">{description}</p>
      </div>
    </div>
  )
}
