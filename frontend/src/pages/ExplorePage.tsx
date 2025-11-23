import { useNavigate } from "react-router-dom";
import WaterTowersMap from "../components/map/WaterTowersMap";
import { useWaterTowers } from "../hooks/useWaterTowers";

export default function ExplorePage() {
  const navigate = useNavigate();
  const { data: towers = [], isLoading, error } = useWaterTowers();

  return (
    <div className="w-full h-[calc(100vh-96px)] bg-slate-950">
      <WaterTowersMap
        towers={towers}
        loading={isLoading}
        error={error}
        onTowerClick={(tower) => {
          navigate(`/analytics?tower_id=${tower.id}`);
        }}
      />
    </div>
  );
}
