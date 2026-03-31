// frontend/src/ORCDashboard.tsx
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import axios from "axios";
import { motion } from "framer-motion";

export default function ORCDashboard() {
  const [orcData, setOrcData] = useState<any[]>([]);
  const [selectedKR, setSelectedKR] = useState<any>(null);

  const fetchData = () => axios.get("/api/dashboard").then(res => setOrcData(res.data.orc_globals));

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const onDragEnd = (result: any) => { /* similaire au drag/drop KR/Objectives */ };

  return (
    <div>
      <h1>Dashboard ORC – Terrain Ready</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        {orcData.map(orc => (
          <div key={orc.id}>
            <h2>{orc.title} - Progression: {orc.progress.toFixed(1)}%</h2>
            {orc.teams.map((team:any) => (
              <Droppable droppableId={team.team_id} type="objective" key={team.team_id}>
                {(provided) => (
                  <motion.div ref={provided.innerRef} {...provided.droppableProps}>
                    <h3>{team.team_name} - {team.progress.toFixed(1)}%</h3>
                    {team.objectives.map((obj:any, idx:number) => (
                      <Draggable draggableId={obj.id} index={idx} key={obj.id}>
                        {(prov) => (
                          <motion.div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps as any}>
                            <strong>{obj.title} - {obj.progress.toFixed(1)}%</strong>
                            <div style={{ display:"flex", gap:8 }}>
                              {obj.krs.map((kr:any) => (
                                <motion.div
                                  key={kr.id}
                                  className={`kr-bubble ${kr.impact>0.7?"high-impact":kr.impact>0.4?"medium-impact":"low-impact"} ${kr.justUpdated?"pulse":""}`}
                                  onClick={()=>setSelectedKR(kr)}
                                >
                                  {kr.title}<br/>
                                  {kr.activities.map((a:any)=> <span key={a.id}>{a.title}</span>)}
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </motion.div>
                )}
              </Droppable>
            ))}
          </div>
        ))}
      </DragDropContext>
    </div>
  )
}