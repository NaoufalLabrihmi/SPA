import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../lib/api';

// Group all fields into 4 professional sections
const sections = [
  {
    key: 'personal',
    label: 'Persönliche Angaben',
    fields: [
      { key: 'geburtsname', label: 'Familienname ggf. Geburtsname', type: 'text' },
      { key: 'vorname', label: 'Vorname', type: 'text' },
      { key: 'strasse_hausnummer', label: 'Straße und Hausnummer', type: 'text' },
      { key: 'plz_ort', label: 'PLZ, Ort', type: 'text' },
      { key: 'geburtsdatum', label: 'Geburtsdatum', type: 'date' },
      { key: 'geschlecht', label: 'Geschlecht', type: 'select', options: ['männlich','weiblich','divers'] },
      { key: 'versicherungsnummer', label: 'Versicherungsnummer', type: 'text' },
      { key: 'familienstand', label: 'Familienstand', type: 'text' },
      { key: 'geburtsort_land', label: 'Geburtsort, -land', type: 'text' },
      { key: 'schwerbehindert', label: 'Schwerbehindert', type: 'checkbox' },
      { key: 'staatsangehoerigkeit', label: 'Staatsangehörigkeit', type: 'text' },
      { key: 'arbeitnehmernummer', label: 'Arbeitnehmernummer', type: 'text' },
      { key: 'iban', label: 'Kontonummer (IBAN)', type: 'text' },
      { key: 'bic', label: 'Bankleitzahl/Bankbezeichnung (BIC)', type: 'text' },
      { key: 'identifikationsnummer', label: 'Identifikationsnummer', type: 'text' },
      { key: 'finanzamt_nr', label: 'Finanzamt-Nr.', type: 'text' },
      { key: 'steuerklasse', label: 'Steuerklasse/Faktor', type: 'text' },
      { key: 'kinderfreibetraege', label: 'Kinderfreibeträge', type: 'text' },
      { key: 'konfession', label: 'Konfession', type: 'text' },
      { key: 'gesetzliche_krankenkasse', label: 'Gesetzl. Krankenkasse', type: 'text' },
      { key: 'elterneigenschaft', label: 'Elterneigenschaft', type: 'checkbox' },
      { key: 'kv', label: 'KV', type: 'text' },
      { key: 'rv', label: 'RV', type: 'text' },
      { key: 'av', label: 'AV', type: 'text' },
      { key: 'pv', label: 'PV', type: 'text' },
      { key: 'uv_gefahrtarif', label: 'UV - Gefahrtarif', type: 'text' },
    ],
  },
  {
    key: 'employment',
    label: 'Beschäftigung & Ausbildung',
    fields: [
      { key: 'eintrittsdatum', label: 'Eintrittsdatum', type: 'date' },
      { key: 'ersteintrittsdatum', label: 'Ersteintrittsdatum', type: 'date' },
      { key: 'betriebsstaette', label: 'Betriebsstätte', type: 'text' },
      { key: 'berufsbezeichnung', label: 'Berufsbezeichnung', type: 'text' },
      { key: 'taetigkeit', label: 'Ausgeübte Tätigkeit', type: 'text' },
      { key: 'schulabschluss', label: 'Höchster Schulabschluss', type: 'select', options: ['ohne Schulabschluss','Haupt-/Volksschulabschluss','Mittlere Reife','Abitur/Fachabitur'] },
      { key: 'berufsausbildung', label: 'Höchste Berufsausbildung', type: 'select', options: ['ohne Abschluss','Anerkannte Berufsausbildung','Meister/Techniker','Bachelor','Diplom/Magister/Master/Staatsexamen','Promotion'] },
      { key: 'ausbildung_beginn', label: 'Beginn der Ausbildung', type: 'date' },
      { key: 'ausbildung_ende', label: 'Voraussichtliches Ende der Ausbildung', type: 'date' },
      { key: 'arbeitszeit_vollzeit', label: 'Vollzeit', type: 'checkbox', group: 'arbeitszeit' },
      { key: 'arbeitszeit_teilzeit', label: 'Teilzeit', type: 'checkbox', group: 'arbeitszeit' },
      { key: 'baugewerbe_seit', label: 'Im Baugewerbe beschäftigt seit', type: 'date', group: 'arbeitszeit' },
      { key: 'arbeitszeit_verteilung', label: 'Ggf. Verteilung d. wöchentl. Arbeitszeit (Std.)', type: 'arbeitszeit_verteilung', group: 'arbeitszeit' },
      { key: 'urlaubsanspruch', label: 'Urlaubsanspruch (Kalenderjahr)', type: 'number' },
      { key: 'kostenstelle', label: 'Kostenstelle', type: 'text' },
      { key: 'abteilungsnummer', label: 'Abt.-Nummer', type: 'text' },
      { key: 'personengruppe', label: 'Personengruppe', type: 'text' },
      { key: 'hauptbeschaeftigung', label: 'Hauptbeschäftigung', type: 'checkbox' },
      { key: 'nebenbeschaeftigung', label: 'Nebenbeschäftigung', type: 'checkbox' },
      { key: 'weitere_beschaeftigungen', label: 'Weitere Beschäftigungen', type: 'checkbox' },
      { key: 'arbeitsverhaeltnis_befristet', label: 'Das Arbeitsverhältnis ist befristet', type: 'checkbox' },
      { key: 'zweckbefristet', label: 'zweckbefristet', type: 'checkbox' },
      { key: 'befristung_arbeitsvertrag_zum', label: 'Befristung Arbeitsvertrag zum', type: 'date' },
      { key: 'schriftlicher_abschluss', label: 'Schriftlicher Abschluss', type: 'checkbox' },
      { key: 'abschluss_arbeitsvertrag_am', label: 'Abschluss Arbeitsvertrag am', type: 'date' },
      { key: 'befristete_beschaeftigung_2monate', label: 'Befristete Beschäftigung 2 Monate', type: 'checkbox' },
    ],
  },
  {
    key: 'entlohnung',
    label: 'Entlohnung & VWL',
    fields: [
      { key: 'entlohnung_bezeichnung1', label: 'Bezeichnung 1', type: 'text' },
      { key: 'entlohnung_betrag1', label: 'Betrag 1', type: 'number', step: '0.01' },
      { key: 'entlohnung_gueltig_ab1', label: 'Gültig ab 1', type: 'date' },
      { key: 'entlohnung_stundenlohn1', label: 'Stundenlohn 1', type: 'number', step: '0.01' },
      { key: 'entlohnung_gueltig_ab_stunden1', label: 'Gültig ab Stunden 1', type: 'date' },
      { key: 'entlohnung_bezeichnung2', label: 'Bezeichnung 2', type: 'text' },
      { key: 'entlohnung_betrag2', label: 'Betrag 2', type: 'number', step: '0.01' },
      { key: 'entlohnung_gueltig_ab2', label: 'Gültig ab 2', type: 'date' },
      { key: 'entlohnung_stundenlohn2', label: 'Stundenlohn 2', type: 'number', step: '0.01' },
      { key: 'entlohnung_gueltig_ab_stunden2', label: 'Gültig ab Stunden 2', type: 'date' },
      { key: 'entlohnung_bezeichnung3', label: 'Bezeichnung 3', type: 'text' },
      { key: 'entlohnung_betrag3', label: 'Betrag 3', type: 'number', step: '0.01' },
      { key: 'entlohnung_gueltig_ab3', label: 'Gültig ab 3', type: 'date' },
      { key: 'entlohnung_stundenlohn3', label: 'Stundenlohn 3', type: 'number', step: '0.01' },
      { key: 'entlohnung_gueltig_ab_stunden3', label: 'Gültig ab Stunden 3', type: 'date' },
      { key: 'vwl_empfaenger', label: 'Empfänger VWL', type: 'text' },
      { key: 'vwl_betrag', label: 'Betrag', type: 'number', step: '0.01' },
      { key: 'vwl_ag_anteil', label: 'AG-Anteil (Höhe mtl.)', type: 'number', step: '0.01' },
      { key: 'vwl_seit_wann', label: 'Seit wann', type: 'date' },
      { key: 'vwl_vertragsnr', label: 'Vertragsnr.', type: 'text' },
      { key: 'vwl_kontonummer', label: 'Kontonummer (IBAN)', type: 'text' },
      { key: 'vwl_bankleitzahl', label: 'Bankleitzahl/Bankbezeichnung (BIC)', type: 'text' },
    ],
  },
  {
    key: 'dokumente',
    label: 'Dokumente & Vorbeschäftigung',
    fields: [
      { key: 'ap_arbeitsvertrag', label: 'Arbeitsvertrag', type: 'checkbox' },
      { key: 'ap_bescheinigung_lsta', label: 'Bescheinigung über LSt.-Abzug', type: 'checkbox' },
      { key: 'ap_sv_ausweis', label: 'SV-Ausweis', type: 'checkbox' },
      { key: 'ap_mitgliedsbescheinigung_kk', label: 'Mitgliedsbescheinigung Krankenasse', type: 'checkbox' },
      { key: 'ap_bescheinigung_private_kk', label: 'Bescheinigung zur privaten Krankenversicherung', type: 'checkbox' },
      { key: 'ap_vwl_vertrag', label: 'VWL Vertrag', type: 'checkbox' },
      { key: 'ap_nachweis_elterneigenschaft', label: 'Nachweis Elterneigenschaft', type: 'checkbox' },
      { key: 'ap_vertrag_bav', label: 'Vertrag Betriebliche Altersversorgung', type: 'checkbox' },
      { key: 'ap_schwerbehindertenausweis', label: 'Schwerbehindertenausweis', type: 'checkbox' },
      { key: 'ap_unterlagen_sozialkasse', label: 'Unterlagen Sozialkasse Bau/Maler', type: 'checkbox' },
      { key: 'vorbeschaeftigung_zeitraum_von', label: 'Zeitraum von', type: 'date' },
      { key: 'vorbeschaeftigung_zeitraum_bis', label: 'Zeitraum bis', type: 'date' },
      { key: 'vorbeschaeftigung_art', label: 'Art der Beschäftigung', type: 'text' },
      { key: 'vorbeschaeftigung_tage', label: 'Anzahl der Beschäftigungstage', type: 'number' },
    ],
  },
  {
    key: 'weitere_angaben',
    label: 'Weitere Angaben',
    fields: [
      { key: 'weitere_angaben', label: 'Weitere Angaben', type: 'textarea' },
    ],
  },
];

