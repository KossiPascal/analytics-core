import { ResponsiveProps, Layout, Responsive } from "react-grid-layout";


interface MyResponsiveProps extends ResponsiveProps {
    draggableHandle?: string;
    measureBeforeMount?: boolean;
    useCSSTransforms?: boolean;
    compactType?: "vertical" | "horizontal";
    preventCollision?: boolean;
}

interface CustomResponsiveLayoutProps {
    width: number;
    children: React.ReactNode;
    layouts: Partial<Record<string, Layout>>;
    breakpoints?: Record<string, number>
    cols?: Record<string, number>
    rowHeight?: number;
    draggableHandle?: '.chart-drag-handle' | '.card-drag-handle';
    onLayoutChange?: ((layout: Layout, layouts: Partial<Record<string, Layout>>) => void)
    onBreakpointChange?: ((newBreakpoint: string, cols: number) => void) | undefined
}

const ResponsiveGridLayout = Responsive as React.ComponentType<MyResponsiveProps>;

export const CustomResponsiveLayout: React.FC<CustomResponsiveLayoutProps> = ({ children, layouts, width = 900, rowHeight = 30, breakpoints, draggableHandle = '.chart-drag-handle', cols, onLayoutChange, onBreakpointChange }) => {
    return (
        <ResponsiveGridLayout
            width={width}
            layouts={layouts}
            breakpoints={breakpoints ?? { lg: 1200, md: 996, sm: 768 }}
            cols={cols ?? { lg: 12, md: 8, sm: 4 }}
            rowHeight={rowHeight}
            draggableHandle={draggableHandle}
            onLayoutChange={onLayoutChange}
            onBreakpointChange={onBreakpointChange}
        // measureBeforeMount={true}       // ⚡ évite les sauts à l’affichage
        // useCSSTransforms={true}         // ⚡ animations fluides pour drag & drop
        // compactType="vertical"
        // preventCollision={false}
        // onResizeStop={(layout) => console.log('Resize stopped', layout)}
        // onDragStop={(layout) => console.log('Drag stopped', layout)}
        // margin={[10, 10]}
        // containerPadding={[10, 10]}
        // // maxRows={3}
        // compactor={{ type: 'vertical', allowOverlap: false, compact:(layout, cols) => layout }}
        // onWidthChange={(width, margin, cols, padding) => { }}
        >
            {children}
        </ResponsiveGridLayout>
    );
};