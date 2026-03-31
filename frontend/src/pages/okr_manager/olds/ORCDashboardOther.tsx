import React, { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell, BarChart, Bar } from "recharts";
import axios from "axios";

// ---------------------
// Types
// ---------------------
interface Activity { id: string; title: string; progress: number; beneficiaries: number; impact: number; }
interface KR {
  outcomes: any[];
  indicators: any[];
  justUpdated: any;
  impact: number; id: string; title: string; progress: number; weight: number; activities: Activity[];
}
interface Objective { id: string; title: string; progress: number; krs: KR[]; }
interface Team { id: string; team_id: string; progress: number; objectives: Objective[]; }
interface ORCGlobal { id: string; title: string; progress: number; teams: Team[]; snapshots: { date: string; progress: number }[]; }

// ---------------------
// Couleur selon progression
// ---------------------
const getColor = (value: number) =>
  value < 50 ? "#f44336" : value < 80 ? "#ff9800" : "#4caf50";

// ---------------------
// Tooltip KR
// ---------------------
const BubbleTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const kr = payload[0].payload as KR;
    return (
      <div style={{ background: "#fff", padding: 8, border: "1px solid #ccc" }}>
        <strong>{kr.title}</strong><br />
        Progression: {kr.progress.toFixed(1)}%<br />
        Poids: {kr.weight}<br />
        Activités: {kr.activities.length}
      </div>
    );
  }
  return null;
};

// Simuler l'update live après activité complétée
const updateKRProgress = (kr: KR, completedValue: number) => {
  kr.progress = Math.min(100, kr.progress + completedValue * kr.impact * 100);
  kr.justUpdated = true; // trigger animation pulse
  setTimeout(() => { 
    kr.justUpdated = false; 
    // setOrcGlobals([...orcGlobals]); 
  }, 1200);
};

// Propagation vers Objectives et Teams
const updateObjectiveProgress = (obj: Objective) => {
  obj.progress = obj.krs.reduce((acc, k) => acc + k.progress * k.weight, 0) / obj.krs.reduce((acc, k) => acc + k.weight, 0);
};

const updateTeamProgress = (team: Team) => {
  team.progress = team.objectives.reduce((acc, o) => acc + o.progress, 0) / team.objectives.length;
};

const updateORCGlobalProgress = (orc: ORCGlobal) => {
  orc.progress = orc.teams.reduce((acc, t) => acc + t.progress, 0) / orc.teams.length;
};

