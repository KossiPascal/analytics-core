import { DatasetField, LinkedFilterGroup } from "@/models/dataset.models";
import { buildFilterTree } from "./buildFilterTree";
import { BuiltFilter } from "./model";



export const buildLinkedFilterGroups = (groups: LinkedFilterGroup[], fieldMap: Map<number, DatasetField>, paramIndex: { current: number }): BuiltFilter => {

    const result: BuiltFilter = { wheres: [], havings: [], values: {} };

    if (!groups?.length) return result;

    let whereExpr = "";
    let havingExpr = "";

    const wheresGroup = groups.filter(g => {
        const res = buildFilterTree(g.node, fieldMap, { current: 0 });
        return res.wheres.length > 0;
    });

    const havingGroup = groups.filter(g => {
        const res = buildFilterTree(g.node, fieldMap, { current: 0 });
        return res.havings.length > 0;
    });

    wheresGroup.forEach((group, index) => {
        const { wheres, values } = buildFilterTree(group.node, fieldMap, paramIndex);
        const link = group.linkWithPrevious || "AND";
        const operator = ` ${group.node.operator || "AND"} `;
        // WHERE
        if (wheres.length) {
            const wClause = wheres.length > 1 ? `(${wheres.join(operator)})` : wheres[0];
            whereExpr = index === 0 ? wClause : `${whereExpr} ${link} ${wClause}`;
        }
        Object.assign(result.values, values);
    });

    havingGroup.forEach((group, index) => {
        const { havings, values } = buildFilterTree(group.node, fieldMap, paramIndex);
        const link = group.linkWithPrevious || "AND";
        const operator = ` ${group.node.operator || "AND"} `;
        // HAVING
        if (havings.length) {
            const hClause = havings.length > 1 ? `(${havings.join(operator)})` : havings[0];
            havingExpr = index === 0 ? hClause : `${havingExpr} ${link} ${hClause}`;
        }
        Object.assign(result.values, values);
    });

    if (whereExpr) result.wheres.push(whereExpr);
    if (havingExpr) result.havings.push(havingExpr);

    return result;
};