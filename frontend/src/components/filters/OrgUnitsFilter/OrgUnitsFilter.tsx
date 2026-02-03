import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Modal, Button } from '@components/ui';
import type {
  CountryMap,
  RegionsMap,
  PrefecturesMap,
  CommunesMap,
  HospitalsMap,
  DistrictQuartiersMap,
  VillageSecteursMap,
  ChwsMap,
  RecosMap,
} from '@/models/OLD/old';
import { useAuth } from '@/stores/OLD';
import { notNull } from '@/utils/date';
import styles from './OrgUnitsFilter.module.css';

export interface OrgUnitSelection {
  country: CountryMap[];
  region: RegionsMap[];
  prefecture: PrefecturesMap[];
  commune: CommunesMap[];
  hospital: HospitalsMap[];
  district_quartier: DistrictQuartiersMap[];
  chws: ChwsMap[];
  village_secteur: VillageSecteursMap[];
  recos: RecosMap[];
  all_recos_ids: string[];
  selected_recos_ids: string[];
}

export interface FilterFormData {
  start_date: string;
  end_date: string;
  country?: string[];
  region?: string[];
  prefecture?: string[];
  commune?: string[];
  hospital?: string[];
  district_quartier?: string[];
  village_secteur?: string[];
  recos?: string[];
  org_units?: OrgUnitSelection;
}

interface OrgUnitsFilterProps {
  onChange?: (formData: FilterFormData) => void;
  showRecoLevel?: boolean;
  showDateSelection?: boolean;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

function getDefaultStartDate(): string {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 21);
  return formatDateToISO(prevMonth);
}

function getDefaultEndDate(): string {
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), 20);
  return formatDateToISO(endDate);
}

