// app/(dashboard)/settings/page.tsx
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Save, Edit3, Package, Warehouse, Move3D } from "lucide-react"
import { toast } from "sonner"

type Categorie = {
  id: string
  nom: string
}

type Emplacement = {
  id: string
  nom: string
  description: string | null
}

type TypeMouvement = {
  id: string
  nom: string
  description: string | null
}

export default function SettingsPage() {
  const [categories, setCategories] = useState<Categorie[]>([])
  const [emplacements, setEmplacements] = useState<Emplacement[]>([])
  const [typesMouvement, setTypesMouvement] = useState<TypeMouvement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // États pour l'ajout/édition
  const [newCategorie, setNewCategorie] = useState("")
  const [newEmplacement, setNewEmplacement] = useState("")
  const [newEmplacementDesc, setNewEmplacementDesc] = useState("")
  const [newTypeMouvement, setNewTypeMouvement] = useState("")
  const [newTypeMouvementDesc, setNewTypeMouvementDesc] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    try {
      // Charger les catégories
      const { data: cats, error: catsError } = await supabase
        .from('categories')
        .select('*')
        .order('nom')

      if (catsError) throw catsError
      setCategories(cats || [])

      // Charger les emplacements
      const { data: emps, error: empsError } = await supabase
        .from('emplacements')
        .select('*')
        .order('nom')

      if (empsError) throw empsError
      setEmplacements(emps || [])

      // Charger les types de mouvements
      const { data: types, error: typesError } = await supabase
        .from('types_mouvement')
        .select('*')
        .order('nom')

      if (typesError) throw typesError
      setTypesMouvement(types || [])

    } catch (error: any) {
      console.error('Erreur chargement paramètres:', error)
      toast.error("Erreur lors du chargement des paramètres")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategorie = async () => {
    if (!newCategorie.trim()) return

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ nom: newCategorie.trim() }])

      if (error) throw error

      toast.success("Catégorie ajoutée")
      setNewCategorie("")
      fetchSettings() // Recharger
    } catch (error: any) {
      console.error('Erreur ajout catégorie:', error)
      toast.error("Erreur lors de l'ajout de la catégorie")
    }
  }

  const handleDeleteCategorie = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success("Catégorie supprimée")
      fetchSettings() // Recharger
    } catch (error: any) {
      console.error('Erreur suppression catégorie:', error)
      toast.error("Erreur lors de la suppression de la catégorie")
    }
  }

  const handleAddEmplacement = async () => {
    if (!newEmplacement.trim()) return

    try {
      const { error } = await supabase
        .from('emplacements')
        .insert([{ 
          nom: newEmplacement.trim(),
          description: newEmplacementDesc.trim() || null
        }])

      if (error) throw error

      toast.success("Emplacement ajouté")
      setNewEmplacement("")
      setNewEmplacementDesc("")
      fetchSettings() // Recharger
    } catch (error: any) {
      console.error('Erreur ajout emplacement:', error)
      toast.error("Erreur lors de l'ajout de l'emplacement")
    }
  }

  const handleDeleteEmplacement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('emplacements')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success("Emplacement supprimé")
      fetchSettings() // Recharger
    } catch (error: any) {
      console.error('Erreur suppression emplacement:', error)
      toast.error("Erreur lors de la suppression de l'emplacement")
    }
  }

  const handleAddTypeMouvement = async () => {
    if (!newTypeMouvement.trim()) return

    try {
      const { error } = await supabase
        .from('types_mouvement')
        .insert([{ 
          nom: newTypeMouvement.trim(),
          description: newTypeMouvementDesc.trim() || null
        }])

      if (error) throw error

      toast.success("Type de mouvement ajouté")
      setNewTypeMouvement("")
      setNewTypeMouvementDesc("")
      fetchSettings() // Recharger
    } catch (error: any) {
      console.error('Erreur ajout type mouvement:', error)
      toast.error("Erreur lors de l'ajout du type de mouvement")
    }
  }

  const handleDeleteTypeMouvement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('types_mouvement')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success("Type de mouvement supprimé")
      fetchSettings() // Recharger
    } catch (error: any) {
      console.error('Erreur suppression type mouvement:', error)
      toast.error("Erreur lors de la suppression du type de mouvement")
    }
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
        <h1 className="text-3xl font-bold tracking-tight">Paramètres de l'application</h1>
        <p className="text-muted-foreground mt-1">
          Gérez les catégories, emplacements et types de mouvements
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Catégories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Catégories de produits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nouvelle catégorie..."
                  value={newCategorie}
                  onChange={(e) => setNewCategorie(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategorie()}
                />
                <Button size="sm" onClick={handleAddCategorie}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{cat.nom}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCategorie(cat.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emplacements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Emplacements de stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Nom de l'emplacement..."
                  value={newEmplacement}
                  onChange={(e) => setNewEmplacement(e.target.value)}
                />
                <Input
                  placeholder="Description (optionnelle)..."
                  value={newEmplacementDesc}
                  onChange={(e) => setNewEmplacementDesc(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEmplacement()}
                />
              </div>
              <Button size="sm" onClick={handleAddEmplacement} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter emplacement
              </Button>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {emplacements.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="text-sm font-medium block">{emp.nom}</span>
                      {emp.description && (
                        <span className="text-xs text-muted-foreground block">{emp.description}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteEmplacement(emp.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Types de mouvements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Move3D className="h-5 w-5" />
              Types de mouvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Nom du type de mouvement..."
                  value={newTypeMouvement}
                  onChange={(e) => setNewTypeMouvement(e.target.value)}
                />
                <Input
                  placeholder="Description (optionnelle)..."
                  value={newTypeMouvementDesc}
                  onChange={(e) => setNewTypeMouvementDesc(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTypeMouvement()}
                />
              </div>
              <Button size="sm" onClick={handleAddTypeMouvement} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter type
              </Button>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {typesMouvement.map((type) => (
                  <div key={type.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="text-sm font-medium block">{type.nom}</span>
                      {type.description && (
                        <span className="text-xs text-muted-foreground block">{type.description}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTypeMouvement(type.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}