// ---------------------
// Modal KR
// ---------------------
const KRModal = ({ kr, onClose }: { kr: KR; onClose: () => void }) => (
  <motion.div
    className="modal"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.25 }}
  >
    <h3>{kr.title} - Activités liées</h3>
    <table>
      <thead>
        <tr>
          <th>Activity</th><th>Progress</th><th>Beneficiaries</th><th>Impact</th>
        </tr>
      </thead>
      <tbody>
        {kr.activities.map(a => (
          <tr key={a.id}>
            <td>{a.title}</td>
            <td>{a.progress.toFixed(1)}%</td>
            <td>{a.beneficiaries}</td>
            <td>{a.impact}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <button onClick={onClose}>Close</button>
  </motion.div>
);

// ---------------------
// Dashboard
// ---------------------
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

  // ---------------------
  // Drag & Drop
  // ---------------------
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId, type } = result;
    const updatedOrc = [...orcGlobals];

    if (type === "objective") {
      // Déplacer Objective entre Teams
      const sourceTeam = updatedOrc[source.droppableId as any].teams.find(t => t.objectives.find(o => o.id === draggableId));
      const destTeam = updatedOrc[destination.droppableId as any].teams.find(t => t.id === updatedOrc[destination.droppableId as any].teams[destination.index].id);

      if (!sourceTeam || !destTeam) return;

      const objIndex = sourceTeam.objectives.findIndex(o => o.id === draggableId);
      const [movedObj] = sourceTeam.objectives.splice(objIndex, 1);
      destTeam.objectives.splice(destination.index, 0, movedObj);
    } else if (type === "kr") {
      // Déplacer KR entre Objectives
      const sourceObj = updatedOrc[source.droppableId as any].teams.flatMap(t => t.objectives).find(o => o.krs.find(k => k.id === draggableId));
      const destObj = updatedOrc[destination.droppableId as any].teams.flatMap(t => t.objectives)[destination.index];

      if (!sourceObj || !destObj) return;

      const krIndex = sourceObj.krs.findIndex(k => k.id === draggableId);
      const [movedKR] = sourceObj.krs.splice(krIndex, 1);
      destObj.krs.push(movedKR);
    }

    setOrcGlobals(updatedOrc);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📊 Dashboard ORC Interactif – Production Ready</h1>

      <select onChange={e => setFilterTeam(e.target.value || null)} value={filterTeam || ""}>
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
              .filter(t => !filterTeam || t.team_id === filterTeam)
              .map((team, idxTeam) => (
                <Droppable droppableId={String(idxTeam)} type="objective" key={team.id}>
                  {(provided) => (
                    <motion.div ref={provided.innerRef} {...provided.droppableProps} style={{ marginLeft: 20 }}>
                      <h3>Team: {team.team_id} - Progression: {team.progress.toFixed(1)}%</h3>

                      {team.objectives.map((obj, idxObj) => (
                        <Draggable draggableId={obj.id} index={idxObj} key={obj.id}>
                          {(prov) => (
                            <motion.div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps as any}
                              className="motion-div"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              transition={{ duration: 0.3 }}
                            >
                              <strong>{obj.title} - Progression: {obj.progress.toFixed(1)}%</strong>

                              {/* KRs */}
                              <Droppable droppableId={String(idxObj)} type="kr">
                                {(krProv) => (
                                  <motion.div ref={krProv.innerRef} {...krProv.droppableProps} style={{ marginLeft: 20 }}>
                                    {obj.krs.map((kr, idxKR) => (
                                      <Draggable draggableId={kr.id} index={idxKR} key={kr.id}>
                                        {(cellProv) => (
                                          <>
                                            <motion.div
                                              ref={cellProv.innerRef}
                                              {...cellProv.draggableProps}
                                              {...cellProv.dragHandleProps as any}
                                              style={{ display: "inline-block", margin: 8, cursor: "grab" }}
                                              whileHover={{ scale: 1.2 }}
                                              onClick={() => setSelectedKR(kr)}
                                            >
                                              <ResponsiveContainer width={60} height={60}>
                                                <ScatterChart>
                                                  <XAxis type="number" dataKey="weight" hide />
                                                  <YAxis type="number" dataKey="progress" hide domain={[0, 100]} />
                                                  <Tooltip content={<BubbleTooltip />} />
                                                  <Scatter data={[kr]} fill={getColor(kr.progress)} />
                                                </ScatterChart>
                                              </ResponsiveContainer>
                                              <div style={{ textAlign: "center", fontSize: 12 }}>{kr.title}</div>
                                            </motion.div>


                                            <motion.div
                                              ref={cellProv.innerRef}
                                              {...cellProv.draggableProps}
                                              {...cellProv.dragHandleProps as any}
                                              className={`kr-bubble ${kr.impact > 0.7 ? "high-impact" : kr.impact > 0.4 ? "medium-impact" : "low-impact"} ${kr.justUpdated ? "pulse" : ""}`}
                                              onClick={() => setSelectedKR(kr)}
                                            >
                                              <ResponsiveContainer width={60} height={60}>
                                                <ScatterChart>
                                                  <XAxis type="number" dataKey="weight" hide />
                                                  <YAxis type="number" dataKey="progress" hide domain={[0, 100]} />
                                                  <Tooltip content={<BubbleTooltip />} />
                                                  <Scatter data={[kr]} fill="transparent" />
                                                </ScatterChart>
                                              </ResponsiveContainer>
                                              <div style={{ textAlign: "center", fontSize: 10 }}>
                                                {kr.title}<br />
                                                {kr.indicators?.map(ind => (
                                                  <span className="indicator-badge" key={ind.id}>{ind.name}: {ind.value}</span>
                                                ))}
                                                {kr.outcomes?.map(out => (
                                                  <span className="outcome-badge" key={out.id}>{out.description}</span>
                                                ))}
                                              </div>
                                            </motion.div>

                                          </>
                                        )}
                                      </Draggable>
                                    ))}
                                    {krProv.placeholder}
                                  </motion.div>
                                )}
                              </Droppable>
                            </motion.div>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}
                    </motion.div>
                  )}
                </Droppable>
              ))}

            {/* Snapshots mini-graph */}
            <h4>Historique Snapshots</h4>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={orc.snapshots}>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={[0, 100]} />
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