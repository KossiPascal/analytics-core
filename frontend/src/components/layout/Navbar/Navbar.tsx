import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell, User, LogOut, Settings, ChevronDown, Mail } from 'lucide-react';
import { cn } from '@utils/cn';
import { dropdownVariants } from '@animations/modal.variants';
import { getTopNavItems, ROUTES, NavItem } from '@routes/routes';
import styles from './Navbar.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { NavGrid } from '@/components/layout/NavGrid/NavGrid';


export interface MenuItemWithIcon {
  path: string;
  label: string;
  icon: React.ReactNode;
}

export interface NavItemWithIcon extends MenuItemWithIcon {
  children?: NavItemWithIcon[];
}

export interface NavbarProps {
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

export function Navbar({ onMenuClick, isMenuOpen = false, userName = 'Utilisateur', userRole = 'Admin', onLogout }: NavbarProps) {
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [topNavItems, setTopNavItems] = useState<NavItem[]>([]);

  const { user } = useAuth();

  const isActive = (path: string) => location.pathname.startsWith(path);

  useEffect(() => {
    if (user?.permissions?.length) {
      const topNavbar = getTopNavItems([...user.permissions]);
      setTopNavItems(topNavbar);
    }
  }, [user?.permissions]);

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        {/* Left Section */}
        <div className={styles.left}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={onMenuClick}
            aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to={ROUTES.home()} className={styles.brand}>
            <span className={styles.brandIcon}>K</span>
            <span className={styles.brandText}>Kendeya Analytics</span>
          </Link>
        </div>

        {/* Center - Navigation */}
        <nav className={styles.nav}>
          {topNavItems.map((item) => (
            <div
              key={item.path}
              className={styles.navItemWrapper}
              onMouseEnter={() => item.children && setActiveDropdown(item.path)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to={item.children ? '#' : item.path}
                className={cn(styles.navItem, isActive(item.path) && styles.navItemActive)}
                onClick={(e) => item.children && e.preventDefault()}>
                {item.icon}
                <span>{item.label}</span>
                {item.children && <ChevronDown size={14} />}
              </Link>

              {/* Dropdown */}
              <AnimatePresence>
                {item.children && activeDropdown === item.path && (
                  <motion.div
                    className={styles.dropdown}
                    variants={dropdownVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={cn(
                          styles.dropdownItem,
                          isActive(child.path) && styles.dropdownItemActive
                        )}
                      >
                        {child.icon}
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* Right Section */}
        <div className={styles.right}>
          {/* Mail */}
          <button type="button" className={styles.iconButton} aria-label="Messages">
            <Mail size={20} />
          </button>

          {/* Notifications */}
          <button type="button" className={styles.iconButton} aria-label="Notifications">
            <Bell size={20} />
            <span className={styles.badge}>3</span>
          </button>

          {/* App Menu Grid - NavGrid */}
          <NavGrid />

          {/* User Menu */}
          <div className={styles.userMenuWrapper}>
            <button
              type="button"
              className={styles.userButton}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
            >
              <div className={styles.avatar}>
                <User size={18} />
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{userName}</span>
                <span className={styles.userRole}>{userRole}</span>
              </div>
              <ChevronDown
                size={16}
                className={cn(styles.chevron, userMenuOpen && styles.chevronOpen)}
              />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  className={styles.userMenu}
                  variants={dropdownVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Link to={ROUTES.settings.root()} className={styles.userMenuItem} onClick={() => setUserMenuOpen(false)}>
                    <Settings size={16} />
                    <span>Paramètres</span>
                  </Link>
                  <div className={styles.userMenuDivider} />
                  <button
                    type="button"
                    className={cn(styles.userMenuItem, styles.logoutItem)}
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout?.();
                    }}
                  >
                    <LogOut size={16} />
                    <span>Déconnexion</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
