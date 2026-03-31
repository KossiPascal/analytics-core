import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { motion } from "framer-motion";

// Types
interface KR { id: string; title: string; progress: number; weight: number; }
interface Objective { id: string; title: string; progress: number; krs: KR[]; }
interface Team { id: string; team_id: string; progress: number; objectives: Objective[]; }
interface ORCGlobal { id: string; title: string; progress: number; teams: Team[]; snapshots: { date: string; progress: number }[]; }

// Color gradient selon progression
const getColor = (value: number) => {
    if (value < 50) return "#f44336";
    if (value < 80) return "#ff9800";
    return "#4caf50";
};

// Tooltip customisé
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div style={{ backgroundColor: "#fff", padding: 8, border: "1px solid #ccc" }}>
                <strong>{data.name}</strong>
                <br />
                Progression: {data.progress.toFixed(1)}%
            </div>
        );
    }
    return null;
};

export default function ORCGraphDashboard() {
    const [orcGlobals, setOrcGlobals] = useState<ORCGlobal[]>([]);

    const fetchData = useCallback(() => {
        axios.get("/api/dashboard").then(res => {
            setOrcGlobals(res.data.orc_globals);
        });
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Refresh toutes les 10s
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <div style={{ padding: 20 }}>
            <h1>📊 ORC Global Dashboard</h1>

            {orcGlobals.map((orc) => (
                <div key={orc.id} style={{ marginBottom: 50 }}>
                    <h2>{orc.title} - Progression: {orc.progress.toFixed(1)}%</h2>

                    {/* Timeline Snapshots */}
                    <h4>Historique des Snapshots</h4>
                    <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={orc.snapshots}>
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Bar dataKey="progress">
                                {orc.snapshots.map((snap, idx) => (
                                    <Cell key={idx} fill={getColor(snap.progress)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Teams */}
                    {orc.teams.map(team => (
                        <motion.div key={team.id} style={{ marginLeft: 20, marginTop: 20 }}>
                            <h3>Team: {team.team_id} - Progression: {team.progress.toFixed(1)}%</h3>

                            {/* Objectives */}
                            {team.objectives.map(obj => (
                                <motion.div key={obj.id} style={{ marginLeft: 20, marginTop: 10 }}>
                                    <strong>{obj.title} - Progression: {obj.progress.toFixed(1)}%</strong>

                                    {/* KRs représentés par des barres proportionnelles au poids */}
                                    <ResponsiveContainer width="100%" height={50}>
                                        <BarChart data={obj.krs}>
                                            <XAxis dataKey="title" hide />
                                            <YAxis hide domain={[0, 100]} />
                                            <Tooltip content={CustomTooltip} />
                                            <Bar dataKey="progress">
                                                {obj.krs.map((kr, idx) => (
                                                    <Cell
                                                        key={kr.id}
                                                        fill={getColor(kr.progress)}
                                                        opacity={kr.weight}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </motion.div>
                            ))}
                        </motion.div>
                    ))}
                </div>
            ))}
        </div>
    );
}