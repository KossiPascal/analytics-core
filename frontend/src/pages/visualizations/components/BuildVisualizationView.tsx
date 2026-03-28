import { Visualization } from "@/models/visualization.model";
import { AnimatePresence, motion } from "framer-motion";
import { VisualizationViewMode } from "./VisualizationUtils";
import { VisualizationViewModule } from "./VisualizationViewModule";

import styles from '../Visualization.module.css';
import useMeasure from "react-use-measure";

type BuildVisualizationViewProps = {
    visualizations: Visualization[];
    viewMode?: VisualizationViewMode
    refreshSecond?: number;
    editView?: (v: Visualization) => void;
    removeView?: (id: number | undefined) => Promise<void>;
    openView?: (v: Visualization) => Promise<void>;
    refreshView?: (id: number | undefined) => Promise<void>
    autoRefresh?: (id: number | undefined) => Promise<void>
}

export function BuildVisualizationView({ visualizations, viewMode, refreshSecond = 10, editView, removeView, openView, refreshView, autoRefresh }: BuildVisualizationViewProps) {
    const [cardsRef, cardsBounds] = useMeasure();
    
    return (
        <div ref={cardsRef} style={{ width: "100%" }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key="grid"
                    className={viewMode === 'grid' ? styles.visualizationsGrid : styles.visualizationsList}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >

                    {visualizations.map((viz, index) => (
                        <div key={String(viz.id)} style={{
                            background: 'white', borderRadius: 14, overflow: 'clip',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                            border: '1px solid #e2e8f0',
                            display: 'flex', flexDirection: 'column',
                            position: 'relative', height: '100%',
                        }}>
                            <motion.div key={viz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} >
                                {/* <div
                                className="card-drag-handle"
                                title="Maintenir pour déplacer"
                                style={{
                                    position: 'absolute', top: 6, left: 6, zIndex: 20,
                                    width: 20, height: 20, borderRadius: 5,
                                    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'grab', userSelect: 'none', fontSize: '0.7rem', color: '#6366f1',
                                    lineHeight: 1,
                                }}
                                >⠿</div> */}
                                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                                    {/* <Card key={viz.id} style={{ padding: "5px" }} className="hover:shadow-xl transition-all rounded-2xl"> */}

                                    <VisualizationViewModule visualization={viz} refreshSecond={refreshSecond} removeView={removeView} editView={editView} openView={openView} refreshView={refreshView} autoRefresh={autoRefresh} />

                                    {/* </Card> */}

                                </div>
                            </motion.div>
                        </div>
                    ))}

                </motion.div>
            </AnimatePresence>
        </div>
    );
}
