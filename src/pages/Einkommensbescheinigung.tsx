import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaFilePdf, FaUpload, FaDownload, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { API_BASE_URL } from '../lib/api';
import { PDFDownloadLink } from '@react-pdf/renderer';
import EinkommensbescheinigungPDFDocument from '../components/EinkommensbescheinigungPDFDocument';
import dayjs from 'dayjs';

const API_BASE = API_BASE_URL || window.location.origin;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const columns = [
  { key: 'monat', label: 'Monat', className: 'min-w-[60px]' },
  { key: 'jahr', label: 'Jahr', className: 'min-w-[70px]' },
  { key: 'eintritt', label: 'Eintritt', className: 'min-w-[100px]' },
  { key: 'stkl', label: 'StKl', className: 'min-w-[60px]' },
  { key: 'krankenkasse', label: 'Krankenkasse', className: 'min-w-[160px]' },
  { key: 'betrag', label: 'Betrag', className: 'min-w-[80px]' },
  { key: 'kv_brutto', label: 'KV-Brutto', className: 'min-w-[90px]' },
  { key: 'sv_abzug', label: 'SV-Abzug', className: 'min-w-[90px]' },
  { key: 'netto', label: 'Netto', className: 'min-w-[80px]' },
  { key: 'actions', label: 'Aktionen', className: 'min-w-[120px]' },
];

