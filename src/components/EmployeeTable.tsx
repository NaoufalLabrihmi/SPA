import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../lib/api';
import { FaCheck, FaDownload, FaChevronLeft, FaChevronRight, FaPlus, FaTimes, FaTrash, FaEdit, FaFilePdf, FaFileAlt, FaSpinner, FaHistory } from 'react-icons/fa';
import { pdf } from '@react-pdf/renderer';
import EmployeePDF from './EmployeePDF';
import { useNavigate } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { StundenzettelPDFDocument } from './StundenzettelPDFDocument';
import { useCallback } from 'react';
import ReactModal from 'react-modal';
import { saveAs } from 'file-saver';

function getDaysInMonth(year, month) {
  const days = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    days.push({
      weekday: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][date.getDay()],
      day: date.getDate(),
    });
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function minToHHMM(mins) {
  if (!mins || isNaN(mins) || mins === 0) return '-';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h > 0 ? h + ':' : '0:'}${m.toString().padStart(2, '0')}`;
}

function parseVerteilung(verteilung) {
  const obj = {};
  if (!verteilung) return obj;
  verteilung.split(',').forEach(part => {
    const [w, min] = part.split(':');
    if (w && min) obj[w.trim()] = parseInt(min.trim(), 10);
  });
  return obj;
}

function parseVerteilungHours(verteilung) {
  const obj = {};
  if (!verteilung) return obj;
  verteilung.split(',').forEach(part => {
    const [w, h] = part.split(':');
    if (w && h) obj[w.trim()] = parseFloat(h.trim());
  });
  return obj;
}

function hoursToHHMM(hours) {
  if (!hours || isNaN(hours) || hours === 0) return '-';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function StundenzettelInputModal({ isOpen, onClose, onConfirm, year, month, arbeitszeitVerteilung, holidays }) {
  const days = getDaysInMonth(year, month);
  const verteilung = parseVerteilung(arbeitszeitVerteilung);
  const [inputs, setInputs] = React.useState(() => days.map(({ weekday }) => ({
    beginn: '08:30',
    pause: '12:00',
    ende: '04:30',
    dauer: minToHHMM(verteilung[weekday] || 0),
  })));
  React.useEffect(() => {
    setInputs(days.map(({ weekday }) => ({
      beginn: '08:30',
      pause: '12:00',
      ende: '04:30',
      dauer: minToHHMM(verteilung[weekday] || 0),
    })));
    // eslint-disable-next-line
  }, [year, month, arbeitszeitVerteilung]);
  const handleChange = (idx, field, value) => {
    setInputs(inputs => inputs.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };
  return (
    <ReactModal isOpen={isOpen} onRequestClose={onClose} ariaHideApp={false} style={{ content: { maxWidth: 700, margin: 'auto', inset: 40 } }}>
      <h2 className="font-bold text-lg mb-2">Stundenzettel Eingabe ({month}.{year})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border">
          <thead>
            <tr>
              <th>Kalendertag</th>
              <th>Beginn (Uhrzeit)</th>
              <th>Pause (Dauer)</th>
              <th>Ende (Uhrzeit)</th>
              <th>Dauer (Summe)</th>
            </tr>
          </thead>
          <tbody>
            {days.map(({ weekday, day }, idx) => (
              <tr key={day} className={weekday === 'So' ? 'bg-gray-100' : ''}>
                <td>{weekday}, {day.toString().padStart(2, '0')}</td>
                <td><input type="text" value={inputs[idx].beginn} onChange={e => handleChange(idx, 'beginn', e.target.value)} className="border rounded px-1 w-16" /></td>
                <td><input type="text" value={inputs[idx].pause} onChange={e => handleChange(idx, 'pause', e.target.value)} className="border rounded px-1 w-16" /></td>
                <td><input type="text" value={inputs[idx].ende} onChange={e => handleChange(idx, 'ende', e.target.value)} className="border rounded px-1 w-16" /></td>
                <td><input type="text" value={inputs[idx].dauer} readOnly className="border rounded px-1 w-16 bg-gray-50" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 justify-end mt-4">
        <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Abbrechen</button>
        <button onClick={() => onConfirm(inputs)} className="px-4 py-2 rounded bg-blue-600 text-white">Bestätigen</button>
      </div>
    </ReactModal>
  );
}

const PAGE_SIZE = 4;

function useStundenzettelData(employeeId, year) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    axios.get(`${API_BASE_URL}/employees/stundenzettel-data/${employeeId}?year=${year}`)
      .then(res => setData(res.data))
      .catch(e => setError(e))
      .finally(() => setLoading(false));
  }, [employeeId, year]);
  React.useEffect(() => {
    if (employeeId && year) fetchData();
  }, [employeeId, year, fetchData]);
  return { data, loading, error };
}

function getHolidaysForYear(year, state = 'sn') {
  // Use backend proxy endpoint to avoid CORS
  return axios.get(`${API_BASE_URL}/holidays/${year}?state=${state}`)
    .then(res => res.data);
}

function StundenzettelPDFDownload({ employeeId, year, emp }) {
  const { data, loading } = useStundenzettelData(employeeId, year);
  const [holidays, setHolidays] = React.useState({});
  const [pdfUrl, setPdfUrl] = React.useState(null);
  const [generating, setGenerating] = React.useState(false);
  React.useEffect(() => {
    getHolidaysForYear(year, 'sn').then(setHolidays);
  }, [year]);
  // Always show the icon, but disable if not ready
  const notReady = loading || Object.keys(holidays).length === 0 || !data;
  // Build entries prop for PDF for all 12 months
  const entries = {};
  const verteilung = data ? parseVerteilungHours(data.arbeitszeitVerteilung) : {};
  for (let month = 1; month <= 12; month++) {
    const days = getDaysInMonth(year, month);
    entries[month] = {};
    days.forEach(({ weekday, day }) => {
      const isHoliday = holidays[month]?.[day.toString().padStart(2, '0')];
      if (isHoliday) {
        entries[month][day.toString().padStart(2, '0')] = {};
        return;
      }
      const dauerH = verteilung[weekday] || 0;
      const beginn = '08:30';
      const pause = '1:00'; // 1 hour pause
      // Work resumes at 09:30
      let [bh, bm] = beginn.split(':').map(Number);
      let resumeMin = bh * 60 + bm + 60; // add 1 hour pause
      let resumeHour = Math.floor(resumeMin / 60);
      let resumeMinute = resumeMin % 60;
      // Calculate Ende as resume + Dauer
      let totalMin = resumeHour * 60 + resumeMinute + Math.round(dauerH * 60);
      let eh = Math.floor(totalMin / 60);
      let em = totalMin % 60;
      const ende = `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;
      const dauer = hoursToHHMM(dauerH);
      entries[month][day.toString().padStart(2, '0')] = {
        beginn,
        pause,
        ende,
        dauer,
      };
    });
  }
  const handleGenerate = async () => {
    setGenerating(true);
    setPdfUrl(null);
    const doc = <StundenzettelPDFDocument {...data} entries={entries} holidays={holidays} />;
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
    setGenerating(false);
  };
  return (
    <>
      {!pdfUrl ? (
        <button
          className={`p-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow hover:scale-110 hover:shadow-lg transition-transform focus:outline-none focus:ring-2 focus:ring-blue-300 ${notReady ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          title={notReady ? 'Stundenzettel nicht bereit' : 'Stundenzettel generieren'}
          onClick={handleGenerate}
          disabled={notReady || generating}
        >
          {generating ? <FaSpinner className="animate-spin w-5 h-5" /> : <FaDownload className="w-5 h-5" />}
        </button>
      ) : (
        <a
          href={pdfUrl}
          download={`Stundenzettel_${emp.vorname}_${emp.geburtsname}_${year}.pdf`}
          className="p-2 rounded-full bg-gradient-to-r from-green-500 to-cyan-400 text-white shadow hover:scale-110 hover:shadow-lg transition-transform focus:outline-none focus:ring-2 focus:ring-green-300"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          title="Stundenzettel herunterladen"
          onClick={() => { setTimeout(() => { URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }, 1000); }}
        >
          <FaDownload className="w-5 h-5" />
        </a>
      )}
    </>
  );
}

export default function EmployeeTable() {
  const [employees, setEmployees] = useState([]);
  const [modal, setModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: number }>({ open: false });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<{ [id: number]: number }>({});
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const HISTORY_PAGE_SIZE = 8;
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    if (showHistory) setHistoryPage(1);
  }, [showHistory]);

  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * HISTORY_PAGE_SIZE;
    return history.slice(start, start + HISTORY_PAGE_SIZE);
  }, [history, historyPage]);
  const historyTotalPages = Math.ceil(history.length / HISTORY_PAGE_SIZE) || 1;

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/employees/stundenzettel-history`);
      setHistory(res.data);
    } catch {
      setHistory([]);
    }
    setLoadingHistory(false);
  };

  const handleShowHistory = () => {
    setShowHistory(true);
    fetchHistory();
  };
  const handleCloseHistory = () => setShowHistory(false);

  const handleDownloadHistory = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/employees/stundenzettel-history/${id}/download`, { responseType: 'blob' });
      // Try to get filename from header
      let filename = 'Stundenzettel.pdf';
      const disposition = res.headers['content-disposition'];
      if (disposition) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match) filename = match[1];
      }
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch {
      setToast({ message: 'Download fehlgeschlagen', type: 'error' });
    }
  };

  const handleRegenerateHistory = async (h) => {
    try {
      // Fetch the data for the same employees, month, year
      const res = await axios.post(
        `${API_BASE_URL}/employees/stundenzettel-pdf-data`,
        {
          employee_ids: JSON.parse(h.employee_ids || '[]'),
          month: h.month,
          year: h.year,
        }
      );
      const { employees } = res.data;
      const holidays = await axios.get(`${API_BASE_URL}/holidays/${h.year}?state=sn`).then(r => r.data);
      const doc = <StundenzettelPDFDocument employees={employees} month={h.month} year={h.year} holidays={holidays} />;
      const blob = await pdf(doc).toBlob();
      saveAs(blob, h.filename || `Stundenzettel_${h.year}_${h.month}.pdf`);
    } catch {
      setToast({ message: 'Regenerieren fehlgeschlagen', type: 'error' });
    }
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/employees/list`)
      .then(res => {
        setEmployees(res.data);
      })
      .catch(() => setEmployees([]));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return employees;
    return employees.filter(emp =>
      Object.values(emp).some(val =>
        (val !== null && val !== undefined ? String(val) : '').toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [employees, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const columns = [
    { key: 'vorname', label: 'Vorname', className: 'min-w-[120px] flex-2' },
    { key: 'geburtsname', label: 'Geburtsname', className: 'min-w-[120px] flex-2' },
    { key: 'id_number', label: 'ID Number', className: 'min-w-[120px] flex-2' },
    { key: 'personal_number', label: 'Personalnummer', className: 'min-w-[120px] flex-2' },
    { key: 'geburtsdatum', label: 'Geburtsdatum', className: 'min-w-[120px] flex-2' },
    { key: 'geschlecht', label: 'Geschlecht', className: 'min-w-[100px] flex-2' },
    { key: 'personalfragebogen', label: 'Personalfragebogen', className: 'min-w-[120px] flex-2', isSpecial: 'personalfragebogen' },
    { key: 'erklaerung_formular', label: 'Erklärung Formular', className: 'min-w-[120px] flex-2', isSpecial: 'erklaerung_formular' },
    { key: 'einkommensbescheinigung', label: 'Einkommensbescheinigung', className: 'min-w-[120px] flex-2', isSpecial: 'einkommensbescheinigung' },
  ];

  const openAdd = () => {
    setFile(null);
    setModal(true);
  };
  const closeModal = () => setModal(false);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
      if (!file) {
        setToast({ message: 'Please upload an ID card image.', type: 'error' });
        setLoading(false);
        return;
      }
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post(`${API_BASE_URL}/employees/add`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const emp = res.data.employee;
      setEmployees(emps => [...emps, emp]);
        setToast({ message: 'Employee added from scan!', type: 'success' });
        closeModal();
      } catch (err: any) {
        setToast({ message: err?.response?.data?.detail || 'Scan failed', type: 'error' });
      }
      setLoading(false);
  };
  const handleDelete = async () => {
    if (!confirmDelete.id) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/employees/delete/${confirmDelete.id}`);
      setEmployees(emps => emps.filter(emp => emp.id !== confirmDelete.id));
      setToast({ message: 'Employee deleted!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err?.response?.data?.detail || 'Delete failed', type: 'error' });
    }
    setLoading(false);
    setConfirmDelete({ open: false });
  };
  const startEdit = (emp: any) => {
    setEditingId(emp.id);
    setEditForm({ ...emp });
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
      const res = await axios.patch(`${API_BASE_URL}/employees/edit/${editingId}`, editForm);
      const updated = res.data.employee;
      setEmployees(emps => emps.map(emp => emp.id === editingId ? updated : emp));
      setToast({ message: 'Employee updated!', type: 'success' });
      setEditingId(null);
      setEditForm({});
    } catch (err: any) {
      setToast({ message: err?.response?.data?.detail || 'Edit failed', type: 'error' });
    }
    setLoading(false);
  };
  const handleDownload = async (emp: any) => {
    setLoading(true);
    try {
      // Fetch full employee data from backend
      const res = await axios.get(`${API_BASE_URL}/employees/pdf/${emp.id}`);
      const employeeData = res.data;
      const blob = await pdf(
        <EmployeePDF data={employeeData} stand={new Date().toLocaleDateString()} />
      ).toBlob();
      const filename = `${employeeData.vorname || ''}_${employeeData.geburtsname || ''}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setToast({ message: 'Download failed', type: 'error' });
    }
    setLoading(false);
  };
  const handleOfficialDownload = async (emp: any) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/employees/erklaerung-pdf/${emp.id}`,
        { responseType: 'blob' }
      );
      const filename = `erklaerung_${emp.vorname || ''}_${emp.geburtsname || ''}.pdf`;
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      setToast({ message: 'PDF downloaded!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Download failed', type: 'error' });
    }
    setLoading(false);
  };
  React.useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Add checkbox select logic
  const handleSelectEmployee = (id: number) => {
    setSelectedEmployees(prev => prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]);
  };
  const handleSelectAll = () => {
    if (selectedEmployees.length === paginated.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(paginated.map(emp => emp.id));
    }
  };

  // Download logic
  const handleMultiStundenzettelDownload = async () => {
    if (selectedEmployees.length === 0) {
      setToast({ message: 'Bitte mindestens einen Mitarbeiter auswählen.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      // Fetch employee names for logging
      const employeeNames = paginated
        .filter(emp => selectedEmployees.includes(emp.id))
        .map(emp => `${emp.vorname} ${emp.geburtsname}`);
      // Generate and download PDF as before
      const res = await axios.post(
        `${API_BASE_URL}/employees/stundenzettel-pdf-data`,
        {
        employee_ids: selectedEmployees,
        month: selectedMonth,
          year: currentYear,
        }
      );
      const { employees } = res.data;
      const holidays = await axios.get(`${API_BASE_URL}/holidays/${currentYear}?state=sn`).then(r => r.data);
      const doc = <StundenzettelPDFDocument employees={employees} month={selectedMonth} year={currentYear} holidays={holidays} />;
      const blob = await pdf(doc).toBlob();
      saveAs(blob, `Stundenzettel_${currentYear}_${selectedMonth}.pdf`);
      setToast({ message: 'PDF heruntergeladen!', type: 'success' });
      // Log the download in the backend with the PDF file
      const formData = new FormData();
      formData.append('employee_ids', JSON.stringify(selectedEmployees));
      formData.append('month', selectedMonth.toString());
      formData.append('year', currentYear.toString());
      formData.append('employee_names', JSON.stringify(employeeNames));
      formData.append('file', new File([blob], `Stundenzettel_${currentYear}_${selectedMonth}.pdf`, { type: 'application/pdf' }));
      await axios.post(`${API_BASE_URL}/employees/stundenzettel-log-download`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (err) {
      setToast({ message: 'Download fehlgeschlagen', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className="w-full my-4 px-2 md:px-6">
      {/* History Icon/Button */}
      <div className="flex justify-end mb-2">
        {!showHistory && (
          <button onClick={handleShowHistory} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-gray-200 to-blue-100 text-blue-700 font-bold shadow hover:scale-105 transition-transform text-base">
            <FaHistory /> Verlauf
          </button>
        )}
      </div>
      {/* History Table as Main View */}
      {showHistory ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-3xl font-extrabold text-blue-900 tracking-tight drop-shadow-lg flex items-center gap-2">Stundenzettel Download-Verlauf</h3>
            <button type="button" onClick={handleCloseHistory} className="px-4 py-2 rounded-xl bg-blue-50 text-blue-500 font-bold shadow hover:bg-blue-100 transition text-base">Back to Employees</button>
          </div>
          {/* Desktop Table Layout */}
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-3xl border border-blue-100 shadow-2xl bg-white/80 backdrop-blur-xl">
              <table className="w-full text-base">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-gradient-to-r from-blue-100/80 via-cyan-100/80 to-blue-50/80 text-blue-800 text-sm">
                    <th className="px-3 py-2 text-left font-bold">Datum</th>
                    <th className="px-3 py-2 text-left font-bold">Monat</th>
                    <th className="px-3 py-2 text-left font-bold">Jahr</th>
                    <th className="px-3 py-2 text-left font-bold">Dateiname</th>
                    <th className="px-3 py-2 text-left font-bold">Mitarbeiter</th>
                    <th className="px-3 py-2 text-left font-bold">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingHistory ? (
                    <tr><td colSpan={6} className="py-12 text-center text-blue-400 animate-pulse text-base">Lade Verlauf...</td></tr>
                  ) : history.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-blue-400 text-base">Kein Verlauf gefunden.</td></tr>
                  ) : paginatedHistory.map((h, idx) => (
                    <tr key={h.id} className={`group even:bg-blue-50/60 odd:bg-white/80 hover:shadow-xl hover:scale-[1.01] transition-all duration-200 rounded-2xl`} style={{ fontSize: '1.08rem' }}>
                      <td className="px-3 py-2 text-blue-900 font-medium text-sm">{h.download_date ? new Date(h.download_date).toLocaleString() : ''}</td>
                      <td className="px-3 py-2 text-blue-900 text-sm">{h.month}</td>
                      <td className="px-3 py-2 text-blue-900 text-sm">{h.year}</td>
                      <td className="px-3 py-2 text-blue-900 text-sm">{h.filename}</td>
                      <td className="px-3 py-2 text-blue-900 text-sm max-w-[180px] truncate" title={Array.isArray(h.employee_names) ? h.employee_names.join(', ') : ''}>{Array.isArray(h.employee_names) ? h.employee_names.join(', ') : ''}</td>
                      <td className="px-3 py-2 flex gap-2 items-center justify-center group-hover:bg-cyan-50/60 transition rounded-xl">
                        <button onClick={() => handleDownloadHistory(h.id)} className="p-2 rounded-xl bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 shadow hover:scale-110 transition flex items-center justify-center" title="Download gespeicherte PDF">
                          <FaHistory />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6 px-1">
              <div className="text-blue-700 text-sm font-semibold">
                Page {historyPage} of {historyTotalPages} <span className="text-blue-400 font-normal">({history.length} downloads)</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                  className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold shadow hover:bg-blue-200 transition disabled:opacity-50 flex items-center gap-2 text-sm"
                  aria-label="Previous page"
                >
                  <FaChevronLeft />
                </button>
                <button
                  onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                  disabled={historyPage === historyTotalPages}
                  className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold shadow hover:bg-blue-200 transition disabled:opacity-50 flex items-center gap-2 text-sm"
                  aria-label="Next page"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          </div>
          {/* Mobile/Card Layout */}
          <div className="block md:hidden space-y-4 text-base">
            {loadingHistory ? (
              <div className="py-8 text-center text-blue-400 animate-pulse text-base">Lade Verlauf...</div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-blue-400 text-base">Kein Verlauf gefunden.</div>
            ) : paginatedHistory.map((h) => (
              <div key={h.id} className="rounded-2xl shadow-xl border border-blue-100 bg-gradient-to-br from-white/90 via-blue-50/90 to-cyan-50/90 p-4 flex flex-col gap-2 hover:scale-[1.01] hover:shadow-2xl transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-blue-900 font-bold text-xl">{h.filename}</div>
                  <button onClick={() => handleDownloadHistory(h.id)} className="p-2 rounded-xl bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 shadow hover:scale-110 transition flex items-center justify-center" title="Download gespeicherte PDF">
                    <FaHistory />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex flex-col"><span className="text-blue-400 font-semibold">Datum</span><span className="text-blue-900 font-medium truncate">{h.download_date ? new Date(h.download_date).toLocaleString() : ''}</span></div>
                  <div className="flex flex-col"><span className="text-blue-400 font-semibold">Monat</span><span className="text-blue-900 font-medium truncate">{h.month}</span></div>
                  <div className="flex flex-col"><span className="text-blue-400 font-semibold">Jahr</span><span className="text-blue-900 font-medium truncate">{h.year}</span></div>
                  <div className="flex flex-col col-span-2"><span className="text-blue-400 font-semibold">Mitarbeiter</span><span className="text-blue-900 font-medium truncate">{Array.isArray(h.employee_names) ? h.employee_names.join(', ') : ''}</span></div>
                </div>
              </div>
            ))}
            {/* Pagination Controls for Mobile */}
            {historyTotalPages > 1 && (
              <div className="flex justify-between items-center mt-6 px-1">
                <div className="text-blue-700 text-sm font-semibold">
                  Page {historyPage} of {historyTotalPages} <span className="text-blue-400 font-normal">({history.length} downloads)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                    className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold shadow hover:bg-blue-200 transition disabled:opacity-50 flex items-center gap-2 text-sm"
                    aria-label="Previous page"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                    disabled={historyPage === historyTotalPages}
                    className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold shadow hover:bg-blue-200 transition disabled:opacity-50 flex items-center gap-2 text-sm"
                    aria-label="Next page"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Month selector and download button */}
          <div className="flex flex-wrap gap-2 items-center mb-2">
            <label className="font-semibold">Monat:</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="border rounded px-2 py-1">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            <button onClick={handleMultiStundenzettelDownload} className="ml-4 px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold shadow hover:scale-105 transition-transform" disabled={loading || selectedEmployees.length === 0}>Stundenzettel PDF herunterladen</button>
          </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4 z-10 relative px-1">
        <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight drop-shadow-lg flex items-center gap-2">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Employees</span>
        </h2>
        <div className="flex gap-2 items-center w-full md:w-auto">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search..."
            className="px-4 py-2 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-300 bg-white/80 text-blue-900 placeholder-blue-400 transition w-full md:w-64 shadow text-sm"
            aria-label="Search employees"
          />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform text-base"
          >
            <FaPlus />
          </button>
        </div>
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
                Bitte überprüfen Sie alle extrahierten Daten sorgfältig, bevor Sie Personalfragebogen, Erklärung Formular, Einkommensbescheinigung oder Stundenzettel herunterladen. 
                Die automatische Extraktion kann Fehler enthalten. Vergewissern Sie sich, dass alle Angaben korrekt sind.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Responsive Table/Card Layout */}
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-3xl border border-blue-100 shadow-2xl bg-white/80 backdrop-blur-xl">
          <table className="w-full text-base">
            <thead className="sticky top-0 z-20">
              <tr className="bg-gradient-to-r from-blue-100/80 via-cyan-100/80 to-blue-50/80 text-blue-800 text-sm">
                <th className="px-3 py-2 text-left font-bold">#</th>
                    <th><input type="checkbox" checked={selectedEmployees.length === paginated.length && paginated.length > 0} onChange={handleSelectAll} /></th>
                {columns.map(col => (
                  <th key={col.key} className="px-3 py-2 text-left font-bold whitespace-nowrap text-sm">{col.label}</th>
                ))}
                <th className="px-3 py-2 text-left font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                    <tr><td colSpan={columns.length + 4} className="py-12 text-center text-blue-400 animate-pulse text-base">Loading...</td></tr>
              ) : paginated.length === 0 ? (
                    <tr><td colSpan={columns.length + 4} className="py-12 text-center text-blue-400 text-base">No employees found.</td></tr>
              ) : paginated.map((emp, idx) => (
                <tr key={emp.id} className={`group even:bg-blue-50/60 odd:bg-white/80 hover:shadow-xl hover:scale-[1.01] transition-all duration-200 rounded-2xl ${editingId === emp.id ? 'ring-2 ring-cyan-400' : ''}`} style={{ fontSize: '1.08rem' }}>
                  <td className="px-3 py-2 text-blue-900 font-bold text-sm">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td><input type="checkbox" checked={selectedEmployees.includes(emp.id)} onChange={() => handleSelectEmployee(emp.id)} /></td>
                  {columns.map(col => {
                    if (col.isSpecial === 'personalfragebogen') {
                      return (
                        <td key={col.key} className={`px-3 py-2 ${col.className || ''}`}>
                          <div className="flex gap-2">
                            <button
                              className="p-2 rounded-xl bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 shadow hover:scale-110 transition flex items-center justify-center"
                              title="Download Personalfragebogen"
                              onClick={() => handleDownload(emp)}
                              disabled={loading}
                            >
                              <FaDownload />
                            </button>
                            <button
                              onClick={() => navigate(`/employees/${emp.id}/edit`)}
                              title="Edit Personalfragebogen"
                              className="p-2 rounded-xl bg-gradient-to-r from-yellow-100 to-yellow-300 text-yellow-700 shadow hover:scale-110 transition flex items-center justify-center"
                              disabled={loading}
                            >
                              <FaEdit />
                            </button>
                          </div>
                        </td>
                      );
                    } else if (col.isSpecial === 'erklaerung_formular') {
                      return (
                        <td key={col.key} className={`px-3 py-2 ${col.className || ''}`}>
                          <div className="flex gap-2">
                            <button
                              className="p-2 rounded-xl bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 shadow hover:scale-110 transition flex items-center justify-center"
                              title="Download Erklärung Formular"
                              onClick={() => handleOfficialDownload(emp)}
                              disabled={loading}
                            >
                              <FaDownload />
                            </button>
                            <button
                              onClick={() => navigate(`/employees/${emp.id}/erklaerung-form`)}
                              title="Edit Erklärung Formular"
                              className="p-2 rounded-xl bg-gradient-to-r from-yellow-100 to-yellow-300 text-yellow-700 shadow hover:scale-110 transition flex items-center justify-center"
                              disabled={loading}
                            >
                              <FaEdit />
                            </button>
                          </div>
                        </td>
                      );
                    } else if (col.isSpecial === 'einkommensbescheinigung') {
                      return (
                        <td key={col.key} className={`px-3 py-2 ${col.className || ''}`}>
                          <button
                            className="p-2 rounded-xl bg-gradient-to-r from-green-100 to-blue-100 text-green-700 shadow hover:scale-110 transition flex items-center justify-center"
                            title="Einkommensbescheinigung anzeigen"
                            onClick={() => navigate(`/einkommensbescheinigung?employeeId=${emp.id}`)}
                          >
                            <FaFilePdf className="w-5 h-5" />
                          </button>
                        </td>
                      );
                    } else {
                      return editingId === emp.id ? (
                        <td key={col.key} className={`px-3 py-2 align-top ${col.className || ''} group-hover:bg-cyan-50/60 transition rounded-xl`.trim()}>
                          <input
                            name={col.key}
                            value={editForm[col.key] ?? ''}
                            onChange={handleEditChange}
                            className="px-2 py-1 rounded-lg border border-blue-200 w-full bg-white/90 shadow text-sm font-medium focus:ring-2 focus:ring-cyan-400"
                            style={{ minWidth: 0 }}
                          />
                        </td>
                      ) : (
                        <td
                          key={col.key}
                          className={`px-3 py-2 text-blue-900 max-w-[140px] truncate cursor-pointer group-hover:bg-cyan-50/60 transition rounded-xl text-sm font-medium ${col.className || ''}`.trim()}
                          title={emp[col.key] ?? ''}
                          onClick={() => startEdit(emp)}
                        >
                          {emp[col.key] ?? ''}
                        </td>
                      );
                    }
                  })}
                  <td className="px-3 py-2 flex gap-2 items-center justify-center group-hover:bg-cyan-50/60 transition rounded-xl">
                    {editingId === emp.id ? (
                      <>
                        <button onClick={saveEdit} title="Save" className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow hover:scale-110 transition flex items-center justify-center" disabled={loading}><FaCheck /></button>
                        <button onClick={cancelEdit} title="Cancel" className="p-2 rounded-xl bg-gray-200 text-blue-700 shadow hover:bg-gray-300 transition flex items-center justify-center" disabled={loading}><FaTimes /></button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmDelete({ open: true, id: emp.id })} title="Delete" className="p-2 rounded-xl bg-gradient-to-r from-red-100 to-pink-100 text-red-600 shadow hover:scale-110 transition flex items-center justify-center" disabled={loading}><FaTrash /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Card layout for mobile */}
      <div className="block md:hidden space-y-4 text-base">
        {loading ? (
          <div className="py-8 text-center text-blue-400 animate-pulse text-base">Loading...</div>
        ) : paginated.length === 0 ? (
          <div className="py-8 text-center text-blue-400 text-base">No employees found.</div>
        ) : paginated.map((emp, idx) => (
          <div key={emp.id} className="rounded-2xl shadow-xl border border-blue-100 bg-gradient-to-br from-white/90 via-blue-50/90 to-cyan-50/90 p-4 flex flex-col gap-2 hover:scale-[1.01] hover:shadow-2xl transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-blue-900 font-bold text-xl">{emp.vorname} {emp.geburtsname}</div>
              <div className="flex gap-2">
                {columns.filter(col => !col.isSpecial).map(col => (
                  <button
                    key={col.key}
                    className="p-2 rounded-xl bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 shadow hover:scale-110 transition flex items-center justify-center"
                    title={col.label}
                    onClick={() => startEdit(emp)}
                    disabled={loading}
                  >
                    {col.label}
                  </button>
                ))}
                {columns.filter(col => col.isSpecial).map(col => (
                  <div key={col.key} className="flex gap-2">
                    {col.isSpecial === 'personalfragebogen' && (
                      <>
                        <button
                          className="p-2 rounded-xl bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 shadow hover:scale-110 transition flex items-center justify-center"
                          title="Download Personalfragebogen"
                          onClick={() => handleDownload(emp)}
                          disabled={loading}
                        >
                          <FaDownload />
                        </button>
                        <button
                          onClick={() => navigate(`/employees/${emp.id}/edit`)}
                          title="Edit Personalfragebogen"
                          className="p-2 rounded-xl bg-gradient-to-r from-yellow-100 to-yellow-300 text-yellow-700 shadow hover:scale-110 transition flex items-center justify-center"
                          disabled={loading}
                        >
                          <FaEdit />
                        </button>
                      </>
                    )}
                    {col.isSpecial === 'erklaerung_formular' && (
                      <>
                        <button
                          className="p-2 rounded-xl bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 shadow hover:scale-110 transition flex items-center justify-center"
                          title="Download Erklärung Formular"
                          onClick={() => handleOfficialDownload(emp)}
                          disabled={loading}
                        >
                          <FaDownload />
                        </button>
                        <button
                          onClick={() => navigate(`/employees/${emp.id}/erklaerung-form`)}
                          title="Edit Erklärung Formular"
                          className="p-2 rounded-xl bg-gradient-to-r from-yellow-100 to-yellow-300 text-yellow-700 shadow hover:scale-110 transition flex items-center justify-center"
                          disabled={loading}
                        >
                          <FaEdit />
                        </button>
                      </>
                    )}
                    {col.isSpecial === 'einkommensbescheinigung' && (
                      <button
                        className="p-2 rounded-xl bg-gradient-to-r from-green-100 to-blue-100 text-green-700 shadow hover:scale-110 transition flex items-center justify-center"
                        title="Einkommensbescheinigung anzeigen"
                        onClick={() => navigate(`/einkommensbescheinigung?employeeId=${emp.id}`)}
                      >
                        <FaFilePdf className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                {editingId === emp.id ? (
                  <>
                    <button onClick={saveEdit} title="Save" className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow hover:scale-110 transition flex items-center justify-center" disabled={loading}><FaCheck /></button>
                    <button onClick={cancelEdit} title="Cancel" className="p-2 rounded-xl bg-gray-200 text-blue-700 shadow hover:bg-gray-300 transition flex items-center justify-center" disabled={loading}><FaTimes /></button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDelete({ open: true, id: emp.id })} title="Delete" className="p-2 rounded-xl bg-gradient-to-r from-red-100 to-pink-100 text-red-600 shadow hover:scale-110 transition flex items-center justify-center" disabled={loading}><FaTrash /></button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {columns.filter(col => !col.isSpecial).map(col => (
                <div key={col.key} className="flex flex-col">
                  <span className="text-blue-400 font-semibold">{col.label}</span>
                  <span className="text-blue-900 font-medium truncate">{emp[col.key] ?? ''}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Pagination */}
      <div className="flex justify-between items-center mt-6 px-1">
        <div className="text-blue-700 text-sm font-semibold">
          Page {page} of {totalPages} <span className="text-blue-400 font-normal">({filtered.length} employees)</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold shadow hover:bg-blue-200 transition disabled:opacity-50 flex items-center gap-2 text-sm"
            aria-label="Previous page"
          >
            <FaChevronLeft />
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-xl bg-blue-100 text-blue-700 font-bold shadow hover:bg-blue-200 transition disabled:opacity-50 flex items-center gap-2 text-sm"
            aria-label="Next page"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>
      {/* Add Employee Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/40 backdrop-blur-xl animate-fade-in">
          <form onSubmit={handleSubmit} className="bg-gradient-to-br from-white/90 via-blue-50/90 to-cyan-50/90 rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-blue-100 flex flex-col gap-6 animate-fade-in relative">
            <button type="button" onClick={closeModal} className="absolute top-4 right-4 text-blue-400 hover:text-blue-700 text-2xl"><FaTimes /></button>
            <h3 className="text-xl font-extrabold text-blue-900 mb-2 text-center">Add Employee by Scanning ID</h3>
            <input type="file" accept="image/*" onChange={handleFileChange} required className="px-4 py-2 rounded-xl border border-blue-200 bg-white/80 text-blue-900 shadow text-sm" />
            <button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform text-base" disabled={loading}>Scan & Add</button>
          </form>
        </div>
      )}
      {/* Confirm Delete */}
      {confirmDelete.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/40 backdrop-blur-xl animate-fade-in">
          <div className="bg-gradient-to-br from-white/90 via-blue-50/90 to-cyan-50/90 rounded-3xl shadow-2xl p-8 w-full max-w-xs border border-blue-100 flex flex-col gap-6 animate-fade-in">
            <div className="text-blue-900 font-extrabold text-lg text-center">Delete this employee?</div>
            <div className="flex gap-3 mt-2 justify-center">
              <button onClick={handleDelete} className="bg-gradient-to-r from-red-500 to-pink-400 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform text-base" disabled={loading}>Delete</button>
              <button onClick={() => setConfirmDelete({ open: false })} className="px-4 py-2 rounded-xl bg-blue-50 text-blue-500 font-bold shadow hover:bg-blue-100 transition text-base" disabled={loading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-3 rounded-2xl shadow-2xl font-bold text-white text-base ${toast.type === 'success' ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-gradient-to-r from-red-500 to-pink-400'} animate-fade-in`} style={{ boxShadow: '0 4px 24px 0 rgba(56,189,248,0.10)' }}>{toast.message}</div>
      )}
        </>
      )}
    </div>
  );
} 