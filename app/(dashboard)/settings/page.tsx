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
import { ArrowRight, Workflow } from "lucide-react" // Ajoutez Workflow aux imports
import { useRouter } from "next/navigation" // En haut du fichier

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
  const router = useRouter()

  // États pour l'ajout
  const [newCategorie, setNewCategorie] = useState("")
  const [newEmplacement, setNewEmplacement] = useState("")
  const [newEmplacementDesc, setNewEmplacementDesc] = useState("")
  const [newTypeMouvement, setNewTypeMouvement] = useState("")
  const [newTypeMouvementDesc, setNewTypeMouvementDesc] = useState("")

  // États pour l'édition
  const [editingCategorie, setEditingCategorie] = useState<{id: string, nom: string} | null>(null)
  const [editingEmplacement, setEditingEmplacement] = useState<{id: string, nom: string, description: string | null} | null>(null)
  const [editingTypeMouvement, setEditingTypeMouvement] = useState<{id: string, nom: string, description: string | null} | null>(null)
  

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

  // --- CATÉGORIES ---
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

  const startEditCategorie = (categorie: Categorie) => {
    setEditingCategorie({ id: categorie.id, nom: categorie.nom })
  }

  const saveEditCategorie = async () => {
    if (!editingCategorie || !editingCategorie.nom.trim()) return

    try {
      const { error } = await supabase
        .from('categories')
        .update({ nom: editingCategorie.nom.trim() })
        .eq('id', editingCategorie.id)

      if (error) throw error

      toast.success("Catégorie mise à jour")
      setEditingCategorie(null)
      fetchSettings() // Recharger
    } catch (error: any) {
      console.error('Erreur mise à jour catégorie:', error)
      toast.error("Erreur lors de la mise à jour de la catégorie")
    }
  }

  const cancelEditCategorie = () => {
    setEditingCategorie(null)
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

  // --- EMPLACEMENTS ---
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

  const startEditEmplacement = (emplacement: Emplacement) => {
    setEditingEmplacement({ 
      id: emplacement.id, 
      nom: emplacement.nom,
      description: emplacement.description || ""
    })
  }

  const saveEditEmplacement = async () => {
    if (!editingEmplacement || !editingEmplacement.nom.trim()) return

    try {
      const { error } = await supabase
        .from('emplacements')
        .update({ 
          nom: editingEmplacement.nom.trim(),
          description: editingEmplacement.description || null
        })
        .eq('id', editingEmplacement.id)

      if (error) throw error

      toast.success("Emplacement mis à jour")
      setEditingEmplacement(null)
      fetchSettings() // Recharger
    } catch (error: any) {
      console.error('Erreur mise à jour emplacement:', error)
      toast.error("Erreur lors de la mise à jour de l'emplacement")
    }
  }

  const cancelEditEmplacement = () => {
    setEditingEmplacement(null)
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

  // --- TYPES DE MOUVEMENT ---
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

  const startEditTypeMouvement = (type: TypeMouvement) => {
    setEditingTypeMouvement({ 
      id: type.id, 
      nom: type.nom,
      description: type.description || ""
    })
  }

  const saveEditTypeMouvement = async () => {
    if (!editingTypeMouvement || !editingTypeMouvement.nom.trim()) return

    try {
      const { error } = await supabase
        .from('types_mouvement')
        .update({ 
          nom: editingTypeMouvement.nom.trim(),
          description: editingTypeMouvement.description || null
        })
        .eq('id', editingTypeMouvement.id)

      if (error) throw error

      toast.success("Type de mouvement mis à jour")
      setEditingTypeMouvement(null)
      fetchSettings() // Recharger
    } catch (error: any) {
      console.error('Erreur mise à jour type mouvement:', error)
      toast.error("Erreur lors de la mise à jour du type de mouvement")
    }
  }

  const cancelEditTypeMouvement = () => {
    setEditingTypeMouvement(null)
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
              {/* Formulaire d'ajout */}
              <div className="space-y-2">
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
              </div>
              
              {/* Liste des catégories */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.map((cat) => (
                  editingCategorie?.id === cat.id ? (
                    // Mode édition
                    <div key={cat.id} className="p-2 border rounded flex items-center gap-2">
                      <Input
                        value={editingCategorie.nom}
                        onChange={(e) => setEditingCategorie({...editingCategorie, nom: e.target.value})}
                        onKeyPress={(e) => e.key === 'Enter' && saveEditCategorie()}
                        className="flex-1"
                        autoFocus
                      />
                      <Button size="sm" onClick={saveEditCategorie} variant="outline">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={cancelEditCategorie} variant="outline">
                        <Edit3 className="h-4 w-4 rotate-45" />
                      </Button>
                    </div>
                  ) : (
                    // Mode lecture
                    <div key={cat.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{cat.nom}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditCategorie(cat)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCategorie(cat.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
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
              {/* Formulaire d'ajout */}
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
                <Button size="sm" onClick={handleAddEmplacement} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter emplacement
                </Button>
              </div>
              
              {/* Liste des emplacements */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {emplacements.map((emp) => (
                  editingEmplacement?.id === emp.id ? (
                    // Mode édition
                    <div key={emp.id} className="p-2 border rounded space-y-2">
                      <Input
                        value={editingEmplacement.nom}
                        onChange={(e) => setEditingEmplacement({...editingEmplacement, nom: e.target.value})}
                        className="w-full"
                        autoFocus
                      />
                      <Input
                        value={editingEmplacement.description || ""}
                        onChange={(e) => setEditingEmplacement({...editingEmplacement, description: e.target.value})}
                        placeholder="Description..."
                        className="w-full"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={saveEditEmplacement} variant="outline">
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={cancelEditEmplacement} variant="outline">
                          <Edit3 className="h-4 w-4 rotate-45" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Mode lecture
                    <div key={emp.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="text-sm font-medium block">{emp.nom}</span>
                        {emp.description && (
                          <span className="text-xs text-muted-foreground block">{emp.description}</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditEmplacement(emp)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteEmplacement(emp.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
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
              {/* Formulaire d'ajout */}
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
                <Button size="sm" onClick={handleAddTypeMouvement} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter type
                </Button>
              </div>
              
              {/* Liste des types de mouvements */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {typesMouvement.map((type) => (
                  editingTypeMouvement?.id === type.id ? (
                    // Mode édition
                    <div key={type.id} className="p-2 border rounded space-y-2">
                      <Input
                        value={editingTypeMouvement.nom}
                        onChange={(e) => setEditingTypeMouvement({...editingTypeMouvement, nom: e.target.value})}
                        className="w-full"
                        autoFocus
                      />
                      <Input
                        value={editingTypeMouvement.description || ""}
                        onChange={(e) => setEditingTypeMouvement({...editingTypeMouvement, description: e.target.value})}
                        placeholder="Description..."
                        className="w-full"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={saveEditTypeMouvement} variant="outline">
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={cancelEditTypeMouvement} variant="outline">
                          <Edit3 className="h-4 w-4 rotate-45" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Mode lecture
                    <div key={type.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="text-sm font-medium block">{type.nom}</span>
                        {type.description && (
                          <span className="text-xs text-muted-foreground block">{type.description}</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditTypeMouvement(type)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTypeMouvement(type.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
					<Card className="hover:shadow-lg transition-shadow">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-lg font-semibold">
						Scénarios de mouvements
						</CardTitle>
						<Workflow className="h-5 w-5 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
						Gérer les scénarios de mouvements de stock pour automatiser les flux
						</p>
						<Button 
						variant="outline" 
						className="w-full"
						onClick={() => router.push('/settings/scenarios')}
						>
						<ArrowRight className="mr-2 h-4 w-4" />
						Configurer les scénarios
						</Button>
					</CardContent>
					</Card>
      </div>
    </div>
  )
}