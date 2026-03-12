import { useMemo, useState } from "react";
import { AGGRAGATE_TYPES, ChartFormProps, ChartPivot, ChartStructure, ChartStructureFilter, DatasetChart, DatasetField, FULL_OPERATORS, getInputTypeForField, getOperatorsForField, LOGICAL_OPERATORS, NO_VALUE_OPERATORS, QueryFilter, QueryFilterGroup, QueryFilterNode, SqlAggType, SqlFieldType } from "@/models/dataset.models";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { FormTextarea } from "@/components/forms/FormTextarea/FormTextarea";
import { FormInput } from "@/components/forms/FormInput/FormInput";
import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";
import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";
import { FormMultiSelect } from "@/components/forms/FormSelect/FormMultiSelect";

interface DragItem {
  type: "dimension" | "metric";
  field: string;
  alias: string;
}

const DraggableItem = ({ item, type }: { item: string; type: "dimension" | "metric" }) => {
  const [, drag] = useDrag(() => ({
    type,
    item: { type, field: item, alias: item },
  }));

  return (
    <div ref={drag as any} className="px-2 py-1 mb-1 bg-white border rounded shadow-sm cursor-move hover:bg-gray-100">
      {item}
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
  fields: DatasetField[];
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

  const selectedField = fields.find(f => f.name === node.field);

  const operators = getOperatorsForField(selectedField?.data_type);
  const inputType = getInputTypeForField(selectedField?.data_type);

  const renderValueInput = () => {
    if (NO_VALUE_OPERATORS.includes(node.operator)) return null;

    if (node.operator === "BETWEEN") {
      return (
        <>
          <FormInput type={inputType} value={node.value}
            onChange={(e) => onChange({ ...node, value: e.target.value })} />

          <FormInput type={inputType} value={node.value2 ?? ""}
            onChange={(e) => onChange({ ...node, value2: e.target.value })} />
        </>
      );
    }

    if (node.operator === "IN") {
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
            onChange={(newValues) =>
              onChange({ ...node, value: newValues })
            }
          />
        </>
      );
    }

    switch (inputType) {
      case "select":
        return (
          <>
            {selectedField?.data_type === "boolean" ? (
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
          value={node.field}
          options={fields.map(f => ({ value: f.name, label: f.name }))}
          // onChange={(v) => onChange({ ...node, field: v })}
          onChange={(v) => {
            const newField = fields.find(f => f.name === v);
            const newOperators = getOperatorsForField(newField?.data_type);

            onChange({
              ...node,
              field: v,
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
            const isBetween = v === "BETWEEN";
            const isIn = v === "IN";

            onChange({
              ...node,
              operator: v,
              value: isIn ? [] : "",
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

export const StructureStep = ({ chart, onChange, queries }: ChartFormProps) => {
  const [_chart, setChart] = useState<DatasetChart>(chart);

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
  }, [queries, _chart.query_id]);


  const dimensions = useMemo(() => {
    return query?.query_json?.select?.dimensions ?? [];
  }, [query]);

  const metrics = useMemo(() => {
    return query?.query_json?.select?.metrics ?? [];
  }, [query]);

  // const structure: ChartStructure = useMemo(() => {
  //   const c1 = chart.structure;
  //   const c2 = _chart.structure;

  //   // Fusion rows et cols (simple car ce sont des strings)
  //   const rows_dimensions = Array.from(new Set([...(c1?.rows_dimensions ?? []), ...(c2?.rows_dimensions ?? [])]));
  //   const cols_dimensions = Array.from(new Set([...(c1?.cols_dimensions ?? []), ...(c2?.cols_dimensions ?? [])]));

  //   // Fusion metrics
  //   const metricsMap = new Map<string, { field: string; aggregation: SqlAggType }>();
  //   [...(c1?.metrics ?? []), ...(c2?.metrics ?? [])].forEach(m => metricsMap.set(m.field, m));
  //   const metrics = Array.from(metricsMap.values());

  //   // Fusion filters
  //   const filtersMap = new Map<string, ChartStructureFilter>();
  //   [...(c1?.filters ?? []), ...(c2?.filters ?? [])].forEach(f => filtersMap.set(f.field, f));
  //   const filters = Array.from(filtersMap.values());

  //   const order_by = Array.from(new Set([...(c1?.order_by ?? []), ...(c2?.order_by ?? [])]));

  //   const pivot = c2?.pivot ?? c1?.pivot ?? false;



  //   return { rows_dimensions, cols_dimensions, metrics, filters, order_by, pivot };
  // }, [chart.structure, _chart.structure]);


  const structure: ChartStructure = useMemo(() => {
    const c1 = chart.structure ?? {};
    const c2 = _chart.structure ?? {};

    const rowsDimsMap = new Map<string, { field: string; alias: string }>();
    // ---- Rows / Cols (strings → Set OK)
    [...(c1.rows_dimensions ?? []), ...(c2.rows_dimensions ?? [])].forEach((rd) => {
      const alias = (rd.alias ?? "").trim() !== "" ? rd.alias : rd.field;
      const key = `${rd.field}_${rd.alias}`.replace(" ", "_");
      rowsDimsMap.set(key, { ...rd, alias });
    });
    const rows_dimensions = Array.from(rowsDimsMap.values());

    const colsDimsMap = new Map<string, { field: string; alias: string }>();
    [...(c1.cols_dimensions ?? []), ...(c2.cols_dimensions ?? [])].forEach((rd) => {
      const alias = (rd.alias ?? "").trim() !== "" ? rd.alias : rd.field;
      const key = `${rd.field}_${rd.alias}`.replace(" ", "_");
      colsDimsMap.set(key, { ...rd, alias });
    });
    const cols_dimensions = Array.from(colsDimsMap.values());

    // ---- Metrics (clé = field + aggregation)
    const metricsMap = new Map<string, { field: string; alias: string; aggregation: SqlAggType }>();
    [...(c1.metrics ?? []), ...(c2.metrics ?? [])].forEach((m) => {
      const alias = (m.alias ?? "").trim() !== "" ? m.alias : m.field;
      const key = `${m.field}_${m.aggregation}`;
      metricsMap.set(key, { ...m, alias });
    });
    const metrics = Array.from(metricsMap.values());

    // ---- Filters (clé plus robuste)
    const filtersMap = new Map<string, ChartStructureFilter>();
    [...(c1.filters ?? []), ...(c2.filters ?? [])].forEach((f) => {
      const key = `${f.field}_${f.operator}_${f.value}_${f.value2 ?? ""}`;
      filtersMap.set(key, f);
    });
    const filters = Array.from(filtersMap.values());

    // ---- Order by
    const orderMap = new Map<string, { field: string; direction: "ASC" | "DESC" }>();
    [...(c1.order_by ?? []), ...(c2.order_by ?? [])].forEach((o) => {
      const key = `${o.field}_${o.direction}`;
      orderMap.set(key, o);
    });
    const order_by = Array.from(orderMap.values());

    // ---- Pivot
    const limit = c2.limit ?? c1.limit;
    const offset = c2.offset ?? c1.offset;
    const pivot = { ...(c1.pivot ?? {}), ...(c2.pivot ?? {}) };

    return { rows_dimensions, cols_dimensions, metrics, filters, limit, offset, order_by, pivot };

  }, [chart.structure, _chart.structure]);

  const rows = useMemo(() => {
    return structure.rows_dimensions;
  }, [structure]);

  const cols = useMemo(() => structure.cols_dimensions, [structure]);
  const mets = useMemo(() => structure.metrics, [structure]);
  const filters = useMemo(() => structure.filters, [structure]);

  const addDimension = (zone: "rows_dimensions" | "cols_dimensions", item: DragItem) => {
    if (item.type !== "dimension") return;

    updateChart(prev => {
      const rows = prev.structure?.rows_dimensions ?? [];
      const cols = prev.structure?.cols_dimensions ?? [];

      let newRows = [...rows];
      let newCols = [...cols];

      if (zone === "rows_dimensions") {
        if (!newRows.map(n => n.field).includes(item.field)) newRows.push({ field: item.field, alias: item.alias });
        // Supprimer uniquement l'item déplacé de l'autre zone
        newCols = cols.filter(c => c.field !== item.field);
      }

      if (zone === "cols_dimensions") {
        if (!newCols.map(n => n.field).includes(item.field)) newCols.push({ field: item.field, alias: item.alias });
        newRows = rows.filter(r => r.field !== item.field);
      }

      return {
        ...prev,
        structure: {
          ...prev.structure,
          rows_dimensions: newRows,
          cols_dimensions: newCols,
          metrics: prev.structure.metrics ?? [],
          filters: prev.structure.filters ?? [],
        },
      };
    });
  };



  const updateDimensionAlias = (zone: "rows_dimensions" | "cols_dimensions", field: string, alias: string) => {
    updateChart(prev => {
      let cols_dims = prev.structure?.cols_dimensions ?? [];
      let rows_dims = prev.structure?.rows_dimensions ?? [];
      if (zone === "rows_dimensions") {
        cols_dims = cols_dims.map((m) => m.field === field ? { ...m, alias } : m);
      }
      if (zone === "cols_dimensions") {
        rows_dims = rows_dims.map((m) => m.field === field ? { ...m, alias } : m);
      }

      return {
        ...prev,
        structure: {
          ...prev.structure,
          rows_dimensions: rows_dims,
          cols_dimensions: cols_dims
        },
      };
    });
  };

  const addMetric = (item: DragItem) => {
    if (item.type !== "metric") return;

    updateChart(prev => {
      const mets = prev.structure?.metrics ?? [];

      if (mets.find(m => m.field === item.field)) return prev;

      return {
        ...prev,
        structure: {
          ...prev.structure,
          metrics: [...mets, { field: item.field, alias: item.alias, aggregation: "sum" }],
          rows_dimensions: prev.structure?.rows_dimensions ?? [],
          cols_dimensions: prev.structure?.cols_dimensions ?? [],
          filters: prev.structure?.filters ?? [],
        },
      };
    });
  };

  const updateMetricAgg = (field: string, agg: SqlAggType) => {
    updateChart(prev => {
      const metricss = prev.structure?.metrics ?? [];
      const newMetrics = metricss.map((m) => m.field === field ? { ...m, aggregation: agg } : m);
      return {
        ...prev,
        structure: { ...prev.structure, metrics: newMetrics },
      };
    });
  };

  const updateMetricAlias = (field: string, alias: string) => {
    updateChart(prev => {
      const metricss = prev.structure?.metrics ?? [];
      const newMetrics = metricss.map((m) => m.field === field ? { ...m, alias } : m);
      return {
        ...prev,
        structure: { ...prev.structure, metrics: newMetrics },
      };
    });
  };

  const removeMetric = (field: string) => {
    updateChart(prev => {
      const metricss = prev.structure?.metrics ?? [];
      const newMetrics = metricss.filter((m) => m.field !== field);
      return {
        ...prev,
        structure: { ...prev.structure, metrics: newMetrics },
      };
    });
  };

  // ✅ Ajoute un filtre vide
  const addFilter = () => {
    updateChart(prev => {
      const newFiler: ChartStructureFilter = { field: "", operator: "=", value: "", value2: "", field_type: "dimension" };
      const newFilters = [...(prev.structure?.filters ?? []), newFiler];
      return {
        ...prev,
        structure: { ...prev.structure, filters: newFilters },
      };
    });
  };

  // ✅ Supprime un filtre à l'index donné
  const removeFilter = (index: number) => {
    updateChart(prev => {
      const newFilters = (prev.structure?.filters ?? []).filter((_, i) => i !== index)
      return {
        ...prev,
        structure: { ...prev.structure, filters: newFilters },
      };
    });
  };

  // ✅ Met à jour une propriété d’un filtre (value, operator…)
  const updateFilter = (index: number, filter: ChartStructureFilter) => {
    const fieldType: SqlFieldType = dimensions.includes(filter.field) ? "dimension" : "metric";
    updateChart(prev => {
      const filters = prev.structure?.filters ?? [];
      const newFilters = filters.map((f, i) => (i === index ? { ...filter, field_type: fieldType } : f));
      return {
        ...prev,
        structure: { ...prev.structure, filters: newFilters },
      };
    });
  };

  // ✅ Met à jour une propriété d’un filtre (value, operator…)
  const updateChartPivot = (key: keyof ChartPivot, val: any) => {
    updateChart(prev => {
      return {
        ...prev,
        structure: {
          ...(prev.structure ?? {}),
          pivot: {
            ...(prev.structure?.pivot ?? {}),
            [key]: val,
          }
        },
      };
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
        {/* Available fields */}
        <div className="col-span-1">
          <h3 className="font-semibold mb-2">Dimensions</h3>
          {dimensions.map((d) => (
            <DraggableItem key={d} item={d} type="dimension" />
          ))}

          <h3 className="font-semibold mt-4 mb-2">Metrics</h3>
          {metrics.map((m) => (
            <DraggableItem key={m} item={m} type="metric" />
          ))}
        </div>

        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Rows */}
            <div className="border rounded p-3 bg-gray-50">
              <div className="font-semibold mb-2">Rows</div>
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Alias</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => (
                    <tr key={m.field}>
                      <td>{m.field}</td>
                      <td>
                        <FormInput 
                          type="text" value={m.alias} 
                          onChange={(e) => updateDimensionAlias("rows_dimensions", m.field, e.target.value)} 
                         />
                      </td>
                      <td>
                        <Button
                          style={{ "padding": "6px 8px", "marginBottom": "12px" }} size="sm" variant="danger"
                          onClick={() => updateStructure("rows_dimensions", rows.filter((r) => r.field !== m.field))}>
                          ✕
                        </Button>
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
              <DragDropZone title="Drop Rows here" items={[]} accept={["dimension"]} onDrop={(item) => addDimension("rows_dimensions", item)} />
            </div>

            {/* Columns */}
            <div className="border rounded p-3 bg-gray-50">
              <div className="font-semibold mb-2">Columns</div>
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Alias</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cols.map((c) => (
                    <tr key={c.field}>
                      <td>{c.field}</td>
                      <td>
                        <FormInput
                          type="text" value={c.alias}
                          onChange={(e) => updateDimensionAlias("cols_dimensions", c.field, e.target.value)} />
                      </td>
                      <td>
                        <Button
                          style={{ "padding": "6px 8px", "marginBottom": "12px" }} size="sm" variant="danger"
                          onClick={() => updateStructure("cols_dimensions", cols.filter((d) => d.field !== c.field))}>
                          ✕
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <DragDropZone title="Drop Columns here" items={[]} accept={["dimension"]} onDrop={(item) => addDimension("cols_dimensions", item)} />

            </div>
          </div>
          {/* Metrics */}
          <div className="border rounded p-3 bg-gray-50">
            <div className="font-semibold mb-2">Metrics</div>

            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Alias</th>
                  <th>Aggr</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {mets.map((m) => (
                  <tr key={m.field}>
                    <th>{m.field}</th>
                    <td>
                      <FormInput
                        type="text" value={m.alias}
                        onChange={(e) => updateMetricAlias(m.field, e.target.value)} />
                    </td>
                    <td>
                      <FormSelect
                        value={m.aggregation}
                        options={AGGRAGATE_TYPES.map(a => ({ value: a, label: a.toUpperCase() }))}
                        onChange={(val) => updateMetricAgg(m.field, val as SqlAggType)}
                      />
                    </td>
                    <td>
                      <Button
                        style={{ "padding": "6px 8px", "marginBottom": "12px" }} size="sm" variant="danger"
                        onClick={() => removeMetric(m.field)}>
                        ✕
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <DragDropZone title="Drop metric here" items={[]} accept={["metric"]} onDrop={addMetric} />
          </div>

          <div className="border rounded p-3 bg-gray-50 mt-4">

            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">Filters</div>

              <button className="text-sm bg-blue-500 text-white px-2 py-1 rounded" onClick={addFilter} >
                + Add Filter
              </button>
            </div>

            {filters.length === 0 && (<div className="text-gray-400 text-sm"> Aucun filtre défini </div>)}

            {filters.length > 0 && (<table className="w-full">
              <tbody>
                {filters.map((filter, i) => (
                  <FilterNodeBuilder
                    key={i}
                    index={i + 1}
                    node={filter}
                    fields={query?.fields ?? []}
                    onChange={(updated) => updateFilter(i, updated)}
                    onRemove={() => removeFilter(i)}
                    error={undefined}
                  />
                ))}
              </tbody>
            </table>)}
          </div>

          <div className="flex justify-between items-center">

            <FormSwitch
              label="Active"
              checked={chart?.structure?.pivot?.acitve}
              onChange={e => updateChartPivot("acitve", e.target.checked)}
            />
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

          <div className="flex justify-between items-center">

            <FormMultiSelect
              label={`percent_metrics`}
              value={chart?.structure?.pivot?.percent_metrics ?? []}
              options={structure.metrics?.map((d) => ({ value: d.alias ?? d.field, label: d.alias ?? d.field })) ?? []}
              onChange={(values) => {
                const vals = values?.filter(Boolean) || [];
                const metVals = (structure.metrics ?? []).filter(d => vals.includes(d.alias ?? d.field));
                updateChartPivot("percent_metrics", metVals.map(m=>m.alias ?? m.field))
              }}
              placeholder="percent_metrics"
            />

            <FormSelect
              label={`sort_metric`}
              value={chart?.structure?.pivot?.sort_metric}
              options={structure.metrics?.map((d) => ({ value: d.alias ?? d.field, label: d.alias ?? d.field })) ?? []}
              onChange={(val) => {
                updateChartPivot("sort_metric", val)
              }}
              placeholder="sort_metric"
            />

            <FormSelect
              label={`top_n`}
              value={chart?.structure?.pivot?.top_n}
              options={[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => ({ value: d, label: `${d}` })) ?? []}
              onChange={(val) => {
                updateChartPivot("top_n", val)
              }}
              placeholder="top_n"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Suggested type: <b>{chart.type}</b>
      </div>
    </DndProvider >
  );
};




// import { FormMultiSelect } from "@/components/forms/FormSelect/FormMultiSelect";
// import { ChartFormProps, ChartStructure, ChartVisualOptions, DatasetChart } from "@/models/dataset.models";
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