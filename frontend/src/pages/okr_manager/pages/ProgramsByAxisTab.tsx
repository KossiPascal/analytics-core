import { useEffect, useState } from "react";
import { OkrStrategicAxis, OkrProgram } from '../models';
import { strategicAxisService } from '../services';
import { Table, Column } from '@components/ui/Table/Table';
import { Loader } from "lucide-react";
// import { Loader } from '@components/ui/Loader/Loader';

export default function ProgramsByAxisTab() {
  const [axes, setAxes] = useState<OkrStrategicAxis[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    strategicAxisService.list()
      .then((res) => setAxes(res))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading strategic axes..." />;

  if (axes.length === 0) return <p>No strategic axes found.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h3>Programs by Strategic Axis</h3>
      {axes.map((axis) => (
        <div key={axis.id} style={{ marginBottom: 20 }}>
          <h4>{axis.name}</h4>
          {axis.programs && axis.programs.length > 0 ? (
            <Table<OkrProgram>
              columns={[
                { key: 'name', header: 'Program Name', searchable: true },
                { key: 'description', header: 'Description' },
              ]}
              data={axis.programs} keyExtractor={(item: OkrProgram, index: number) => { return '' }} />
          ) : (
            <p>No programs linked to this axis.</p>
          )}
        </div>
      ))}
    </div>
  );
}