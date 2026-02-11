import React, { createContext, ReactNode, useContext, useReducer } from "react"
import { QueryAST } from "./SQLBuilder";

const initialState: QueryAST = {
  sourceTableId: "",
  tables: [],
  joins: [],
  dimensions: [],
  metrics: [],
  chart: undefined
}

type Action =
  | { type: "SET_SOURCE"; table: any }
  | { type: "ADD_DIMENSION"; column: any }
  | { type: "ADD_METRIC"; metric: any }
  | { type: "SET_FILTER"; filter: any }
  | { type: "ADD_JOIN"; join: any }
  | { type: "SET_CHART"; chart: any }

interface QueryContextType {
  state: QueryAST;
  dispatch: React.ActionDispatch<[action: Action]>;
}

function reducer(state: QueryAST, action: Action): QueryAST {
  switch (action.type) {
    case "SET_SOURCE":
      return {
        ...state,
        sourceTableId: action.table.id,
        tables: [action.table],
      }

    case "ADD_DIMENSION":
      return {
        ...state,
        dimensions: [...state.dimensions, action.column],
      }

    case "ADD_METRIC":
      return {
        ...state,
        metrics: [...state.metrics, action.metric],
      }

    case "SET_FILTER":
      return {
        ...state,
        where: action.filter,
      }

    default:
      return state
  }
}

const QueryContext = createContext<QueryContextType | undefined>(undefined)

export const QueryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const contextValue: QueryContextType = { state, dispatch }

  return <QueryContext.Provider value={ contextValue }> { children } </QueryContext.Provider>;
}

export const useQuery = () => {
  const context = useContext(QueryContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
