
// export default function VisualizationView() {


//     // ---------------- UI ----------------
//     return (
//         <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">

//             {/* HEADER */}
//             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
//                 <div>
//                     <h1 className="text-3xl font-bold tracking-tight">📊 Visualizations</h1>
//                 </div>

//                 <div className="flex gap-2">
//                     <Button variant="outline" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
//                         Toggle View
//                     </Button>
//                 </div>
//             </div>

//             {/* FILTER BAR */}
//             <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex flex-wrap gap-3 items-center">
//                 <div className="flex-1 min-w-[200px]">
//                     <FormInput
//                         placeholder="Search visualization..."
//                         value={search}
//                         onChange={e => setSearch(e.target.value)}
//                     />
//                 </div>
//             </div>

//             {/* GRID */}
//             <div className={viewMode === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
//                 {filtered.map(v => (
//                     <Card key={v.id} className="hover:shadow-xl transition-all rounded-2xl">
//                         <div className="p-4 space-y-4">
//                             <VisualizationViewModule visualization={v} charts={charts} removeView={remove} openView={openView} />
//                         </div>
//                     </Card>
//                 ))}
//             </div>
//         </div >
//     );
// }



