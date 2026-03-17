import { useMemo, useState } from "react";
import { AGGRAGATE_TYPES, ChartDimension, ChartFormProps, ChartMetric, ChartPivot, ChartStructure, ChartStructureDimension, ChartStructureFilter, ChartStructureMetric, ChartStructureOrderBy, DatasetChart, DatasetField, FULL_OPERATORS, getInputTypeForField, getOperatorsForField, LOGICAL_OPERATORS, NO_VALUE_OPERATORS, QueryFilter, QueryFilterGroup, QueryFilterNode, SqlAggType, SqlDataType, SqlFieldType, SqlOperators } from "@/models/dataset.models";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { FormTextarea } from "@/components/forms/FormTextarea/FormTextarea";
import { FormInput } from "@/components/forms/FormInput/FormInput";
import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";
import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";
import { FormMultiSelect } from "@/components/forms/FormSelect/FormMultiSelect";
import { MoreVertical, Trash2, Pencil } from "lucide-react";
import { ChartFilterBuilder } from "./ChartFilterBuilder";
import { data } from "react-router-dom";

interface DragItem {
  type: "dimension" | "metric";
  field_name: string;
  field_id: number;
  alias: string;
}

const DraggableItem = ({ field_name, field_id, type, alias }: DragItem) => {
  const [, drag] = useDrag(() => ({ type, item: { type, field_id, alias } }));
  return (
    <div ref={drag as any} className="px-2 py-1 mb-1 bg-white border rounded shadow-sm cursor-move hover:bg-gray-100">
      {field_name}
    </div>
  );
};

interface ZoneProps {
  title: string;
  items: string[];
  accept: ("dimension" | "metric")[];
  onDrop: (item: DragItem) => void;
  onRemove?: (item: string) => void;
}

