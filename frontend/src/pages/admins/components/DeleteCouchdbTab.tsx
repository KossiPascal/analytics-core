import { useState, useEffect } from 'react';
import { Trash2, Search, AlertTriangle, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@components/ui/Card/Card';
import { Button } from '@components/ui/Button/Button';
import { Modal } from '@components/ui/Modal/Modal';
import { useNotification } from '@/contexts/OLD/useNotification';
import { AdminApi, OrgUnitsApi } from '@/services/OLD/old/api.service';
import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';
import { FormDatePicker } from '@/components/forms/FormDatePicker/FormDatePicker';
import { FormMultiSelect } from '@/components/forms/FormSelect/FormMultiSelect';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import styles from '@pages/admins/AdminPage.module.css';

interface DataToDelete {
  id: string;
  rev: string;
  name?: string;
  form?: string;
  user: string;
  table: string;
}

interface OrgUnit {
  id: string;
  name: string;
}

const DATA_TYPES = [
  { value: 'reco-data', label: 'Données RECO' },
  { value: 'patients', label: 'Patients' },
  { value: 'families', label: 'Familles' },
  { value: 'chws-data', label: 'Données ASC' },
  { value: 'mentors-data', label: 'Données Mentors' },
  { value: 'dashboards', label: 'Dashboards' },
  { value: 'reports', label: 'Rapports' },
];

export function DeleteCouchdbTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDistrictQuartiers, setSelectedDistrictQuartiers] = useState<string[]>([]);
  const [selectedCibles, setSelectedCibles] = useState<string[]>([]);

  // Org units
  const [districtQuartiers, setDistrictQuartiers] = useState<OrgUnit[]>([]);
  const [cibles, setCibles] = useState<OrgUnit[]>([]);
  const [recos, setRecos] = useState<OrgUnit[]>([]);
  const [chws, setChws] = useState<OrgUnit[]>([]);

  // Data to delete
  const [foundData, setFoundData] = useState<DataToDelete[]>([]);
  const [selectedData, setSelectedData] = useState<Set<string>>(new Set());

  const { showSuccess, showError, showWarning } = useNotification();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    generateCibles();
  }, [selectedDistrictQuartiers, selectedType]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [dqResponse, recosResponse, chwsResponse] = await Promise.all([
        OrgUnitsApi.getDistrictQuartiers(),
        OrgUnitsApi.getRecos(),
        OrgUnitsApi.getChws(),
      ]);

      if (dqResponse?.status === 200) setDistrictQuartiers((dqResponse.data as OrgUnit[]) || []);
      if (recosResponse?.status === 200) setRecos((recosResponse.data as OrgUnit[]) || []);
      if (chwsResponse?.status === 200) setChws((chwsResponse.data as OrgUnit[]) || []);
    } catch (error) {
      showError('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const generateCibles = () => {
    if (!selectedType || selectedDistrictQuartiers.length === 0) {
      setCibles([]);
      return;
    }

    if (['reco-data', 'patients', 'families', 'dashboards', 'reports'].includes(selectedType)) {
      const filteredRecos = recos.filter((r: any) =>
        selectedDistrictQuartiers.includes(r.district_quartier_id)
      );
      setCibles(filteredRecos);
    } else if (selectedType === 'chws-data') {
      const filteredChws = chws.filter((c: any) =>
        selectedDistrictQuartiers.includes(c.district_quartier_id)
      );
      setCibles(filteredChws);
    }
  };

  const searchData = async () => {
    if (!startDate || !endDate || !selectedType || selectedCibles.length === 0) {
      showWarning('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSearching(true);
    setFoundData([]);
    setSelectedData(new Set());

    try {
      const response = await AdminApi.getDataToDeleteFromCouchDb({
        start_date: startDate,
        end_date: endDate,
        type: selectedType,
        cible: selectedCibles,
      });

      if (response?.status === 200 && response.data) {
        const dataArray = response.data as DataToDelete[];
        const uniqueData = dataArray.reduce((acc: DataToDelete[], item: DataToDelete) => {
          if (!acc.find((d) => d.id === item.id)) {
            acc.push(item);
          }
          return acc;
        }, []);
        setFoundData(uniqueData);
        if (uniqueData.length === 0) {
          showWarning('Aucune donnée trouvée pour ces critères');
        }
      }
    } catch (error) {
      showError('Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedData.size === foundData.length) {
      setSelectedData(new Set());
    } else {
      setSelectedData(new Set(foundData.map((d) => d.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedData);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedData(newSelected);
  };

  const handleDelete = async () => {
    if (selectedData.size === 0) {
      showWarning('Veuillez sélectionner au moins une donnée');
      return;
    }

    setIsDeleting(true);
    try {
      const dataToDelete = foundData
        .filter((d) => selectedData.has(d.id))
        .map((d) => ({
          _deleted: true,
          _id: d.id,
          _rev: d.rev,
          _table: d.table,
        }));

      const response = await AdminApi.deleteDataFromCouchDb(dataToDelete, selectedType);

      if (response?.status === 200) {
        showSuccess(`${selectedData.size} élément(s) supprimé(s) avec succès`);
        setFoundData([]);
        setSelectedData(new Set());
        setIsConfirmModalOpen(false);
      } else {
        showError('Erreur lors de la suppression');
      }
    } catch (error) {
      showError('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <div className={styles.cardTitle}>
            <Trash2 size={20} />
            Supprimer des données CouchDB
          </div>
        }
      />
      <CardBody>
        <div className={`${styles.alert} ${styles.alertWarning}`} style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={20} />
          <div>
            <strong>Attention</strong>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Cette action est irréversible. Les données supprimées ne pourront pas être récupérées.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.form}>
          <div className={`${styles.grid} ${styles.grid2}`}>
            <FormDatePicker
              label="Date de début"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <FormDatePicker
              label="Date de fin"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className={`${styles.grid} ${styles.grid2}`}>
            <FormSelect
              label="Type de données"
              required
              value={selectedType}
              placeholder="Sélectionner un type"
              options={DATA_TYPES.map((type) => ({
                value: type.value,
                label: type.label,
              }))}
              onChange={(value) => setSelectedType(value)}
            />
            <FormMultiSelect
              label="Districts/Quartiers"
              required
              value={selectedDistrictQuartiers}
              options={districtQuartiers.map((dq) => ({
                value: dq.id,
                label: dq.name,
              }))}
              onChange={(values) => setSelectedDistrictQuartiers(values)}
              placeholder="Sélectionner des districts/quartiers"
            />
          </div>

          {cibles.length > 0 && (
            <FormMultiSelect
              label={`Cibles (${selectedType === 'chws-data' ? 'ASC' : 'RECO'})`}
              required
              value={selectedCibles}
              options={cibles.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              onChange={(values) => setSelectedCibles(values)}
              placeholder="Sélectionner des cibles"
            />
          )}

          <Button variant="primary" onClick={searchData} disabled={isSearching || isLoading}>
            {isSearching ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Recherche...
              </>
            ) : (
              <>
                <Search size={16} />
                Rechercher
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {foundData.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                {foundData.length} élément(s) trouvé(s) - {selectedData.size} sélectionné(s)
              </h3>
              <div className={styles.buttonGroup}>
                <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                  {selectedData.size === foundData.length ? <CheckSquare size={16} /> : <Square size={16} />}
                  {selectedData.size === foundData.length ? 'Désélectionner tout' : 'Tout sélectionner'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsConfirmModalOpen(true)}
                  disabled={selectedData.size === 0}
                >
                  <Trash2 size={16} />
                  Supprimer ({selectedData.size})
                </Button>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Formulaire</th>
                    <th>Utilisateur</th>
                    <th>Table</th>
                  </tr>
                </thead>
                <tbody>
                  {foundData.slice(0, 100).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <FormCheckbox
                          checked={selectedData.has(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                        />
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {item.id.substring(0, 12)}...
                      </td>
                      <td>{item.name || '-'}</td>
                      <td>{item.form || '-'}</td>
                      <td>{item.user || '-'}</td>
                      <td>
                        <span className={`${styles.badge} ${styles.badgeWarning}`}>
                          {item.table}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {foundData.length > 100 && (
                <p style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                  Affichage des 100 premiers éléments sur {foundData.length}
                </p>
              )}
            </div>
          </div>
        )}
      </CardBody>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirmer la suppression"
      >
        <div className={styles.form}>
          <div className={`${styles.alert} ${styles.alertDanger}`}>
            <AlertTriangle size={20} />
            <div>
              <strong>Attention !</strong>
              <p style={{ margin: '0.5rem 0 0 0' }}>
                Vous êtes sur le point de supprimer <strong>{selectedData.size}</strong> élément(s).
                Cette action est irréversible.
              </p>
            </div>
          </div>
          <div className={styles.buttonGroup}>
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Confirmer la suppression
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
