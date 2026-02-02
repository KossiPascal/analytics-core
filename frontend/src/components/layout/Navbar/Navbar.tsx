import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell, User, LogOut, Settings, ChevronDown, FileText, Map, Users, Shield, BookOpen, Gauge, Search, Mail, Eye, Activity, Database } from 'lucide-react';
import { cn } from '@utils/cn';
import { dropdownVariants } from '@animations/index';
import { getGridNavItems, getTopNavItems, ROUTES, NavItem } from '@routes/index';
import styles from './Navbar.module.css';
import { useAuth } from '@/contexts/AuthContext';



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
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [topNavItems, setTopNavItems] = useState<NavItem[]>([]);
  const [gridNavItems, setGridNavItems] = useState<NavItem[]>([]);
  const appMenuRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();

  const isActive = (path: string) => location.pathname.startsWith(path);

  // Filter app menu items based on search query
  const filteredAppMenuItems = gridNavItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close app menu when clicking outside
  useEffect(() => {
    if (user?.permissions?.length) {
      const gridNavbar = getGridNavItems([...user.permissions]);
      const topNavbar = getTopNavItems([...user.permissions]);
      setGridNavItems(gridNavbar);
      setTopNavItems(topNavbar);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (appMenuRef.current && !appMenuRef.current.contains(event.target as Node)) {
        setAppMenuOpen(false);
        setSearchQuery('');
      }
    };

    if (appMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [appMenuOpen]);

  // Handle app menu item click
  const handleAppMenuItemClick = (path: string) => {
    setAppMenuOpen(false);
    setSearchQuery('');
    navigate(path);
  };

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

          {/* App Menu Toggle - DHIS2 Style */}
          <div className={styles.appMenuWrapper} ref={appMenuRef}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setAppMenuOpen(!appMenuOpen)}
              aria-label="Menu des applications"
              aria-expanded={appMenuOpen}
            >
              <Menu size={20} />
            </button>

            {/* App Menu Popup - DHIS2 Style */}
            <AnimatePresence>
              {appMenuOpen && (
                <motion.div
                  className={styles.appMenu}
                  variants={dropdownVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {/* Search Input */}
                  <div className={styles.appMenuSearch}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={styles.searchInput}
                      autoFocus
                    />
                  </div>

                  {/* Menu Grid */}
                  <div className={styles.appMenuGrid}>
                    {filteredAppMenuItems.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        className={styles.appMenuItem}
                        onClick={() => handleAppMenuItemClick(item.path)}
                      >
                        <span className={styles.appMenuItemIcon}>{item.icon}</span>
                        <span className={styles.appMenuItemLabel}>{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* No Results */}
                  {filteredAppMenuItems.length === 0 && (
                    <div className={styles.noResults}>Aucun élément trouvé</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
