import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../lib/api';

export default function EmployeeErklaerungFormEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios.get(`${API_BASE_URL}/erklaerung_form/edit/${id}`)
      .then(res => {
        setForm(res.data);
      })
      .catch(() => setToast({ message: 'Failed to fetch Erklärung Formular', type: 'error' }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      const checked = e.target.checked;
      setForm((f: any) => ({ ...f, [name]: checked ? '1' : '0' }));
    } else {
      setForm((f: any) => ({ ...f, [name]: value }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f: any) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.patch(`${API_BASE_URL}/erklaerung_form/edit/${id}`, form);
      setToast({ message: 'Erklärung Formular gespeichert!', type: 'success' });
      setTimeout(() => navigate('/employees'), 1200);
    } catch (err: any) {
      setToast({ message: err?.response?.data?.detail || 'Speichern fehlgeschlagen', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full px-2 py-4 overflow-x-hidden">
      <div className="w-full bg-white/90 rounded-3xl shadow-xl border border-blue-100 p-4">
        <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">Erklärung Formular bearbeiten</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
          {/* Section A. Erklärung und Anlass */}
          <div className="md:col-span-4 bg-blue-50/60 border border-blue-200 rounded-2xl p-8 mb-8 shadow flex flex-col gap-6">
            <h3 className="text-xl font-bold text-blue-900 mb-2">A. Erklärung und Anlass</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-blue-700 font-semibold text-sm mb-1">Erklärung zum Beschäftigungsverhältnis zur Vorlage in folgendem Verfahren:</label>
                <select
                  id="erklaerung_typ"
                  name="erklaerung_typ"
                  value={form['erklaerung_typ'] ?? ''}
                  onChange={handleSelectChange}
                  className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                >
                  <option value="">Bitte wählen</option>
                  <option value="zur Erteilung eines Aufenthaltstitels zum Zweck der Beschäftigung">zur Erteilung eines Aufenthaltstitels zum Zweck der Beschäftigung</option>
                  <option value="zur Zustimmung der Aufnahme einer Beschäftigung von Personen mit Duldung oder Aufenthaltsgestattung (Bitte nur die Fragen 3 bis 22, 24 und 25, 37 bis 51 sowie 57 bis 59 ausfüllen)">zur Zustimmung der Aufnahme einer Beschäftigung von Personen mit Duldung oder Aufenthaltsgestattung (Bitte nur die Fragen 3 bis 22, 24 und 25, 37 bis 51 sowie 57 bis 59 ausfüllen)</option>
                  <option value="zur Zustimmung zu einer Aufenthaltserlaubnis, die die Beschäftigung nicht erlaubt">zur Zustimmung zu einer Aufenthaltserlaubnis, die die Beschäftigung nicht erlaubt</option>
                  <option value="zur Erteilung einer Vorabzustimmung der Bundesagentur für Arbeit">zur Erteilung einer Vorabzustimmung der Bundesagentur für Arbeit</option>
                  <option value="zur Erteilung einer Arbeitserlaubnis der Bundesagentur für Arbeit">zur Erteilung einer Arbeitserlaubnis der Bundesagentur für Arbeit</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 mt-2 md:mt-0">
                <label className="text-blue-700 font-semibold text-sm mb-1">Anlass der Vorlage der Erklärung:</label>
                <select
                  id="erklaerung_anlass"
                  name="erklaerung_anlass"
                  value={form['erklaerung_anlass'] ?? ''}
                  onChange={handleSelectChange}
                  className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                >
                  <option value="">Bitte wählen</option>
                  <option value="Ersterteilung">Ersterteilung</option>
                  <option value="Verlängerung">Verlängerung</option>
                  <option value="Arbeitgeberwechsel">Arbeitgeberwechsel</option>
                </select>
              </div>
            </div>
          </div>
          {/* Section B. Angaben zur Arbeitnehmerin/zum Arbeitnehmer */}
          <div className="md:col-span-4 bg-blue-50/60 border border-blue-200 rounded-2xl p-8 mb-8 shadow flex flex-col gap-6">
            <h3 className="text-xl font-bold text-blue-900 mb-2">B. Angaben zur Arbeitnehmerin/zum Arbeitnehmer</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Row 1: Vorname(n) + Nachname */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="vorname">Vorname(n)</label>
                <input type="text" id="vorname" name="vorname" value={form['vorname'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="geburtsname">Nachname</label>
                <input type="text" id="geburtsname" name="geburtsname" value={form['geburtsname'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
              {/* Row 2: Geburtsdatum + Geschlecht */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="geburtsdatum">Geburtsdatum <span className='text-blue-400'>(TT.MM.JJJJ)</span></label>
                <input type="date" id="geburtsdatum" name="geburtsdatum" value={form['geburtsdatum'] ? String(form['geburtsdatum']).slice(0, 10) : ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="geschlecht">Geschlecht</label>
                <select id="geschlecht" name="geschlecht" value={form['geschlecht'] ?? ''} onChange={handleSelectChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400">
                  <option value="">Bitte wählen</option>
                  <option value="männlich">männlich</option>
                  <option value="weiblich">weiblich</option>
                  <option value="divers">divers</option>
                </select>
              </div>
              {/* Divider */}
              <div className="md:col-span-4 border-t border-blue-100 my-2"></div>
              {/* Row 3: Staatsangehörigkeit + Wohnsitz */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="staatsangehoerigkeit">Staatsangehörigkeit</label>
                <input type="text" id="staatsangehoerigkeit" name="staatsangehoerigkeit" value={form['staatsangehoerigkeit'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="wohnsitz">Wohnsitz/Aufenthaltsort (im Ausland oder in Deutschland)</label>
                <input type="text" id="wohnsitz" name="wohnsitz" value={form['wohnsitz'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
              {/* Row 4: Seit wann besteht der Wohnsitz/gewöhnliche Aufenthaltsort? */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="wohnsitz_seit">Seit wann besteht der Wohnsitz/gewöhnliche Aufenthaltsort? <span className='text-blue-400'>(TT.MM.JJJJ)</span></label>
                <input type="date" id="wohnsitz_seit" name="wohnsitz_seit" value={form['wohnsitz_seit'] ? String(form['wohnsitz_seit']).slice(0, 10) : ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
            </div>
          </div>
          {/* Section C. Angaben zum Arbeitgeber */}
          <div className="md:col-span-4 bg-blue-50/60 border border-blue-200 rounded-2xl p-8 mb-8 shadow flex flex-col gap-6">
            <h3 className="text-xl font-bold text-blue-900 mb-2">C. Angaben zum Arbeitgeber</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Row 1: Firma + Straße + Hausnummer */}
              <div className="flex flex-col gap-1">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="arbeitgeber_firma">Firma</label>
                <input type="text" id="arbeitgeber_firma" name="arbeitgeber_firma" value={form['arbeitgeber_firma'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="arbeitgeber_strasse">Straße</label>
                <input type="text" id="arbeitgeber_strasse" name="arbeitgeber_strasse" value={form['arbeitgeber_strasse'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="arbeitgeber_hausnummer">Hausnummer</label>
                <input type="text" id="arbeitgeber_hausnummer" name="arbeitgeber_hausnummer" value={form['arbeitgeber_hausnummer'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
              {/* Row 2: Postleitzahl + Ort + Kontaktperson */}
              <div className="flex flex-col gap-1">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="arbeitgeber_plz">Postleitzahl</label>
                <input type="text" id="arbeitgeber_plz" name="arbeitgeber_plz" value={form['arbeitgeber_plz'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="arbeitgeber_ort">Ort</label>
                <input type="text" id="arbeitgeber_ort" name="arbeitgeber_ort" value={form['arbeitgeber_ort'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="arbeitgeber_kontakt">Kontaktperson</label>
                <input type="text" id="arbeitgeber_kontakt" name="arbeitgeber_kontakt" value={form['arbeitgeber_kontakt'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
              {/* Row 3: Telefon + E-Mail + Telefax */}
              <div className="flex flex-col gap-1">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="arbeitgeber_telefon">Telefon</label>
                <input type="text" id="arbeitgeber_telefon" name="arbeitgeber_telefon" value={form['arbeitgeber_telefon'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="arbeitgeber_email">E-Mail</label>
                <input type="text" id="arbeitgeber_email" name="arbeitgeber_email" value={form['arbeitgeber_email'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="arbeitgeber_telefax">Telefax</label>
                <input type="text" id="arbeitgeber_telefax" name="arbeitgeber_telefax" value={form['arbeitgeber_telefax'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
              {/* Row 4: Betriebsnummer + Unternehmen gegründet? */}
              <div className="flex flex-col gap-1">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="arbeitgeber_betriebsstaette">Betriebsnummer des Beschäftigungsbetriebes (bitte immer eintragen)</label>
                <input type="text" id="arbeitgeber_betriebsstaette" name="arbeitgeber_betriebsstaette" value={form['arbeitgeber_betriebsstaette'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="arbeitgeber_gegruendet">Wurde das Unternehmen in den letzten 24 Monaten gegründet?</label>
                <select id="arbeitgeber_gegruendet" name="arbeitgeber_gegruendet" value={form['arbeitgeber_gegruendet'] ?? ''} onChange={handleSelectChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400">
                  <option value="">Bitte wählen</option>
                  <option value="Ja">Ja</option>
                  <option value="Nein">Nein</option>
                </select>
              </div>
            </div>
          </div>
          {/* Section D. Angaben zur Beschäftigung der Arbeitnehmerin/des Arbeitnehmers */}
          <div className="md:col-span-4 bg-blue-50/60 border border-blue-200 rounded-2xl p-8 mb-8 shadow flex flex-col gap-8">
            <h3 className="text-xl font-bold text-blue-900 mb-2">D. Angaben zur Beschäftigung der Arbeitnehmerin/des Arbeitnehmers</h3>
            {/* Beschäftigungsbeginn & Befristung */}
            <div className="bg-white/80 border border-blue-100 rounded-xl p-6 shadow flex flex-col gap-6">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">Beschäftigungsbeginn & Befristung</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Beginn des Beschäftigungsverhältnisses */}
                <div className="flex flex-col gap-1 md:col-span-1">
                  <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="beschaeftigung_beginn">Beschäftigungsverhältnis beginnt am <span className='text-blue-400'>(TT.MM.JJJJ)</span></label>
                  <input
                    type="date"
                    id="beschaeftigung_beginn"
                    name="beschaeftigung_beginn"
                    value={form['beschaeftigung_beginn'] ? String(form['beschaeftigung_beginn']).slice(0, 10) : ''}
                    onChange={handleChange}
                    className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                  />
                </div>
                {/* Befristung des Beschäftigungsverhältnisses */}
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-blue-700 font-semibold mb-1 text-xs">Befristung des Beschäftigungsverhältnisses:</label>
                  <div className="flex items-center gap-6 mt-1 flex-wrap">
                    <label className="flex items-center gap-2 text-xs font-medium text-blue-700">
                      <input
                        type="radio"
                        name="beschaeftigung_befristung"
                        value="unbefristet"
                        checked={form['beschaeftigung_befristung'] === 'unbefristet'}
                        onChange={handleChange}
                        className="accent-cyan-500 w-4 h-4"
                      />
                      unbefristet
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-blue-700">
                      <input
                        type="radio"
                        name="beschaeftigung_befristung"
                        value="befristet"
                        checked={form['beschaeftigung_befristung'] === 'befristet'}
                        onChange={handleChange}
                        className="accent-cyan-500 w-4 h-4"
                      />
                      befristet bis
                    </label>
                    {form['beschaeftigung_befristung'] === 'befristet' && (
                      <input
                        type="date"
                        id="beschaeftigung_befristet_bis"
                        name="beschaeftigung_befristet_bis"
                        value={form['beschaeftigung_befristet_bis'] ? String(form['beschaeftigung_befristet_bis']).slice(0, 10) : ''}
                        onChange={handleChange}
                        className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Überlassung an Dritte & Arbeitsort */}
            <div className="bg-white/80 border border-blue-100 rounded-xl p-6 shadow flex flex-col gap-6">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">Überlassung & Arbeitsort</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Überlassung an Dritte */}
                <div className="flex flex-col gap-1 md:col-span-1">
                  <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="beschaeftigung_ueberlassung">Soll die Arbeitnehmerin/der Arbeitnehmer an Dritte überlassen werden?</label>
                  <select
                    id="beschaeftigung_ueberlassung"
                    name="beschaeftigung_ueberlassung"
                    value={form['beschaeftigung_ueberlassung'] ?? ''}
                    onChange={handleSelectChange}
                    className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                  >
                    <option value="">Bitte wählen</option>
                    <option value="Ja">Ja</option>
                    <option value="Nein">Nein</option>
                  </select>
                </div>
                {/* Angaben zum Arbeitsort */}
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-blue-700 font-semibold mb-1 text-xs">Bitte machen Sie Angaben zum Arbeitsort:</label>
                  <div className="flex flex-col gap-2 mt-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-blue-700">
                      <input
                        type="radio"
                        name="beschaeftigung_arbeitsort"
                        value="arbeitgeber_sitz"
                        checked={form['beschaeftigung_arbeitsort'] === 'arbeitgeber_sitz'}
                        onChange={handleChange}
                        className="accent-cyan-500 w-4 h-4"
                      />
                      Arbeitsort entspricht dem Arbeitgeber-Sitz
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-blue-700">
                      <input
                        type="radio"
                        name="beschaeftigung_arbeitsort"
                        value="wechselnde_arbeitsorte"
                        checked={form['beschaeftigung_arbeitsort'] === 'wechselnde_arbeitsorte'}
                        onChange={handleChange}
                        className="accent-cyan-500 w-4 h-4"
                      />
                      Arbeitnehmerin oder Arbeitnehmer wird an wechselnden Arbeits-/Einsatzorten beschäftigt
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-blue-700">
                      <input
                        type="radio"
                        name="beschaeftigung_arbeitsort"
                        value="adresse"
                        checked={form['beschaeftigung_arbeitsort'] === 'adresse'}
                        onChange={handleChange}
                        className="accent-cyan-500 w-4 h-4"
                      />
                      Der Arbeitsort befindet sich unter folgender Adresse:
                    </label>
                    {form['beschaeftigung_arbeitsort'] === 'adresse' && (
                      <input
                        type="text"
                        id="beschaeftigung_arbeitsort_adresse"
                        name="beschaeftigung_arbeitsort_adresse"
                        value={form['beschaeftigung_arbeitsort_adresse'] ?? ''}
                        onChange={handleChange}
                        placeholder="Adresse eingeben"
                        className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400 mt-2"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Berufsbezeichnung und Beschreibung der Tätigkeit */}
            <div className="bg-white/80 border border-blue-100 rounded-xl p-6 shadow flex flex-col gap-4">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">Berufsbezeichnung & Tätigkeitsbeschreibung</h4>
              <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="beschaeftigung_berufsbezeichnung">Berufsbezeichnung und Beschreibung der Tätigkeit (bitte genaue Beschreibung der Tätigkeit; Fachrichtung, Funktionsbereich und Branche angeben; gegebenenfalls auf gesondertem Blatt fortsetzen):</label>
              <textarea
                id="beschaeftigung_berufsbezeichnung"
                name="beschaeftigung_berufsbezeichnung"
                value={form['beschaeftigung_berufsbezeichnung'] ?? ''}
                onChange={handleChange}
                rows={3}
                className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
              />
            </div>
          </div>
          {/* Section E. Angaben zur Qualifikation der Arbeitnehmerin/des Arbeitnehmers */}
          <div className="md:col-span-4 bg-blue-50/60 border border-blue-200 rounded-2xl p-8 mb-8 shadow flex flex-col gap-8">
            <h3 className="text-xl font-bold text-blue-900 mb-2">E. Angaben zur Qualifikation der Arbeitnehmerin/des Arbeitnehmers</h3>
            <p className="text-blue-700 text-xs mb-4">(Nachweise und Übersetzung in deutscher Sprache bitte beifügen)</p>
            <div className="flex flex-col gap-4">
              {/* No degree */}
              <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                <input
                  type="checkbox"
                  name="qualifikation_keine"
                  checked={form['qualifikation_keine'] === '1' || form['qualifikation_keine'] === 1 || form['qualifikation_keine'] === true}
                  onChange={e => setForm((f: any) => ({ ...f, qualifikation_keine: e.target.checked ? '1' : '0' }))}
                  className="accent-cyan-500 w-4 h-4"
                />
                Die Arbeitnehmerin/Der Arbeitnehmer hat keinen Abschluss.
              </label>
              {/* Hochschulabschluss */}
              <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                <input
                  type="checkbox"
                  name="qualifikation_hochschule"
                  checked={form['qualifikation_hochschule'] === '1' || form['qualifikation_hochschule'] === 1 || form['qualifikation_hochschule'] === true}
                  onChange={e => setForm((f: any) => ({ ...f, qualifikation_hochschule: e.target.checked ? '1' : '0' }))}
                  className="accent-cyan-500 w-4 h-4"
                />
                Die Arbeitnehmerin/Der Arbeitnehmer hat einen Hochschulabschluss.
              </label>
              {form['qualifikation_hochschule'] === '1' || form['qualifikation_hochschule'] === 1 || form['qualifikation_hochschule'] === true ? (
                <div className="bg-white/80 border border-blue-100 rounded-xl p-6 shadow flex flex-col gap-4 ml-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="qualifikation_studiengang">Bezeichnung des Studiengangs:</label>
                      <input type="text" id="qualifikation_studiengang" name="qualifikation_studiengang" value={form['qualifikation_studiengang'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="qualifikation_hochschulort">Wo wurde der Hochschulabschluss erworben?</label>
                      <input type="text" id="qualifikation_hochschulort" name="qualifikation_hochschulort" value={form['qualifikation_hochschulort'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-blue-700 font-semibold mb-1 text-xs">Wenn der Abschluss im Ausland erworben wurde: Ist der Abschluss in Deutschland oder im Staat, in dem er erworben wurde, staatlich anerkannt oder mit einem deutschen Hochschulabschluss vergleichbar?</label>
                    <div className="flex gap-6 flex-wrap">
                      <label className="flex items-center gap-2 text-xs font-medium text-blue-700">
                        <input type="radio" name="qualifikation_hochschul_anerkannt" value="Ja" checked={form['qualifikation_hochschul_anerkannt'] === 'Ja'} onChange={handleChange} className="accent-cyan-500 w-4 h-4" /> Ja (bitte Nachweis vorlegen)
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-blue-700">
                        <input type="radio" name="qualifikation_hochschul_anerkannt" value="Nein" checked={form['qualifikation_hochschul_anerkannt'] === 'Nein'} onChange={handleChange} className="accent-cyan-500 w-4 h-4" /> Nein
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="qualifikation_hochschul_nachweis">Der Anerkennungsnachweis oder Gleichwertigkeitsnachweis für Hochschulabschluss liegt in folgender Form vor:</label>
                    <input type="text" id="qualifikation_hochschul_nachweis" name="qualifikation_hochschul_nachweis" value={form['qualifikation_hochschul_nachweis'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
                  </div>
                </div>
              ) : null}
              {/* Berufsausbildung */}
              <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                <input
                  type="checkbox"
                  name="qualifikation_berufsausbildung"
                  checked={form['qualifikation_berufsausbildung'] === '1' || form['qualifikation_berufsausbildung'] === 1 || form['qualifikation_berufsausbildung'] === true}
                  onChange={e => setForm((f: any) => ({ ...f, qualifikation_berufsausbildung: e.target.checked ? '1' : '0' }))}
                  className="accent-cyan-500 w-4 h-4"
                />
                Die Arbeitnehmerin/Der Arbeitnehmer hat eine Berufsausbildung.
              </label>
              {form['qualifikation_berufsausbildung'] === '1' || form['qualifikation_berufsausbildung'] === 1 || form['qualifikation_berufsausbildung'] === true ? (
                <div className="bg-white/80 border border-blue-100 rounded-xl p-6 shadow flex flex-col gap-4 ml-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="qualifikation_berufsausbildung_bezeichnung">Bezeichnung der Berufsausbildung:</label>
                      <input type="text" id="qualifikation_berufsausbildung_bezeichnung" name="qualifikation_berufsausbildung_bezeichnung" value={form['qualifikation_berufsausbildung_bezeichnung'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="qualifikation_berufsausbildung_ort">Wo wurde die Berufsausbildung erworben?</label>
                      <input type="text" id="qualifikation_berufsausbildung_ort" name="qualifikation_berufsausbildung_ort" value={form['qualifikation_berufsausbildung_ort'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-blue-700 font-semibold mb-1 text-xs">Wenn die Ausbildung im Ausland erworben wurde: Hat die für die berufliche Anerkennung zuständige deutsche Stelle die Gleichwertigkeit des ausländischen Berufsabschlusses festgestellt oder ist die Berufsqualifikation in dem Staat, in dem sie erworben wurde, staatlich anerkannt?</label>
                    <div className="flex gap-6 flex-wrap">
                      <label className="flex items-center gap-2 text-xs font-medium text-blue-700">
                        <input type="radio" name="qualifikation_berufsausbildung_anerkannt" value="Ja" checked={form['qualifikation_berufsausbildung_anerkannt'] === 'Ja'} onChange={handleChange} className="accent-cyan-500 w-4 h-4" /> Ja (bitte Nachweis vorlegen)
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-blue-700">
                        <input type="radio" name="qualifikation_berufsausbildung_anerkannt" value="Nein" checked={form['qualifikation_berufsausbildung_anerkannt'] === 'Nein'} onChange={handleChange} className="accent-cyan-500 w-4 h-4" /> Nein
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-blue-700">
                        <input type="radio" name="qualifikation_berufsausbildung_anerkannt" value="Teilweise" checked={form['qualifikation_berufsausbildung_anerkannt'] === 'Teilweise'} onChange={handleChange} className="accent-cyan-500 w-4 h-4" /> Teilweise (bitte Nachweis vorlegen)
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="qualifikation_berufsausbildung_nachweis">Der Anerkennungsnachweis oder Gleichwertigkeitsnachweis für Berufsausbildung liegt in folgender Form vor:</label>
                    <input type="text" id="qualifikation_berufsausbildung_nachweis" name="qualifikation_berufsausbildung_nachweis" value={form['qualifikation_berufsausbildung_nachweis'] ?? ''} onChange={handleChange} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
                  </div>
                </div>
              ) : null}
              {/* Sonstige Qualifikationen */}
              <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                <input
                  type="checkbox"
                  name="qualifikation_sonstige"
                  checked={form['qualifikation_sonstige'] === '1' || form['qualifikation_sonstige'] === 1 || form['qualifikation_sonstige'] === true}
                  onChange={e => setForm((f: any) => ({ ...f, qualifikation_sonstige: e.target.checked ? '1' : '0' }))}
                  className="accent-cyan-500 w-4 h-4"
                />
                Sonstige Qualifikationen und weitere Angaben
              </label>
              {form['qualifikation_sonstige'] === '1' || form['qualifikation_sonstige'] === 1 || form['qualifikation_sonstige'] === true ? (
                <div className="bg-white/80 border border-blue-100 rounded-xl p-6 shadow flex flex-col gap-4 ml-6">
                  <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="qualifikation_sonstige_text">Bitte geben Sie sonstige Qualifikationen an beziehungsweise benennen weitere Sachverhalte, die für die Ausübung der Beschäftigung relevant sind wie: tertiäre Bildungsabschlüsse, Abschlüsse einer deutschen Auslandshandelskammer, Weiterbildungszertifikate, einschlägige Kenntnisse, Fertigkeiten, Berufserfahrung (gegebenenfalls auf gesondertem Blatt fortsetzen):</label>
                  <textarea id="qualifikation_sonstige_text" name="qualifikation_sonstige_text" value={form['qualifikation_sonstige_text'] ?? ''} onChange={handleChange} rows={3} className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400" />
                  {/* Keine Qualifikation erforderlich (now inside Sonstige) */}
                  <label className="flex items-center gap-2 text-xs font-medium text-blue-700 mt-2">
                    <input
                      type="checkbox"
                      name="qualifikation_nicht_erforderlich"
                      checked={form['qualifikation_nicht_erforderlich'] === '1' || form['qualifikation_nicht_erforderlich'] === 1 || form['qualifikation_nicht_erforderlich'] === true}
                      onChange={e => setForm((f: any) => ({ ...f, qualifikation_nicht_erforderlich: e.target.checked ? '1' : '0' }))}
                      className="accent-cyan-500 w-4 h-4"
                    />
                    Nach meiner Kenntnis setzt die Tätigkeit keine qualifizierte Berufsausbildung (reguläre Ausbildungsdauer mindestens zwei Jahre) und keinen Hochschulabschluss voraus; zum Beispiel weil es sich um eine Helfertätigkeit oder Anlerntätigkeit handelt oder weil die Beschäftigung aufgrund einer bestimmten Vorschrift der Beschäftigungsverordnung erfolgen soll, nach der eine bestimmte Qualifikation nicht erforderlich ist.
                  </label>
                </div>
              ) : null}
            </div>
          </div>
          {/* Section F. Angaben zur Berufsausübungserlaubnis */}
          <div className="md:col-span-4 bg-blue-50/60 border border-blue-200 rounded-2xl p-8 mb-8 shadow flex flex-col gap-6">
            <h3 className="text-xl font-bold text-blue-900 mb-2">F. Angaben zur Berufsausübungserlaubnis</h3>
            <div className="flex flex-col gap-4">
              <label className="text-blue-700 font-semibold mb-1 text-sm">Ist die Berufsausübung an eine bestimmte Qualifikation beziehungsweise eine Erlaubnis gebunden (zum Beispiel § 10 BÄO für den ärztlichen Beruf, § 1 Pflegeberufegesetz für Pflegefachkräfte)?</label>
              <div className="flex gap-8 flex-wrap">
                <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <input
                    type="radio"
                    name="berufsausuebung_gebunden"
                    value="Ja"
                    checked={form['berufsausuebung_gebunden'] === 'Ja'}
                    onChange={handleChange}
                    className="accent-cyan-500 w-4 h-4"
                  />
                  Ja
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <input
                    type="radio"
                    name="berufsausuebung_gebunden"
                    value="Nein"
                    checked={form['berufsausuebung_gebunden'] === 'Nein'}
                    onChange={handleChange}
                    className="accent-cyan-500 w-4 h-4"
                  />
                  Nein <span className="text-xs text-blue-400 ml-2">(weiter mit Abschnitt G.)</span>
                </label>
              </div>
              <div className="flex flex-col gap-1 mt-2 md:w-2/3">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="berufsausuebung_qualifikation">Bitte geben Sie die erforderliche Qualifikation oder Erlaubnis an (Nachweise bitte vorlegen):</label>
                <input
                  type="text"
                  id="berufsausuebung_qualifikation"
                  name="berufsausuebung_qualifikation"
                  value={form['berufsausuebung_qualifikation'] ?? ''}
                  onChange={handleChange}
                  className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                />
              </div>
            </div>
          </div>
          {/* Section G. Angaben zur Arbeitszeit */}
          <div className="md:col-span-4 bg-blue-50/60 border border-blue-200 rounded-2xl p-8 mb-8 shadow flex flex-col gap-6">
            <h3 className="text-xl font-bold text-blue-900 mb-2">G. Angaben zur Arbeitszeit</h3>
            <div className="flex flex-col gap-4">
              <label className="text-blue-700 font-semibold mb-1 text-sm">Welche Arbeitszeit hat die Arbeitnehmerin/der Arbeitnehmer?</label>
              <div className="flex gap-8 flex-wrap">
                <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <input
                    type="radio"
                    name="arbeitszeit_typ"
                    value="Vollzeit"
                    checked={form['arbeitszeit_typ'] === 'Vollzeit'}
                    onChange={handleChange}
                    className="accent-cyan-500 w-4 h-4"
                  />
                  Vollzeit
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <input
                    type="radio"
                    name="arbeitszeit_typ"
                    value="Teilzeit"
                    checked={form['arbeitszeit_typ'] === 'Teilzeit'}
                    onChange={handleChange}
                    className="accent-cyan-500 w-4 h-4"
                  />
                  Teilzeit
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <input
                    type="radio"
                    name="arbeitszeit_typ"
                    value="Geringfügige Beschäftigung"
                    checked={form['arbeitszeit_typ'] === 'Geringfügige Beschäftigung'}
                    onChange={handleChange}
                    className="accent-cyan-500 w-4 h-4"
                  />
                  Geringfügige Beschäftigung
                </label>
              </div>
              <div className="flex flex-col gap-1 mt-2 md:w-1/3">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="arbeitszeit_stunden">Arbeitsstunden pro Woche:</label>
                <input
                  type="number"
                  id="arbeitszeit_stunden"
                  name="arbeitszeit_stunden"
                  value={form['arbeitszeit_stunden'] ?? ''}
                  onChange={handleChange}
                  className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                />
              </div>
            </div>
          </div>

          {/* Section H. Überstunden */}
          <div className="md:col-span-4 bg-blue-50/60 border border-blue-200 rounded-2xl p-8 mb-8 shadow flex flex-col gap-6">
            <h3 className="text-xl font-bold text-blue-900 mb-2">H. Überstunden</h3>
            <div className="flex flex-col gap-4">
              <label className="text-blue-700 font-semibold mb-1 text-sm">Ist die Arbeitnehmerin/der Arbeitnehmer verpflichtet, Überstunden zu leisten?</label>
              <div className="flex gap-8 flex-wrap">
                <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <input
                    type="radio"
                    name="ueberstunden_verpflichtet"
                    value="Ja"
                    checked={form['ueberstunden_verpflichtet'] === 'Ja'}
                    onChange={handleChange}
                    className="accent-cyan-500 w-4 h-4"
                  />
                  Ja
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <input
                    type="radio"
                    name="ueberstunden_verpflichtet"
                    value="Nein"
                    checked={form['ueberstunden_verpflichtet'] === 'Nein'}
                    onChange={handleChange}
                    className="accent-cyan-500 w-4 h-4"
                  />
                  Nein <span className="text-xs text-blue-400 ml-2">(weiter mit Abschnitt I.)</span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="ueberstunden_umfang">Überstundenumfang:</label>
                  <input
                    type="text"
                    id="ueberstunden_umfang"
                    name="ueberstunden_umfang"
                    value={form['ueberstunden_umfang'] ?? ''}
                    onChange={handleChange}
                    className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="ueberstunden_ausgleich">Überstundenausgleich durch:</label>
                  <input
                    type="text"
                    id="ueberstunden_ausgleich"
                    name="ueberstunden_ausgleich"
                    value={form['ueberstunden_ausgleich'] ?? ''}
                    onChange={handleChange}
                    className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section I. Urlaubsanspruch */}
          <div className="md:col-span-4 bg-blue-50/60 border border-blue-200 rounded-2xl p-8 mb-8 shadow flex flex-col gap-6">
            <h3 className="text-xl font-bold text-blue-900 mb-2">I. Urlaubsanspruch</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 md:w-1/3">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="urlaubsanspruch_tage">Auf wie viele Arbeitstage je Urlaubsjahr besteht Anspruch?</label>
                <input
                  type="number"
                  id="urlaubsanspruch_tage"
                  name="urlaubsanspruch_tage"
                  value={form['urlaubsanspruch_tage'] ?? ''}
                  onChange={handleChange}
                  className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                />
              </div>
            </div>
          </div>

          {/* Section J. Arbeitsentgelt */}
          <div className="md:col-span-4 bg-blue-50/60 border border-blue-200 rounded-2xl p-8 mb-8 shadow flex flex-col gap-8">
            <h3 className="text-xl font-bold text-blue-900 mb-2">J. Arbeitsentgelt</h3>
            
            {/* Tarifgebundenheit */}
            <div className="bg-white/80 border border-blue-100 rounded-xl p-6 shadow flex flex-col gap-4">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">Tarifgebundenheit</h4>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-blue-700 font-semibold mb-2 text-sm block">Ist der Arbeitgeber tarifgebunden (§ 3 oder § 5 Tarifvertragsgesetz (TVG))?</label>
                  <div className="flex gap-8 flex-wrap">
                    <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                      <input
                        type="radio"
                        name="arbeitgeber_tarifgebunden"
                        value="Ja"
                        checked={form['arbeitgeber_tarifgebunden'] === 'Ja'}
                        onChange={handleChange}
                        className="accent-cyan-500 w-4 h-4"
                      />
                      Ja
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                      <input
                        type="radio"
                        name="arbeitgeber_tarifgebunden"
                        value="Nein"
                        checked={form['arbeitgeber_tarifgebunden'] === 'Nein'}
                        onChange={handleChange}
                        className="accent-cyan-500 w-4 h-4"
                      />
                      Nein <span className="text-xs text-blue-400 ml-2">(weiter mit 46)</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="text-blue-700 font-semibold mb-2 text-sm block">Wird die Arbeitnehmerin/der Arbeitnehmer zu den geltenden tariflichen Arbeitsbedingungen beschäftigt?</label>
                  <div className="flex gap-8 flex-wrap">
                    <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                      <input
                        type="radio"
                        name="arbeitnehmer_tariflich"
                        value="Ja"
                        checked={form['arbeitnehmer_tariflich'] === 'Ja'}
                        onChange={handleChange}
                        className="accent-cyan-500 w-4 h-4"
                      />
                      Ja
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                      <input
                        type="radio"
                        name="arbeitnehmer_tariflich"
                        value="Nein"
                        checked={form['arbeitnehmer_tariflich'] === 'Nein'}
                        onChange={handleChange}
                        className="accent-cyan-500 w-4 h-4"
                      />
                      Nein <span className="text-xs text-blue-400 ml-2">(weiter mit 46)</span>
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="tarifvertrag">Tarifvertrag:</label>
                    <input
                      type="text"
                      id="tarifvertrag"
                      name="tarifvertrag"
                      value={form['tarifvertrag'] ?? ''}
                      onChange={handleChange}
                      className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="entgeltgruppe">Entgeltgruppe:</label>
                    <input
                      type="text"
                      id="entgeltgruppe"
                      name="entgeltgruppe"
                      value={form['entgeltgruppe'] ?? ''}
                      onChange={handleChange}
                      className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Höhe und Berechnungsart des Arbeitsentgelts */}
            <div className="bg-white/80 border border-blue-100 rounded-xl p-6 shadow flex flex-col gap-4">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">Höhe und Berechnungsart des Arbeitsentgelts</h4>
              <div className="flex flex-col gap-4">
                <label className="text-blue-700 font-semibold mb-1 text-sm">Höhe und Berechnungsart des Arbeitsentgelts</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <input
                      type="radio"
                      id="entgelt_pro_typ_stunde"
                      name="entgelt_pro_typ"
                      value="pro Stunde"
                      checked={form['entgelt_pro_typ'] === 'pro Stunde'}
                      onChange={handleChange}
                    className="accent-cyan-500 w-4 h-4"
                  />
                    pro Stunde Entgelt (brutto in Euro)
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <input
                      type="radio"
                      id="entgelt_pro_typ_monat"
                      name="entgelt_pro_typ"
                      value="pro Monat"
                      checked={form['entgelt_pro_typ'] === 'pro Monat'}
                      onChange={handleChange}
                      className="accent-cyan-500 w-4 h-4"
                    />
                    pro Monat Entgelt (brutto in Euro)
                  </label>
                </div>
                {form['entgelt_pro_typ'] === 'pro Stunde' && (
                  <div className="flex flex-col gap-1 ml-6 md:w-1/3">
                    <input
                      type="number"
                      step="0.01"
                      id="entgelt_pro_stunde_wert"
                      name="entgelt_pro_stunde_wert"
                      value={form['entgelt_pro_stunde_wert'] ?? ''}
                      onChange={handleChange}
                      className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                    />
                  </div>
                )}
                {form['entgelt_pro_typ'] === 'pro Monat' && (
                  <div className="flex flex-col gap-1 ml-6 md:w-1/3">
                    <input
                      type="number"
                      step="0.01"
                      id="entgelt_pro_monat_wert"
                      name="entgelt_pro_monat_wert"
                      value={form['entgelt_pro_monat_wert'] ?? ''}
                      onChange={handleChange}
                      className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Weitere Formen der Vergütung */}
            <div className="bg-white/80 border border-blue-100 rounded-xl p-6 shadow flex flex-col gap-4">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">Weitere Formen der Vergütung</h4>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="geldwerte_leistungen"
                    name="geldwerte_leistungen"
                    checked={form['geldwerte_leistungen'] === '1' || form['geldwerte_leistungen'] === 1 || form['geldwerte_leistungen'] === true}
                    onChange={e => setForm((f: any) => ({ ...f, geldwerte_leistungen: e.target.checked ? '1' : '0' }))}
                    className="accent-cyan-500 w-4 h-4"
                  />
                  <label className="text-sm font-medium text-blue-700" htmlFor="geldwerte_leistungen">zusätzliche geldwerte Leistungen</label>
                </div>
                
                {(form['geldwerte_leistungen'] === '1' || form['geldwerte_leistungen'] === 1 || form['geldwerte_leistungen'] === true) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="geldwerte_leistungen_art">Art der geldwerten Leistung:</label>
                      <input
                        type="text"
                        id="geldwerte_leistungen_art"
                        name="geldwerte_leistungen_art"
                        value={form['geldwerte_leistungen_art'] ?? ''}
                        onChange={handleChange}
                        className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="geldwerte_leistungen_hoehe">Höhe der geldwerten Leistung (brutto in Euro):</label>
                      <input
                        type="number"
                        step="0.01"
                        id="geldwerte_leistungen_hoehe"
                        name="geldwerte_leistungen_hoehe"
                        value={form['geldwerte_leistungen_hoehe'] ?? ''}
                        onChange={handleChange}
                        className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sonstige_berechnung"
                    name="sonstige_berechnung"
                    checked={form['sonstige_berechnung'] === '1' || form['sonstige_berechnung'] === 1 || form['sonstige_berechnung'] === true}
                    onChange={e => setForm((f: any) => ({ ...f, sonstige_berechnung: e.target.checked ? '1' : '0' }))}
                    className="accent-cyan-500 w-4 h-4"
                  />
                  <label className="text-sm font-medium text-blue-700" htmlFor="sonstige_berechnung">sonstige Berechnung (zum Beispiel variable Vergütung)</label>
                </div>
                
                {(form['sonstige_berechnung'] === '1' || form['sonstige_berechnung'] === 1 || form['sonstige_berechnung'] === true) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="sonstige_berechnung_art">Art der variablen Vergütung:</label>
                      <input
                        type="text"
                        id="sonstige_berechnung_art"
                        name="sonstige_berechnung_art"
                        value={form['sonstige_berechnung_art'] ?? ''}
                        onChange={handleChange}
                        className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="sonstige_berechnung_hoehe">Höhe der variablen Vergütung (brutto in Euro):</label>
                      <input
                        type="number"
                        step="0.01"
                        id="sonstige_berechnung_hoehe"
                        name="sonstige_berechnung_hoehe"
                        value={form['sonstige_berechnung_hoehe'] ?? ''}
                        onChange={handleChange}
                        className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Section K. Inländisches Beschäftigungsverhältnis */}
          <div className="md:col-span-4 bg-blue-50/60 border border-blue-200 rounded-2xl p-8 mb-8 shadow flex flex-col gap-8">
            <h3 className="text-xl font-bold text-blue-900 mb-2">K. Inländisches Beschäftigungsverhältnis</h3>
            <div className="flex flex-col gap-4">
              <label className="text-blue-700 font-semibold mb-1 text-sm">Besteht für den Arbeitnehmer/die Arbeitnehmerin Sozialversicherungspflicht in Deutschland?</label>
              <div className="flex gap-8 flex-wrap">
                <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <input
                    type="radio"
                    name="versicherungspflicht_de"
                    value="Ja"
                    checked={form['versicherungspflicht_de'] === 'Ja'}
                    onChange={handleChange}
                    className="accent-cyan-500 w-4 h-4"
                  />
                  Ja <span className="text-xs text-blue-400 ml-2">(weiter mit 54)</span>
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <input
                    type="radio"
                    name="versicherungspflicht_de"
                    value="Nein"
                    checked={form['versicherungspflicht_de'] === 'Nein'}
                    onChange={handleChange}
                    className="accent-cyan-500 w-4 h-4"
                  />
                  Nein
                </label>
              </div>
              <div className="flex flex-col gap-1 mt-2 md:w-2/3">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="versicherungspflicht_begruendung">Wenn nein, bitte Begründung angeben (bitte auch den Grund beziehungsweise gegebenenfalls die Gründe angeben, wenn in einzelnen Versicherungszweigen keine Versicherungspflicht besteht):</label>
                <textarea
                  id="versicherungspflicht_begruendung"
                  name="versicherungspflicht_begruendung"
                  value={form['versicherungspflicht_begruendung'] ?? ''}
                  onChange={handleChange}
                  rows={2}
                  className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                />
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-blue-700 font-semibold mb-1 text-sm">Besteht die Sozialversicherungspflicht in Deutschland ganz oder teilweise nicht, weil eine Ausnahmevereinbarung der Deutschen Verbindungsstelle Krankenversicherung – Ausland (DVKA) mit der ausländischen Sozialversicherung vorliegt?</label>
                <div className="flex gap-8 flex-wrap">
                  <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <input
                      type="radio"
                      name="dvka_ausnahme"
                      value="Ja"
                      checked={form['dvka_ausnahme'] === 'Ja'}
                      onChange={handleChange}
                      className="accent-cyan-500 w-4 h-4"
                    />
                    Ja <span className="text-xs text-blue-400 ml-2">(bitte Nachweis vorlegen)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <input
                      type="radio"
                      name="dvka_ausnahme"
                      value="Nein"
                      checked={form['dvka_ausnahme'] === 'Nein'}
                      onChange={handleChange}
                      className="accent-cyan-500 w-4 h-4"
                    />
                    Nein <span className="text-xs text-blue-400 ml-2">(weiter mit Abschnitt L.)</span>
                  </label>
                </div>
                <div className="flex flex-col gap-1 mt-2 md:w-2/3">
                  <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="dvka_nachweis_form">Bitte die Form des Nachweises angeben:</label>
                  <input
                    type="text"
                    id="dvka_nachweis_form"
                    name="dvka_nachweis_form"
                    value={form['dvka_nachweis_form'] ?? ''}
                    onChange={handleChange}
                    className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-2 md:w-2/3">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="ergaenzende_angaben">Raum für ergänzende Angaben:</label>
                <textarea
                  id="ergaenzende_angaben"
                  name="ergaenzende_angaben"
                  value={form['ergaenzende_angaben'] ?? ''}
                  onChange={handleChange}
                  rows={2}
                  className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                />
              </div>
            </div>
          </div>

          {/* Section L. Unterschrift */}
          <div className="md:col-span-4 bg-blue-50/60 border border-blue-200 rounded-2xl p-8 mb-8 shadow flex flex-col gap-8">
            <h3 className="text-xl font-bold text-blue-900 mb-2">L. Unterschrift</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="unterschrift_ort">Ort</label>
                <input
                  type="text"
                  id="unterschrift_ort"
                  name="unterschrift_ort"
                  value={form['unterschrift_ort'] ?? ''}
                  onChange={handleChange}
                  className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-blue-700 font-semibold mb-1 text-xs" htmlFor="unterschrift_datum">Datum</label>
                <input
                  type="date"
                  id="unterschrift_datum"
                  name="unterschrift_datum"
                  value={form['unterschrift_datum'] ?? ''}
                  onChange={handleChange}
                  className="px-2 py-2 rounded-lg border border-blue-200 bg-white/90 text-blue-900 shadow focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-xs font-medium hover:border-blue-400"
                />
              </div>
            </div>
          </div>
          <div className="md:col-span-4 flex gap-4 justify-between mt-8">
            <button type="button" className="px-6 py-3 rounded-2xl bg-blue-50 text-blue-500 font-bold shadow hover:bg-blue-100 focus:ring-2 focus:ring-cyan-400 transition text-lg disabled:opacity-50" onClick={() => navigate('/employees')} disabled={loading}>Zurück</button>
            <button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 focus:ring-2 focus:ring-cyan-400 transition-transform text-lg" disabled={loading}>Speichern</button>
          </div>
        </form>
        {toast && (
          <div className={`mt-6 px-6 py-3 rounded-xl shadow-lg font-semibold text-white text-center text-base ${toast.type === 'success' ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-red-500'} animate-fade-in`} style={{ boxShadow: '0 4px 24px 0 rgba(56,189,248,0.10)' }}>{toast.message}</div>
        )}
      </div>
    </div>
  );
} 