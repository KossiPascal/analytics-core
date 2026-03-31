import { useEffect, useState } from "react";
import { OkrProgram, OkrProject } from '../models';
import { programService } from '../services';
import { Table, Column } from '@components/ui/Table/Table';
import { Loader } from "lucide-react";
// import { Loader } from '@components/ui/Loader/Loader';

export default function ProgramsTab() {
  const [programs, setPrograms] = useState<OkrProgram[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    programService.list()
      .then((res) => setPrograms(res))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading programs..." />;

  if (programs.length === 0) return <p>No programs found.</p>;

  const columns: Column<OkrProgram>[] = [
    { key: 'name', header: 'Program Name', searchable: true, sortable: true },
    { key: 'team_id', header: 'Team', render: (p) => p.team?.name || 'N/A' },
    { key: 'strategic_axis_id', header: 'Strategic Axis', render: (p) => p.strategic_axis?.name || 'N/A' },
    { key: 'status', header: 'Status', render: (p) => p.status },
    { key: 'projects', header: 'Projects', render: (p) => p.projects?.length || 0 },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h3>All Programs</h3>
      <Table<OkrProgram> columns={columns} data={programs} keyExtractor={(item: OkrProgram, index: number) => { return "" }} />
    </div>
  );
}