const EinkommensbescheinigungPage = () => {
  const query = useQuery();
  const employeeId = query.get('employeeId');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employee, setEmployee] = useState<any>(null);
  const [einkommensbescheinigung, setEinkommensbescheinigung] = useState<any>(null);
  const [erklaerungForm, setErklaerungForm] = useState<any>(null);
  const [monatlichGleich, setMonatlichGleich] = useState<'Ja' | 'Nein' | ''>('');
  const [branche, setBranche] = useState('');
  const fileInputRef = useRef(null);
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');
  const [numMonths, setNumMonths] = useState(6);
  const [entgeltMonate, setEntgeltMonate] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [company, setCompany] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number }>({ open: false });

  const fetchEmployeeName = async () => {
    if (!employeeId) return;
    try {
      const res = await axios.get(`${API_BASE}/employees/pdf/${employeeId}`);
      if (res.data && (res.data.vorname || res.data.geburtsname)) {
        setEmployeeName(`${res.data.vorname || ''} ${res.data.geburtsname || ''}`.trim());
      } else {
        setEmployeeName('');
      }
    } catch {
      setEmployeeName('');
    }
  };

  const fetchEmployee = async () => {
    if (!employeeId) return;
    try {
      const res = await axios.get(`${API_BASE}/employees/${employeeId}`);
      setEmployee(res.data);
    } catch {
      setEmployee(null);
    }
  };

  const fetchEinkommensbescheinigung = async () => {
    if (!employeeId) return;
    try {
      const res = await axios.get(`${API_BASE}/einkommensbescheinigung/list?employeeId=${employeeId}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setEinkommensbescheinigung(res.data[0]); // latest
      } else {
        setEinkommensbescheinigung(null);
      }
    } catch {
      setEinkommensbescheinigung(null);
    }
  };

  const fetchErklaerungForm = async () => {
    if (!employeeId) return;
    try {
      const res = await axios.get(`${API_BASE}/erklaerung_form/${employeeId}`);
      setErklaerungForm(res.data);
    } catch {
      setErklaerungForm(null);
    }
  };

  const fetchData = async () => {
    if (!employeeId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/einkommensbescheinigung/list?employeeId=${employeeId}`);
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError('Fehler beim Laden der Daten.');
      setData([]);
    }
    setLoading(false);
  };

  const fetchCompany = async () => {
    try {
      const res = await axios.get(`${API_BASE}/company`);
      setCompany(res.data);
    } catch {
      setCompany(null);
    }
  };

  // Helper to get available months/years from einkommensbescheinigung
  const availableMonths = einkommensbescheinigung ? data.map((row: any) => ({ monat: row.monat, jahr: row.jahr })) : [];
  const uniqueYears = Array.from(new Set(data.map((row: any) => row.jahr))).sort((a, b) => b - a);
  const uniqueMonths = Array.from(new Set(data.map((row: any) => row.monat))).sort();

  // When user selects start month/year/numMonths, update entgeltMonate
  useEffect(() => {
    if (!startMonth || !startYear || !numMonths) {
      setEntgeltMonate([]);
      return;
    }
    // Build array of {monat, jahr} for the selected range
    const months: { monat: string, jahr: string }[] = [];
    let m = parseInt(startMonth, 10);
    let y = parseInt(startYear, 10);
    for (let i = 0; i < numMonths; i++) {
      months.push({ monat: m.toString().padStart(2, '0'), jahr: y.toString() });
      m++;
      if (m > 12) { m = 1; y++; }
    }
    // Find matching rows in data
    const selected = months.map(({ monat, jahr }) =>
      data.find((row: any) => row.monat === monat && row.jahr === jahr) || { monat, jahr }
    );
    setEntgeltMonate(selected);
  }, [startMonth, startYear, numMonths, data]);

  useEffect(() => {
    fetchEmployeeName();
    fetchEmployee();
    fetchEinkommensbescheinigung();
    fetchErklaerungForm();
    fetchData();
    fetchCompany();
    // eslint-disable-next-line
  }, [employeeId]);

  // Only enable download if we have at least 1 entgeltMonate and all other required fields
  const canDownload = !!employee && !!einkommensbescheinigung && !!erklaerungForm && !!monatlichGleich && branche.trim().length > 0 && entgeltMonate.length > 0;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setUploading(true);
    setError('');
    setSuccess('');
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    try {
      await axios.post(`${API_BASE}/employees/${employeeId}/einkommensbescheinigung/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('PDF erfolgreich hochgeladen und verarbeitet!');
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Fehler beim Hochladen.');
    }
    setUploading(false);
    if (fileInputRef.current) (fileInputRef.current as HTMLInputElement).value = '';
  };

  const startEdit = (row: any) => {
    setEditingId(row.id);
    setEditForm({ ...row });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const saveEdit = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/einkommensbescheinigung/${editingId}`, editForm);
      setSuccess('Einkommensbescheinigung erfolgreich aktualisiert!');
      fetchData();
      setEditingId(null);
      setEditForm({});
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Fehler beim Aktualisieren.');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete.id) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/einkommensbescheinigung/${confirmDelete.id}`);
      setSuccess('Einkommensbescheinigung erfolgreich gelöscht!');
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Fehler beim Löschen.');
    }
    setLoading(false);
    setConfirmDelete({ open: false });
  };

  // Get unique months/years for filter dropdowns
  const allMonths = Array.from(new Set(data.map((row: any) => row.monat))).sort();
  const allYears = Array.from(new Set(data.map((row: any) => row.jahr))).sort((a, b) => b - a);

  // Filtered data
  const filteredData = data.filter((row: any) => {
    return (!filterMonth || row.monat === filterMonth) && (!filterYear || row.jahr === filterYear);
  });

  // Pagination logic
  const rowsPerPage = 4;
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [filterMonth, filterYear]);

  if (!employeeId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-xl text-red-600 font-bold">
        Kein Mitarbeiter ausgewählt.
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6">
      {/* Table Section */}
      <div className="flex-1 bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-800 flex flex-wrap items-center gap-2 font-sans">
            <FaFilePdf className="text-green-600" />
            <span>Einkommensbescheinigung</span>
            {employeeName && (
              <span className="ml-2 text-2xl md:text-3xl font-bold text-cyan-700 font-sans whitespace-nowrap">
                für&nbsp;{employeeName}
              </span>
            )}
          </h2>
        </div>
        {/* Warning Message */}
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Wichtiger Hinweis zur Datenverifizierung
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Bitte überprüfen Sie alle extrahierten Daten sorgfältig, bevor Sie diese Einkommensbescheinigung oder den Personalfragebogen verwenden. 
                  Die automatische Extraktion kann Fehler enthalten. Vergewissern Sie sich, dass alle Angaben korrekt sind.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4 items-center bg-blue-50 rounded-lg px-4 py-2">
          <label className="font-semibold text-blue-900">Monat:</label>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="border rounded px-2 py-1">
            <option value="">Alle</option>
            {allMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <label className="font-semibold text-blue-900">Jahr:</label>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="border rounded px-2 py-1">
            <option value="">Alle</option>
            {allYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {(filterMonth || filterYear) && (
            <button className="ml-2 text-xs text-blue-600 underline" onClick={() => { setFilterMonth(''); setFilterYear(''); }}>Filter zurücksetzen</button>
          )}
        </div>
        {error ? (
          <div className="text-red-600">{error}</div>
        ) : loading ? (
          <div className="text-gray-500">Lade Daten...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col.key} className={`text-left py-2 px-3 bg-blue-50 font-semibold ${col.className}`}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!Array.isArray(paginatedData) || paginatedData.length === 0 ? (
                  <tr><td colSpan={columns.length} className="text-center text-gray-400 py-6">Keine Einträge gefunden.</td></tr>
                ) : (
                  paginatedData.map((row: any) => (
                    <tr key={row.id} className="hover:bg-blue-50 transition">
                      {columns.map(col => {
                        if (col.key === 'actions') {
                          return (
                            <td key={col.key} className="py-2 px-3 border-b border-gray-100">
                              <div className="flex gap-2">
                                {editingId === row.id ? (
                                  <>
                                    <button
                                      onClick={saveEdit}
                                      className="p-1 rounded bg-green-500 text-white hover:bg-green-600 transition"
                                      title="Speichern"
                                      disabled={loading}
                                    >
                                      <FaCheck className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="p-1 rounded bg-gray-500 text-white hover:bg-gray-600 transition"
                                      title="Abbrechen"
                                      disabled={loading}
                                    >
                                      <FaTimes className="w-3 h-3" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEdit(row)}
                                      className="p-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                                      title="Bearbeiten"
                                      disabled={loading}
                                    >
                                      <FaEdit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete({ open: true, id: row.id })}
                                      className="p-1 rounded bg-red-500 text-white hover:bg-red-600 transition"
                                      title="Löschen"
                                      disabled={loading}
                                    >
                                      <FaTrash className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          );
                        } else {
                          return editingId === row.id ? (
                            <td key={col.key} className="py-2 px-3 border-b border-gray-100">
                              <input
                                name={col.key}
                                value={editForm[col.key] || ''}
                                onChange={handleEditChange}
                                className="w-full px-2 py-1 border rounded text-sm"
                                disabled={loading}
                              />
                            </td>
                          ) : (
                            <td key={col.key} className="py-2 px-3 border-b border-gray-100">
                              {row[col.key] || '-'}
                            </td>
                          );
                        }
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  className={`px-2 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </button>
                <span className="font-semibold text-blue-900">Seite {currentPage} / {totalPages}</span>
                <button
                  className={`px-2 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Right Section: Stepper for Upload and Download */}
      <div className="w-full md:w-[380px] flex-shrink-0 flex flex-col gap-8">
        {/* Step 1: PDF hochladen */}
        <div className="flex flex-col items-center gap-2 py-6 relative">
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center shadow-lg">
                <FaFilePdf className="text-4xl text-white drop-shadow" />
              </div>
              <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white">1</div>
            </div>
            <div className="text-lg font-bold text-blue-900 mb-1">PDF hochladen</div>
          </div>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleUpload}
            disabled={uploading}
          />
          <button
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-full shadow hover:scale-105 transition font-semibold text-base mt-2"
            onClick={() => fileInputRef.current && (fileInputRef.current as HTMLInputElement).click()}
            disabled={uploading}
          >
            <FaUpload /> PDF auswählen
          </button>
          {uploading && !error && <div className="text-xs text-blue-600 mt-2">Wird hochgeladen...</div>}
          {success && <div className="text-xs bg-green-100 text-green-700 rounded px-2 py-1 mt-2">{success}</div>}
          {error && !loading && <div className="text-xs bg-red-100 text-red-700 rounded px-2 py-1 mt-2">{error}</div>}
        </div>
        {/* Step 2: PDF Optionen & Download */}
        <div className="relative bg-gradient-to-br from-blue-50 to-white rounded-xl shadow p-4 flex flex-col gap-4 border-l-4 border-blue-400">
          <div className="absolute -left-5 top-5 bg-blue-400 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-base shadow">2</div>
          <h3 className="text-lg font-bold text-blue-800 mb-1">PDF Optionen & Download</h3>
          <div className="h-[1.5px] bg-gradient-to-r from-blue-300 to-blue-100 rounded mb-1" />
          {/* UI for selecting months/years */}
          <div className="flex flex-col gap-1 bg-white/70 rounded-lg p-2 border border-blue-100">
            <div className="flex flex-wrap gap-2 items-center">
              <label className="font-semibold text-sm">Startmonat:</label>
              <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="">Monat</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={(i+1).toString().padStart(2, '0')}>{(i+1).toString().padStart(2, '0')}</option>
                ))}
              </select>
              <label className="font-semibold text-sm">Jahr:</label>
              <select value={startYear} onChange={e => setStartYear(e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="">Jahr</option>
                {uniqueYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <label className="font-semibold text-sm">Anzahl Monate:</label>
              <select value={numMonths} onChange={e => setNumMonths(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
                {[1,2,3,4,5,6].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Monatlich gleich hoch & Branche */}
          <div className="flex flex-col gap-2 bg-white/70 rounded-lg p-2 border border-blue-100">
            <div className="flex flex-col md:flex-row gap-1 md:gap-2 items-start md:items-center w-full">
              <div className="flex flex-col w-full md:w-auto">
                <label className="font-semibold text-blue-900 flex-shrink-0 mb-1 md:mb-0 flex items-center gap-1 text-sm">
                  <span>Einkommen monatlich gleich?</span>
                  <span className="hidden md:inline text-xs text-gray-400" title="Das Einkommen ist monatlich gleich hoch">&#9432;</span>
                </label>
                <span className="md:hidden text-xs text-gray-400 mb-1">Das Einkommen ist monatlich gleich hoch</span>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <label className="flex items-center gap-1 cursor-pointer text-sm">
                  <input type="radio" name="monatlichGleich" value="Ja" checked={monatlichGleich==='Ja'} onChange={()=>setMonatlichGleich('Ja')} /> Ja
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-sm">
                  <input type="radio" name="monatlichGleich" value="Nein" checked={monatlichGleich==='Nein'} onChange={()=>setMonatlichGleich('Nein')} /> Nein
                </label>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 items-center">
              <label className="font-semibold text-blue-900 flex-shrink-0 text-sm">Branche:</label>
              <input
                type="text"
                className="border rounded px-2 py-1 w-full md:w-48 text-sm"
                value={branche}
                onChange={e=>setBranche(e.target.value)}
                placeholder="z.B. Baugewerbe, Gastronomie..."
              />
            </div>
          </div>
          <div className="flex justify-end mt-1">
            <PDFDownloadLink
              document={<EinkommensbescheinigungPDFDocument
                employee={employee}
                eintritt={einkommensbescheinigung?.eintritt}
                stkl={einkommensbescheinigung?.stkl}
                krankenkasse={einkommensbescheinigung?.krankenkasse}
                arbeitszeit_stunden={erklaerungForm?.arbeitszeit_stunden}
                monatlichGleich={monatlichGleich}
                branche={branche}
                entgeltMonate={entgeltMonate}
                company={company}
              />}
              fileName="Einkommensbescheinigung.pdf"
            >
              {({ loading }) => (
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-base font-semibold shadow transition-all ${canDownload ? 'bg-blue-600 text-white hover:bg-blue-700 scale-105' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  title="Download PDF"
                  disabled={!canDownload}
                >
                  <FaDownload className="text-xl" /> {loading ? 'Erzeuge PDF...' : 'PDF herunterladen'}
                </button>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </div>
      
      {/* Confirm Delete Modal */}
      {confirmDelete.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Einkommensbescheinigung löschen
            </h3>
            <p className="text-gray-600 mb-6">
              Sind Sie sicher, dass Sie diese Einkommensbescheinigung löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete({ open: false })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition"
                disabled={loading}
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                disabled={loading}
              >
                {loading ? 'Löschen...' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EinkommensbescheinigungPage; 