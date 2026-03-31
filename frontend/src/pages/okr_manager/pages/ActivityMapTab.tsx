import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { OkrActivityMap } from "../models";
import { activityService } from "../services";

export const ActivityMapTab = () => {
  const [mapData, setMapData] = useState<OkrActivityMap[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // activityService.getMap().then((res) => {
    //   setMapData(res);
    //   setLoading(false);
    // });
  }, []);

  if (loading) return <p>Loading Activity Map...</p>;
  if (!mapData.length) return <p>No activity map found.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h3>
        <Share2 /> Activity Map
      </h3>
      <div style={{
        border: "1px dashed #ccc",
        padding: 20,
        maxHeight: 500,
        overflowY: "auto",
      }}>
        {mapData.map((s) => (
          <div key={s.strategy_id} style={{ marginBottom: 20 }}>
            <strong>Strategy:</strong> {s.strategy_name}
            {s.project_id && <div>Project: {s.project_name}</div>}
            {s.activities.map((a) => (
              <div key={a.id} style={{ marginLeft: 20 }}>
                Activity: {a.name} ({a.status}) - Progress: {a.progress || 0}%
                {a.tasks?.map((t) => (
                  <div key={t.id} style={{ marginLeft: 20 }}>
                    Task: {t.name} ({t.status}) - Progress: {t.progress || 0}%
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};