"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, ShoppingCart, Package, TruckIcon } from "lucide-react"
import type { BonCommande } from "@/lib/types"

export default function CommandesPage() {
  const [commandes, setCommandes] = useState<BonCommande[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCommandes()
  }, [])

  async function fetchCommandes() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bons_commande')
        .select(`
          *,
          fournisseur:fournisseurs(nom)
        `)
        .order('date_commande', { ascending: false })

      if (error) throw error
      setCommandes(data || [])
    } catch (error) {
      console.error('Error fetching commandes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (statut: string) => {
    const variants: Record<string, { class: string, label: string }> = {
      brouillon: { class: 'bg-gray-100 text-gray-800', label: 'Brouillon' },
      envoyee: { class: 'bg-blue-100 text-blue-800', label: 'Envoyée' },
      confirmee: { class: 'bg-green-100 text-green-800', label: 'Confirmée' },
      en_transit: { class: 'bg-purple-100 text-purple-800', label: 'En transit' },
      livree: { class: 'bg-green-600 text-white', label: 'Livrée' },
      annulee: { class: 'bg-red-100 text-red-800', label: 'Annulée' },
    }
    return variants[statut] || variants.brouillon
  }

  const stats = {
    total: commandes.length,
    enCours: commandes.filter(c => ['envoyee', 'confirmee', 'en_transit'].includes(c.statut)).length,
    livrees: commandes.filter(c => c.statut === 'livree').length,
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
          <h1 className="text-3xl font-bold tracking-tight">Bons de commande</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos commandes fournisseurs
          </p>
        </div>
        <Link href="/commandes/nouvelle">
          <Button className="btn-shimmer">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle commande
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total commandes
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En cours
            </CardTitle>
            <TruckIcon className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enCours}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Livrées
            </CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.livrees}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {commandes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune commande</p>
              <Link href="/commandes/nouvelle">
                <Button className="mt-4">
                  Créer votre première commande
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          commandes.map((commande) => {
            const statusInfo = getStatusBadge(commande.statut)
            return (
              <Card key={commande.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{commande.numero_commande}</h3>
                        <Badge className={statusInfo.class}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">
                        {commande.fournisseur?.nom || 'Fournisseur inconnu'}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date commande</p>
                          <p className="font-medium">
                            {new Date(commande.date_commande).toLocaleDateString('fr-BE')}
                          </p>
                        </div>
                        {commande.date_livraison_prevue && (
                          <div>
                            <p className="text-muted-foreground">Livraison prévue</p>
                            <p className="font-medium">
                              {new Date(commande.date_livraison_prevue).toLocaleDateString('fr-BE')}
                            </p>
                          </div>
                        )}
                        {commande.montant_total_ht && (
                          <div>
                            <p className="text-muted-foreground">Montant HT</p>
                            <p className="font-medium">{commande.montant_total_ht.toFixed(2)}€</p>
                          </div>
                        )}
                        {commande.montant_total_ttc && (
                          <div>
                            <p className="text-muted-foreground">Montant TTC</p>
                            <p className="font-semibold text-lg">{commande.montant_total_ttc.toFixed(2)}€</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
