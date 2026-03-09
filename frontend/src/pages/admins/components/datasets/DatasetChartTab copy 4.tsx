// import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
// import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from '@pages/admins/AdminEntityCrudModule';
// import { DatasetChart, DatasetQuery, Dataset, SqlChartTypeList, TableColumn } from '@/models/dataset.models';
// import { chartService, datasetService, queryService } from '@/services/dataset.service';
// import { FormInput } from '@components/forms/FormInput/FormInput';
// import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
// import { FormSelect } from '@components/forms/FormSelect/FormSelect';
// import { FormCheckbox } from '@components/forms/FormCheckbox/FormCheckbox';
// import { FaDatabase, FaExchangeAlt, FaPalette, FaSlidersH } from 'react-icons/fa';
// import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
// import { tenantService } from '@/services/identity.service';
// import { Column } from '@/components/ui/Table/Table';
// import { StatusBadge } from '@/components/ui/Badge/Badge';
// import { Shield } from 'lucide-react';

// import { HexColorPicker } from "react-colorful";
// import { FaPlus, FaTrash } from "react-icons/fa";

// import WidthProvider, { Responsive, GridLayoutProps, ResponsiveGridLayout, Layout } from 'react-grid-layout';
// import 'react-grid-layout/css/styles.css';
// import 'react-resizable/css/styles.css';

// import { DndProvider, useDrag, useDrop } from 'react-dnd';
// import { HTML5Backend } from 'react-dnd-html5-backend';
// import { Button } from '@/components/ui/Button/Button';
// import { Modal } from '@/components/ui/Modal/Modal';

// import { v4 as uuidv4 } from "uuid";
// import styles from '@pages/admins/AdminPage.module.css';
// import { FormSwitch } from '@/components/forms/FormSwitch/FormSwitch';


// interface ColumnEditorProps {
//     columns: TableColumn[];
//     onChange: (cols: TableColumn[]) => void;
// }

// // Zone DragDrop
// interface DragItem {
//     type: "dimension" | "metric";
//     key: string;
// }

// interface ColorSchemePickerProps {
//     value: string[];
//     onChange: (colors: string[]) => void;
//     label?: string;
//     placeholder?: string;
//     maxColors?: number;
// }
// // Item Draggable
// const DraggableItem = ({ item, type }: { item: string; type: "dimension" | "metric" }) => {
//     const [, drag] = useDrag({ type, item: { type, key: item }, });
//     return <div ref={drag as any} className="p-1 cursor-move border rounded mb-1 bg-white">{item}</div>;
// };

// const DragDropZone = ({ title, items, onDrop, maxItems }: { title: string; items: string[]; onDrop: (item: DragItem) => void; maxItems?: number; }) => {
//     const [, drop] = useDrop({
//         accept: ["dimension", "metric"],
//         drop: (item: DragItem) => {
//             if (maxItems && items.length >= maxItems) return;
//             if (!items.includes(item.key)) onDrop(item);
//         },
//     });

//     return (
//         <div ref={drop as any} className="border p-2 rounded bg-gray-50 min-h-[120px]">
//             <strong>{title}</strong>
//             {items.length === 0 && <div className="text-gray-400 text-sm mt-1">Déposez vos éléments ici</div>}
//             <ul>
//                 {items.map((i) => (
//                     <li key={i} className="p-1 border-b bg-white rounded mb-1">{i}</li>
//                 ))}
//             </ul>
//         </div>
//     );
// };

// // DatasetChartTab
// const DEFAULT_FORM = Object.freeze<DatasetChart>({
//     id: null,
//     name: "",
//     tenant_id: null,
//     query_id: null,
//     dataset_id: null,
//     type: "table",
//     description: "",
//     is_active: false,
//     options: {
//         columns: [],
//         rows: [],
//         metrics: [],

//         table_columns: [],

//         color_scheme: ["#4caf50", "#2196f3", "#ff9800", "#9c27b0"],

//         show_percentage: false,
//         show_labels: true,
//         show_legend: true,
//         show_tooltip: true,
//         show_grid: true,

//         width: 600,
//         height: 400,
//         title: "",
//         subtitle: "",
//     },
// });

