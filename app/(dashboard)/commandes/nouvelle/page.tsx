"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NouvelleCommandePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/commandes">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouvelle commande</h1>
          <p className="text-muted-foreground mt-1">
            Créez un nouveau bon de commande
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulaire de commande</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium mb-2">Fonctionnalité en cours de développement</p>
            <p className="text-sm">
              Le formulaire de création de commande sera bientôt disponible.
            </p>
            <Link href="/commandes">
              <Button className="mt-6" variant="outline">
                Retour aux commandes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}