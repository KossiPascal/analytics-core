import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronDown, Check } from 'lucide-react';
import styles from './FormCascadeTree.module.css';

export interface TreeNode {
  id: string;
  name: string;
  parentId: string | null;
  children?: TreeNode[];
}

interface FormCascadeTreeProps {
  nodes: TreeNode[];
  selectedIds?: string[];
  onChange?: (selectedIds: string[]) => void;
}

export const FormCascadeTree: React.FC<FormCascadeTreeProps> = ({nodes,selectedIds = [],onChange}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Init selected from props   
  useEffect(() => {
    setSelected(new Set(selectedIds));
  }, [selectedIds]);

  // Map parentId => child ids
  const childrenMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    nodes.forEach((node) => {
      if (node.parentId) {
        if (!map[node.parentId]) map[node.parentId] = [];
        map[node.parentId].push(node.id);
      }
    });
    return map;
  }, [nodes]);

  // Get all descendants of a node
  const getAllDescendants = useCallback(
    (id: string): string[] => {
      const result: string[] = [];
      const stack = [id];
      while (stack.length) {
        const current = stack.pop()!;
        const children = childrenMap[current] || [];
        for (const child of children) {
          result.push(child);
          stack.push(child);
        }
      }
      return result;
    },
    [childrenMap]
  );

  // Node state: checked & indeterminate
  const getNodeState = useCallback(
    (node: TreeNode): { checked: boolean; indeterminate: boolean } => {
      const descendants = getAllDescendants(node.id);
      const allSelected = descendants.every((id) => selected.has(id));
      const anySelected = descendants.some((id) => selected.has(id));
      const selfSelected = selected.has(node.id);

      return {
        checked: selfSelected && allSelected,
        indeterminate: (selfSelected || anySelected) && !(selfSelected && allSelected),
      };
    },
    [selected, getAllDescendants]
  );

  // Toggle selection
  const toggleNode = useCallback(
    (node: TreeNode) => {
      setSelected((prev) => {
        const newSelected = new Set(prev);
        const descendants = getAllDescendants(node.id);
        const isSelected = newSelected.has(node.id);

        if (isSelected) {
          newSelected.delete(node.id);
          descendants.forEach((id) => newSelected.delete(id));
        } else {
          newSelected.add(node.id);
          descendants.forEach((id) => newSelected.add(id));
        }

        onChange?.([...newSelected]);
        return newSelected;
      });
    },
    [getAllDescendants, onChange]
  );

  // Toggle expanded
  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const renderNode = useCallback(
    (node: TreeNode, level = 0) => {
      const { checked, indeterminate } = getNodeState(node);
      const hasChildren = !!(childrenMap[node.id]?.length || node.children?.length);
      const expanded = expandedIds[node.id];

      const childrenNodes =
        node.children && node.children.length > 0
          ? node.children
          : (childrenMap[node.id] || []).map((childId) =>
              nodes.find((n) => n.id === childId)
            ).filter(Boolean) as TreeNode[];

      return (
        <div key={node.id} className={styles.treeNode}>
          <div
            className={`${styles.treeNodeHeader} ${
              checked ? styles.selectedNodeHeader : ''
            } ${indeterminate ? styles.indeterminateNodeHeader : ''}`}
            style={{ marginLeft: level * 16 }}
          >
            {hasChildren ? (
              <button
                type="button"
                className={styles.expandButton}
                onClick={() => toggleExpanded(node.id)}
              >
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className={styles.expandPlaceholder} />
            )}
            <label className={styles.checkboxWrapper}>
              <input
                type="checkbox"
                checked={checked}
                ref={(el) => void (el && (el.indeterminate = indeterminate))}
                onChange={() => toggleNode(node)}
                />

              {checked && <Check size={12} className={styles.checkIcon} />}
            </label>
            <span className={styles.nodeName}>{node.name}</span>
          </div>
          {hasChildren && expanded && (
            <div className={styles.treeChildren}>
              {childrenNodes.map((child) => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    },
    [getNodeState, toggleNode, expandedIds, childrenMap, nodes]
  );

  return <div className={styles.treeContainer}>{nodes.filter(n => !n.parentId).map((n) => renderNode(n))}</div>;
};
