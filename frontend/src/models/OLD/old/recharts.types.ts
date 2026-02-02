
export type RechartsClickEvent<T = any> = {
  activePayload?: Array<{
    payload: T;
    dataKey?: string;
    name?: string;
    value?: number;
  }>;
  activeTooltipIndex?: number | string | null;
};
