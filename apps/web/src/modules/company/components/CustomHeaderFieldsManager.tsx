"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical, AlertCircle } from "lucide-react";
import { CustomHeaderField } from "../company.schema";

const MAX_CUSTOM_FIELDS = 4;

interface CustomHeaderFieldsManagerProps {
  fields: CustomHeaderField[];
  onChange: (fields: CustomHeaderField[]) => void;
}

export function CustomHeaderFieldsManager({ fields, onChange }: CustomHeaderFieldsManagerProps) {
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  const addField = () => {
    if (!newFieldLabel.trim() || !newFieldValue.trim()) return;
    if (fields.length >= MAX_CUSTOM_FIELDS) return;

    const newField: CustomHeaderField = {
      id: Date.now().toString(),
      label: newFieldLabel.trim(),
      value: newFieldValue.trim(),
      enabled: true,
    };

    onChange([...fields, newField]);
    setNewFieldLabel("");
    setNewFieldValue("");
  };

  const updateField = (id: string, updates: Partial<CustomHeaderField>) => {
    onChange(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const deleteField = (id: string) => {
    onChange(fields.filter((field) => field.id !== id));
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Campos Personalizados en Factura</h3>
            <span className="text-sm text-muted-foreground">
              {fields.length}/{MAX_CUSTOM_FIELDS} campos
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Agrega campos adicionales que aparecerán en el encabezado de tus facturas (ej: Terminal, Sucursal, etc.)
          </p>
          {fields.length >= MAX_CUSTOM_FIELDS && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>Has alcanzado el límite de {MAX_CUSTOM_FIELDS} campos personalizados.</p>
            </div>
          )}
        </div>

        {/* Existing Fields */}
        {fields.length > 0 && (
          <div className="space-y-3">
            {fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Etiqueta (ej: Terminal)"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    maxLength={50}
                  />
                  <Input
                    placeholder="Valor (ej: 001)"
                    value={field.value}
                    onChange={(e) => updateField(field.id, { value: e.target.value })}
                    maxLength={200}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={field.enabled}
                    onCheckedChange={(enabled) => updateField(field.id, { enabled })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteField(field.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Field */}
        <div className="pt-4 border-t">
          <div className="flex gap-3">
            <Input
              placeholder="Etiqueta (ej: Terminal)"
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              maxLength={50}
              className="flex-1"
            />
            <Input
              placeholder="Valor (ej: 001)"
              value={newFieldValue}
              onChange={(e) => setNewFieldValue(e.target.value)}
              maxLength={200}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addField}
              disabled={!newFieldLabel.trim() || !newFieldValue.trim() || fields.length >= MAX_CUSTOM_FIELDS}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        </div>

        {fields.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No hay campos personalizados.</p>
            <p className="text-xs mt-1">Agrega hasta {MAX_CUSTOM_FIELDS} campos para mostrar información adicional en tus facturas.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
