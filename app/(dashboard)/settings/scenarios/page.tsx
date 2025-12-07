// app/(dashboard)/settings/scenarios/page.tsx
"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Plus, 
  Search, 
  ArrowLeft,
  Pencil,
  Trash2,
  ArrowRight,
  Save
} from "lucide-react"
import { useRouter } from "next/navigation"

type Scenario = {
  id: string
  origine_type: string
  emplacement_origine: string
  action_origine: string
  type_mouvement: string
  action_destination: string
  emplacement_destination: string
  personne_type: string
  resume_action: string
  created_at: string
}

export default function ScenariosPage() {
  const router = useRouter()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [emplacements, setEmplacements] = useState<{id: string, nom: string}[]>([])
  const [typesMouvement, setTypesMouvement] = useState<{id: string, nom: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null)
  
  const [formData, setFormData] = useState({
    origine_type: "",
    emplacement_origine: "",
    action_origine: "",
    type_mouvement: "",
    action_destination: "",
    emplacement_destination: "",
    personne_type: "",
    resume_action: "",
  })

  useEffect(() => {
    fetchScenarios()
    fetchEmplacements()
    fetchTypesMouvement()
  }, [])

  async function fetchScenarios() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('scenarios_mouvement')
        .select('*')
        .order('emplacement_origine')
        .order('type_mouvement')
      if (error) throw error
      setScenarios(data || [])
    } catch (error) {
      console.error('Error fetching scenarios:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchEmplacements() {
    try {
      const { data } = await supabase
        .from('emplacements')
        .select('id, nom')
        .order('nom')
      setEmplacements(data || [])
    } catch (error) {
      console.error('Error fetching emplacements:', error)
    }
  }

  async function fetchTypesMouvement() {
    try {
      const { data } = await supabase
        .from('types_mouvement')
        .select('id, nom')
        .order('nom')
      setTypesMouvement(data || [])
    } catch (error) {
      console.error('Error fetching types:', error)
    }
  }

  function openAddDialog() {
    setEditingScenario(null)
    setFormData({
      origine_type: "",
      emplacement_origine: "",
      action_origine: "",
      type_mouvement: "",
      action_destination: "",
      emplacement_destination: "",
      personne_type: "",
      resume_action: "",
    })
    setShowDialog(true)
  }

  function openEditDialog(scenario: Scenario) {
    setEditingScenario(scenario)
    setFormData({
      origine_type: scenario.origine_type || "",
      emplacement_origine: scenario.emplacement_origine || "",
      action_origine: scenario.action_origine || "",
      type_mouvement: scenario.type_mouvement || "",
      action_destination: scenario.action_destination || "",
      emplacement_destination: scenario.emplacement_destination || "",
      personne_type: scenario.personne_type || "",
      resume_action: scenario.resume_action || "",
    })
    setShowDialog(true)
  }

  async function saveScenario() {
    if (!formData.emplacement_origine || !formData.type_mouvement) {
      alert("Veuillez remplir au minimum l'emplacement d'origine et le type de mouvement")
      return
    }

    try {
      if (editingScenario) {
        // Mise à jour
        const { error } = await supabase
          .from('scenarios_mouvement')
          .update(formData)
          .eq('id', editingScenario.id)
        if (error) throw error
        alert("Scénario mis à jour avec succès")
      } else {
        // Création
        const { error } = await supabase
          .from('scenarios_mouvement')
          .insert([formData])
        if (error) throw error
        alert("Scénario créé avec succès")
      }
      setShowDialog(false)
      fetchScenarios()
    } catch (error: any) {
      console.error('Error saving scenario:', error)
      alert("Erreur: " + error.message)
    }
  }

  async function deleteScenario(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce scénario ?")) return

    try {
      const { error } = await supabase
        .from('scenarios_mouvement')
        .delete()
        .eq('id', id)
      if (error) throw error
      alert("Scénario supprimé avec succès")
      fetchScenarios()
    } catch (error: any) {
      console.error('Error deleting scenario:', error)
      alert("Erreur: " + error.message)
    }
  }

  const filteredScenarios = scenarios.filter(s => 
    s.emplacement_origine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.type_mouvement?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.emplacement_destination?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Grouper par origine
  const groupedScenarios = filteredScenarios.reduce((acc, scenario) => {
    const origine = scenario.emplacement_origine || 'Sans origine'
    if (!acc[origine]) {
      acc[origine] = []
    }
    acc[origine].push(scenario)
    return acc
  }, {} as Record<string, Scenario[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/settings')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gestion des Scénarios</h1>
            <p className="text-muted-foreground mt-1">
              Configurer les scénarios de mouvements de stock
            </p>
          </div>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau scénario
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un scénario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.entries(groupedScenarios).map(([origine, scenariosGroup]) => (
          <Card key={origine}>
            <CardHeader>
              <CardTitle className="text-xl">
                {origine}
                <Badge variant="secondary" className="ml-3">
                  {scenariosGroup.length} scénario{scenariosGroup.length > 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scenariosGroup.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          {scenario.type_mouvement}
                        </Badge>
                        {scenario.origine_type && (
                          <span className="text-xs text-muted-foreground">
                            Type: {scenario.origine_type}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded">
                          <span className="font-semibold text-green-700">
                            {scenario.emplacement_origine}
                          </span>
                          {scenario.action_origine && (
                            <span className="text-xs text-green-600">
                              ({scenario.action_origine})
                            </span>
                          )}
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded">
                          <span className="font-semibold text-blue-700">
                            {scenario.emplacement_destination}
                          </span>
                          {scenario.action_destination && (
                            <span className="text-xs text-blue-600">
                              ({scenario.action_destination})
                            </span>
                          )}
                        </div>
                      </div>

                      {scenario.personne_type && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          👤 Personne: {scenario.personne_type}
                        </div>
                      )}

                      {scenario.resume_action && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          📝 {scenario.resume_action}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(scenario)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteScenario(scenario.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingScenario ? 'Modifier le scénario' : 'Nouveau scénario'}
            </DialogTitle>
            <DialogDescription>
              Configurez les paramètres du scénario de mouvement
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Emplacement d&apos;origine *</Label>
                <Select
                  value={formData.emplacement_origine}
                  onValueChange={(value) => setFormData({...formData, emplacement_origine: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {emplacements.map((emp) => (
                      <SelectItem key={emp.id} value={emp.nom}>
                        {emp.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type de mouvement *</Label>
                <Select
                  value={formData.type_mouvement}
                  onValueChange={(value) => setFormData({...formData, type_mouvement: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {typesMouvement.map((type) => (
                      <SelectItem key={type.id} value={type.nom}>
                        {type.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Action origine</Label>
                <Input
                  value={formData.action_origine}
                  onChange={(e) => setFormData({...formData, action_origine: e.target.value})}
                  placeholder="ex: out stock, Count"
                />
              </div>

              <div>
                <Label>Type origine</Label>
                <Input
                  value={formData.origine_type}
                  onChange={(e) => setFormData({...formData, origine_type: e.target.value})}
                  placeholder="ex: Solutions 30, Technicien"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Emplacement de destination</Label>
                <Select
                  value={formData.emplacement_destination}
                  onValueChange={(value) => setFormData({...formData, emplacement_destination: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {emplacements.map((emp) => (
                      <SelectItem key={emp.id} value={emp.nom}>
                        {emp.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Action destination</Label>
                <Input
                  value={formData.action_destination}
                  onChange={(e) => setFormData({...formData, action_destination: e.target.value})}
                  placeholder="ex: in stock, Count"
                />
              </div>
            </div>

            <div>
              <Label>Type de personne</Label>
              <Input
                value={formData.personne_type}
                onChange={(e) => setFormData({...formData, personne_type: e.target.value})}
                placeholder="ex: Technicien, Client, Solutions 30"
              />
            </div>

            <div>
              <Label>Résumé de l&apos;action</Label>
              <Input
                value={formData.resume_action}
                onChange={(e) => setFormData({...formData, resume_action: e.target.value})}
                placeholder="ex: mouvements de quantité, Comptabilisation des quantités"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveScenario}>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}