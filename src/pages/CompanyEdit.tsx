import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaBuilding, FaMapMarkerAlt, FaUser, FaPhone, FaHashtag, FaIdBadge, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { API_BASE_URL } from '../lib/api';

const API_BASE = API_BASE_URL || window.location.origin;

const initialState = {
  name: '',
  street: '',
  postal_code: '',
  city: '',
  contact_person: '',
  phone: '',
  reference: '',
  company_number: '',
};

const fields = [
  { name: 'name', label: 'Name des Arbeitgebers', icon: <FaBuilding /> },
  { name: 'street', label: 'Straße, Hausnummer', icon: <FaMapMarkerAlt /> },
  { name: 'postal_code', label: 'PLZ', icon: <FaMapMarkerAlt /> },
  { name: 'city', label: 'Ort', icon: <FaMapMarkerAlt /> },
  { name: 'contact_person', label: 'Ansprechpartner/in', icon: <FaUser /> },
  { name: 'phone', label: 'Telefonnummer', icon: <FaPhone /> },
  { name: 'reference', label: 'Geschäftszeichen', icon: <FaHashtag /> },
  { name: 'company_number', label: 'Betriebsnummer des Arbeitgebers', icon: <FaIdBadge /> },
];

const validate = (company: typeof initialState) => {
  for (const key in company) {
    if (!company[key as keyof typeof company]) return false;
  }
  return true;
};

// CompanyEdit page for editing company data
const CompanyEdit: React.FC = () => {
  const [company, setCompany] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<{[k:string]:boolean}>({});

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE}/company`)
      .then(res => {
-        setCompany(res.data);
+        setCompany({ ...initialState, ...res.data });
        setLoading(false);
      })
      .catch(() => {
        setError('Fehler beim Laden der Firmendaten.');
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompany({ ...company, [e.target.name]: e.target.value });
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleSave = async () => {
    setSuccess('');
    setError('');
    if (!validate(company)) {
      setError('Bitte füllen Sie alle Felder aus.');
      return;
    }
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/company`, company);
      setSuccess('Firmendaten erfolgreich gespeichert!');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Fehler beim Speichern.');
    }
    setSaving(false);
  };

  return (
    <div className="flex items-center min-h-[70vh] bg-gradient-to-br from-blue-200/60 via-blue-100/80 to-blue-50/90 py-8 animate-fade-in">
      <div className="relative w-full max-w-6xl mx-auto">
        <div className="absolute -inset-1 bg-gradient-to-br from-blue-400/30 via-blue-200/20 to-blue-100/10 rounded-3xl blur-xl z-0 animate-pulse-slow" />
        <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-0 flex flex-col animate-fade-in-up border border-blue-100">
          <div className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 rounded-t-3xl px-4 py-6 flex items-center gap-3 shadow-lg">
            <FaBuilding className="text-white text-3xl drop-shadow" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide drop-shadow">Firmendaten bearbeiten</h2>
          </div>
          {loading ? (
            <div className="text-blue-600 p-8">Lade Daten...</div>
          ) : (
            <form className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 px-3 py-8">
              {fields.map((f, idx) => (
                <div key={f.name} className="flex flex-col gap-1 bg-white/60 rounded-xl shadow-sm p-4 border border-blue-100 hover:border-blue-300 transition-all">
                  <label className="font-semibold text-blue-900 flex items-center gap-2 mb-1">
                    <span className="text-blue-400 text-lg">{f.icon}</span> {f.label}
                  </label>
                  <input
                    name={f.name}
                    value={company[f.name as keyof typeof company]}
                    onChange={handleChange}
                    className={`border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-300 transition text-base bg-white/80 ${touched[f.name] && !company[f.name as keyof typeof company] ? 'border-red-400' : 'border-blue-100'}`}
                    autoComplete="off"
                  />
                </div>
              ))}
              <div className="md:col-span-3 flex flex-col items-end mt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white font-bold py-3 px-10 rounded-full shadow-xl transition-all flex items-center gap-3 text-lg disabled:opacity-60 animate-glow"
                  style={{ boxShadow: '0 0 16px 2px #60a5fa, 0 2px 8px 0 #3b82f6' }}
                >
                  {saving ? 'Speichern...' : 'Speichern'}
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full blur-sm animate-pulse" />
                </button>
                {success && (
                  <div className="flex items-center gap-2 text-green-600 mt-4 animate-fade-in text-base">
                    <FaCheckCircle /> <span>{success}</span>
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 text-red-600 mt-4 animate-fade-in text-base">
                    <FaExclamationCircle /> <span>{error}</span>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyEdit; 