const DragDropZone = ({ title, items, accept, onDrop, onRemove }: ZoneProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept,
    drop: (item: DragItem) => onDrop(item),
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }));

  return (
    // <div ref={drop as any} className="border rounded p-3 bg-gray-50 min-h-[120px]">
    <div ref={drop as any} className={`border rounded p-3 min-h-[120px] ${isOver ? "bg-blue-50 border-blue-400" : "bg-gray-50"}`} >
      <div className="font-semibold mb-2">{title}</div>

      {items.length === 0 && (
        <div className="text-gray-400 text-sm">Déposez ici</div>
      )}

      {items.map((i) => (
        <div key={i} className="flex justify-between items-center bg-white border rounded px-2 py-1 mb-1">
          {i}
          {onRemove && (
            <button className="text-red-500 text-xs" onClick={() => onRemove(i)} >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

interface FilterNodeBuilderProps {
  index: number
  node: ChartStructureFilter;
  fields: DimMetricFieldMap[];
  onChange: (node: ChartStructureFilter) => void;
  onRemove?: () => void;
  error: string | undefined;
}

interface InValuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  values: string[];
  onChange: (values: string[]) => void;
  inputType: string;
}

interface ChartFieldProps {
  type?: "dimension" | "metric" | "filter";
  field_id: number,
  field_type?: SqlFieldType,
  alias?: string,
  agg?: SqlAggType,
  operator?: SqlOperators,
  value?: any,
  value2?: any,
  useSqlInClause?: boolean,
  index?: number
}

const InValuesModal = ({ isOpen, onClose, values, onChange, inputType }: InValuesModalProps) => {

  const [tempValue, setTempValue] = useState("");

  const addValue = () => {
    if (!tempValue.trim()) return;
    onChange([...values, tempValue.trim()]);
    setTempValue("");
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <Modal title="Add IN values" isOpen={true} onClose={onClose} size="sm">
      <div style={{ "height": "30px" }} className="flex gap-2">
        <FormInput
          type={inputType} value={tempValue}
          onChange={(e) => setTempValue(e.target.value)} />
        <Button
          size="sm" style={{ "padding": "0px 5px" }}
          onClick={addValue}>Add</Button>
      </div>

      <br />

      <table>
        {values.map((v, i) => (
          <tr key={i}>
            <th>{v}</th>
            <th><Button size="sm" style={{ "padding": "1px 5px" }} onClick={() => removeValue(i)} variant="danger">✕</Button></th>
          </tr>
        ))}
      </table>

      <br />

      <div className="flex justify-end">
        <Button size="sm" style={{ "padding": "5px 10px" }} variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

const FilterNodeBuilder = ({ index, node, fields, onChange, onRemove }: FilterNodeBuilderProps) => {
  const [isInModalOpen, setIsInModalOpen] = useState(false);

  const field = fields.find(f => f.field_id === node.field_id);

  const operators = getOperatorsForField(field?.data_type);
  const inputType = getInputTypeForField(field?.data_type);

  const renderValueInput = () => {

    if (NO_VALUE_OPERATORS.includes(node.operator) || node.field_id <= 0) return null;

    if (node.operator === "BETWEEN" || node.operator === "NOT BETWEEN") {
      return (
        <>
          <FormInput type={inputType} value={node.value}
            onChange={(e) => onChange({ ...node, value: e.target.value })} />

          <FormInput type={inputType} value={node.value2 ?? ""}
            onChange={(e) => onChange({ ...node, value2: e.target.value })} />
        </>
      );
    }

    if (node.operator === "IN" || node.operator === "NOT IN") {
      const values = Array.isArray(node.value) ? node.value : [];

      return (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsInModalOpen(true)}
          >
            Edit values ({values.length})
          </Button>

          <InValuesModal
            isOpen={isInModalOpen}
            onClose={() => setIsInModalOpen(false)}
            values={values}
            inputType={inputType}
            onChange={(newValues) => onChange({ ...node, value: newValues })}
          />

          <FormSwitch
            label={`useSqlInClause`}
            checked={node.useSqlInClause ?? false}
            onChange={(e) => onChange({ ...node, useSqlInClause: e.target.checked })}
          />
        </>
      );
    }

    switch (inputType) {
      case "select":
        return (
          <>
            {field?.data_type === "boolean" ? (
              <FormSelect
                // label="Value"
                value={node.value}
                options={[
                  { value: "true", label: "TRUE" },
                  { value: "false", label: "FALSE" },
                ]}
                onChange={(v) => onChange({ ...node, value: v })}
              />
            ) : (<>Erreur</>)}
          </>
        );

      case "textarea":
        return (
          <FormTextarea
            // label="Value"
            value={node.value}
            onChange={(e) => onChange({ ...node, value: e.target.value })}
          />
        );

      default:
        return (
          <FormInput
            // label="Value"
            type={inputType}
            value={node.value}
            onChange={(e) => onChange({ ...node, value: e.target.value })}
          />
        );
    }
  };

  return (
    <tr>
      <th>
        <span className="text-xs text-gray-500 w-6">{index}</span>
      </th>
      <td>
        <FormSelect
          value={node.field_id}
          options={fields.map(f => ({ value: f.field_id, label: f.field_name }))}
          // onChange={(v) => onChange({ ...node, field_id: v })}
          onChange={(v) => {
            const newField = fields.find(f => f.field_id === v);
            const newOperators = getOperatorsForField(newField?.data_type);

            onChange({
              ...node,
              field_id: v,
              operator: newOperators[0] ?? "=",
              value: "",
              value2: undefined
            });
          }}
        />
      </td>

      <td>
        <FormSelect
          // label="Operator"
          value={node.operator}
          options={operators.map(o => ({ value: o, label: o }))}
          // onChange={(v) => onChange({ ...node, operator: v })}
          onChange={(v) => {
            const isBetween = v === "BETWEEN" || v === "NOT BETWEEN";
            const isIn = v === "IN" || v === "NOT IN";

            onChange({
              ...node,
              operator: v,
              value: isIn
                ? (Array.isArray(node.value) ? node.value : [])
                : "",
              value2: isBetween ? "" : undefined
            });
          }}
        />
      </td>

      <td colSpan={2} className="flex gap-2 items-center">
        {renderValueInput()}
      </td>

      <td>
        {onRemove && (
          <Button style={{ "padding": "6px 8px", "marginBottom": "12px" }} size="sm" variant="danger" onClick={onRemove}>
            ✕
          </Button>
        )}
      </td>
    </tr>
  );
};

type FilterZone = "rows_dimensions" | "cols_dimensions" | "metrics" | "filters"

interface FilterEditingProps {
  zone: FilterZone;
  filter: ChartDimension | ChartMetric;
}

interface DimMetricFieldMap {
  field_name: string;
  data_type: SqlDataType;
  field_id: number;
  alias?: string;
}

export const StructureStep = ({ chart, onChange, queries }: ChartFormProps) => {
  const [_chart, setChart] = useState<DatasetChart>(chart);
  const [editing, setEditing] = useState<number | null>(null);
  const [filterEditing, setFilterEditing] = useState<FilterEditingProps | null>(null);

  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const updateChart = (updater: DatasetChart | ((prev: DatasetChart) => DatasetChart)) => {
    setChart(prev => {
      const newChart = typeof updater === "function" ? updater(prev) : updater;
      onChange(newChart); // ici c'est sûr que c'est la valeur correcte
      return newChart;
    });
  };

  const updateStructure = (key: keyof ChartStructure, val: any) => {
    updateChart((prev) => ({
      ...prev,
      structure: {
        ...prev.structure,
        [key]: val,
      },
    }));
  };

  const query = useMemo(() => {
    return queries?.find((q) => q.id === (_chart.query_id ?? chart.query_id));
  }, [queries, _chart.query_id, chart.query_id]);

  const fields = useMemo(() => {
    return query?.fields ?? [];
  }, [query]);


  const queryDimensions: DimMetricFieldMap[] = useMemo(() => {
    const dims = query?.query_json?.select?.dimensions ?? [];
    const fm = new Map(fields.map(f => [f.id, f]));
    return dims
      .filter(d => fm.has(d.field_id))
      .map(q => {
        const fd = fm.get(q.field_id);
        const field_name = q?.alias ?? fd?.name ?? "";
        const fl = fields.find(f => f.id === q.field_id);
        const data_type = fl?.data_type ?? "string";
        return { ...q, field_name, data_type };
      });
  }, [query, fields]);

  const queryMetrics: DimMetricFieldMap[] = useMemo(() => {
    const metrs = query?.query_json?.select?.metrics ?? [];
    const fm = new Map(fields.map(f => [f.id, f]));
    return metrs
      .filter(d => fm.has(d.field_id))
      .map(q => {
        const fd = fm.get(q.field_id);
        const field_name = q?.alias ?? fd?.name ?? "";
        const fl = fields.find(f => f.id === q.field_id);
        const data_type = fl?.data_type ?? "string";
        return { ...q, field_name, data_type };
      });
  }, [query, fields]);

  const { dimMap, metricMap, fieldMap } = useMemo(() => {
    const dimMap: Map<number, DimMetricFieldMap> = new Map();
    const metricMap: Map<number, DimMetricFieldMap> = new Map();
    const fieldMap: Map<number, DimMetricFieldMap> = new Map();

    queryDimensions.forEach(d => {
      dimMap.set(d.field_id, d);
      fieldMap.set(d.field_id, d);
    });

    queryMetrics.forEach(m => {
      metricMap.set(m.field_id, m);
      fieldMap.set(m.field_id, m);
    });

    return { dimMap, metricMap, fieldMap };
  }, [queryDimensions, queryMetrics]);

  const structure: ChartStructure = useMemo(() => {
    const str = { ..._chart.structure ?? {} };

    const rowsDimsMap = new Map<string, ChartDimension>();
    // ---- Rows / Cols (strings → Set OK)
    [...(str.rows_dimensions ?? [])].forEach((rd, i) => {
      const dim = dimMap.get(rd.field_id);
      const alias = rd.alias ?? dim?.field_name ?? "";
      const name = dim?.field_name ?? rd.alias ?? "";
      const key = `${i}`; // `${dim?.field_name}_${alias}`.replace(/\s+/g, "_");
      rowsDimsMap.set(key, { ...rd, alias, name });
    });
    const rows_dimensions = Array.from(rowsDimsMap.values());

    const colsDimsMap = new Map<string, ChartDimension>();
    [...(str.cols_dimensions ?? [])].forEach((cd, i) => {
      const dim = dimMap.get(cd.field_id);
      const alias = cd.alias ?? dim?.field_name ?? "";
      const name = dim?.field_name ?? cd.alias ?? "";
      const key = `${i}`; // `${dim.field_name}_${alias}`.replace(/\s+/g, "_");
      colsDimsMap.set(key, { ...cd, alias, name });
    });
    const cols_dimensions = Array.from(colsDimsMap.values());

    // ---- Metrics (clé = field + aggregation)
    const metricsMap = new Map<string, ChartMetric>();
    [...(str.metrics ?? [])].forEach((m, i) => {
      const metr = metricMap.get(m.field_id);
      const alias = m.alias ?? metr?.field_name ?? "";
      const name = metr?.field_name ?? m.alias ?? "";
      const key = `${i}`; // `${alias}_${m.aggregation}`;
      metricsMap.set(key, { ...m, alias, name });
    });
    const metrics = Array.from(metricsMap.values());

    // ---- Filters (clé plus robuste)
    const filtersMap = new Map<string, ChartStructureFilter>();
    [...(str.filters ?? [])].forEach((ft, i) => {
      // const filt = fieldMap.get(ft.field_id);
      const key = `${i}`; // `${filt?.field_name ?? ""}_${ft.operator ?? ""}_${ft.value ?? ""}_${ft.value2 ?? ""}`;
      filtersMap.set(key, { ...ft });
    });
    const filters = Array.from(filtersMap.values());

    // ---- Order by
    const orderMap = new Map<string, ChartStructureOrderBy>();
    [...(str.order_by ?? [])].forEach((o, i) => {
      // const odb = fieldMap.get(o.field_id);
      const key = `${i}`; // `${odb?.field_id}_${o.direction}`;
      orderMap.set(key, { ...o });
    });
    const order_by = Array.from(orderMap.values());

    // ---- Pivot
    const limit = str.limit;
    const offset = str.offset;
    const pivot = { ...(str.pivot ?? {}) };

    return { rows_dimensions, cols_dimensions, metrics, filters, limit, offset, order_by, pivot };

  }, [_chart.structure, queryDimensions, queryMetrics]);


  const addChartField = (zone: FilterZone, data: ChartFieldProps) => {

    const { field_id, type, field_type, alias, agg, operator, value, value2, useSqlInClause, index } = data;

    if (["rows_dimensions", "cols_dimensions"].includes(zone) && type !== "dimension") return;
    if (zone === "metrics" && type !== "metric") return;

    const newData: any = { field_id };

    if (alias !== undefined) newData.alias = alias;
    if (agg !== undefined) newData.aggregation = agg;
    if (operator !== undefined) newData.operator = operator;
    if (value !== undefined) newData.value = value;
    if (value2 !== undefined) newData.value2 = value2;
    if (field_type !== undefined) newData.field_type = field_type;
    if (useSqlInClause !== undefined) newData.useSqlInClause = useSqlInClause;

    updateChart(prev => {
      const rows = prev.structure?.rows_dimensions ?? [];
      const cols = prev.structure?.cols_dimensions ?? [];
      const metrics = prev.structure?.metrics ?? [];
      const filters = prev.structure?.filters ?? [];

      let newRows = [...rows];
      let newCols = [...cols];
      let newMetrics = [...metrics];
      let newFilters = [...filters];

      if (zone === "rows_dimensions") {
        if (!newRows.map(n => n.field_id).includes(field_id)) newRows.push(newData);
        newCols = cols.filter(c => c.field_id !== field_id);
      }
      if (zone === "cols_dimensions") {
        if (!newCols.map(n => n.field_id).includes(field_id)) newCols.push(newData);
        newRows = rows.filter(r => r.field_id !== field_id);
      }
      if (zone === "metrics") {
        newMetrics.push({ ...newData, aggregation: "sum" });
      }
      if (zone === "filters") {
        newFilters.push({ ...newData, operator: "=", field_type: "dimension", useSqlInClause: false });
      }
      return {
        ...prev,
        structure: {
          ...(prev.structure ?? {}),
          rows_dimensions: newRows,
          cols_dimensions: newCols,
          metrics: newMetrics,
          filters: newFilters,
        },
      };
    });
  };

  const updateChartFields = (zone: FilterZone, data: ChartFieldProps) => {

    const { field_id, type, field_type, alias, agg, operator, value, value2, useSqlInClause, index } = data;

    const newData: any = { field_id };

    if (alias !== undefined) newData.alias = alias;
    if (agg !== undefined) newData.aggregation = agg;
    if (operator !== undefined) newData.operator = operator;
    if (value !== undefined) newData.value = value;
    if (value2 !== undefined) newData.value2 = value2;
    if (field_type !== undefined) newData.field_type = field_type;
    if (useSqlInClause !== undefined) newData.useSqlInClause = useSqlInClause;

    updateChart(prev => {

      let rows_dims = prev.structure?.rows_dimensions ?? [];
      let cols_dims = prev.structure?.cols_dimensions ?? [];
      let metrics = prev.structure?.metrics ?? [];
      let filters = prev.structure?.filters ?? [];

      if (zone === "rows_dimensions") {
        rows_dims = rows_dims.map((m) => m.field_id === field_id ? { ...m, ...newData } : m);
      }
      if (zone === "cols_dimensions") {
        cols_dims = cols_dims.map((m) => m.field_id === field_id ? { ...m, ...newData } : m);
      }
      if (zone === "metrics" && index !== undefined) {
        // metrics = metrics.map((m) => m.field_id === field_id ? { ...m, ...newData } : m);
        metrics = metrics.map((m, i) => i === index ? { ...m, ...newData } : m);
      }
      if (zone === "filters" && index !== undefined) {
        const dimensionIds = queryDimensions.map(d => d.field_id);
        const field_type: SqlFieldType = dimensionIds.includes(field_id) ? "dimension" : "metric";
        filters = filters.map((m, i) => (i === index ? { ...m, ...newData, field_type } : m));
      }

      return {
        ...prev,
        structure: {
          ...prev.structure,
          rows_dimensions: rows_dims,
          cols_dimensions: cols_dims,
          metrics: metrics,
          filters: filters,
        },
      };
    });
  };

  const removeChartFields = (zone: FilterZone, field_id: number, index: number) => {

    updateChart(prev => {
      let cols_dims = prev.structure?.cols_dimensions ?? [];
      let rows_dims = prev.structure?.rows_dimensions ?? [];
      let metrics = prev.structure?.metrics ?? [];
      let filters = prev.structure?.filters ?? [];

      if (zone === "rows_dimensions") {
        rows_dims = rows_dims.filter((m) => m.field_id !== field_id);
      }
      if (zone === "cols_dimensions") {
        cols_dims = cols_dims.filter((m) => m.field_id !== field_id);
      }
      if (zone === "metrics" && index !== undefined) {
        // metrics = metrics.filter((m) => m.field_id !== field_id);
        metrics = metrics.filter((m, i) => i !== index);
      }
      if (zone === "filters" && index !== undefined) {
        filters = filters.filter((m, i) => i !== index);
      }

      return {
        ...prev,
        structure: {
          ...prev.structure,
          rows_dimensions: rows_dims,
          cols_dimensions: cols_dims,
          metrics: metrics,
          filters: filters,
        },
      };
    });
  };

  // ✅ Met à jour une propriété d’un filtre (value, operator…)
  const updateChartPivot = (key: keyof ChartPivot, val: any) => {
    updateChart(prev => {
      const pivot = { ...(prev.structure?.pivot ?? {}), [key]: val };
      return { ...prev, structure: { ...(prev.structure ?? {}), pivot } };
    });
  };

  return (
    <>
      <DndProvider backend={HTML5Backend}>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
          {/* Available fields */}
          <div className="col-span-1">
            <h3 className="font-semibold mb-2">Dimensions</h3>
            {queryDimensions.map((dim) => {
              return (<DraggableItem key={dim.field_id} field_id={dim.field_id} type="dimension" field_name={dim.field_name} alias={dim.field_name} />);
            })}

            <h3 className="font-semibold mt-4 mb-2">Metrics</h3>
            {queryMetrics.map((m) => {
              return (<DraggableItem key={m.field_id} field_id={m.field_id} type="metric" field_name={m.field_name} alias={m.field_name} />);
            })}
          </div>

          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Rows */}
              {[""].map(_ => {
                const cible = "rows_dimensions";
                return (
                  <div className="w-full border rounded-xl p-3 bg-gray-50">
                    <div className="font-semibold mb-2">Rows</div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 text-gray-600">
                        <tr>
                          <th className="text-left px-4 py-2">Nom</th>
                          <th className="text-left px-4 py-2">Alias</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {structure[cible].map((rd, i) => {
                          // const field = fields.find(f => f.id === rd.field_id);
                          return (
                            <tr key={rd.field_id} className="border-t hover:bg-gray-50 transition">
                              <td className="px-4 py-2 font-medium">{rd.name ?? rd.alias}</td>
                              <td className="px-4 py-2">
                                {editing === rd.field_id ? (
                                  <FormInput type="text" value={rd.alias || ""} className="border rounded-lg px-2 py-1 w-full"
                                    onChange={(e) => updateChartFields(cible, { field_id: rd.field_id, alias: e.target.value?.trim() })}
                                    onBlur={() => setEditing(null)} />
                                ) : (
                                  <span className="text-gray-500">
                                    {rd.alias || "—"}
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-2 relative">
                                <button
                                  className="p-2 rounded hover:bg-gray-200"
                                  onClick={() => setMenuOpen(menuOpen === rd.field_id ? null : rd.field_id)}>
                                  <MoreVertical size={16} />
                                </button>

                                {menuOpen === rd.field_id && (
                                  <div className="absolute right-2 mt-1 w-32 bg-white border rounded-lg shadow-lg z-10">

                                    <Button
                                      size="sm"
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
                                      onClick={() => { setEditing(rd.field_id); setMenuOpen(null); }}>
                                      <Pencil size={14} />
                                      Rename
                                    </Button>

                                    <Button
                                      size="sm"
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
                                      onClick={() => {
                                        const field = fields.find(f => f.id === rd.field_id);
                                        const data_type = field?.data_type ?? "string";
                                        setFilterEditing({ zone: cible, filter: { ...rd, data_type } });
                                        setMenuOpen(null);
                                      }}>
                                      <Pencil size={14} />
                                      Filter
                                    </Button>

                                    <Button
                                      variant="danger"
                                      size="sm"
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                      onClick={() => removeChartFields(cible, rd.field_id, i)}>
                                      <Trash2 size={14} />
                                      Delete
                                    </Button>

                                  </div>
                                )}


                                {/* <Button
                                      style={{ "padding": "6px 8px", "marginBottom": "12px" }} size="sm" variant="danger"
                                      onClick={() => updateStructure(cible, rows.filter((r) => r.field !== rd.field))}>
                                      ✕
                                    </Button> */}
                              </td>
                            </tr>
                          );
                        })}

                      </tbody>
                    </table>
                    <DragDropZone title="Drop Rows here" items={[]} accept={["dimension"]} onDrop={(item) => addChartField(cible, item)} />
                  </div>
                )
              })}

              {/* Columns */}
              {[""].map(_ => {
                const cible = "cols_dimensions";
                return (
                  <div className="w-full border rounded-xl p-3 bg-gray-50">
                    <div className="font-semibold mb-2">Columns</div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 text-gray-600">
                        <tr>
                          <th className="text-left px-4 py-2">Nom</th>
                          <th className="text-left px-4 py-2">Alias</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {structure[cible].map((cd) => {
                          // const field_name = fields.find(f => f.id === cd.field_id)?.name ?? cd.field_id;

                          return (
                            <tr key={cd.field_id} className="border-t hover:bg-gray-50 transition">
                              <td className="px-4 py-2 font-medium">{cd.name ?? cd.alias}</td>
                              <td className="px-4 py-2">
                                {editing === cd.field_id ? (
                                  <FormInput
                                    type="text" value={cd.alias || ""}
                                    className="border rounded-lg px-2 py-1 w-full"
                                    onChange={(e) => updateChartFields(cible, { field_id: cd.field_id, alias: e.target.value?.trim() })}
                                    onBlur={() => setEditing(null)} />

                                ) : (
                                  <span className="text-gray-500">
                                    {cd.alias || "—"}
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-2 relative">
                                <button
                                  className="p-2 rounded hover:bg-gray-200"
                                  onClick={() =>
                                    setMenuOpen(menuOpen === cd.field_id ? null : cd.field_id)
                                  }
                                >
                                  <MoreVertical size={16} />
                                </button>

                                {menuOpen === cd.field_id && (
                                  <div className="absolute right-2 mt-1 w-32 bg-white border rounded-lg shadow-lg z-10">

                                    <button
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
                                      onClick={() => {
                                        setEditing(cd.field_id);
                                        setMenuOpen(null);
                                      }}
                                    >
                                      <Pencil size={14} />
                                      Rename
                                    </button>

                                    <Button
                                      size="sm"
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
                                      onClick={() => {
                                        const field = fields.find(f => f.id === cd.field_id);
                                        const data_type = field?.data_type ?? "string";
                                        setFilterEditing({ zone: cible, filter: { ...cd, data_type } });
                                        setMenuOpen(null);
                                      }}>
                                      <Pencil size={14} />
                                      Filter
                                    </Button>

                                    <button
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                      onClick={() => updateStructure(cible, structure[cible].filter((d) => d.field_id !== cd.field_id))}
                                    >
                                      <Trash2 size={14} />
                                      Delete
                                    </button>
                                  </div>
                                )}
                                {/* <Button
                            style={{ "padding": "6px 8px", "marginBottom": "12px" }} size="sm" variant="danger"
                            onClick={() => updateStructure(cible, cols.filter((d) => d.field_id !== cd.field_id))}>
                            ✕
                          </Button> */}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <DragDropZone title="Drop Columns here" items={[]} accept={["dimension"]} onDrop={(item) => addChartField(cible, item)} />

                  </div>
                )
              })}
            </div>
            {/* Metrics */}
            {[""].map(_ => {
              const cible = "metrics";
              return (
                <div className="w-full border rounded-xl p-3 bg-gray-50">
                  <div className="font-semibold mb-2">Metrics</div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600">
                      <tr>
                        <th className="text-left px-4 py-2">Nom</th>
                        <th className="text-left px-4 py-2">Alias</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {structure[cible].map((m, i) => {
                        // const field_name = fields.find(f => f.id === m.field_id)?.name ?? m.field_id;
                        return (
                          <tr key={m.field_id} className="border-t hover:bg-gray-50 transition">
                            <td className="px-4 py-2 font-medium">{m.name ?? m.alias}</td>
                            <td className="px-4 py-2">
                              {editing === m.field_id ? (
                                <FormInput
                                  type="text" value={m.alias || ""}
                                  className="border rounded-lg px-2 py-1 w-full"
                                  onChange={(e) => updateChartFields(cible, { field_id: m.field_id, alias: e.target.value?.trim(), index: i })}
                                  onBlur={() => setEditing(null)} />
                              ) : (
                                <span className="text-gray-500">
                                  {m.alias || "—"}
                                </span>
                              )}
                            </td>
                            <td>
                              <FormSelect
                                value={m.aggregation || ""}
                                className="border rounded-lg px-2 py-1 w-full"
                                options={AGGRAGATE_TYPES.map(a => ({ value: a, label: a.toUpperCase() }))}
                                onChange={(val) => updateChartFields(cible, { field_id: m.field_id, agg: val, index: i })} />
                            </td>
                            <td className="px-2 py-2 relative">
                              <button
                                className="p-2 rounded hover:bg-gray-200"
                                onClick={() => setMenuOpen(menuOpen === m.field_id ? null : m.field_id)}>
                                <MoreVertical size={16} />
                              </button>

                              {menuOpen === m.field_id && (
                                <div className="absolute right-2 mt-1 w-32 bg-white border rounded-lg shadow-lg z-10">

                                  <button
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
                                    onClick={() => { setEditing(m.field_id); setMenuOpen(null); }}>
                                    <Pencil size={14} />
                                    Rename
                                  </button>

                                  <Button
                                    size="sm"
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
                                    onClick={() => {
                                      const field = fields.find(f => f.id === m.field_id);
                                      const data_type = field?.data_type ?? "string";
                                      setFilterEditing({ zone: cible, filter: { ...m, data_type } });
                                      setMenuOpen(null);
                                    }}>
                                    <Pencil size={14} />
                                    Filter
                                  </Button>

                                  <button
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                    onClick={() => removeChartFields(cible, m.field_id, i)}>
                                    <Trash2 size={14} />
                                    Delete
                                  </button>

                                </div>
                              )}
                              {/* <Button
                                    style={{ "padding": "6px 8px", "marginBottom": "12px" }} size="sm" variant="danger"
                                    onClick={() => removeChartFields(m.field)}>
                                    ✕
                                  </Button> */}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <DragDropZone title="Drop metric here" items={[]} accept={["metric"]} onDrop={(item) => addChartField(cible, item)} />
                </div>
              )
            })}
            {/* Filters */}
            {[""].map(_ => {
              const cible = "filters";
              return (
                <div className="border rounded p-3 bg-gray-50 mt-4">

                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold">Filters</div>

                    <button className="text-sm bg-blue-500 text-white px-2 py-1 rounded" onClick={(e) => addChartField(cible, { field_id: 0 })} >
                      + Add Filter
                    </button>
                  </div>

                  {structure[cible].length === 0 && (<div className="text-gray-400 text-sm"> Aucun filtre défini </div>)}

                  {structure[cible].length > 0 && (
                    <table className="w-full">
                      <tbody>
                        {structure[cible].map((filter, i) => (
                          <FilterNodeBuilder
                            key={i}
                            index={i + 1}
                            node={filter}
                            fields={[...queryDimensions, ...queryMetrics]}
                            onChange={(updated) => {
                              updateChartFields(cible, { ...updated, index: i })
                            }}
                            onRemove={() => removeChartFields(cible, filter.field_id, i)}
                            error={undefined}
                          />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })}

            <div className="w-full border rounded-xl p-3 bg-gray-50">
              <div className="flex justify-between items-center">
                <FormSwitch
                  label="Rows totals"
                  checked={chart?.structure?.pivot?.rows_total}
                  onChange={e => updateChartPivot("rows_total", e.target.checked)}
                />
                <FormSwitch
                  label="Columns totals"
                  checked={chart?.structure?.pivot?.cols_total}
                  onChange={e => updateChartPivot("cols_total", e.target.checked)}
                />
                <FormSwitch
                  label="Rows subtotals"
                  checked={chart?.structure?.pivot?.rows_subtotal}
                  onChange={e => updateChartPivot("rows_subtotal", e.target.checked)}
                />
                <FormSwitch
                  label="Columns subtotals"
                  checked={chart?.structure?.pivot?.cols_subtotal}
                  onChange={e => updateChartPivot("cols_subtotal", e.target.checked)}
                />
              </div>
            </div>

            <div className="w-full border rounded-xl p-3 bg-gray-50">
              <div className="flex justify-between items-center">

                <FormSwitch
                  label="Active"
                  checked={chart?.structure?.pivot?.acitve}
                  onChange={e => updateChartPivot("acitve", e.target.checked)}
                />
                <FormSwitch
                  label="sort_desc"
                  checked={chart?.structure?.pivot?.sort_desc}
                  onChange={e => updateChartPivot("sort_desc", e.target.checked)}
                />
                <FormInput
                  value={chart?.structure?.pivot?.fill_value ?? 0}
                  type="number"
                  onChange={(e) => updateChartPivot("fill_value", e.target.value)}
                />
              </div>
            </div>

            <div className="w-full border rounded-xl p-3 bg-gray-50">
              <div className="flex justify-between items-center">

                <FormMultiSelect
                  label={`percent_metrics`}
                  value={chart?.structure?.pivot?.percent_metrics ?? []}
                  options={structure.metrics?.map((m) => {
                    const label = m.alias ?? fields.find(f => f.id === m.field_id)?.name ?? ""
                    return { value: m.field_id, label };
                  }) ?? []}
                  onChange={(values) => {
                    const vals = values?.filter(Boolean) || [];
                    const metVals = (structure.metrics ?? []).filter(d => vals.includes(d.field_id));
                    updateChartPivot("percent_metrics", metVals.map(m => m.field_id))
                  }}
                  placeholder="percent_metrics"
                />

                <FormSelect
                  label={`sort_metric`}
                  value={chart?.structure?.pivot?.sort_metric}
                  options={structure.metrics?.map((m) => {
                    const label = m.alias ?? fields.find(f => f.id === m.field_id)?.name ?? ""
                    return { value: m.field_id, label }
                  }) ?? []}
                  onChange={(val) => updateChartPivot("sort_metric", val)}
                  placeholder="sort_metric"
                />

                <FormSelect
                  label={`top_n`}
                  value={chart?.structure?.pivot?.top_n}
                  options={[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => ({ value: d, label: `${d}` })) ?? []}
                  onChange={(val) => updateChartPivot("top_n", val)}
                  placeholder="top_n"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Suggested type: <b>{chart.type}</b>
        </div>
      </DndProvider >

      <Modal title="Edit Map Values" isOpen={filterEditing !== null} size="md" showCloseButton={false} onClose={() => { }} >
        {filterEditing && (
          <ChartFilterBuilder
            filter={filterEditing.filter}
            onChange={(filter) => {
              updateChartFields(filterEditing.zone, { ...filter });
              setFilterEditing(null);
            }}
          />
        )}
      </Modal>
    </>
  );
};




// import { FormMultiSelect } from "@/components/forms/FormSelect/FormMultiSelect";
// import { ChartFormProps, ChartStructure, ChartOptions, DatasetChart } from "@/models/dataset.models";
// import { useMemo } from "react";
// import { DndProvider, useDrag, useDrop } from 'react-dnd';



// // Zone DragDrop
// interface DragItem {
//   type: "dimension" | "metric";
//   key: string;
// }

// // Item Draggable
// const DraggableItem = ({ item, type }: { item: string; type: "dimension" | "metric" }) => {
//   const [, drag] = useDrag({ type, item: { type, key: item }, });
//   return <div ref={drag as any} className="p-1 cursor-move border rounded mb-1 bg-white">{item}</div>;
// };

// const DragDropZone = ({ title, items, onDrop, maxItems }: { title: string; items: string[]; onDrop: (item: DragItem) => void; maxItems?: number; }) => {
//   const [, drop] = useDrop({
//     accept: ["dimension", "metric"],
//     drop: (item: DragItem) => {
//       if (maxItems && items.length >= maxItems) return;
//       if (!items.includes(item.key)) onDrop(item);
//     },
//   });

//   return (
//     <div ref={drop as any} className="border p-2 rounded bg-gray-50 min-h-[120px]">
//       <strong>{title}</strong>
//       {items.length === 0 && <div className="text-gray-400 text-sm mt-1">Déposez vos éléments ici</div>}
//       <ul>
//         {items.map((i) => (
//           <li key={i} className="p-1 border-b bg-white rounded mb-1">{i}</li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export const StructureStep = ({ chart, onChange, tenants, datasets, queries }: ChartFormProps) => {

//   const updateStructure = (key: keyof ChartStructure, val: any) => {
//     const updated = { ...chart, structure: { ...chart.structure, [key]: val } };
//     onChange(updated);
//   };

//   // setTenant(tenants.find(t => t.id === chart.tenant_id));
//   // setDataset(datasets.find(d => d.id === chart.dataset_id));

//   const query = useMemo(() => {
//     return queries?.find(q => q.id === chart.query_id);
//   }, [queries,chart.query_id]);

//   const dimensions = useMemo(() => {
//     return query?.query_json?.select?.dimensions ?? [];
//   }, [query]);

//   const metrics = useMemo(() => {
//     return query?.query_json?.select?.metrics ?? [];
//   }, [query]);


//   return (
//     <>
//       <FormMultiSelect
//         label={`Columns Dimensions`}
//         value={chart?.structure?.cols_dimensions ?? []}
//         options={dimensions?.map((d) => ({ value: d, label: d })) ?? []}
//         onChange={(values) => {
//           const vals = values?.filter(Boolean) || [];
//           const dims = dimensions.filter(d => vals.includes(d));
//           updateStructure("cols_dimensions", dims)
//         }}
//         placeholder="Sélectionner Columns"
//         required={true}
//       />
//       <FormMultiSelect
//         label={`Rows Dimensions`}
//         value={chart?.structure?.rows_dimensions ?? []}
//         options={dimensions?.map((d) => ({ value: d, label: d })) ?? []}
//         onChange={(values) => {
//           const vals = values?.filter(Boolean) || [];
//           const dims = dimensions.filter(d => vals.includes(d));
//           updateStructure("rows_dimensions", dims)
//         }}
//         placeholder="Sélectionner Columns"
//         required={true}
//       />

//       <FormMultiSelect
//         label={`Metrics | Data`}
//         value={chart?.structure?.metrics ?? []}
//         options={metrics?.map((d) => ({ value: d, label: d })) ?? []}
//         onChange={(values) => {
//           const vals = values?.filter(Boolean) || [];
//           const mets = metrics.filter(m => vals.includes(m));
//           updateStructure("metrics", mets)
//         }}
//         placeholder="Sélectionner Metrics"
//         required={true}
//       />

//       <FormMultiSelect
//         label={`Filters`}
//         value={chart?.structure?.metrics ?? []}
//         options={metrics?.map((d) => ({ value: d, label: d })) ?? []}
//         onChange={(values) => {
//           const vals = values?.filter(Boolean) || [];
//           const mets = metrics.filter(m => vals.includes(m));
//           updateStructure("metrics", mets)
//         }}
//         placeholder="Sélectionner Metrics"
//         required={true}
//       />

//       <p>Suggested type: {chart.type}</p>
//     </>
//   );
// };