import { useEffect, useMemo, useRef, useState } from "react";
import { Responsive } from "react-grid-layout";
import useMeasure from "react-use-measure";

import { FormInput } from "@/components/forms/FormInput/FormInput";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { Button } from "@/components/ui/Button/Button";
import { Card } from "@/components/ui/Card/Card";

import { useAuth } from "@/contexts/AuthContext";
import { tenantService } from "@/services/identity.service";
import { visualizationService } from "@/services/visualization.service";
import { chartService } from "@/services/dataset.service";

import { Visualization, VisualLayoutItem } from "@/models/visualization.model";
import { DatasetChart } from "@/models/dataset.models";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";

import { Tenant } from "@/models/identity.model";
import { FormTextarea } from "@/components/forms/FormTextarea/FormTextarea";

import { VisualizationChartRenderer, VisualizationViewModule } from "./VisualizationUtils";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const STATUS = ["draft", "submitted", "reviewed", "approved", "published", "archived"];
const TYPES = ["dashboard", "report"];

const getDefaultForm = (): Visualization => ({
  id: null,
  tenant_id: null,
  name: "",
  type: "dashboard",
  description: "",
  status: "draft",
  state: "pending",
  layout: [],
  filters: {},
  config: {},
  generated_data: {}
});

export default function VisualizationHome() {

  const { user } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant_id, setTenantId] = useState<number>();
  const [data, setData] = useState<Visualization[]>([]);
  const [charts, setCharts] = useState<DatasetChart[]>([]);
  const [chart_id, setChartId] = useState<number | undefined>(undefined);

  const [form, setForm] = useState<Visualization>(getDefaultForm());
  const [editing, setEditing] = useState<Visualization | null>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [ref, bounds] = useMeasure();
  const didLoad = useRef(false);

  // ---------------- INIT ----------------
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;

    tenantService.list().then(t => {
      setTenants(t || []);
      setTenantId(user?.tenant_id);
    });
  }, []);

  // ---------------- FETCH ----------------
  const fetchData = async () => {
    if (!tenant_id) return;
    setLoading(true);
    const res = await visualizationService.list(tenant_id);
    setData(res || []);
    setLoading(false);
  };

  const fetchCharts = async () => {
    if (!tenant_id) return;
    const res = await chartService.list(tenant_id);
    setCharts(res || []);
  };

  useEffect(() => {
    if (!tenant_id) return;
    fetchData();
    fetchCharts();
  }, [tenant_id]);

  // ---------------- ACTIONS ----------------
  const save = async () => {
    if (!form.name || !tenant_id) return;

    const payload = { ...form, tenant_id };

    if (editing && form.id) {
      await visualizationService.update(form.id, payload);
    } else {
      await visualizationService.create(payload);
    }

    setOpen(false);
    setEditing(null);
    setForm(getDefaultForm());
    fetchData();
  };

  const remove = async (id: number | null) => {
    if (!id) return;
    await visualizationService.remove(id);
    fetchData();
  };

  const create = () => {
    setEditing(null);
    setForm(getDefaultForm());
    setOpen(true);
  };

  const startEdit = (v: Visualization) => {
    setEditing(v);
    setForm({ ...v, layout: [...(v.layout || [])] });
    setOpen(true);
  };

  // ---------------- BUILDER ----------------
  const updateLayout = (layout: VisualLayoutItem[]) => {
    setForm(prev => ({
      ...prev,
      layout: layout.map(l => {
        const existing = prev.layout.find(p => p.i === l.i);
        return { ...l, chart_id: existing?.chart_id };
      }),
    }));
  };

  const updateChartBinding = (id: string, chart_id: number) => {
    setForm(prev => ({
      ...prev,
      layout: prev.layout.map(l =>
        l.i === id ? { ...l, chart_id } : l
      ),
    }));
  };

  const addBlock = () => {
    const newItem: VisualLayoutItem = {
      i: Date.now().toString(),
      x: 0,
      y: Infinity,
      w: 4,
      h: 4,
    };
    setForm(prev => ({ ...prev, layout: [...prev.layout, newItem] }));
  };

  const removeBlock = (id: string) => {
    setForm(prev => ({
      ...prev,
      layout: prev.layout.filter(l => l.i !== id),
    }));
  };

  const duplicateBlock = (item: VisualLayoutItem) => {
    const copy = { ...item, i: Date.now().toString(), y: Infinity };
    setForm(prev => ({ ...prev, layout: [...prev.layout, copy] }));
  };

  // ---------------- FILTER ----------------
  const filtered = useMemo(() => {
    return data.filter(v =>
      v.name.toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter ? v.status === statusFilter : true)
    );
  }, [data, search, statusFilter]);


  const workflowAction = async (id: number, action: string) => {
    await fetch(`/api/visualizations/${id}/${action}`, { method: "POST" });
    fetchData();
  };

  const openView = async (viz: Visualization, charts: DatasetChart[]) => {
    window.open(`/dashboard/${viz.id}`)
  }


  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📊 Visualizations</h1>
          <p className="text-gray-500 text-sm">Create, manage and explore dashboards</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            Toggle View
          </Button>
          <Button onClick={create} className="shadow-md">+ New Visualization</Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <FormInput
            placeholder="🔍 Search visualization..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="w-[200px]">
          <FormSelect
            value={statusFilter}
            options={[{ value: "", label: "All Status" }, ...STATUS.map(s => ({ value: s, label: s }))]}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* EMPTY */}
      {!loading && !filtered.length && (
        <div className="text-center py-20 text-gray-400">
          🚀 No visualization yet. Create your first one!
        </div>
      )}

      {/* GRID */}
      <div className={viewMode === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
        {filtered.map(v => (
          <Card key={v.id} className="hover:shadow-xl transition-all rounded-2xl">

            <div className="p-4 space-y-4">

              {/* TITLE */}
              {/* <div className="flex justify-between"> */}
              {/* <div>
                  <h2 className="font-semibold text-lg truncate">{v.name}</h2>
                  <p className="text-sm text-gray-500 line-clamp-2">{v.description}</p>
                </div> */}

              {/* BADGES */}
              {/* <div className="flex gap-2 flex-wrap">
                  <Badge>{v.type}</Badge>
                  <Badge>{v.status}</Badge>
                  <Badge>{v.state}</Badge>
                </div> */}

              {/* ACTIONS */}
              {/* <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => startEdit(v)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => remove(v.id)}>Delete</Button>
                <Button size="sm" onClick={() => window.open(`/dashboard/${v.id}`)}>Open</Button>

                <Button onClick={() => workflowAction(v.id!, "publish")}>Publish</Button>
                <Button onClick={() => workflowAction(v.id!, "archive")}>Archive</Button>
                <Button onClick={() => workflowAction(v.id!, "execute")}>Run</Button>
                <Button onClick={() => window.open(`/api/export/pdf/${v.id}`)}>Export PDF</Button>
                <Button onClick={() => window.open(`/api/export/excel/${v.id}`)}>Export Excel</Button>
              </div> */}
              {/* </div> */}

              {/* MINI PREVIEW */}
              {/* <div className="h-32 bg-gray-50 border rounded-xl overflow-hidden flex items-center justify-center text-gray-400 text-sm"> */}
              <VisualizationViewModule visualization={v} charts={charts} removeView={remove} editView={startEdit} openView={openView} />
              {/* </div> */}

              {/* ACTIONS */}
              {/* <div className="flex justify-between items-center">
                <Button size="sm" onClick={() => window.open(`/dashboard/${v.id}`)}>Open</Button>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(v)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => remove(v.id)}>Delete</Button>
                </div>
              </div> */}

            </div>
          </Card>
        ))}
      </div>

      {/* BUILDER MODAL */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xl" fullWidth>
        <DialogContent className="space-y-6">

          <h2 className="text-xl font-semibold">
            {editing ? "Edit Visualization" : "New Visualization"}
          </h2>

          {/* FORM */}
          <div className="grid md:grid-cols-2 gap-4">
            <FormInput
              label="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <FormSelect
              label="Type"
              value={form.type}
              options={TYPES.map(t => ({ value: t, label: t }))}
              onChange={v => setForm({ ...form, type: v })}
            />

            <FormSelect
              label="Chart Status"
              value={form.status}
              options={STATUS.map(s => ({ value: s, label: s }))}
              onChange={v => setForm({ ...form, status: v })}
            />
          </div>

          <FormInput
            label="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />

          {/* BUILDER */}
          <div>
            <h3 className="font-medium mb-2">Layout Builder</h3>

            <div ref={ref}>
              <Responsive
                width={bounds.width || 1200}
                layouts={{ lg: form.layout }}
                breakpoints={{ lg: 1200, md: 996, sm: 768 }}
                cols={{ lg: 12, md: 8, sm: 4 }}
                rowHeight={40}
                onLayoutChange={(layout) => updateLayout(layout as any)}
              >
                {(form.layout || []).map(item => (

                  // <div key={item.i} className="bg-white border rounded-xl shadow-sm p-2 group">
                  <div key={item.i}
                  // className="relative h-full flex flex-col bg-white border rounded-xl shadow-sm hover:shadow-md transition overflow-hidden group"
                  >

                    {/* HEADER */}
                    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-gray-50">

                      {/* SELECT */}
                      <div className="flex-1 min-w-0">
                        <FormSelect
                          options={charts.map(c => ({ value: c.id, label: c.name }))}
                          value={item.chart_id}
                          onChange={(v) => updateChartBinding(item.i, Number(v))}
                        />
                      </div>

                      {/* ACTIONS */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <Button size="sm" variant="ghost" onClick={() => duplicateBlock(item)}>⧉</Button>
                        <Button size="sm" variant="ghost" onClick={() => removeBlock(item.i)}>✕</Button>
                      </div>

                    </div>

                    {/* CONTENT */}
                    {/* <div className="flex-1 min-h-0 p-2">
                      <div className="w-full h-full rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden"> */}
                    <VisualizationChartRenderer chart={charts.find(c => c.id === item.chart_id)} />
                    {/* </div>
                    </div> */}

                  </div>
                ))}
              </Responsive>
            </div>

            {/* JSON CONFIG */}
            <FormTextarea
              className="w-full border rounded p-2 font-mono text-xs"
              rows={5}
              value={JSON.stringify(form.config, null, 2)}
              onChange={e => {
                try {
                  setForm({ ...form, config: JSON.parse(e.target.value) });
                } catch { }
              }}
            />

            <Button onClick={addBlock} className="mt-3 w-full border-dashed">
              + Add Chart Block
            </Button>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.name}>Save</Button>
          </div>

        </DialogContent>
      </Dialog>

    </div >
  );
}



