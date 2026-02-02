import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  FileText,
  Map,
  Users,
  Building2,
  Shield,
  ShieldCheck,
  BookOpen,
  Gauge,
  Activity,
  User,
  Settings,
  LogOut,
  Eye,
} from 'lucide-react';
import { cn } from '@utils/cn';
import { collapseVariants, sidebarItemTextVariants } from '@animations/index';
import { getSideNavItems, ROUTES, NavItem } from '@routes/index';
import styles from './Sidebar.module.css';
import { useAuth } from '@/contexts/AuthContext';

export interface SidebarItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  children?: SidebarItem[];
  onClick?: () => void;
  isButton?: boolean;
  className?: string;
}

export interface SidebarProps {
  isOpen: boolean;
  isCollapsed?: boolean;
  onClose?: () => void;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

export function Sidebar({ isOpen, isCollapsed = false, onClose, userName = 'Utilisateur', userRole = 'Admin', onLogout }: SidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [sideNavItems, setSideNavItems] = useState<NavItem[]>([]);

  const { user } = useAuth();

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) => prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]);
  };
  const isActive = (path: string) => location.pathname.startsWith(path);
  const isExpanded = (path: string) => expandedItems.includes(path);

  useEffect(() => {
    if (user?.permissions?.length) {
      const navItems = getSideNavItems([...user.permissions]);
      setSideNavItems(navItems)
    }
  }, []);

  // User menu items (mobile only)
  const userMenuItems: SidebarItem[] = [
    { path: ROUTES.settings.root(), label: 'Paramètres', icon: <Settings size={20} /> },
    {
      path: '#',
      label: 'Déconnexion',
      icon: <LogOut size={20} />,
      onClick: () => {
        onClose?.();
        onLogout?.();
      },
      isButton: true,
      className: 'logout'
    },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          styles.sidebar,
          isOpen && styles.open,
          isCollapsed && styles.collapsed
        )}
        initial={false}
        animate={{
          width: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <nav className={styles.nav}>
          {/* User Section - Mobile Only - At Top */}
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                <User size={18} />
              </div>
              <div className={styles.userDetails}>
                <div className={styles.userName}>{userName}</div>
                <div className={styles.userRole}>{userRole}</div>
              </div>
            </div>

            <div className={styles.divider} />
          </div>

          {/* Main Navigation */}
          {sideNavItems.map((item) => (
            <div key={item.path} className={styles.navGroup}>
              {item.children ? (
                <>
                  <button
                    type="button"
                    className={cn(
                      styles.navItem,
                      isActive(item.path) && styles.active
                    )}
                    onClick={() => toggleExpand(item.path)}
                  >
                    <span className={styles.icon}>{item.icon}</span>
                    <motion.span
                      className={styles.label}
                      variants={sidebarItemTextVariants}
                      animate={isCollapsed ? 'collapsed' : 'expanded'}
                    >
                      {item.label}
                    </motion.span>
                    {!isCollapsed && (
                      <ChevronRight
                        size={16}
                        className={cn(
                          styles.chevron,
                          isExpanded(item.path) && styles.chevronExpanded
                        )}
                      />
                    )}
                  </button>

                  <AnimatePresence>
                    {!isCollapsed && isExpanded(item.path) && (
                      <motion.div
                        className={styles.subNav}
                        variants={collapseVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={cn(
                              styles.subNavItem,
                              isActive(child.path) && styles.subNavItemActive
                            )}
                            onClick={onClose}
                          >
                            <span className={styles.subIcon}>{child.icon}</span>
                            <span>{child.label}</span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <Link
                  to={item.path}
                  className={cn(
                    styles.navItem,
                    isActive(item.path) && styles.active
                  )}
                  onClick={onClose}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <motion.span
                    className={styles.label}
                    variants={sidebarItemTextVariants}
                    animate={isCollapsed ? 'collapsed' : 'expanded'}
                  >
                    {item.label}
                  </motion.span>
                </Link>
              )}
            </div>
          ))}

          {/* User Menu Items - Mobile Only - At Bottom */}
          <div className={styles.userMenuSection}>
            <div className={styles.divider} />

            {userMenuItems.map((item) => (
              <div key={item.path} className={styles.navGroup}>
                {item.isButton ? (
                  <button
                    type="button"
                    className={cn(
                      styles.navItem,
                      item.className === 'logout' && styles.logoutItem
                    )}
                    onClick={item.onClick}
                  >
                    <span className={styles.icon}>{item.icon}</span>
                    <motion.span
                      className={styles.label}
                      variants={sidebarItemTextVariants}
                      animate={isCollapsed ? 'collapsed' : 'expanded'}
                    >
                      {item.label}
                    </motion.span>
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={cn(
                      styles.navItem,
                      isActive(item.path) && styles.active
                    )}
                    onClick={onClose}
                  >
                    <span className={styles.icon}>{item.icon}</span>
                    <motion.span
                      className={styles.label}
                      variants={sidebarItemTextVariants}
                      animate={isCollapsed ? 'collapsed' : 'expanded'}
                    >
                      {item.label}
                    </motion.span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>
      </motion.aside>
    </>
  );
}
