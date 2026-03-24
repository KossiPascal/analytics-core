import { FULL_OPERATORS } from "@/models/dataset.models";
import { z } from "zod";

export const QueryFilterConditionSchema = z.object({
    type: z.literal("condition"),
    field: z.string().min(1),
    operator: z.enum(FULL_OPERATORS),
    value: z.any().optional(),
    value2: z.any().optional()
    // value: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]),
    // value2: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]).optional()
}).superRefine((val, ctx) => {
    if (val.operator === "BETWEEN" && val.value2 === undefined) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "BETWEEN requires value2"
        });
    }
    if (val.operator === "IN" && !Array.isArray(val.value)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "IN requires array value"
        });
    }
});

const QueryFilterSchema: z.ZodType<z.infer<typeof QueryFilterConditionSchema> | any> = z.lazy(() =>
    z.union([
        QueryFilterConditionSchema,
        z.object({
            type: z.literal("group"),
            operator: z.enum(["AND", "OR"]),
            children: z.array(QueryFilterSchema)
        })
    ])
);

export const QueryJsonSchema = z.object({
    select: z.object({
        dimensions: z.array(z.string()),
        metrics: z.array(z.string())
    }),
    filters: QueryFilterSchema.optional(),
    order_by: z.array(
        z.object({
            field: z.string().min(1),
            direction: z.enum(["asc", "desc"])
        })
    ).optional().default([]),
    limit: z.number().int().positive().nullable().optional(),
    offset: z.number().int().nonnegative().nullable().optional()
});