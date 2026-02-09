import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSwitch } from '@/components/forms/FormSwitch/FormSwitch';
import { FormCheckbox } from '@/components/forms/FormCheckbox/FormCheckbox';
import { Save, X, ChevronDown, ChevronRight, Check, User as UserIcon, Mail, Lock, Phone } from 'lucide-react';
import type { User, Roles } from '@/models/OLD/old/auth.types';
import type {
  CountryMap,
  RegionsMap,
  PrefecturesMap,
  CommunesMap,
  HospitalsMap,
  DistrictQuartiersMap,
  VillageSecteursMap,
} from '@/models/OLD/old/org-unit.types';
import type { OrgUnitsData } from '@/stores/OLD/users.store';
import type { UserFormData } from '@/contexts/OLD/useUsers';
import styles from './UserModal.module.css';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UserFormData) => Promise<{ success: boolean; message?: string }>;
  user: User | null;
  roles: Roles[];
  orgUnits: OrgUnitsData;
  isLoading: boolean;
}

type OrgUnitSection = 'countries' | 'regions' | 'prefectures' | 'communes' | 'hospitals' | 'districtQuartiers' | 'villageSecteurs';

export function UserModal({
  isOpen,
  onClose,
  onSave,
  user,
  roles,
  orgUnits,
  isLoading,
}: UserModalProps) {
  const isEditMode = !!user;

  // Form state
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [message, setMessage] = useState('');

  // Selected OrgUnits
  const [selectedCountries, setSelectedCountries] = useState<CountryMap[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<RegionsMap[]>([]);
  const [selectedPrefectures, setSelectedPrefectures] = useState<PrefecturesMap[]>([]);
  const [selectedCommunes, setSelectedCommunes] = useState<CommunesMap[]>([]);
  const [selectedHospitals, setSelectedHospitals] = useState<HospitalsMap[]>([]);
  const [selectedDistrictQuartiers, setSelectedDistrictQuartiers] = useState<DistrictQuartiersMap[]>([]);
  const [selectedVillageSecteurs, setSelectedVillageSecteurs] = useState<VillageSecteursMap[]>([]);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    info: true,
    roles: false,
    orgUnits: false,
  });

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setUsername(user.username || '');
        setFullname(user.fullname || '');
        setEmail(user.email || '');
        setPhone((user as any).phone || '');
        setIsActive(user.isActive ?? true);
        setSelectedRoles(user.rolesIds || []);
        setSelectedCountries(user.countries || []);
        setSelectedRegions(user.regions || []);
        setSelectedPrefectures(user.prefectures || []);
        setSelectedCommunes(user.communes || []);
        setSelectedHospitals(user.hospitals || []);
        setSelectedDistrictQuartiers(user.districtQuartiers || []);
        setSelectedVillageSecteurs(user.villageSecteurs || []);
      } else {
        setUsername('');
        setFullname('');
        setEmail('');
        setPhone('');
        setIsActive(true);
        setSelectedRoles([]);
        setSelectedCountries([]);
        setSelectedRegions([]);
        setSelectedPrefectures([]);
        setSelectedCommunes([]);
        setSelectedHospitals([]);
        setSelectedDistrictQuartiers([]);
        setSelectedVillageSecteurs([]);
      }
      setPassword('');
      setPasswordConfirm('');
      setMessage('');
    }
  }, [isOpen, user]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  // OrgUnits selection helpers
  const isOrgUnitSelected = (type: OrgUnitSection, id: string): boolean => {
    switch (type) {
      case 'countries':
        return selectedCountries.some((c) => c.id === id);
      case 'regions':
        return selectedRegions.some((r) => r.id === id);
      case 'prefectures':
        return selectedPrefectures.some((p) => p.id === id);
      case 'communes':
        return selectedCommunes.some((c) => c.id === id);
      case 'hospitals':
        return selectedHospitals.some((h) => h.id === id);
      case 'districtQuartiers':
        return selectedDistrictQuartiers.some((d) => d.id === id);
      case 'villageSecteurs':
        return selectedVillageSecteurs.some((v) => v.id === id);
      default:
        return false;
    }
  };

  const toggleCountry = (country: CountryMap) => {
    const isSelected = selectedCountries.some((c) => c.id === country.id);
    if (isSelected) {
      setSelectedCountries((prev) => prev.filter((c) => c.id !== country.id));
      // Remove all children
      setSelectedRegions((prev) => prev.filter((r) => r.country_id !== country.id));
      setSelectedPrefectures((prev) => prev.filter((p) => p.country_id !== country.id));
      setSelectedCommunes((prev) => prev.filter((c) => c.country_id !== country.id));
      setSelectedHospitals((prev) => prev.filter((h) => h.country_id !== country.id));
      setSelectedDistrictQuartiers((prev) => prev.filter((d) => d.country_id !== country.id));
      setSelectedVillageSecteurs((prev) => prev.filter((v) => v.country_id !== country.id));
    } else {
      setSelectedCountries((prev) => [...prev, country]);
      // Select all children
      setSelectedRegions((prev) => [
        ...prev.filter((r) => r.country_id !== country.id),
        ...orgUnits.regions.filter((r) => r.country_id === country.id),
      ]);
      setSelectedPrefectures((prev) => [
        ...prev.filter((p) => p.country_id !== country.id),
        ...orgUnits.prefectures.filter((p) => p.country_id === country.id),
      ]);
      setSelectedCommunes((prev) => [
        ...prev.filter((c) => c.country_id !== country.id),
        ...orgUnits.communes.filter((c) => c.country_id === country.id),
      ]);
      setSelectedHospitals((prev) => [
        ...prev.filter((h) => h.country_id !== country.id),
        ...orgUnits.hospitals.filter((h) => h.country_id === country.id),
      ]);
      setSelectedDistrictQuartiers((prev) => [
        ...prev.filter((d) => d.country_id !== country.id),
        ...orgUnits.districtQuartiers.filter((d) => d.country_id === country.id),
      ]);
      setSelectedVillageSecteurs((prev) => [
        ...prev.filter((v) => v.country_id !== country.id),
        ...orgUnits.villageSecteurs.filter((v) => v.country_id === country.id),
      ]);
    }
  };

  const toggleRegion = (region: RegionsMap) => {
    const isSelected = selectedRegions.some((r) => r.id === region.id);
    if (isSelected) {
      setSelectedRegions((prev) => prev.filter((r) => r.id !== region.id));
      setSelectedPrefectures((prev) => prev.filter((p) => p.region_id !== region.id));
      setSelectedCommunes((prev) => prev.filter((c) => c.region_id !== region.id));
      setSelectedHospitals((prev) => prev.filter((h) => h.region_id !== region.id));
      setSelectedDistrictQuartiers((prev) => prev.filter((d) => d.region_id !== region.id));
      setSelectedVillageSecteurs((prev) => prev.filter((v) => v.region_id !== region.id));
    } else {
      setSelectedRegions((prev) => [...prev, region]);
      setSelectedPrefectures((prev) => [
        ...prev.filter((p) => p.region_id !== region.id),
        ...orgUnits.prefectures.filter((p) => p.region_id === region.id),
      ]);
      setSelectedCommunes((prev) => [
        ...prev.filter((c) => c.region_id !== region.id),
        ...orgUnits.communes.filter((c) => c.region_id === region.id),
      ]);
      setSelectedHospitals((prev) => [
        ...prev.filter((h) => h.region_id !== region.id),
        ...orgUnits.hospitals.filter((h) => h.region_id === region.id),
      ]);
      setSelectedDistrictQuartiers((prev) => [
        ...prev.filter((d) => d.region_id !== region.id),
        ...orgUnits.districtQuartiers.filter((d) => d.region_id === region.id),
      ]);
      setSelectedVillageSecteurs((prev) => [
        ...prev.filter((v) => v.region_id !== region.id),
        ...orgUnits.villageSecteurs.filter((v) => v.region_id === region.id),
      ]);
    }
  };

  const togglePrefecture = (prefecture: PrefecturesMap) => {
    const isSelected = selectedPrefectures.some((p) => p.id === prefecture.id);
    if (isSelected) {
      setSelectedPrefectures((prev) => prev.filter((p) => p.id !== prefecture.id));
      setSelectedCommunes((prev) => prev.filter((c) => c.prefecture_id !== prefecture.id));
      setSelectedHospitals((prev) => prev.filter((h) => h.prefecture_id !== prefecture.id));
      setSelectedDistrictQuartiers((prev) => prev.filter((d) => d.prefecture_id !== prefecture.id));
      setSelectedVillageSecteurs((prev) => prev.filter((v) => v.prefecture_id !== prefecture.id));
    } else {
      setSelectedPrefectures((prev) => [...prev, prefecture]);
      setSelectedCommunes((prev) => [
        ...prev.filter((c) => c.prefecture_id !== prefecture.id),
        ...orgUnits.communes.filter((c) => c.prefecture_id === prefecture.id),
      ]);
      setSelectedHospitals((prev) => [
        ...prev.filter((h) => h.prefecture_id !== prefecture.id),
        ...orgUnits.hospitals.filter((h) => h.prefecture_id === prefecture.id),
      ]);
      setSelectedDistrictQuartiers((prev) => [
        ...prev.filter((d) => d.prefecture_id !== prefecture.id),
        ...orgUnits.districtQuartiers.filter((d) => d.prefecture_id === prefecture.id),
      ]);
      setSelectedVillageSecteurs((prev) => [
        ...prev.filter((v) => v.prefecture_id !== prefecture.id),
        ...orgUnits.villageSecteurs.filter((v) => v.prefecture_id === prefecture.id),
      ]);
    }
  };

  const toggleCommune = (commune: CommunesMap) => {
    const isSelected = selectedCommunes.some((c) => c.id === commune.id);
    if (isSelected) {
      setSelectedCommunes((prev) => prev.filter((c) => c.id !== commune.id));
      setSelectedHospitals((prev) => prev.filter((h) => h.commune_id !== commune.id));
      setSelectedDistrictQuartiers((prev) => prev.filter((d) => d.commune_id !== commune.id));
      setSelectedVillageSecteurs((prev) => prev.filter((v) => v.commune_id !== commune.id));
    } else {
      setSelectedCommunes((prev) => [...prev, commune]);
      setSelectedHospitals((prev) => [
        ...prev.filter((h) => h.commune_id !== commune.id),
        ...orgUnits.hospitals.filter((h) => h.commune_id === commune.id),
      ]);
      setSelectedDistrictQuartiers((prev) => [
        ...prev.filter((d) => d.commune_id !== commune.id),
        ...orgUnits.districtQuartiers.filter((d) => d.commune_id === commune.id),
      ]);
      setSelectedVillageSecteurs((prev) => [
        ...prev.filter((v) => v.commune_id !== commune.id),
        ...orgUnits.villageSecteurs.filter((v) => v.commune_id === commune.id),
      ]);
    }
  };

  const toggleHospital = (hospital: HospitalsMap) => {
    const isSelected = selectedHospitals.some((h) => h.id === hospital.id);
    if (isSelected) {
      setSelectedHospitals((prev) => prev.filter((h) => h.id !== hospital.id));
      setSelectedDistrictQuartiers((prev) => prev.filter((d) => d.hospital_id !== hospital.id));
      setSelectedVillageSecteurs((prev) => prev.filter((v) => v.hospital_id !== hospital.id));
    } else {
      setSelectedHospitals((prev) => [...prev, hospital]);
      setSelectedDistrictQuartiers((prev) => [
        ...prev.filter((d) => d.hospital_id !== hospital.id),
        ...orgUnits.districtQuartiers.filter((d) => d.hospital_id === hospital.id),
      ]);
      setSelectedVillageSecteurs((prev) => [
        ...prev.filter((v) => v.hospital_id !== hospital.id),
        ...orgUnits.villageSecteurs.filter((v) => v.hospital_id === hospital.id),
      ]);
    }
  };

  const toggleDistrictQuartier = (districtQuartier: DistrictQuartiersMap) => {
    const isSelected = selectedDistrictQuartiers.some((d) => d.id === districtQuartier.id);
    if (isSelected) {
      setSelectedDistrictQuartiers((prev) => prev.filter((d) => d.id !== districtQuartier.id));
      setSelectedVillageSecteurs((prev) => prev.filter((v) => v.district_quartier_id !== districtQuartier.id));
    } else {
      setSelectedDistrictQuartiers((prev) => [...prev, districtQuartier]);
      setSelectedVillageSecteurs((prev) => [
        ...prev.filter((v) => v.district_quartier_id !== districtQuartier.id),
        ...orgUnits.villageSecteurs.filter((v) => v.district_quartier_id === districtQuartier.id),
      ]);
    }
  };

  const toggleVillageSecteur = (villageSecteur: VillageSecteursMap) => {
    const isSelected = selectedVillageSecteurs.some((v) => v.id === villageSecteur.id);
    if (isSelected) {
      setSelectedVillageSecteurs((prev) => prev.filter((v) => v.id !== villageSecteur.id));
    } else {
      setSelectedVillageSecteurs((prev) => [...prev, villageSecteur]);
    }
  };

  // Validation
  const orgUnitsIsEmpty = useMemo(() => {
    return (
      selectedCountries.length === 0 &&
      selectedRegions.length === 0 &&
      selectedPrefectures.length === 0 &&
      selectedCommunes.length === 0 &&
      selectedHospitals.length === 0 &&
      selectedDistrictQuartiers.length === 0 &&
      selectedVillageSecteurs.length === 0
    );
  }, [
    selectedCountries,
    selectedRegions,
    selectedPrefectures,
    selectedCommunes,
    selectedHospitals,
    selectedDistrictQuartiers,
    selectedVillageSecteurs,
  ]);

  // Form validity check for button disable
  const isFormValid = useMemo(() => {
    // Username is required for new users
    if (!isEditMode && !username.trim()) return false;
    // Password is required for new users
    if (!isEditMode && (!password.trim() || password.length < 8)) return false;
    // Password confirmation must match
    if (!isEditMode && password !== passwordConfirm) return false;
    // If editing and password is set, confirmation must match
    if (isEditMode && password && password !== passwordConfirm) return false;
    // At least one role must be selected
    if (selectedRoles.length === 0) return false;
    // At least one org unit must be selected
    if (orgUnitsIsEmpty) return false;
    return true;
  }, [isEditMode, username, password, passwordConfirm, selectedRoles, orgUnitsIsEmpty]);

  const handleSubmit = async () => {
    setMessage('');

    // Validate password
    if (!isEditMode) {
      if (!password.trim()) {
        setMessage('Le mot de passe est obligatoire.');
        return;
      }
      if (!passwordConfirm.trim()) {
        setMessage('Veuillez confirmer le mot de passe.');
        return;
      }
      if (password !== passwordConfirm) {
        setMessage('Les mots de passe ne concordent pas.');
        return;
      }
      if (password.length < 8) {
        setMessage('Le mot de passe doit contenir au moins 8 caractères.');
        return;
      }
    } else if (password || passwordConfirm) {
      if (password !== passwordConfirm) {
        setMessage('Les mots de passe ne concordent pas. Effacez-les si vous ne souhaitez pas les modifier.');
        return;
      }
    }

    // Validate OrgUnits and roles
    if (orgUnitsIsEmpty || selectedRoles.length === 0) {
      setMessage('Les unités organisationnelles ou les rôles sont vides. Ils sont requis.');
      return;
    }

    const data: UserFormData = {
      id: user?.id,
      username: user?.username || username,
      fullname,
      email,
      phone,
      password: password.trim() || undefined,
      isActive,
      roles: selectedRoles,
      countries: selectedCountries,
      regions: selectedRegions,
      prefectures: selectedPrefectures,
      communes: selectedCommunes,
      hospitals: selectedHospitals,
      districtQuartiers: selectedDistrictQuartiers,
      villageSecteurs: selectedVillageSecteurs,
      chws: orgUnits.chws.filter((c) =>
        selectedDistrictQuartiers.some((d) => d.id === c.district_quartier_id)
      ),
      recos: orgUnits.recos.filter((r) =>
        selectedVillageSecteurs.some((v) => v.id === r.village_secteur_id)
      ),
    };

    const result = await onSave(data);
    if (!result.success && result.message) {
      setMessage(result.message);
    }
  };

  // Hierarchy data for OrgUnits tree
  const getRegionsForCountry = (countryId: string) =>
    orgUnits.regions.filter((r) => r.country_id === countryId);

  const getPrefecturesForRegion = (regionId: string) =>
    orgUnits.prefectures.filter((p) => p.region_id === regionId);

  const getCommunesForPrefecture = (prefectureId: string) =>
    orgUnits.communes.filter((c) => c.prefecture_id === prefectureId);

  const getHospitalsForCommune = (communeId: string) =>
    orgUnits.hospitals.filter((h) => h.commune_id === communeId);

  const getDistrictQuartiersForHospital = (hospitalId: string) =>
    orgUnits.districtQuartiers.filter((d) => d.hospital_id === hospitalId);

  const getVillageSecteursForDistrictQuartier = (districtQuartierId: string) =>
    orgUnits.villageSecteurs.filter((v) => v.district_quartier_id === districtQuartierId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Modifier utilisateur' : 'Nouvel utilisateur'}
      size="lg"
    >
      <div className={styles.form}>
        {message && <div className={styles.errorMessage}>{message}</div>}

        {/* Basic Info Section */}
        <div className={styles.section}>
          <button
            type="button"
            className={styles.sectionHeader}
            onClick={() => toggleSection('info')}
          >
            {expandedSections.info ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            <span>Informations de base</span>
          </button>
          {expandedSections.info && (
            <div className={styles.sectionContent}>
              <div className={styles.formRow}>
                <FormInput
                  label="Nom d'utilisateur"
                  required={!isEditMode}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nom d'utilisateur"
                  disabled={isEditMode}
                  leftIcon={<UserIcon size={18} />}
                />
                <FormInput
                  label="Nom complet"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Nom complet"
                  leftIcon={<UserIcon size={18} />}
                />
              </div>
              <div className={styles.formRow}>
                <FormInput
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  leftIcon={<Mail size={18} />}
                />
                <FormInput
                  type="tel"
                  label="Téléphone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Numéro de téléphone"
                  leftIcon={<Phone size={18} />}
                />
              </div>
              <div className={styles.formRow}>
                <FormInput
                  type="password"
                  label="Mot de passe"
                  required={!isEditMode}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  leftIcon={<Lock size={18} />}
                  hint={!isEditMode ? 'Minimum 8 caractères' : 'Laissez vide pour ne pas modifier'}
                  error={!isEditMode && password.length > 0 && password.length < 8 ? 'Minimum 8 caractères' : undefined}
                />
                <FormInput
                  type="password"
                  label="Confirmer"
                  required={!isEditMode}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  leftIcon={<Lock size={18} />}
                  error={passwordConfirm && password !== passwordConfirm ? 'Les mots de passe ne correspondent pas' : undefined}
                />
              </div>
              <FormSwitch
                label="Utilisateur actif"
                description="Décochez pour désactiver temporairement l'accès"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            </div>
          )}
        </div>

        {/* Roles Section */}
        <div className={styles.section}>
          <button
            type="button"
            className={styles.sectionHeader}
            onClick={() => toggleSection('roles')}
          >
            {expandedSections.roles ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            <span>Rôles ({selectedRoles.length} sélectionné{selectedRoles.length > 1 ? 's' : ''})</span>
          </button>
          {expandedSections.roles && (
            <div className={styles.sectionContent}>
              <div className={styles.rolesList}>
                {roles.map((role) => (
                  <FormCheckbox
                    key={role.id}
                    label={role.name}
                    checked={selectedRoles.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* OrgUnits Section */}
        <div className={styles.section}>
          <button
            type="button"
            className={styles.sectionHeader}
            onClick={() => toggleSection('orgUnits')}
          >
            {expandedSections.orgUnits ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            <span>Unités organisationnelles</span>
            {orgUnitsIsEmpty && <span className={styles.required}>(requis)</span>}
          </button>
          {expandedSections.orgUnits && (
            <div className={styles.sectionContent}>
              <div className={styles.orgUnitsTree}>
                {orgUnits.countries.map((country) => (
                  <OrgUnitTreeItem
                    key={country.id}
                    item={country}
                    type="country"
                    isSelected={isOrgUnitSelected('countries', country.id)}
                    onToggle={() => toggleCountry(country)}
                    level={0}
                  >
                    {getRegionsForCountry(country.id).map((region) => (
                      <OrgUnitTreeItem
                        key={region.id}
                        item={region}
                        type="region"
                        isSelected={isOrgUnitSelected('regions', region.id)}
                        onToggle={() => toggleRegion(region)}
                        level={1}
                      >
                        {getPrefecturesForRegion(region.id).map((prefecture) => (
                          <OrgUnitTreeItem
                            key={prefecture.id}
                            item={prefecture}
                            type="prefecture"
                            isSelected={isOrgUnitSelected('prefectures', prefecture.id)}
                            onToggle={() => togglePrefecture(prefecture)}
                            level={2}
                          >
                            {getCommunesForPrefecture(prefecture.id).map((commune) => (
                              <OrgUnitTreeItem
                                key={commune.id}
                                item={commune}
                                type="commune"
                                isSelected={isOrgUnitSelected('communes', commune.id)}
                                onToggle={() => toggleCommune(commune)}
                                level={3}
                              >
                                {getHospitalsForCommune(commune.id).map((hospital) => (
                                  <OrgUnitTreeItem
                                    key={hospital.id}
                                    item={hospital}
                                    type="hospital"
                                    isSelected={isOrgUnitSelected('hospitals', hospital.id)}
                                    onToggle={() => toggleHospital(hospital)}
                                    level={4}
                                  >
                                    {getDistrictQuartiersForHospital(hospital.id).map((dq) => (
                                      <OrgUnitTreeItem
                                        key={dq.id}
                                        item={dq}
                                        type="districtQuartier"
                                        isSelected={isOrgUnitSelected('districtQuartiers', dq.id)}
                                        onToggle={() => toggleDistrictQuartier(dq)}
                                        level={5}
                                      >
                                        {getVillageSecteursForDistrictQuartier(dq.id).map((vs) => (
                                          <OrgUnitTreeItem
                                            key={vs.id}
                                            item={vs}
                                            type="villageSecteur"
                                            isSelected={isOrgUnitSelected('villageSecteurs', vs.id)}
                                            onToggle={() => toggleVillageSecteur(vs)}
                                            level={6}
                                          />
                                        ))}
                                      </OrgUnitTreeItem>
                                    ))}
                                  </OrgUnitTreeItem>
                                ))}
                              </OrgUnitTreeItem>
                            ))}
                          </OrgUnitTreeItem>
                        ))}
                      </OrgUnitTreeItem>
                    ))}
                  </OrgUnitTreeItem>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            <X size={18} />
            Annuler
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={!isFormValid || isLoading}>
            <Save size={18} />
            {isEditMode ? 'Modifier' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// OrgUnit Tree Item Component
interface OrgUnitTreeItemProps {
  item: { id: string; name: string };
  type: string;
  isSelected: boolean;
  onToggle: () => void;
  level: number;
  children?: React.ReactNode;
}

function OrgUnitTreeItem({ item, isSelected, onToggle, level, children }: OrgUnitTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = !!children && React.Children.count(children) > 0;

  return (
    <div className={styles.treeItem} style={{ marginLeft: `${level * 16}px` }}>
      <div className={styles.treeItemHeader}>
        {hasChildren && (
          <button
            type="button"
            className={styles.expandButton}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
        {!hasChildren && <span className={styles.expandPlaceholder} />}
        <label className={styles.treeCheckbox}>
          <input type="checkbox" checked={isSelected} onChange={onToggle} />
          {isSelected && <Check size={12} className={styles.checkIcon} />}
        </label>
        <span className={styles.treeItemName}>{item.name}</span>
      </div>
      {hasChildren && isExpanded && <div className={styles.treeChildren}>{children}</div>}
    </div>
  );
}

// Import React for Children.count
import React from 'react';