// // Colonnes du tableau
// const sourceColumns: Column<DatasetChart>[] = [
//     { key: "name", header: "Nom", sortable: true, searchable: true },
//     { key: "tenant", header: "Tenant", render: (ds) => ds.tenant?.name ?? "", sortable: true, searchable: true },
//     { key: "dataset", header: "Dataset", render: (ds) => ds.dataset?.name ?? "", sortable: true, searchable: true },
//     { key: "query", header: "Query", render: (ds) => ds.query?.name ?? "", sortable: true, searchable: true },
//     { key: "type", header: "Type", sortable: true, searchable: true },
//     { key: "options", header: "Options", render: (ds) => JSON.stringify(ds.options ?? {}), sortable: false, searchable: false },
//     { key: "description", header: "Description", render: (ds) => ds.description || "-", sortable: true, searchable: true },
//     { key: "is_active", header: "Statut", align: "center", render: (ds) => <StatusBadge isActive={ds.is_active} />, sortable: false, searchable: false },
// ];

// const ColorSchemePicker = ({ value, onChange, label = "Color Scheme", maxColors = 10 }: ColorSchemePickerProps) => {
//     const [showPicker, setShowPicker] = useState(false);
//     const [currentColor, setCurrentColor] = useState("#ff0000");

//     const addColor = () => {
//         if (value.length >= maxColors) return;
//         if (!value.includes(currentColor)) onChange([...value, currentColor]);
//         setShowPicker(false);
//     };

//     const removeColor = (color: string) => {
//         onChange(value.filter(c => c !== color));
//     };

//     // Fonction pour déterminer texte blanc ou noir selon contraste
//     const getContrastColor = (hex: string) => {
//         const c = hex.substring(1); // remove #
//         const rgb = parseInt(c, 16); // convert rrggbb to decimal
//         const r = (rgb >> 16) & 0xff;
//         const g = (rgb >> 8) & 0xff;
//         const b = rgb & 0xff;
//         return (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? "#000" : "#fff";
//     };

//     return (
//         <div className="mt-4">
//             <label className="font-semibold mb-2 block">{label}</label>

//             <div className="flex flex-wrap gap-3 mb-2 max-w-full overflow-x-auto p-1 border rounded bg-gray-50">
//                 {value.length === 0 && (
//                     <span className="text-gray-400 text-sm">Aucune couleur sélectionnée</span>
//                 )}

//                 {value.map(color => (
//                     <div key={color} title={color} style={{ backgroundColor: color }}
//                         className="relative w-16 h-16 rounded-lg shadow-md flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
//                         {/* Code hex au centre */}
//                         <span className="font-mono text-sm font-bold" style={{ color: getContrastColor(color) }}>
//                             {color}
//                         </span>

//                         {/* Bouton supprimer */}
//                         <button type="button" onClick={() => removeColor(color)}
//                             className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-white border border-gray-300 flex items-center justify-center text-red-500 hover:text-red-700 shadow">
//                             <FaTrash size={12} />
//                         </button>
//                     </div>
//                 ))}

//                 {/* Bouton Ajouter */}
//                 <button type="button" onClick={() => setShowPicker(true)}
//                     className="flex items-center justify-center w-16 h-16 rounded-lg border border-gray-300 text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition-colors">
//                     <FaPlus />
//                 </button>
//             </div>

//             {/* Modal Color Picker */}
//             {showPicker && (
//                 <Modal isOpen={showPicker} onClose={() => setShowPicker(false)}>
//                     <div className="p-4 bg-white rounded-lg shadow-lg w-80 max-w-full">
//                         <h3 className="text-lg font-semibold mb-3">Sélectionnez une couleur</h3>
//                         <HexColorPicker color={currentColor} onChange={setCurrentColor} />
//                         <div className="flex justify-between mt-4">
//                             <Button onClick={() => setShowPicker(false)} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">
//                                 Annuler
//                             </Button>
//                             <Button onClick={addColor} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
//                                 Ajouter
//                             </Button>
//                         </div>
//                     </div>
//                 </Modal>
//             )}
//         </div>
//     );
// };

// const renderChartPreview = (chart: DatasetChart) => {
//     const [previewData, setPreviewData] = useState<any[]>([]);

