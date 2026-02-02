
import { LazyExoticComponent, ComponentType, useEffect } from "react";
import { RouteAccess, type Access } from "./access";
import { Route } from "react-router-dom";

export interface CommonRouteItem {
  // name: string;
  label: string;
  icon: React.ReactNode;

  path: string;
  permissions: string[];

  onClick?: () => void;
  className?: string;
  access?: Access;

  showInGridpNav?: boolean;
  showInTopNav?: boolean;
  showInSideNav?: boolean;

  isPublic?: boolean;
  isButton?: boolean;
  allowSubRoutes?: boolean;
}

export interface RouteItem extends CommonRouteItem {
  component?: LazyExoticComponent<ComponentType<any>>;
  children?: RouteItem[];
}

export interface MenuItem extends CommonRouteItem {
  component: LazyExoticComponent<ComponentType<any>>;
  children?: MenuItem[];
}

export interface NavItem extends MenuItem {
  children?: NavItem[];
}

export interface RouteConfig extends Omit<RouteItem, "children"> {
  component: LazyExoticComponent<ComponentType<any>>;
}

export const buildUrl = (path: string, params?: Record<string, string | number>): string => {
  if (!params) return path;

  let url = path;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, String(value));
  }
  return url;
}

export const withQuery = (path: string, query?: Record<string, string | number | boolean | undefined>): string => {
  if (!query) return path;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    // supprime les accents (é → e, ç → c, ñ → n, etc.)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // remplace tout ce qui n'est pas lettre ou chiffre par _
    .replace(/[^a-z0-9]+/g, "_")
    // supprime les _ multiples
    .replace(/_+/g, "_")
    // supprime les _ en début et fin
    .replace(/^_+|_+$/g, "");
};

export const generateRouteConfig = (items: RouteItem[]): RouteConfig[] => {
  const routes: RouteConfig[] = [];
  const walk = (nodes: RouteItem[], parent?: RouteItem) => {
    const hasChildren = (parent?.children ?? []).length > 0;
    for (const node of nodes) {
      if (!!node.component) {
        const access = node.access ?? parent?.access;
        routes.push({ ...node, allowSubRoutes: hasChildren, access } as RouteConfig);
      }
      if (!!node.children && node.children.length > 0) {
        walk(node.children, node);
      }
    }
  };
  walk(items);
  return routes;
};

export const generateGridNavItems = (items: RouteItem[], userPermissions: string[]): NavItem[] => {
  const result: NavItem[] = [];
  const walk = (nodes: RouteItem[], parent?: RouteItem) => {
    for (const node of nodes) {
      if (node.children?.length) {
        walk(node.children, node);
      } else {
        const showInGridpNav = parent?.showInGridpNav === true || node.showInGridpNav === true;

        if (showInGridpNav && !!node.component) {
          for (const perm of userPermissions) {
            if (node.permissions.includes(perm)) {
              result.push(node as NavItem);
              break;
            }
          }
        }
      }
    }
  };
  walk(items);
  return result;
};

export const generateNavItems = (items: RouteItem[], mode: "top" | "side", userPermissions: string[]): NavItem[] => {
  const routes: NavItem[] = [];

  const getVisibility = (item: RouteItem, parent?: RouteItem): boolean => {
    if (mode === "top") {
      // priorité à l'enfant, sinon héritage du parent
      if (item.showInTopNav !== undefined) return item.showInTopNav;
      return parent?.showInTopNav === true;
    }

    // mode === "side"
    if (item.showInSideNav !== undefined) return item.showInSideNav;
    return parent?.showInSideNav === true;
  };

  const walk = (nodes: RouteItem[]) => {
    for (const node of nodes) {
      const children = node.children ?? [];

      // ---------- AVEC ENFANTS ----------
      if (children.length > 0) {
        const visibleChildren = children.filter(child => {
          const ok1 = getVisibility(child, node);
          let ok2 = false;
          for (const perm of userPermissions) {
            if (child.permissions.includes(perm)) {
              ok2 = true;
              break;
            }
          }
          return ok1 && ok2;
        });

        // Ajouter le parent uniquement si au moins un enfant est visible
        if (visibleChildren.length > 0) {
          for (const perm of userPermissions) {
            if (node.permissions.includes(perm)) {
              routes.push({ ...(node as NavItem), children: visibleChildren as NavItem[] });
              break;
            }
          }
        }
        continue;
      }

      // ---------- SANS ENFANTS ----------
      if (getVisibility(node)) {
        for (const perm of userPermissions) {
          if (node.permissions.includes(perm)) {
            routes.push({ ...node } as NavItem);
            break;
          }
        }
      }
    }
  };

  walk(items);
  return routes;
};



// export const generateMenuItems = (items: RouteItem[]): NavItem[] => {
//   const result: NavItem[] = [];
//   const walk = (nodes: RouteItem[]) => {
//     for (const node of nodes) {
//       if (node.children?.length) {
//         walk(node.children);
//       } else {
//         if ((!!node.component && !node.children) || !!node.children) {
//           result.push(node as NavItem);
//         }
//       }
//     }
//   };
//   walk(items);
//   return result;
// };


// export const generateTopNavItems = (items: RouteItem[]): NavItem[] => {
//   const routes: NavItem[] = [];

//   const walk = (nodes: RouteItem[]) => {
//     for (const node of nodes) {
//       // ---- VISIBILITÉ DU PARENT ----
//       // if (node.showInTopNav !== true) continue;
//       const children = node.children;
//       // ---- AVEC ENFANTS ----
//       if (children && children.length > 0) {
//         const data = { ...node, children: [] } as NavItem;
//         for (const child of children) {
//           if (node.showInTopNav && child.showInTopNav !== false || child.showInTopNav == true) {
//             data.children!.push(child as NavItem);
//           }
//         }
//         // Ajouter le parent seulement si au moins un enfant est visible
//         if (data.children!.length > 0) routes.push(data);
//         // ---- SANS ENFANTS ----
//       } else {
//         routes.push({ ...node } as NavItem);
//       }
//     }
//   };
//   walk(items);
//   return routes;
// };

// export const generateSideNavItems = (items: RouteItem[]): NavItem[] => {
//   const routes: NavItem[] = [];

//   const walk = (nodes: RouteItem[]) => {
//     for (const node of nodes) {
//       // ---- VISIBILITÉ DU PARENT ----
//       if (node.showInSideNav !== true) continue;
//       const children = node.children;
//       // ---- AVEC ENFANTS ----
//       if (children && children.length > 0) {
//         const data = { ...node, children: [] } as NavItem;
//         for (const child of children) {
//           if (node.showInSideNav && child.showInSideNav !== false || child.showInSideNav == true) {
//             data.children!.push(child as NavItem);
//           }
//         }
//         // Ajouter le parent seulement si au moins un enfant est visible
//         if (data.children!.length > 0) routes.push(data);
//         // ---- SANS ENFANTS ----
//       } else {
//         routes.push({ ...node } as NavItem);
//       }
//     }
//   };
//   walk(items);
//   return routes;
// };





// // Type helper for extracting path values
// export type PathValue = string;

// // Flatten PATHS for easy iteration
// export const getAllPaths = (): string[] => {
//   const paths: string[] = [];

//   const extractPaths = (obj: Record<string, unknown>, prefix = ''): void => {
//     for (const [key, value] of Object.entries(obj)) {
//       if (typeof value === 'string') {
//         paths.push(value);
//       } else if (typeof value === 'object' && value !== null) {
//         extractPaths(value as Record<string, unknown>, `${prefix}${key}.`);
//       }
//     }
//   };

//   extractPaths(PATHS);
//   return paths;
// };
