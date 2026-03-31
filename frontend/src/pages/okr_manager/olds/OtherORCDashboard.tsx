import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell, BarChart, Bar } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

// ---------------------
// Types
// ---------------------
interface Activity { id: string; title: string; progress: number; beneficiaries: number; impact: number; }
interface KR { id: string; title: string; progress: number; weight: number; activities: Activity[]; }
interface Objective { id: string; title: string; progress: number; krs: KR[]; }
interface Team { id: string; team_id: string; progress: number; objectives: Objective[]; }
interface ORCGlobal { id: string; title: string; progress: number; teams: Team[]; snapshots: { date: string; progress: number }[]; }

// ---------------------
// Helper Couleur
// ---------------------
const getColor = (value: number) => value < 50 ? "#f44336" : value < 80 ? "#ff9800" : "#4caf50";

// ---------------------
// Tooltip KR
// ---------------------
const BubbleTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const kr = payload[0].payload as KR;
        return (
            <div style={{ background: "#fff", padding: 8, border: "1px solid #ccc" }}>
                <strong>{kr.title}</strong>
                <br />Progression: {kr.progress.toFixed(1)}%
                <br />Poids: {kr.weight}
                <br />Activités: {kr.activities.length}
            </div>
        );
    }
    return null;
};

// ---------------------
// Modal KR
// ---------------------
const KRModal = ({ kr, onClose }: { kr: KR; onClose: () => void }) => (
    <div className="modal">
        <h3>{kr.title} - Activités liées</h3>
        <table>
            <thead>
                <tr>
                    <th>Activity</th><th>Progress</th><th>Beneficiaries</th><th>Impact</th>
                </tr>
            </thead>
            <tbody>
                {kr.activities.map(act => (
                    <tr key={act.id}>
                        <td>{act.title}</td>
                        <td>{act.progress.toFixed(1)}%</td>
                        <td>{act.beneficiaries}</td>
                        <td>{act.impact}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        <button onClick={onClose}>Close</button>
    </div>
);

{/* <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    transition={{ duration: 0.3 }}
    className="motion-div"
>
</motion.div>

<Cell
    key={kr.id}
    fill={getColor(kr.progress)}
    r={kr.weight * 20 + 10}
    // scale animation à l'apparition
    className="kr-bubble"
/> */}



export default function ORCDashboard() {
    const [orcGlobals, setOrcGlobals] = useState<ORCGlobal[]>([]);
    const [selectedKR, setSelectedKR] = useState<KR | null>(null);
    const [filterTeam, setFilterTeam] = useState<string | null>(null);

    // Fetch data
    const fetchData = useCallback(() => {
        axios.get("/api/dashboard").then(res => setOrcGlobals(res.data.orc_globals));
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Drag & Drop
    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const { source, destination, draggableId } = result;

        const updatedOrc = [...orcGlobals];
        const objSource = updatedOrc[source.droppableId as any].teams[source.index];
        const objDest = updatedOrc[destination.droppableId as any].teams[destination.index];
        // Logique pour swap / réordonner KRs ou Objectives
        console.log("Drag:", draggableId, source, destination);
        setOrcGlobals(updatedOrc);
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>📊 Dashboard ORC Interactif – Production Ready</h1>

            {/* Filtrage par équipe */}
            <select onChange={e => setFilterTeam(e.target.value)} value={filterTeam || ""}>
                <option value="">Toutes les équipes</option>
                {orcGlobals.flatMap(o => o.teams).map(t => (
                    <option key={t.id} value={t.team_id}>{t.team_id}</option>
                ))}
            </select>

            <DragDropContext onDragEnd={onDragEnd}>
                {orcGlobals.map((orc, idxOrc) => (
                    <div key={orc.id} style={{ marginBottom: 50 }}>
                        <h2>{orc.title} - Progression: {orc.progress.toFixed(1)}%</h2>

                        {orc.teams
                            .filter(team => !filterTeam || team.team_id === filterTeam)
                            .map((team, idxTeam) => (
                            <Droppable droppableId={String(idxTeam)} key={team.id} direction="vertical">
                                {(provided) => (
                                    <motion.div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        style={{ marginLeft: 20, marginTop: 20 }}
                                    >
                                        <h3>Team: {team.team_id} - Progression: {team.progress.toFixed(1)}%</h3>

                                        {team.objectives.map((obj, idxObj) => (
                                            <Draggable draggableId={obj.id} index={idxObj} key={obj.id}>
                                                {(prov) => (
                                                    <motion.div
                                                        ref={prov.innerRef}
                                                        {...prov.draggableProps}
                                                        {...prov.dragHandleProps as any}
                                                        style={{ ...prov.draggableProps.style, marginLeft: 20, marginTop: 10 }}
                                                    >
                                                        <strong>{obj.title} - Progression: {obj.progress.toFixed(1)}%</strong>

                                                        <ResponsiveContainer width="100%" height={150}>
                                                            <ScatterChart>
                                                                <XAxis type="number" dataKey="weight" name="Weight" hide />
                                                                <YAxis type="number" dataKey="progress" name="Progress" hide domain={[0,100]} />
                                                                <Tooltip content={<BubbleTooltip />} />
                                                                <Scatter
                                                                    data={obj.krs}
                                                                    fill="#8884d8"
                                                                    onClick={kr => setSelectedKR(kr)}
                                                                >
                                                                    {obj.krs.map(kr => (
                                                                        <Cell
                                                                            key={kr.id}
                                                                            fill={getColor(kr.progress)}
                                                                            r={kr.weight * 20 + 10}
                                                                        />
                                                                    ))}
                                                                </Scatter>
                                                            </ScatterChart>
                                                        </ResponsiveContainer>
                                                    </motion.div>
                                                )}
                                            </Draggable>
                                        ))}

                                        {provided.placeholder}
                                    </motion.div>
                                )}
                            </Droppable>
                        ))}

                        {/* Mini-graph snapshots */}
                        <h4>Historique Snapshots</h4>
                        <ResponsiveContainer width="100%" height={80}>
                            <BarChart data={orc.snapshots}>
                                <XAxis dataKey="date" hide />
                                <YAxis hide domain={[0,100]} />
                                <Tooltip />
                                <Bar dataKey="progress">
                                    {orc.snapshots.map((snap, idx) => (
                                        <Cell key={idx} fill={getColor(snap.progress)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ))}
            </DragDropContext>

            <AnimatePresence>
                {selectedKR && <KRModal kr={selectedKR} onClose={() => setSelectedKR(null)} />}
            </AnimatePresence>
        </div>
    );
}