function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function OrgUnitsFilter({
  onChange,
  showRecoLevel = true,
  showDateSelection = true,
  isOpen = false,
  onClose,
}: OrgUnitsFilterProps) {
  const { user } = useAuth();
  const isInitialized = useRef(false);

  const Countries$ = useMemo(() => user?.countries ?? [], [user?.countries]);
  const Regions$ = useMemo(() => user?.regions ?? [], [user?.regions]);
  const Prefectures$ = useMemo(() => user?.prefectures ?? [], [user?.prefectures]);
  const Communes$ = useMemo(() => user?.communes ?? [], [user?.communes]);
  const Hospitals$ = useMemo(() => user?.hospitals ?? [], [user?.hospitals]);
  const DistrictQuartiers$ = useMemo(() => user?.districtQuartiers ?? [], [user?.districtQuartiers]);
  const Chws$ = useMemo(() => user?.chws ?? [], [user?.chws]);
  const Recos$ = useMemo(() => user?.recos ?? [], [user?.recos]);

  const [startDate, setStartDate] = useState(() => getDefaultStartDate());
  const [endDate, setEndDate] = useState(() => getDefaultEndDate());

  const [countries, setCountries] = useState<CountryMap[]>([]);
  const [regions, setRegions] = useState<RegionsMap[]>([]);
  const [prefectures, setPrefectures] = useState<PrefecturesMap[]>([]);
  const [communes, setCommunes] = useState<CommunesMap[]>([]);
  const [hospitals, setHospitals] = useState<HospitalsMap[]>([]);
  const [districtQuartiers, setDistrictQuartiers] = useState<DistrictQuartiersMap[]>([]);
  const [recos, setRecos] = useState<RecosMap[]>([]);

  const [formValues, setFormValues] = useState<Record<string, string[]>>({
    country: [],
    region: [],
    prefecture: [],
    commune: [],
    hospital: [],
    district_quartier: [],
    recos: [],
  });

  const getVal = useCallback((field: string): string[] => {
    return formValues[field] || [];
  }, [formValues]);

  const setMultipleValues = useCallback((field: string, values: string[]) => {
    setFormValues(prev => ({ ...prev, [field]: values }));
  }, []);

  const recosGenerate = useCallback((currentDistrictQuartiers: DistrictQuartiersMap[], districtQuartierIds: string[]) => {
    let filteredRecos: RecosMap[];
    if (notNull(districtQuartierIds) && Recos$.length > 0) {
      if (currentDistrictQuartiers.length > 0) {
        filteredRecos = Recos$.filter(d => districtQuartierIds.includes(d.district_quartier_id));
      } else {
        filteredRecos = Recos$;
      }
    } else {
      filteredRecos = Recos$;
    }
    setRecos(filteredRecos);
    return filteredRecos.map(r => r.id);
  }, [Recos$]);

  const districtsGenerate = useCallback((currentHospitals: HospitalsMap[], hospitalIds: string[]) => {
    let filteredDistricts: DistrictQuartiersMap[];
    if (notNull(hospitalIds) && DistrictQuartiers$.length > 0) {
      if (currentHospitals.length > 0) {
        filteredDistricts = DistrictQuartiers$.filter(d => hospitalIds.includes(d.hospital_id));
      } else {
        filteredDistricts = DistrictQuartiers$;
      }
    } else {
      filteredDistricts = [];
    }
    setDistrictQuartiers(filteredDistricts);
    const districtIds = filteredDistricts.map(r => r.id);
    const recoIds = recosGenerate(filteredDistricts, districtIds);
    return { districtIds, recoIds };
  }, [DistrictQuartiers$, recosGenerate]);

  const hospitalsGenerate = useCallback((currentCommunes: CommunesMap[], communeIds: string[]) => {
    let filteredHospitals: HospitalsMap[];
    if (notNull(communeIds) && Hospitals$.length > 0) {
      if (currentCommunes.length > 0) {
        filteredHospitals = Hospitals$.filter(d => communeIds.includes(d.commune_id));
      } else {
        filteredHospitals = Hospitals$;
      }
    } else {
      filteredHospitals = [];
    }
    setHospitals(filteredHospitals);
    const hospitalIds = filteredHospitals.map(r => r.id);
    const { districtIds, recoIds } = districtsGenerate(filteredHospitals, hospitalIds);
    return { hospitalIds, districtIds, recoIds };
  }, [Hospitals$, districtsGenerate]);

  const communesGenerate = useCallback((currentPrefectures: PrefecturesMap[], prefectureIds: string[]) => {
    let filteredCommunes: CommunesMap[];
    if (notNull(prefectureIds) && Communes$.length > 0) {
      if (currentPrefectures.length > 0) {
        filteredCommunes = Communes$.filter(d => prefectureIds.includes(d.prefecture_id));
      } else {
        filteredCommunes = Communes$;
      }
    } else {
      filteredCommunes = [];
    }
    setCommunes(filteredCommunes);
    const communeIds = filteredCommunes.map(r => r.id);
    const { hospitalIds, districtIds, recoIds } = hospitalsGenerate(filteredCommunes, communeIds);
    return { communeIds, hospitalIds, districtIds, recoIds };
  }, [Communes$, hospitalsGenerate]);

  const prefecturesGenerate = useCallback((currentRegions: RegionsMap[], regionIds: string[]) => {
    let filteredPrefectures: PrefecturesMap[];
    if (notNull(regionIds) && Prefectures$.length > 0) {
      if (currentRegions.length > 0) {
        filteredPrefectures = Prefectures$.filter(d => regionIds.includes(d.region_id));
      } else {
        filteredPrefectures = Prefectures$;
      }
    } else {
      filteredPrefectures = [];
    }
    setPrefectures(filteredPrefectures);
    const prefectureIds = filteredPrefectures.map(r => r.id);
    const { communeIds, hospitalIds, districtIds, recoIds } = communesGenerate(filteredPrefectures, prefectureIds);
    return { prefectureIds, communeIds, hospitalIds, districtIds, recoIds };
  }, [Prefectures$, communesGenerate]);

  const regionsGenerate = useCallback((currentCountries: CountryMap[], countryIds: string[]) => {
    let filteredRegions: RegionsMap[];
    if (notNull(countryIds) && Regions$.length > 0) {
      if (currentCountries.length > 0) {
        filteredRegions = Regions$.filter(d => countryIds.includes(d.country_id));
      } else {
        filteredRegions = Regions$;
      }
    } else {
      filteredRegions = [];
    }
    setRegions(filteredRegions);
    const regionIds = filteredRegions.map(r => r.id);
    const { prefectureIds, communeIds, hospitalIds, districtIds, recoIds } = prefecturesGenerate(filteredRegions, regionIds);
    return { regionIds, prefectureIds, communeIds, hospitalIds, districtIds, recoIds };
  }, [Regions$, prefecturesGenerate]);

  const countriesGenerate = useCallback(() => {
    const filteredCountries = Countries$;
    setCountries(filteredCountries);
    const countryIds = filteredCountries.map(c => c.id);
    const { regionIds, prefectureIds, communeIds, hospitalIds, districtIds, recoIds } = regionsGenerate(filteredCountries, countryIds);
    setFormValues(prev => ({
      ...prev,
      country: countryIds,
      region: regionIds,
      prefecture: prefectureIds,
      commune: communeIds,
      hospital: hospitalIds,
      district_quartier: districtIds,
      recos: recoIds,
    }));
  }, [Countries$, regionsGenerate]);

  useEffect(() => {
    if (!isInitialized.current && Countries$.length > 0) {
      isInitialized.current = true;
      countriesGenerate();
    }
  }, [Countries$, countriesGenerate]);

  const handleCountryChange = useCallback((newCountryIds: string[]) => {
    const currentCountries = Countries$.filter(c => newCountryIds.includes(c.id));
    setCountries(currentCountries.length > 0 ? currentCountries : Countries$);
    const { regionIds, prefectureIds, communeIds, hospitalIds, districtIds, recoIds } = regionsGenerate(
      currentCountries.length > 0 ? currentCountries : Countries$,
      newCountryIds
    );
    setFormValues(prev => ({
      ...prev,
      country: newCountryIds,
      region: regionIds,
      prefecture: prefectureIds,
      commune: communeIds,
      hospital: hospitalIds,
      district_quartier: districtIds,
      recos: recoIds,
    }));
  }, [Countries$, regionsGenerate]);

  const handleRegionChange = useCallback((newRegionIds: string[]) => {
    const { prefectureIds, communeIds, hospitalIds, districtIds, recoIds } = prefecturesGenerate(regions, newRegionIds);
    setFormValues(prev => ({
      ...prev,
      region: newRegionIds,
      prefecture: prefectureIds,
      commune: communeIds,
      hospital: hospitalIds,
      district_quartier: districtIds,
      recos: recoIds,
    }));
  }, [regions, prefecturesGenerate]);

  const handlePrefectureChange = useCallback((newPrefectureIds: string[]) => {
    const { communeIds, hospitalIds, districtIds, recoIds } = communesGenerate(prefectures, newPrefectureIds);
    setFormValues(prev => ({
      ...prev,
      prefecture: newPrefectureIds,
      commune: communeIds,
      hospital: hospitalIds,
      district_quartier: districtIds,
      recos: recoIds,
    }));
  }, [prefectures, communesGenerate]);

  const handleCommuneChange = useCallback((newCommuneIds: string[]) => {
    const { hospitalIds, districtIds, recoIds } = hospitalsGenerate(communes, newCommuneIds);
    setFormValues(prev => ({
      ...prev,
      commune: newCommuneIds,
      hospital: hospitalIds,
      district_quartier: districtIds,
      recos: recoIds,
    }));
  }, [communes, hospitalsGenerate]);

  const handleHospitalChange = useCallback((newHospitalIds: string[]) => {
    const { districtIds, recoIds } = districtsGenerate(hospitals, newHospitalIds);
    setFormValues(prev => ({
      ...prev,
      hospital: newHospitalIds,
      district_quartier: districtIds,
      recos: recoIds,
    }));
  }, [hospitals, districtsGenerate]);

  const handleDistrictQuartierChange = useCallback((newDistrictIds: string[]) => {
    const recoIds = recosGenerate(districtQuartiers, newDistrictIds);
    setFormValues(prev => ({
      ...prev,
      district_quartier: newDistrictIds,
      recos: recoIds,
    }));
  }, [districtQuartiers, recosGenerate]);

  const handleRecosChange = useCallback((newRecoIds: string[]) => {
    setMultipleValues('recos', newRecoIds);
  }, [setMultipleValues]);

  const selectAll = useCallback((
    cible: 'country' | 'region' | 'prefecture' | 'commune' | 'hospital' | 'district_quartier' | 'recos',
    checked: boolean
  ) => {
    if (cible === 'country') handleCountryChange(checked ? countries.map(r => r.id) : []);
    else if (cible === 'region') handleRegionChange(checked ? regions.map(r => r.id) : []);
    else if (cible === 'prefecture') handlePrefectureChange(checked ? prefectures.map(r => r.id) : []);
    else if (cible === 'commune') handleCommuneChange(checked ? communes.map(r => r.id) : []);
    else if (cible === 'hospital') handleHospitalChange(checked ? hospitals.map(r => r.id) : []);
    else if (cible === 'district_quartier') handleDistrictQuartierChange(checked ? districtQuartiers.map(r => r.id) : []);
    else if (cible === 'recos') handleRecosChange(checked ? recos.map(r => r.id) : []);
  }, [countries, regions, prefectures, communes, hospitals, districtQuartiers, recos,
      handleCountryChange, handleRegionChange, handlePrefectureChange, handleCommuneChange,
      handleHospitalChange, handleDistrictQuartierChange, handleRecosChange]);

  const isChecked = useCallback((cible: string): boolean => {
    const value = getVal(cible);
    if (cible === 'country') return notNull(value) && value.length === countries.length && countries.length > 0;
    if (cible === 'region') return notNull(value) && value.length === regions.length && regions.length > 0;
    if (cible === 'prefecture') return notNull(value) && value.length === prefectures.length && prefectures.length > 0;
    if (cible === 'commune') return notNull(value) && value.length === communes.length && communes.length > 0;
    if (cible === 'hospital') return notNull(value) && value.length === hospitals.length && hospitals.length > 0;
    if (cible === 'district_quartier') return notNull(value) && value.length === districtQuartiers.length && districtQuartiers.length > 0;
    if (cible === 'recos') return notNull(value) && value.length === recos.length && recos.length > 0;
    return false;
  }, [getVal, countries, regions, prefectures, communes, hospitals, districtQuartiers, recos]);

  const selectedLength = useCallback((cible: string): number => {
    const val = getVal(cible);
    return notNull(val) ? val.length : 0;
  }, [getVal]);

  const getOrgUnits = useCallback((): OrgUnitSelection => {
    const selectedRecos = recos.filter(r => getVal('recos').includes(r.id));
    return {
      country: countries.filter(r => getVal('country').includes(r.id)),
      region: regions.filter(r => getVal('region').includes(r.id)),
      prefecture: prefectures.filter(r => getVal('prefecture').includes(r.id)),
      commune: communes.filter(r => getVal('commune').includes(r.id)),
      hospital: hospitals.filter(r => getVal('hospital').includes(r.id)),
      district_quartier: districtQuartiers.filter(r => getVal('district_quartier').includes(r.id)),
      chws: Chws$.filter(r => getVal('district_quartier').includes(r.district_quartier_id)),
      village_secteur: [],
      recos: selectedRecos,
      all_recos_ids: Recos$.map(r => r.id),
      selected_recos_ids: selectedRecos.map(r => r.id),
    };
  }, [countries, regions, prefectures, communes, hospitals, districtQuartiers, recos, Chws$, Recos$, getVal]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const formData: FilterFormData = {
      start_date: startDate,
      end_date: endDate,
      country: getVal('country'),
      region: getVal('region'),
      prefecture: getVal('prefecture'),
      commune: getVal('commune'),
      hospital: getVal('hospital'),
      district_quartier: getVal('district_quartier'),
      recos: getVal('recos'),
      org_units: getOrgUnits(),
    };
    onChange?.(formData);
    onClose?.();
  }, [getVal, getOrgUnits, startDate, endDate, onChange, onClose]);

  const toggleValue = useCallback((
    cible: 'country' | 'region' | 'prefecture' | 'commune' | 'hospital' | 'district_quartier' | 'recos',
    id: string
  ) => {
    const current = getVal(cible);
    const next = current.includes(id) ? current.filter(val => val !== id) : [...current, id];
    if (cible === 'country') handleCountryChange(next);
    if (cible === 'region') handleRegionChange(next);
    if (cible === 'prefecture') handlePrefectureChange(next);
    if (cible === 'commune') handleCommuneChange(next);
    if (cible === 'hospital') handleHospitalChange(next);
    if (cible === 'district_quartier') handleDistrictQuartierChange(next);
    if (cible === 'recos') handleRecosChange(next);
  }, [getVal, handleCountryChange, handleRegionChange, handlePrefectureChange, handleCommuneChange,
      handleHospitalChange, handleDistrictQuartierChange, handleRecosChange]);

  const renderFilterGroup = (
    label: string,
    cible: 'country' | 'region' | 'prefecture' | 'commune' | 'hospital' | 'district_quartier' | 'recos',
    items: { id: string; name: string }[]
  ) => (
    <div className={styles.formGroup}>
      <label>
        {label} : ({selectedLength(cible)})
        <input
          type="checkbox"
          checked={isChecked(cible)}
          onChange={(e) => selectAll(cible, e.target.checked)}
        />
      </label>
      <div className={styles.optionsContainer}>
        <div className={styles.optionsGrid}>
          {items.map(item => {
            const isSelected = getVal(cible).includes(item.id);
            return (
              <label
                key={item.id}
                className={`${styles.optionItem} ${isSelected ? styles.optionItemSelected : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleValue(cible, item.id)}
                />
                <span>{item.name}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose || (() => {})}
      title="Filtrer les données"
      size="lg"
      footer={
        <Button variant="primary" onClick={handleSubmit}>
          Appliquer le filtre
        </Button>
      }
    >
      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        {((Countries$.length > 1 && countries.length === 0) || countries.length > 1) &&
          renderFilterGroup('Pays', 'country', countries)}

        {((Regions$.length > 1 && regions.length === 0) || regions.length > 1) &&
          renderFilterGroup('Regions', 'region', regions)}

        {((Prefectures$.length > 1 && prefectures.length === 0) || prefectures.length > 1) &&
          renderFilterGroup('Prefectures', 'prefecture', prefectures)}

        {((Communes$.length > 1 && communes.length === 0) || communes.length > 1) &&
          renderFilterGroup('Communes', 'commune', communes)}

        {((Hospitals$.length > 1 && hospitals.length === 0) || hospitals.length > 1) &&
          renderFilterGroup('Centre de sante', 'hospital', hospitals)}

        {((DistrictQuartiers$.length > 1 && districtQuartiers.length === 0) || districtQuartiers.length > 1) &&
          renderFilterGroup('Districts/Quartiers', 'district_quartier', districtQuartiers)}

        {showRecoLevel && ((Recos$.length > 1 && recos.length === 0) || recos.length > 1) &&
          renderFilterGroup('Recos', 'recos', recos)}

        {showDateSelection && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="start_date">Date de debut :</label>
              <input
                id="start_date"
                type="date"
                className={styles.formControl}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="end_date">Date de fin :</label>
              <input
                id="end_date"
                type="date"
                className={styles.formControl}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

export default OrgUnitsFilter;
