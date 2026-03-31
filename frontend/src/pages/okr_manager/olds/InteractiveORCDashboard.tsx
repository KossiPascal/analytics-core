import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { motion } from "framer-motion";

// Types
interface Activity { id: string; title: string; progress: number; beneficiaries: number; impact: number; }
interface KR { id: string; title: string; progress: number; weight: number; activities: Activity[]; }
interface Objective { id: string; title: string; progress: number; krs: KR[]; }
interface Team { id: string; team_id: string; progress: number; objectives: Objective[]; }
interface ORCGlobal { id: string; title: string; progress: number; teams: Team[]; snapshots: { date: string; progress: number }[]; }

// Couleur selon progression
const getColor = (value: number) => {
    if (value < 50) return "#f44336";
    if (value < 80) return "#ff9800";
    return "#4caf50";
};

// Tooltip customisé pour bulles
const BubbleTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const kr = payload[0].payload as KR;
        return (
            <div style={{ background: "#fff", padding: 8, border: "1px solid #ccc" }}>
                <strong>{kr.title}</strong>
                <br />
                Progression: {kr.progress.toFixed(1)}%
                <br />
                Poids: {kr.weight}
                <br />
                Activités: {kr.activities.length}
            </div>
        );
    }
    return null;
};

// Modal affichage activités d’un KR
const KRModal = ({ kr, onClose }: { kr: KR; onClose: () => void }) => {
    return (
        <div className="modal">
            <h3>{kr.title} - Activités liées</h3>
            <table>
                <thead>
                    <tr>
                        <th>Activity</th>
                        <th>Progress</th>
                        <th>Beneficiaries</th>
                        <th>Impact</th>
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
};

export default function InteractiveORCDashboard() {
    const [orcGlobals, setOrcGlobals] = useState<ORCGlobal[]>([]);
    const [selectedKR, setSelectedKR] = useState<KR | null>(null);

    const fetchData = useCallback(() => {
        axios.get("/api/dashboard").then(res => setOrcGlobals(res.data.orc_globals));
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <div style={{ padding: 20 }}>
            <h1>📊 ORC Dashboard Interactif</h1>

            {orcGlobals.map(orc => (
                <div key={orc.id} style={{ marginBottom: 50 }}>
                    <h2>{orc.title} - Progression: {orc.progress.toFixed(1)}%</h2>

                    {orc.teams.map(team => (
                        <motion.div key={team.id} style={{ marginLeft: 20, marginTop: 20 }}>
                            <h3>Team: {team.team_id} - Progression: {team.progress.toFixed(1)}%</h3>

                            {team.objectives.map(obj => (
                                <motion.div key={obj.id} style={{ marginLeft: 20, marginTop: 10 }}>
                                    <strong>{obj.title} - Progression: {obj.progress.toFixed(1)}%</strong>

                                    {/* ScatterChart pour KRs */}
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
                                                        r={kr.weight * 20 + 10} // taille proportionnelle au poids
                                                    />
                                                ))}
                                            </Scatter>
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </motion.div>
                            ))}
                        </motion.div>
                    ))}

                    {/* Mini-graph snapshots */}
                    <h4>Historique des Snapshots</h4>
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

            {selectedKR && <KRModal kr={selectedKR} onClose={() => setSelectedKR(null)} />}
        </div>
    );
}