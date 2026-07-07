"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Location } from "@/lib/types";
import { LocationForm } from "./location-form";

export function LocationsClient() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/locations");
      const data = await res.json();
      setLocations(data.data || []);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this location?")) return;
    try {
      await fetch(`/api/locations/${id}`, { method: "DELETE" });
      setLocations(locations.filter((l) => l.id !== id));
    } catch (error) {
      console.error("Failed to delete location:", error);
    }
  };

  const handleSave = async () => {
    setShowForm(false);
    setEditingLocation(null);
    await fetchLocations();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Locations</CardTitle>
          <Button
            onClick={() => {
              setEditingLocation(null);
              setShowForm(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        </CardHeader>
      </Card>

      {showForm && (
        <LocationForm
          location={editingLocation}
          onClose={() => {
            setShowForm(false);
            setEditingLocation(null);
          }}
          onSave={handleSave}
        />
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="py-8 text-center text-slate-500">Loading...</div>
          ) : locations.length === 0 ? (
            <div className="py-8 text-center text-slate-500">No locations yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 font-medium">Capacity</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location) => (
                    <tr
                      key={location.id}
                      className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30"
                    >
                      <td className="py-3 pr-4 font-medium text-slate-200">{location.name}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{location.type}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-slate-400">{location.capacity.toLocaleString()}</td>
                      <td className="py-3 flex gap-2">
                        <button
                          onClick={() => {
                            setEditingLocation(location);
                            setShowForm(true);
                          }}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(location.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
