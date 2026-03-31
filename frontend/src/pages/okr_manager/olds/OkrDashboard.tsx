// frontend/src/Dashboard.tsx
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Tooltip } from "react-tooltip";

interface KeyResult {
    id: string;
    title: string;
    progress: number;
}

interface OkrObjective {
    id: string;
    title: string;
    progress: number;
    krs: KeyResult[];
}

interface OkrTeam {
    id: string;
    team_id: string;
    progress: number;
    objectives: OkrObjective[];
}

interface OkrGlobal {
    id: string;
    title: string;
    progress: number;
    teams: OkrTeam[];
}

interface OkrProject {
    id: string;
    name: string;
    progress: number;
    budget: number;
    donor: string;
}


// Progress Bar avec couleurs
const ProgressBar = ({ value }: { value: number }) => {
    let color = "#4caf50"; // vert
    if (value < 50) color = "#f44336"; // rouge
    else if (value < 80) color = "#ff9800"; // orange

    return (
        <Tooltip content={`${value.toFixed(1)}%`}>
            <div style={{ border: "1px solid #ccc", width: "100%", borderRadius: 4, height: 16 }}>
                <div style={{ width: `${value}%`, backgroundColor: color, height: 16, borderRadius: 4 }} />
            </div>
        </Tooltip>
    );
};


// Modal d’édition
const EditModal = ({ entity, onSave, onClose }: any) => {
    const [state, setState] = useState(entity);

    return (
        <div className="modal">
            <h3>Edit {entity.title}</h3>
            <input value={state.title} onChange={e => setState({ ...state, title: e.target.value })} />
            <input type="number" value={state.progress} onChange={e => setState({ ...state, progress: parseFloat(e.target.value) })} />
            <button onClick={() => onSave(state)}>Save</button>
            <button onClick={onClose}>Close</button>
        </div>
    );
};


export default function OkrDashboard() {
    const [projects, setProjects] = useState<OkrProject[]>([]);
    const [orcGlobals, setOrcGlobals] = useState<OkrGlobal[]>([]);
    const [filterTeam, setFilterTeam] = useState<string>("");
    const [editEntity, setEditEntity] = useState<any>(null);

    // Fetch Data
    const fetchData = useCallback(() => {
        axios.get("/api/dashboard").then(res => {
            setProjects(res.data.projects);
            setOrcGlobals(res.data.orc_globals);
        });
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Refresh auto toutes les 10s
        return () => clearInterval(interval);
    }, [fetchData]);

    // Drag & Drop
    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        // Exemple: réordonner projets
        const reordered = Array.from(projects);
        const [removed] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, removed);
        setProjects(reordered);
        // Ici tu peux envoyer la nouvelle hiérarchie au backend si nécessaire
    };

    const handleSave = (entity: any) => {
        axios.post("/api/update", {
            type: entity.type,
            id: entity.id,
            updates: { title: entity.title, progress: entity.progress }
        }).then(() => fetchData());
        setEditEntity(null);
    };

    // Filtre équipes
    const filteredGlobals = filterTeam
        ? orcGlobals.map(g => ({
            ...g,
            teams: g.teams.filter(t => t.team_id === filterTeam)
        })).filter(g => g.teams.length)
        : orcGlobals;

    return (
        <div style={{ padding: 20 }}>
            <h2>📊 Projets</h2>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="projects">
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                            <AnimatePresence>
                                {projects.map((proj, index) => (
                                    <Draggable key={proj.id} draggableId={proj.id} index={index}>
                                        {(provided) => (
                                            <motion.div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps as any}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                style={{
                                                    marginBottom: 16,
                                                    padding: 8,
                                                    border: "1px solid #ddd",
                                                    borderRadius: 4,
                                                    backgroundColor: "#f9f9f9",
                                                    ...provided.draggableProps.style
                                                }}
                                                onDoubleClick={() => setEditEntity({ ...proj, type: "project" })}
                                            >
                                                <strong>{proj.name}</strong> (Budget: {proj.budget} USD, Donor: {proj.donor})
                                                <ProgressBar value={proj.progress} />
                                            </motion.div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </AnimatePresence>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <h2>🎯 ORC Globals</h2>
            <label>Filtrer par équipe: </label>
            <input value={filterTeam} onChange={e => setFilterTeam(e.target.value)} placeholder="Team ID" />
            {filteredGlobals.map(orc => (
                <div key={orc.id} style={{ marginBottom: 20, paddingLeft: 10, borderLeft: "2px solid #888" }}>
                    <strong>{orc.title}</strong>
                    <ProgressBar value={orc.progress} />
                    {orc.teams.map(team => (
                        <div key={team.id} style={{ marginLeft: 20 }}>
                            <strong>Team: {team.team_id}</strong>
                            <ProgressBar value={team.progress} />
                            {team.objectives.map(obj => (
                                <div key={obj.id} style={{ marginLeft: 20 }} onDoubleClick={() => setEditEntity({ ...obj, type: "objective" })}>
                                    <span>{obj.title}</span>
                                    <ProgressBar value={obj.progress} />
                                    {obj.krs.map(kr => (
                                        <div key={kr.id} style={{ marginLeft: 20 }} onDoubleClick={() => setEditEntity({ ...kr, type: "kr" })}>
                                            {kr.title} <ProgressBar value={kr.progress} />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ))}

            {editEntity && <EditModal entity={editEntity} onSave={handleSave} onClose={() => setEditEntity(null)} />}

        </div>
    );
}