export default function EmployeeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [section, setSection] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios.get(`${API_BASE_URL}/employees/list`)
      .then(res => {
        const emp = res.data.find((e: any) => String(e.id) === String(id));
        if (emp) {
          // Split arbeitszeit_verteilung string into fields
          if (emp.arbeitszeit_verteilung) {
            const parts = String(emp.arbeitszeit_verteilung).split(',');
            parts.forEach(p => {
              const [day, val] = p.split(':');
              if (day && val !== undefined) emp[`arbeitszeit_verteilung_${day}`] = val;
            });
          }
          setForm(emp);
        } else setToast({ message: 'Employee not found', type: 'error' });
      })
      .catch(() => setToast({ message: 'Failed to fetch employee', type: 'error' }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      setForm((f: any) => ({ ...f, [name]: (e.target as HTMLInputElement).checked ? '1' : '0' }));
    } else {
      setForm((f: any) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Combine arbeitszeit_verteilung fields into a string
      const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      const arbeitszeit_verteilung = days.map(day => `${day}:${form[`arbeitszeit_verteilung_${day}`] ?? ''}`).join(',');
      const submitForm = { ...form, arbeitszeit_verteilung };
      // Optionally remove the individual day fields
      days.forEach(day => delete submitForm[`arbeitszeit_verteilung_${day}`]);
      await axios.patch(`${API_BASE_URL}/employees/edit/${id}`, submitForm);
      setToast({ message: 'Employee updated!', type: 'success' });
      setTimeout(() => navigate('/employees'), 1200);
    } catch (err: any) {
      setToast({ message: err?.response?.data?.detail || 'Edit failed', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full px-2 py-4 overflow-x-hidden">
      <div className="w-full bg-white/90 rounded-3xl shadow-xl border border-blue-100 p-4">
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {sections.map((s, idx) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSection(idx)}
              className={`px-4 py-2 rounded-xl font-bold text-base transition-all shadow-sm border-2 ${section === idx ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-cyan-400 scale-105' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
          {sections[section].key === 'employment' ? (
            <div className="col-span-1 md:col-span-3 lg:col-span-6 flex flex-wrap gap-3 items-end mb-2">
              <div className="flex flex-col gap-1">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="baugewerbe_seit">Im Baugewerbe beschäftigt seit</label>
                <input
                  id="baugewerbe_seit"
                  name="baugewerbe_seit"
                  type="date"
                  value={form['baugewerbe_seit'] ?? ''}
                  onChange={handleChange}
                  className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow text-xs font-medium focus:ring-2 focus:ring-cyan-400"
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col gap-1 items-center">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="arbeitszeit_vollzeit">Vollzeit</label>
                <input
                  id="arbeitszeit_vollzeit"
                  name="arbeitszeit_vollzeit"
                  type="checkbox"
                  checked={form['arbeitszeit_vollzeit'] === '1' || form['arbeitszeit_vollzeit'] === 1 || form['arbeitszeit_vollzeit'] === true}
                  onChange={handleChange}
                  className="w-4 h-4 accent-cyan-500 border-blue-200 rounded focus:ring-2 focus:ring-cyan-400 mt-1"
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col gap-1 items-center">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="arbeitszeit_teilzeit">Teilzeit</label>
                <input
                  id="arbeitszeit_teilzeit"
                  name="arbeitszeit_teilzeit"
                  type="checkbox"
                  checked={form['arbeitszeit_teilzeit'] === '1' || form['arbeitszeit_teilzeit'] === 1 || form['arbeitszeit_teilzeit'] === true}
                  onChange={handleChange}
                  className="w-4 h-4 accent-cyan-500 border-blue-200 rounded focus:ring-2 focus:ring-cyan-400 mt-1"
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-blue-700 font-semibold mb-1 text-xs">Ggf. Verteilung d. wöchentl. Arbeitszeit (Std.)</label>
                <div className="flex gap-2 mt-1">
                  {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="flex flex-col items-center">
                      <span className="text-blue-700 font-semibold text-xs mb-1">{day}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        name={`arbeitszeit_verteilung_${day}`}
                        value={form[`arbeitszeit_verteilung_${day}`] ?? ''}
                        onChange={handleChange}
                        className="w-12 px-1 py-1 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow text-xs font-medium focus:ring-2 focus:ring-cyan-400 text-center"
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {sections[section].fields
            .filter(f => !['arbeitszeit_vollzeit','arbeitszeit_teilzeit','baugewerbe_seit','arbeitszeit_verteilung'].includes(f.key))
            .sort((a, b) => {
              if (a.type === 'checkbox' && b.type !== 'checkbox') return 1;
              if (a.type !== 'checkbox' && b.type === 'checkbox') return -1;
              return 0;
            })
            .map(field => {
              const isWeitereAngaben = field.key === 'weitere_angaben' && sections[section].key === 'weitere_angaben';
              const options = Array.isArray((field as any).options) ? (field as any).options : [];
              const step = (field as any).step ? (field as any).step : undefined;
              return (
                <div
                  key={field.key}
                  className={
                    isWeitereAngaben
                      ? 'flex flex-col gap-1 col-span-1 md:col-span-3 lg:col-span-6'
                      : 'flex flex-col gap-1'
                  }
                >
                  <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor={field.key}>{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      id={field.key}
                      name={field.key}
                      value={form[field.key] ?? ''}
                      onChange={handleChange}
                      className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow text-xs font-medium focus:ring-2 focus:ring-cyan-400"
                      disabled={loading}
                    >
                      <option value="">Bitte wählen</option>
                      {options.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <input
                      id={field.key}
                      name={field.key}
                      type="checkbox"
                      checked={form[field.key] === '1' || form[field.key] === 1 || form[field.key] === true}
                      onChange={handleChange}
                      className="w-4 h-4 accent-cyan-500 border-blue-200 rounded focus:ring-2 focus:ring-cyan-400 mt-1"
                      disabled={loading}
                    />
                  ) : field.type === 'textarea' ? (
                    <textarea
                      id={field.key}
                      name={field.key}
                      value={form[field.key] ?? ''}
                      onChange={handleChange}
                      className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow text-xs font-medium focus:ring-2 focus:ring-cyan-400 min-h-[60px]"
                      disabled={loading}
                    />
                  ) : (
                    <input
                      id={field.key}
                      name={field.key}
                      type={field.type}
                      value={form[field.key] ?? ''}
                      onChange={handleChange}
                      className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow text-xs font-medium focus:ring-2 focus:ring-cyan-400"
                      disabled={loading}
                      step={step}
                    />
                  )}
                </div>
              );
            })}
          <div className="lg:col-span-6 md:col-span-3 flex gap-4 justify-between mt-4">
            <button
              type="button"
              className="px-6 py-3 rounded-2xl bg-blue-50 text-blue-500 font-bold shadow hover:bg-blue-100 transition text-lg disabled:opacity-50"
              onClick={() => setSection(s => Math.max(0, s - 1))}
              disabled={section === 0 || loading}
            >Zurück</button>
            <button
              type="button"
              className="px-6 py-3 rounded-2xl bg-blue-50 text-blue-500 font-bold shadow hover:bg-blue-100 transition text-lg disabled:opacity-50"
              onClick={() => setSection(s => Math.min(sections.length - 1, s + 1))}
              disabled={section === sections.length - 1 || loading}
            >Weiter</button>
            <button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform text-lg" disabled={loading}>Speichern</button>
          </div>
        </form>
        {toast && (
          <div className={`mt-6 px-6 py-3 rounded-xl shadow-lg font-semibold text-white text-center text-base ${toast.type === 'success' ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-red-500'} animate-fade-in`} style={{ boxShadow: '0 4px 24px 0 rgba(56,189,248,0.10)' }}>{toast.message}</div>
        )}
      </div>
    </div>
  );
} 