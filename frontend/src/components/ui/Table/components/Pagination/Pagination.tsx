import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showFirstLast?: boolean;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showFirstLast = true,
}: PaginationProps) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - delta; i <= currentPage + delta; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`${styles.pagination} ${className || ''}`}>
      <div className={styles.info}>
        Page {currentPage} sur {totalPages}
      </div>

      <div className={styles.controls}>
        {showFirstLast && (
          <button
            className={styles.button}
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            type="button"
            aria-label="Première page"
          >
            <ChevronsLeft size={18} />
          </button>
        )}

        <button
          className={styles.button}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          type="button"
          aria-label="Page précédente"
        >
          <ChevronLeft size={18} />
        </button>

        <div className={styles.pages}>
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                  ...
                </span>
              );
            }

            return (
              <motion.button
                key={page}
                className={`${styles.pageButton} ${
                  page === currentPage ? styles.active : ''
                }`}
                onClick={() => handlePageChange(page as number)}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {page}
              </motion.button>
            );
          })}
        </div>

        <button
          className={styles.button}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          type="button"
          aria-label="Page suivante"
        >
          <ChevronRight size={18} />
        </button>

        {showFirstLast && (
          <button
            className={styles.button}
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            type="button"
            aria-label="Dernière page"
          >
            <ChevronsRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
