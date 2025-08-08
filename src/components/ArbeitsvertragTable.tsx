import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaSave, FaTimes, FaDownload } from 'react-icons/fa';
import { API_BASE_URL } from '../lib/api';

const PAGE_SIZE = 7;
const CONTRACT_TYPES = [
  'TEILZEITTÄTIGKEIT',
  'VOLLZEITTÄTIGKEIT',
  'TEILZEITTÄTIGKEIT - "MINIJOB"',
];
const DOWNLOADABLE_TYPES = CONTRACT_TYPES;

export default function ArbeitsvertragTable() {
  const [vertraege, setVertraege] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<any>({});
  const [contractTypes, setContractTypes] = useState<{ [id: string]: string }>({});
  const CONTRACT_TYPE_PLACEHOLDER = 'Vertragsart wählen';

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'strasse', label: 'Straße' },
    { key: 'plz_ort', label: 'PLZ/Ort' },
    { key: 'land', label: 'Land' },
    { key: 'beginn', label: 'Beschäftigungsbeginn' },
    { key: 'position', label: 'Position' },
    { key: 'arbeitszeit_stunden', label: 'Wochenstunden' },
    { key: 'gehalt', label: 'Gehalt (Euro)' },
    { key: 'urlaub', label: 'Urlaubstage' },
    { key: 'contract_type', label: 'Vertragsart' },
  ];

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/arbeitsvertrag/list`)
      .then(res => {
        setVertraege(res.data);
        setLoading(false);
        // Initialize contractTypes state from backend
        const ct: { [id: string]: string } = {};
        res.data.forEach((v: any) => {
          ct[v.id] = v.contract_type && v.contract_type !== '' ? v.contract_type : '';
        });
        setContractTypes(ct);
      })
      .catch(() => {
        setToast({ message: 'Fehler beim Laden der Verträge', type: 'error' });
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return vertraege;
    return vertraege.filter(v =>
      Object.values(v).some(val =>
        (val !== null && val !== undefined ? String(val) : '').toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [vertraege, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleEdit = (idx: number, v: any) => {
    setEditIdx(idx);
    setEditRow({ ...v });
  };

  const handleEditChange = (key: string, value: any) => {
    setEditRow((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleEditCancel = () => {
    setEditIdx(null);
    setEditRow({});
  };

  const handleEditSave = async (row: any, idx: number) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/arbeitsvertrag/edit/${row.id}`, editRow);
      setVertraege(prev => {
        const all = [...prev];
        const globalIdx = vertraege.findIndex(v => v.id === row.id);
        if (globalIdx !== -1) all[globalIdx] = { ...all[globalIdx], ...res.data };
        return all;
      });
      setToast({ message: 'Vertrag gespeichert', type: 'success' });
      setEditIdx(null);
      setEditRow({});
    } catch (e) {
      setToast({ message: 'Fehler beim Speichern', type: 'error' });
    }
  };

  const handleContractTypeChange = async (id: string, value: string) => {
    setContractTypes(prev => ({ ...prev, [id]: value }));
    if (!value) return;
    try {
      await axios.patch(`${API_BASE_URL}/arbeitsvertrag/edit/${id}`, { contract_type: value });
      setToast({ message: 'Vertragsart gespeichert', type: 'success' });
      setVertraege(prev => prev.map(v => v.id === id ? { ...v, contract_type: value } : v));
    } catch (e) {
      setToast({ message: 'Fehler beim Speichern der Vertragsart', type: 'error' });
    }
  };

  const handleDownload = async (row: any) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/arbeitsvertrag/download/${row.id}`,
        {
          responseType: 'blob',
        }
      );
      // Extract filename from Content-Disposition header
      const disposition = response.headers['content-disposition'];
      let filename = 'Arbeitsvertrag.docx';
      if (disposition && disposition.indexOf('filename=') !== -1) {
        filename = disposition
          .split('filename=')[1]
          .replace(/['"]/g, '')
          .trim();
      }
      // Create a blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setToast({ message: 'Fehler beim Herunterladen', type: 'error' });
    }
  };

  return (
    <div className="w-full my-4 px-2 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4 z-10 relative px-1">
        <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight drop-shadow-lg flex items-center gap-2">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">ARBEITSVERTRAG FÜR</span>
        </h2>
        <div className="flex gap-2 items-center w-full md:w-auto">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search..."
            className="px-4 py-2 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-300 bg-white/80 text-blue-900 placeholder-blue-400 transition w-full md:w-64 shadow text-sm"
            aria-label="Search contracts"
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl border border-blue-100 shadow-2xl bg-white/80 backdrop-blur-xl">
        <table className="min-w-full text-base">
          <thead>
            <tr className="bg-gradient-to-r from-blue-100/80 via-cyan-100/80 to-blue-50/80 text-blue-800 text-sm">
              <th className="px-3 py-2 text-left font-bold">#</th>
              {columns.map(col => (
                <th key={col.key} className="px-3 py-2 text-left font-bold whitespace-nowrap text-sm">{col.label}</th>
              ))}
              <th className="px-3 py-2 text-left font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + 2} className="py-12 text-center text-blue-400 animate-pulse text-base">Lade Verträge...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={columns.length + 2} className="py-12 text-center text-blue-400 text-base">No contracts found.</td></tr>
            ) : paginated.map((v, idx) => {
              const isEditing = editIdx === idx;
              const contractType = contractTypes[v.id] || '';
              return (
                <tr key={v.id || idx} className="group even:bg-blue-50/60 odd:bg-white/80 hover:shadow-xl hover:scale-[1.01] transition-all duration-200 rounded-2xl" style={{ fontSize: '1.08rem' }}>
                  <td className="px-3 py-2 text-blue-900 font-bold text-sm">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  {columns.map(col => {
                    if (col.key === 'contract_type') {
                      return (
                        <td key={col.key} className="px-3 py-2 text-blue-900 group-hover:bg-cyan-50/60 transition rounded-xl text-sm font-medium">
                          <select
                            className="w-full px-2 py-1 rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-900 font-semibold text-sm shadow focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
                            value={contractType}
                            onChange={e => handleContractTypeChange(v.id, e.target.value)}
                          >
                            <option value="" disabled className="text-gray-400">{CONTRACT_TYPE_PLACEHOLDER}</option>
                            {CONTRACT_TYPES.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </td>
                      );
                    }
                    return (
                      <td key={col.key} className="px-3 py-2 text-blue-900 max-w-[140px] truncate group-hover:bg-cyan-50/60 transition rounded-xl text-sm font-medium">
                        {isEditing ? (
                          <input
                            className="w-full px-2 py-1 rounded border border-blue-200 text-blue-900 bg-white/90 text-sm"
                            value={editRow[col.key] ?? ''}
                            onChange={e => handleEditChange(col.key, e.target.value)}
                            type={col.key === 'beginn' ? 'date' : col.key === 'arbeitszeit_stunden' || col.key === 'urlaub' ? 'number' : 'text'}
                          />
                        ) : (
                          v[col.key]
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 flex gap-2 items-center justify-center group-hover:bg-cyan-50/60 transition rounded-xl">
                    {isEditing ? (
                      <>
                        <button title="Save" className="p-2 rounded-xl bg-gradient-to-r from-green-100 to-green-300 text-green-700 shadow hover:scale-110 transition flex items-center justify-center" onClick={() => handleEditSave(v, idx)}><FaSave /></button>
                        <button title="Cancel" className="p-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-300 text-gray-700 shadow hover:scale-110 transition flex items-center justify-center" onClick={handleEditCancel}><FaTimes /></button>
                      </>
                    ) : (
                      <>
                        <button title="Edit" className="p-2 rounded-xl bg-gradient-to-r from-yellow-100 to-yellow-300 text-yellow-700 shadow hover:scale-110 transition flex items-center justify-center" onClick={() => handleEdit(idx, v)}><FaEdit /></button>
                        <button
                          title={DOWNLOADABLE_TYPES.includes(contractType) ? `Download Vertrag (${contractType})` : 'Bitte gültige Vertragsart wählen'}
                          className={`p-2 rounded-xl bg-gradient-to-r from-blue-100 to-cyan-200 text-blue-700 shadow hover:scale-110 transition flex items-center justify-center ${!DOWNLOADABLE_TYPES.includes(contractType) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => DOWNLOADABLE_TYPES.includes(contractType) && handleDownload(v)}
                          disabled={!DOWNLOADABLE_TYPES.includes(contractType)}
                        >
                          <FaDownload />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-between items-center mt-6 px-1">
        <div className="text-blue-700 text-sm font-semibold">
          Page {page} of {totalPages} <span className="text-blue-400 font-normal">({filtered.length} contracts)</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold shadow hover:bg-blue-200 transition disabled:opacity-50 flex items-center gap-2 text-sm"
            aria-label="Previous page"
          >
            &lt;
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold shadow hover:bg-blue-200 transition disabled:opacity-50 flex items-center gap-2 text-sm"
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      </div>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-3 rounded-2xl shadow-2xl font-bold text-white text-base ${toast.type === 'success' ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gradient-to-r from-red-500 to-pink-400'} animate-fade-in`} style={{ boxShadow: '0 4px 24px 0 rgba(56,189,248,0.10)' }}>{toast.message}</div>
      )}
    </div>
  );
} 