//     if (!previewData || previewData.length === 0) return <div className="text-gray-400">Aucune donnée pour l’aperçu</div>;
//     const { type, options } = chart;
//     const colors = options.color_scheme ?? ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#000"];
//     // options.color_scheme?.[i] ?? `#${Math.floor(Math.random() * 16777215).toString(16)}`
//     switch (type) {
//         case "line":
//             return (
//                 <ResponsiveContainer width={options.width ?? 600} height={options.height ?? 400}>
//                     <LineChart data={previewData}>
//                         {options.metrics?.map((m: string, i: number) => (
//                             <Line key={m} type="monotone" dataKey={m} stroke={colors[i % colors.length] ?? "#000"} />
//                         ))}
//                         <XAxis dataKey={options.x_axis} />
//                         <YAxis />
//                         {options.show_legend && <Legend />}
//                         {options.show_tooltip && <Tooltip />}
//                         {options.show_grid && <CartesianGrid strokeDasharray="3 3" />}
//                     </LineChart>
//                 </ResponsiveContainer>
//             );
//         case "bar":
//             return (
//                 <ResponsiveContainer width={options.width ?? 600} height={options.height ?? 400}>
//                     <BarChart data={previewData}>
//                         {options.metrics?.map((m: string, i: number) => (
//                             <Bar key={m} dataKey={m} fill={colors[i % colors.length] ?? "#000"} />
//                         ))}
//                         <XAxis dataKey={options.x_axis} />
//                         <YAxis />
//                         {options.show_legend && <Legend />}
//                         {options.show_tooltip && <Tooltip />}
//                         {options.show_grid && <CartesianGrid strokeDasharray="3 3" />}
//                     </BarChart>
//                 </ResponsiveContainer>
//             );
//         case "pie":
//             return (
//                 <ResponsiveContainer width={options.width ?? 600} height={options.height ?? 400}>
//                     <PieChart>
//                         <Pie
//                             data={previewData}
//                             dataKey={options.metric}
//                             nameKey={options.dimension}
//                             label={options.show_labels}
//                         >
//                             {previewData.map((entry, idx) => (
//                                 <Cell key={`cell-${idx}`} fill={colors[idx % colors.length] ?? "#000"} />
//                             ))}
//                         </Pie>
//                         {options.show_legend && <Legend />}
//                         {options.show_tooltip && <Tooltip />}
//                     </PieChart>
//                 </ResponsiveContainer>
//             );
//         case "table":
//             if (!previewData?.length) return <div className="text-gray-400">Aucune donnée pour la table</div>;

//             const rows = options.rows ?? [];
//             const metrics = options.metrics ?? [];
//             const customColumns = options.table_columns ?? [];

//             // Si customColumns existe → priorité à l'affichage custom
//             const columns =
//                 customColumns.length > 0
//                     ? customColumns
//                     : [...rows, ...metrics].map((key: string) => ({
//                         field: key,
//                         label: key,
//                     }));

//             return (
//                 <div className="overflow-auto border rounded bg-white p-2">
//                     <table className="table-auto w-full border-collapse">
//                         <thead>
//                             <tr>
//                                 {columns.map((col) => (
//                                     <th key={col.field} className="border-b px-3 py-2 text-left bg-gray-100 font-semibold">
//                                         {col.label}
//                                     </th>
//                                 ))}
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {previewData?.length ? (
//                                 previewData.map((rowData, idx) => (
//                                     <tr key={idx} className="hover:bg-gray-50 transition">
//                                         {columns.map((col) => (
//                                             <td key={col.field} className="border-b px-3 py-2">
//                                                 {rowData?.[col.field] ?? "-"}
//                                             </td>
//                                         ))}
//                                     </tr>
//                                 ))
//                             ) : (
//                                 <tr>
//                                     <td colSpan={columns.length} className="text-center py-4 text-gray-400">
//                                         Aucune donnée disponible
//                                     </td>
//                                 </tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             );
//         case "kpi":
//             if (!previewData?.length) return <div className="text-gray-400">Aucune donnée KPI</div>;
//             return (
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     {(options.metrics ?? []).map((metric: any) => (
//                         <div key={metric} className="p-4 bg-blue-50 border rounded text-center">
//                             <div className="text-gray-500">{metric}</div>
//                             <div className="text-2xl font-bold">
//                                 {previewData[0][metric] ?? 0}
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             );
//         default:
//             return <div style={{ padding: '1rem' }} className="text-gray-400">Aperçu non disponible pour ce type</div>;
//     }
// };

// const ColumnEditor = ({ columns, onChange }: ColumnEditorProps) => {
//     const [localCols, setLocalCols] = useState<(TableColumn & { _id: string })[]>([]);

//     useEffect(() => {
//         setLocalCols(prev => {
//             return (columns ?? []).map((col, index) => {
//                 // Si déjà existant → garder l'ancien _id
//                 const existing = prev[index];

//                 return {
//                     field: String(col.field ?? ""),
//                     label: String(col.label ?? ""),
//                     _id: existing?._id ?? crypto.randomUUID(),
//                 };
//             });
//         });
//     }, [columns]);

//     const emit = (cols: any[]) => {
//         onChange(cols.map(({ _id, ...rest }) => rest));
//     };

//     const updateCol = (id: string, key: keyof TableColumn, value: string) => {
//         setLocalCols(prev => {
//             const updated = prev.map(c =>
//                 c._id === id ? { ...c, [key]: value } : c
//             );
//             emit(updated);
//             return updated;
//         });
//     };

//     const addCol = () => {
//         setLocalCols(prev => {
//             const updated = [
//                 ...prev,
//                 { field: "", label: "", _id: crypto.randomUUID() },
//             ];
//             emit(updated);
//             return updated;
//         });
//     };

//     const removeCol = (id: string) => {
//         setLocalCols(prev => {
//             const updated = prev.filter(c => c._id !== id);
//             emit(updated);
//             return updated;
//         });
//     };


//     return (
//         <div className="border rounded p-3 bg-gray-50 mt-2">
//             <label className="font-semibold mb-2 block">Columns</label>

//             {localCols.length === 0 && (
//                 <div className="text-gray-400 mb-2">Aucune colonne définie</div>
//             )}

//             {localCols.map(col => (
//                 <div key={col._id} className="flex gap-2 mb-2 items-center">
//                     <FormInput
//                         label="Field"
//                         value={col.field}
//                         onChange={e => updateCol(col._id, "field", e.target.value)}
//                         placeholder="Ex: name"
//                         className="flex-1"
//                     />
//                     <FormInput
//                         label="Label"
//                         value={col.label}
//                         onChange={e => updateCol(col._id, "label", e.target.value)}
//                         placeholder="Ex: Nom"
//                         className="flex-1"
//                     />
//                     <button
//                         type="button"
//                         onClick={() => removeCol(col._id)}
//                         className="text-red-500 hover:text-red-700 mt-6"
//                     >
//                         <FaTrash />
//                     </button>
//                 </div>
//             ))}

//             <Button type="button" onClick={addCol} className="mt-2 flex items-center gap-2">
//                 <FaPlus /> Ajouter une colonne
//             </Button>
//         </div>
//     );
// };

// // Chart Options Editor
// const ChartOptionsEditor = ({ chart, setValue }: { chart: DatasetChart; setValue: (field: keyof DatasetChart, value: any) => void }) => {

//     const updateOption = (key: string, value: any) => {
//         const newOptions = { ...chart.options, [key]: value };
//         setValue("options", newOptions);
//     };

//     return (
//         <div className="border p-3 rounded bg-gray-50 mt-4">
//             <h4 className="font-semibold mb-2 flex items-center gap-2">
//                 <FaSlidersH /> Chart Options
//             </h4>

//             {/* Dynamic options by type */}
//             {["line", "bar", "area"].includes(chart.type) && (
//                 <>
//                     <FormInput
//                         label="X Axis"
//                         value={chart.options.x_axis ?? ""}
//                         onChange={e => updateOption("x_axis", e.target.value)}
//                         placeholder="Dimension X"
//                     />
//                     <FormInput
//                         label="Metrics (comma separated)"
//                         value={chart.options.metrics?.join(",") ?? ""}
//                         onChange={e => updateOption("metrics", e.target.value.split(",").map(s => s.trim()))}
//                         placeholder="Ex: sum_case_role_patient,total_id_between_year_2025_2026"
//                     />
//                 </>
//             )}
//             {chart.type === "pie" && (
//                 <>
//                     <FormInput
//                         label="Dimension"
//                         value={chart.options.dimension ?? ""}
//                         onChange={e => updateOption("dimension", e.target.value)}
//                     />
//                     <FormInput
//                         label="Metric"
//                         value={chart.options.metric ?? ""}
//                         onChange={e => updateOption("metric", e.target.value)}
//                     />
//                     <FormCheckbox
//                         label="Show/Display Percentage"
//                         checked={chart.options.show_percentage ?? true}
//                         onChange={e => updateOption("show_percentage", e.target.checked)}
//                     />
//                 </>
//             )}

//             {chart.type === "kpi" && (
//                 <FormInput
//                     label="Metric"
//                     value={chart.options.metric ?? ""}
//                     onChange={(e) => updateOption("metric", e.target.value)}
//                 />
//             )}

//             {/* {chart.type === "table" && (
//                     <FormTextarea
//                         label="Columns JSON"
//                         value={JSON.stringify(chart.options.columns ?? [], null, 2)}
//                         onChange={e => {
//                             try {
//                                 const cols = JSON.parse(e.target.value);
//                                 updateOption("columns", cols);
//                             } catch { }
//                         }}
//                         rows={5}
//                         placeholder='Ex: [{"field": "name", "label": "Nom"}]'
//                     />
//                 )} */}

//             {chart.type === "table" && (
//                 <ColumnEditor
//                     columns={chart.options.table_columns ?? []}
//                     onChange={(cols) => updateOption("table_columns", cols)}
//                 />
//             )}

//             {/* Visual options */}
//             <h4 className="font-semibold mt-4 mb-2 flex items-center gap-2">
//                 <FaPalette /> Visual Options
//             </h4>

//             <ColorSchemePicker
//                 label="Color Scheme (comma separated)"
//                 value={chart.options.color_scheme ?? []}
//                 onChange={(colors) => updateOption("color_scheme", colors)}
//                 maxColors={10}
//                 placeholder="Ex: category10, tableau10, accent"
//             />

//             <div className={styles.grid + ' ' + styles.grid3}>
//                 <FormCheckbox
//                     label="Show Legend"
//                     checked={chart.options.show_legend ?? true}
//                     onChange={e => updateOption("show_legend", e.target.checked)}
//                 />
//                 <FormCheckbox
//                     label="Show Labels"
//                     checked={chart.options.show_labels ?? true}
//                     onChange={e => updateOption("show_labels", e.target.checked)}
//                 />
//                 <FormCheckbox
//                     label="Show Tooltip"
//                     checked={chart.options.show_tooltip ?? true}
//                     onChange={e => updateOption("show_tooltip", e.target.checked)}
//                 />
//             </div>

//             <div className={styles.grid + ' ' + styles.grid3}>
//                 <FormCheckbox
//                     label="Show Grid"
//                     checked={chart.options.show_grid ?? true}
//                     onChange={e => updateOption("show_grid", e.target.checked)}
//                 />
//                 <FormInput
//                     label="Chart Width"
//                     type="number"
//                     value={chart.options.width ?? 600}
//                     onChange={e => updateOption("width", parseInt(e.target.value))}
//                 />
//                 <FormInput
//                     label="Chart Height"
//                     type="number"
//                     value={chart.options.height ?? 400}
//                     onChange={e => updateOption("height", parseInt(e.target.value))}
//                 />
//             </div>

//             <div className={styles.grid + ' ' + styles.grid3}>
//                 <FormInput
//                     label="Title"
//                     value={chart.options.title ?? ""}
//                     onChange={e => updateOption("title", e.target.value)}
//                 />
//                 <FormInput
//                     label="Subtitle"
//                     value={chart.options.subtitle ?? ""}
//                     onChange={e => updateOption("subtitle", e.target.value)}
//                 />
//             </div>
//         </div>
//     );
// };

// const useUndoableState = <T = any>(initialState: T) => {
//     const [history, setHistory] = useState<T[]>([initialState]);
//     const [pointer, setPointer] = useState(0);

//     const state = history[pointer];

//     const set = (newState: T) => {
//         const newHistory = history.slice(0, pointer + 1);
//         newHistory.push(newState);
//         setHistory(newHistory);
//         setPointer(newHistory.length - 1);
//     };

//     const undo = () => {
//         if (pointer > 0) setPointer(pointer - 1);
//     };

//     const redo = () => {
//         if (pointer < history.length - 1) setPointer(pointer + 1);
//     };

//     return { state, set, undo, redo, canUndo: pointer > 0, canRedo: pointer < history.length - 1 };
// }

// export const DatasetChartTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {
//     const [tenants, setTenants] = useState<any[]>([]);
//     const [datasets, setDatasets] = useState<Dataset[]>([]);
//     const [queries, setQueries] = useState<DatasetQuery[]>([]);

//     const [tenant_id, setTenantId] = useState<number | undefined>(undefined);
//     const [dataset_id, setDatasetId] = useState<number | undefined>(undefined);
//     const [query_id, setQueryId] = useState<number | undefined>(undefined);

//     const [layout, setLayout] = useState<Layout | undefined>(undefined);
//     const [charts, setCharts] = useState<DatasetChart[]>([]);
//     const [breakpoint, setBreakpoint] = useState<string | undefined>(undefined);

//     const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
//     const [containerCols, setContainerCols] = useState<number | undefined>(undefined);
//     const [containerMargin, setContainerMargin] = useState<[number, number] | undefined>(undefined);
//     const [containerPadding, setContainerPadding] = useState<[number, number] | undefined | null>(undefined);

//     const [expertMode, setExpertMode] = useState<boolean>(false);
//     const [chartType, setChartType] = useState<string>("table");
//     const [selectedChart, setSelectedChart] = useState<DatasetChart | null>(null);

//     const suggestChartType = (rows: string[], metrics: string[]) => {
//         if (rows.length === 1 && metrics.length === 1) return "bar";
//         if (rows.length === 1 && metrics.length > 1) return "line";
//         if (rows.length === 0 && metrics.length === 1) return "kpi";
//         if (rows.length === 2 && metrics.length === 1) return "stacked_bar";
//         return "table";
//     };

//     const didLoad = useRef(false);

//     useEffect(() => {
//         if (didLoad.current) return;
//         didLoad.current = true;
//         const loadTenants = async () => {
//             const t = await tenantService.all();
//             setTenants(t ?? []);
//             setTenantId(t?.length ? (t[0].id ?? 0) : 0);
//         };
//         loadTenants();
//     }, []);

//     useEffect(() => {
//         if (!tenant_id) return;
//         const load = async () => {
//             const d = await datasetService.all(tenant_id);
//             setDatasets(d ?? []);
//             setDatasetId(d?.length ? (d[0].id ?? 0) : 0);
//         };
//         load();
//     }, [tenant_id]);

//     useEffect(() => {
//         if (!tenant_id || !dataset_id) return;
//         const load = async () => {
//             const q = await queryService.all(tenant_id, dataset_id);
//             setQueries(q || []);
//             setQueryId(q?.length ? (q[0].id ?? 0) : 0);
//         };
//         load();
//     }, [tenant_id, dataset_id]);


//     useEffect(() => {
//         const suggestion = suggestChartType(
//             selectedChart?.options?.rows ?? [],
//             selectedChart?.options?.metrics ?? []
//         );
//         if (!expertMode) setChartType(suggestion);
//     }, [selectedChart?.options?.rows, selectedChart?.options?.metrics]);

//     const defaultTenant = useMemo(() => {
//         return { required: true, ids: [tenant_id, dataset_id, query_id] };
//     }, [tenant_id, dataset_id, query_id]);

//     const SuggestionsPanel = ({ chart }: { chart: DatasetChart }) => {
//         const suggestions = [];

//         if (!chart.options.rows?.length) {
//             suggestions.push("Ajoutez une dimension (ex: Mois, Région)");
//         }

//         if (!chart.options.metrics?.length) {
//             suggestions.push("Ajoutez une métrique (ex: Total ventes)");
//         }

//         if (chart.options.rows?.length > 1 && chart.type === "pie") {
//             suggestions.push("Le graphique Pie supporte 1 seule dimension");
//         }

//         if (!suggestions.length) return null;

//         return (
//             <div className="bg-yellow-50 p-3 rounded text-sm">
//                 <strong>Suggestions :</strong>
//                 <ul className="list-disc ml-4">
//                     {suggestions.map((s, i) => <li key={i}>{s}</li>)}
//                 </ul>
//             </div>
//         );
//     };

//     return (
//         <>

//             <div className="grid grid-cols-3 gap-4 mt-4">

//                 <FormSelect
//                     label={`Tenant List`}
//                     value={tenant_id}
//                     options={tenants.map((c) => ({ value: c.id, label: c.name }))}
//                     onChange={(value) => {
//                         setTenantId(value);
//                         setDatasetId(0);
//                     }}
//                     placeholder="Sélectionner Tenant"
//                     leftIcon={<FaDatabase />}
//                     required={true}
//                 />

//                 <FormSelect
//                     label={`Dataset List`}
//                     value={dataset_id}
//                     options={datasets.map((c) => ({ value: c.id, label: c.name }))}
//                     onChange={(value) => {
//                         setDatasetId(value);
//                         setQueryId(0);
//                     }}
//                     placeholder="Sélectionner Dataset"
//                     leftIcon={<FaDatabase />}
//                     required={true}
//                 />

//                 <FormSelect
//                     label={`Queries List`}
//                     value={query_id}
//                     options={queries.map((c) => ({ value: c.id, label: c.name }))}
//                     onChange={(value) => {
//                         setQueryId(value)
//                     }}
//                     placeholder="Sélectionner Query"
//                     leftIcon={<FaDatabase />}
//                     required={true}
//                 />
//             </div>
//             <br />
//             <AdminEntityCrudModule<DatasetChart>
//                 ref={ref}
//                 modalSize="yl"
//                 title="Gestion des DatasetChart"
//                 icon={<Shield size={20} />}
//                 entityName="DatasetChart"
//                 columns={sourceColumns}
//                 defaultValue={DEFAULT_FORM}
//                 service={chartService}
//                 defaultTenant={defaultTenant}
//                 // isValid={(r) => !!r.name && !!r.dataset_id && !!r.query_id}
//                 isValid={(r) => r.name.trim().length > 0 && r.dataset_id != null && r.query_id != null}

//                 renderForm={(chart, setValue, saving) => (
//                     <>
//                         <div className={styles.grid + ' ' + styles.grid3}>
//                             <FormSelect
//                                 label="Tenant"
//                                 value={chart.tenant_id}
//                                 options={tenants.map(t => ({ value: t.id, label: t.name }))}
//                                 onChange={v => setValue("tenant_id", v)}
//                                 required
//                             />
//                             <FormSelect
//                                 label="Dataset"
//                                 value={chart.dataset_id}
//                                 options={datasets.map(d => ({ value: d.id, label: d.name }))}
//                                 onChange={v => setValue("dataset_id", v)}
//                                 required
//                             />
//                             <FormSelect
//                                 label="Query"
//                                 value={chart.query_id}
//                                 options={queries.map(q => ({ value: q.id, label: q.name }))}
//                                 onChange={v => setValue("query_id", v)}
//                                 required
//                             />
//                         </div>

//                         <div className={styles.grid + ' ' + styles.grid3}>
//                             <FormSelect
//                                 label="Chart Type"
//                                 value={chart.type}
//                                 options={SqlChartTypeList.map(c => ({ value: c, label: c }))}
//                                 onChange={v => setValue("type", v)}
//                                 required
//                             />
//                             <FormInput
//                                 label="Titre du graphique"
//                                 value={chart.name}
//                                 onChange={e => setValue("name", e.target.value)}
//                                 required
//                             />
//                             <FormSwitch
//                                 label="Active"
//                                 checked={chart.is_active}
//                                 onChange={e => setValue("is_active", e.target.checked)}
//                             />
//                         </div>

//                         <DndProvider backend={HTML5Backend}>
//                             <div className="grid grid-cols-3 gap-4 mt-4">
//                                 {/* Columns */}
//                                 <DragDropZone
//                                     title="Columns"
//                                     items={chart.options?.columns || []}
//                                     onDrop={(item) => {
//                                         setValue("options", {
//                                             ...chart.options,
//                                             columns: Array.from(
//                                                 new Set([...(chart.options?.columns || []), item.key])
//                                             ),
//                                         });
//                                     }}
//                                 />

//                                 {/* Rows */}
//                                 <DragDropZone
//                                     title="Rows"
//                                     items={chart.options?.rows || []}
//                                     onDrop={(item) => {
//                                         setValue("options", {
//                                             ...chart.options,
//                                             rows: Array.from(new Set([...(chart.options?.rows || []), item.key])),
//                                         });
//                                     }}
//                                 />

//                                 {/* Values */}
//                                 <DragDropZone
//                                     title="Values"
//                                     items={chart.options?.metrics || []}
//                                     onDrop={(item) => {
//                                         setValue("options", {
//                                             ...chart.options,
//                                             metrics: Array.from(new Set([...(chart.options?.metrics || []), item.key])),
//                                         });
//                                     }}
//                                 />
//                             </div>

//                             {/* Transposer Columns <-> Rows */}
//                             <button
//                                 type="button"
//                                 className="mt-2 p-2 bg-blue-500 text-white rounded flex items-center"
//                                 onClick={() => setValue("options", {
//                                     ...chart.options,
//                                     columns: chart.options?.rows ?? [],
//                                     rows: chart.options?.columns ?? []
//                                 })}
//                             >
//                                 <FaExchangeAlt className="mr-2" /> Transposer Columns ↔ Rows
//                             </button>

//                             {/* Source dimensions et metrics draggable */}
//                             <div className="mt-4 grid grid-cols-2 gap-4">
//                                 <h4>Dimensions</h4>
//                                 {queries.find(q => q.id === chart.query_id)?.query_json?.select.dimensions?.map((dim) => (
//                                     <DraggableItem key={dim} item={dim} type="dimension" />
//                                 ))}

//                                 <h4 className="mt-2">Metrics</h4>
//                                 {queries.find(q => q.id === chart.query_id)?.query_json?.select.metrics?.map((met) => (
//                                     <DraggableItem key={met} item={met} type="metric" />
//                                 ))}
//                             </div>
//                         </DndProvider>

//                         <ChartOptionsEditor chart={chart} setValue={setValue} />

//                         <FormTextarea
//                             label="Commentaire / Analyse"
//                             value={chart.description ?? ""}
//                             onChange={e => setValue("description", e.target.value)}
//                         />

//                         {/* Live preview */}
//                         <div className="dashboard-builder">
//                             <ResponsiveGridLayout
//                                 className="layout"
//                                 width={containerWidth ?? 200}
//                                 layouts={{ lg: layout }}
//                                 breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
//                                 cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
//                                 rowHeight={120}
//                                 onLayoutChange={(layout: Layout, layouts: Partial<Record<string, Layout>>) => setLayout(layout)}
//                                 // draggableHandle=".drag-handle"
//                                 breakpoint={breakpoint}
//                                 maxRows={undefined}
//                                 margin={containerMargin}
//                                 containerPadding={containerPadding}
//                                 compactor={undefined}
//                                 onBreakpointChange={(newBreakpoint: string, cols: number) => setBreakpoint(newBreakpoint)}
//                                 onWidthChange={(width: number, margin: readonly [number, number], cols: number, padding: readonly [number, number] | null) => {
//                                     setContainerWidth(width)
//                                     setContainerMargin(margin as [number, number])
//                                     setContainerCols(cols)
//                                     setContainerPadding(padding as [number, number])
//                                 }}
//                             >
//                                 <div className="mt-6">
//                                     <h3 className="text-lg font-bold mb-2">Aperçu Live</h3>

//                                     {charts.map(chart => (
//                                         <div key={chart.id} className="border rounded p-2 bg-white">
//                                             <div className="drag-handle cursor-move bg-gray-200 px-2 py-1 mb-1 font-semibold">
//                                                 {chart.name} ({chart.type})
//                                             </div>
//                                             {renderChartPreview(chart)}
//                                         </div>
//                                     ))}
//                                 </div>
//                             </ResponsiveGridLayout>
//                         </div>
//                     </>
//                 )}
//             />
//         </>
//     );
// });
