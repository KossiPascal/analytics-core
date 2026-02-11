export interface History<T> {
  past: T[]
  present: T
  future: T[]
}

export function undo<T>(h: History<T>): History<T> {
  if (!h.past.length) return h
  const prev = h.past[h.past.length - 1]
  return {
    past: h.past.slice(0, -1),
    present: prev,
    future: [h.present, ...h.future],
  }
}

export function redo<T>(h: History<T>): History<T> {
  if (!h.future.length) return h
  const next = h.future[0]
  return {
    past: [...h.past, h.present],
    present: next,
    future: h.future.slice(1),
  }
}
