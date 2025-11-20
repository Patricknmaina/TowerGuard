import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import DataState from "../../components/shared/DataState";
import ScoreBadge from "../../components/shared/ScoreBadge";
import { createSite } from "../../api/client";
import type { SiteCreatePayload } from "../../api/types";
import { useSites } from "../../hooks/useSites";

const initialForm = {
  name: "",
  description: "",
  geometry: "",
  country: "Kenya",
};

const SitesPage = () => {
  const queryClient = useQueryClient();
  const { data: sites, isLoading, isError, error } = useSites();
  const [formState, setFormState] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const createSiteMutation = useMutation({
    mutationFn: (payload: SiteCreatePayload) => createSite(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      setFormState(initialForm);
      setIsFormOpen(false);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const geometry = JSON.parse(formState.geometry);
      createSiteMutation.mutate({
        name: formState.name,
        description: formState.description,
        geometry,
        country: formState.country,
      });
    } catch (err) {
      alert("Invalid GeoJSON: " + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-brand-gray">Sites</h2>
          <p className="text-sm text-slate-500">Registered restoration areas linked to water towers.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen((prev) => !prev)}
          className="inline-flex items-center rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          {isFormOpen ? "Close" : "Add Site"}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-brand-gray">Name</label>
            <input
              type="text"
              required
              className="rounded-lg border border-slate-200 px-3 py-2"
              value={formState.name}
              onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-brand-gray">Description</label>
            <textarea
              className="rounded-lg border border-slate-200 px-3 py-2"
              value={formState.description}
              onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-brand-gray">GeoJSON Geometry</label>
            <textarea
              required
              className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
              rows={6}
              placeholder='{"type":"Point","coordinates":[37.35,-0.52]}'
              value={formState.geometry}
              onChange={(e) => setFormState((prev) => ({ ...prev, geometry: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-brand-gray">Country</label>
            <input
              type="text"
              className="rounded-lg border border-slate-200 px-3 py-2"
              value={formState.country}
              onChange={(e) => setFormState((prev) => ({ ...prev, country: e.target.value }))}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
            disabled={createSiteMutation.isPending}
          >
            {createSiteMutation.isPending ? "Submitting…" : "Save Site"}
          </button>
          {createSiteMutation.isError && (
            <p className="text-sm text-rose-600">{(createSiteMutation.error as Error).message}</p>
          )}
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Country</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center">
                  <DataState state="loading" />
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center">
                  <DataState state="error" message={(error as Error).message} />
                </td>
              </tr>
            ) : sites && sites.length ? (
              sites.map((site) => (
                <tr key={site.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div className="font-medium text-brand-gray">{site.name}</div>
                    <div className="text-xs text-slate-500">{site.description}</div>
                  </td>
                  <td className="px-4 py-4">{site.country}</td>
                  <td className="px-4 py-4">
                    <ScoreBadge score={null} />
                  </td>
                  <td className="px-4 py-4 text-slate-500">{site.created_at ? new Date(site.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center">
                  <DataState state="empty" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SitesPage;
