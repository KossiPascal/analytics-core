import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search } from 'lucide-react';
import { dropdownVariants } from '@animations/modal.variants';
import { getGridNavItems, NavItem } from '@routes/routes';
import styles from './NavGrid.module.css';
import { useAuth } from '@/contexts/AuthContext';

export function NavGrid() {
  const navigate = useNavigate();
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gridNavItems, setGridNavItems] = useState<NavItem[]>([]);
  const appMenuRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();

  // Filter app menu items based on search query
  const filteredAppMenuItems = gridNavItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load grid nav items and close app menu when clicking outside
  useEffect(() => {
    if (user?.permissions?.length) {
      const gridNavbar = getGridNavItems([...user.permissions]);
      setGridNavItems(gridNavbar);
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
  );
}
