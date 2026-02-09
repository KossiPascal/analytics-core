import { db } from '@/utils/TestData';
import { StoredVisualization } from './domain';

const COLLECTION = 'visualizations';

export const VisualizationRepository = {
  list(): StoredVisualization[] {
    return db.list<StoredVisualization>(COLLECTION,{
      sortBy: 'updatedAt',
      sortDir: 'desc',
    }).items;
  },

  save(viz: StoredVisualization) {
    db.create<StoredVisualization>(COLLECTION, viz);
  },
};
