interface LayersPanelProps {
  onClose: () => void;
  layerState: {
    boundary: boolean;
    bubbles: boolean;
    satellite: boolean;
    ndvi: boolean;
    rainfall: boolean;
  };
  onToggle: (key: "boundary" | "bubbles" | "satellite" | "ndvi" | "rainfall") => void;
}

const LayersPanel = ({ onClose, layerState, onToggle }: LayersPanelProps) => {
  const layers = [
    {
      key: "boundary" as const,
      name: "Water Tower Boundary",
      description: "Show outline/fill of the selected tower.",
    },
    {
      key: "bubbles" as const,
      name: "Monitoring Sites/Bubbles",
      description: "Show bubble markers for monitoring points.",
    },
    {
      key: "satellite" as const,
      name: "Satellite Basemap",
      description: "Switch to satellite imagery basemap.",
    },
    {
      key: "ndvi" as const,
      name: "NDVI Layer",
      description: "Visualize vegetation index (placeholder).",
    },
    {
      key: "rainfall" as const,
      name: "Rainfall Layer",
      description: "Show rainfall overlay (placeholder).",
    },
  ];

  return (
    <div className="absolute inset-y-0 left-0 z-20 flex h-full w-full max-w-full flex-col overflow-y-auto rounded-3xl bg-slate-950/95 p-4 text-white shadow-2xl lg:w-[calc(100%-16px)]">
      <div className="mb-3 flex items-center justify-between text-sm text-slate-200">
        <div className="flex items-center gap-2 text-base font-semibold">
          <span>Explore Layers</span>
        </div>
        <button onClick={onClose} className="rounded-full bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700">
          Close
        </button>
      </div>
      <div className="space-y-3">
        {layers.map((layer) => (
          <div
            key={layer.key}
            className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-white">{layer.name}</p>
              <p className="text-xs text-slate-400">
                {layer.description} {/* TODO: Wire NDVI/Rainfall overlays to real map data. */}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggle(layer.key)}
              className={`flex h-6 w-12 items-center rounded-full border px-1 transition ${
                layerState[layer.key]
                  ? "justify-end border-emerald-400 bg-emerald-500/30"
                  : "justify-start border-slate-600 bg-slate-800"
              }`}
            >
              <span className="h-4 w-4 rounded-full bg-white shadow transition" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayersPanel;
