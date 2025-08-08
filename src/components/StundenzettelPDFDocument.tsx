import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';

// Helper to get weekday short name in German
const weekdayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function getDaysInMonth(year: number, month: number) {
  // month: 1-based (1=Jan)
  const days: { weekday: string; day: number }[] = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    days.push({
      weekday: weekdayNames[date.getDay()],
      day: date.getDate(),
    });
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const styles = StyleSheet.create({
  page: {
    paddingLeft: 48,
    paddingRight: 48,
    paddingTop: 32,
    paddingBottom: 32,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'column',
  },
  datevLogo: {
    width: 48,
    height: 48,
    marginLeft: 20,
    marginTop: 0,
  },
  title: {
    fontSize: 11,
    fontWeight: 'normal',
    color: '#111',
    marginBottom: 8,
    textAlign: 'left',
  },
  headerField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    width: 110,
    color: '#111',
    fontWeight: 'bold',
    fontSize: 10,
    textAlign: 'left',
  },
  input: {
    border: '1px solid #111',
    minWidth: 170,
    height: 18,
    paddingTop: 3,
    paddingLeft: 6,
    paddingRight: 2,
    marginLeft: 4,
    fontSize: 10,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  persnrInput: {
    border: '1px solid #111',
    minWidth: 80,
    height: 18,
    paddingTop: 3,
    paddingLeft: 6,
    marginLeft: 4,
    paddingRight: 2,
    fontSize: 10,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  monthLabel: {
    width: 60,
    color: '#111',
    fontWeight: 'bold',
    fontSize: 10,
    marginLeft: 12,
    marginRight: 2,
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
  },
  monthInput: {
    border: '1px solid #111',
    minWidth: 110,
    height: 18,
    paddingTop: 3,
    paddingLeft: 6,
    paddingRight: 2,
    marginLeft: 4,
    fontSize: 10,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  table: {
    width: 'auto',
    border: '1px solid #111',
    marginTop: 6,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#bdbdbd',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    minHeight: 22,
  },
  headerMainLabel: {
    fontWeight: 'bold',
    color: '#111',
    fontSize: 9,
    textAlign: 'center',
  },
  headerSubLabel: {
    fontWeight: 'normal',
    color: '#444',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 0,
    textDecoration: 'none',
  },
  cell: {
    borderRight: '1px solid #111',
    borderBottom: '1px solid #111',
    padding: 2,
    fontSize: 9,
    minHeight: 14,
    textAlign: 'center',
    flexGrow: 1,
    color: '#111',
    backgroundColor: '#fff',
  },
  cellFirst: {
    flexBasis: 45,
    flexGrow: 0,
    textAlign: 'left',
  },
  cellBemerk: {
    flexBasis: 90,
    flexGrow: 0,
    textAlign: 'left',
  },
  cellShort: {
    flexBasis: 30,
    flexGrow: 0,
  },
  cellSum: {
    flexBasis: 45,
    flexGrow: 0,
  },
});

// Change Props type
type Employee = {
  companyName: string;
  employeeName: string;
  employeeNumber: string;
  entries?: {
    [day: string]: {
      beginn?: string;
      pause?: string;
      ende?: string;
      dauer?: string;
      code?: string;
      aufgezeichnet_am?: string;
      bemerkungen?: string;
    }
  };
  arbeitszeitVerteilung?: string;
};

type Props = {
  employees: Employee[];
  month: number;
  year: number;
  holidays?: { [month: number]: { [day: string]: true } };
};

const monthNames = [
  '',
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

export const StundenzettelPDFDocument: React.FC<Props> = ({
  employees,
  month,
  year,
  holidays = {},
}) => {
  return (
    <Document>
      {employees.map((emp, idx) => {
        const days = getDaysInMonth(year, month);
        // Parse arbeitszeitVerteilung string to { [weekday]: dauerMinutes }
        const verteilung: { [weekday: string]: number } = {};
        (emp.arbeitszeitVerteilung || '').split(',').forEach(part => {
          const [w, min] = part.split(':');
          if (w && min) verteilung[w.trim()] = parseInt(min.trim(), 10);
        });
        function minToHHMM(mins: number) {
          if (!mins || isNaN(mins) || mins === 0) return '-';
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          return `${h > 0 ? h + ':' : '0:'}${m.toString().padStart(2, '0')}`;
        }
        return (
          <Page size="A4" style={styles.page} key={emp.employeeNumber + '-' + month}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Text style={styles.title}>
                  Vorlage zur Dokumentation der täglichen Arbeitszeit
                </Text>
                <View style={styles.headerField}>
                  <Text style={styles.label}>Firma:</Text>
                  <Text style={styles.input}>{emp.companyName}</Text>
                </View>
                <View style={styles.headerField}>
                  <Text style={styles.label}>Name des Mitarbeiters:</Text>
                  <Text style={styles.input}>{emp.employeeName}</Text>
                </View>
                <View style={styles.monthRow}>
                  <Text style={styles.label}>Pers.-Nr.:</Text>
                  <Text style={styles.persnrInput}>{emp.employeeNumber}</Text>
                  <Text style={styles.monthLabel}>Monat/Jahr:</Text>
                  <Text style={styles.monthInput}>
                    {monthNames[month]} {year}
                  </Text>
                </View>
              </View>
              <Image style={styles.datevLogo} src="/pdf-assets/logo.png" />
            </View>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}> {/* Header row */}
                <View style={[styles.cell, styles.cellFirst, { alignItems: 'flex-start', justifyContent: 'center' }]}> 
                  <Text style={{ color: '#111', fontSize: 10, textAlign: 'left', fontWeight: 'normal' }}>Kalendertag</Text> 
                </View>
                <View style={[styles.cell,styles.cellSum, { alignItems: 'center', justifyContent: 'center' }]}> 
                  <Text style={{ color: '#111', fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>Beginn</Text>
                  <Text style={{ color: '#444', fontSize: 8, textAlign: 'center', fontWeight: 'normal', textDecoration: 'none' }}>(Uhrzeit)</Text>
                </View>
                <View style={[styles.cell,styles.cellSum, { alignItems: 'center', justifyContent: 'center' }]}> 
                  <Text style={{ color: '#111', fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>Pause</Text>
                  <Text style={{ color: '#444', fontSize: 8, textAlign: 'center', fontWeight: 'normal', textDecoration: 'none' }}>(Dauer)</Text>
                </View>
                <View style={[styles.cell,styles.cellSum, { alignItems: 'center', justifyContent: 'center' }]}> 
                  <Text style={{ color: '#111', fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>Ende</Text>
                  <Text style={{ color: '#444', fontSize: 8, textAlign: 'center', fontWeight: 'normal', textDecoration: 'none' }}>(Uhrzeit)</Text>
                </View>
                <View style={[styles.cell, styles.cellSum, { alignItems: 'center', justifyContent: 'center' }]}> 
                  <Text style={{ color: '#111', fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>Dauer</Text>
                  <Text style={{ color: '#444', fontSize: 8, textAlign: 'center', fontWeight: 'normal', textDecoration: 'none' }}>(Summe)</Text>
                </View>
                <View style={[styles.cell, styles.cellShort, { alignItems: 'center', justifyContent: 'center' }]}> 
                  <Text style={{ color: '#111', fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>*</Text> 
                </View>
                <View style={[styles.cell,styles.cellBemerk, { alignItems: 'center', justifyContent: 'center' }]}> 
                  <Text style={{ color: '#111', fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>aufgezeichnet</Text>
                  <Text style={{ color: '#111', fontSize: 10, textAlign: 'center', fontWeight: 'normal' }}>am:</Text>
                </View>
                <View style={[styles.cell, { alignItems: 'center', justifyContent: 'center' }]}> 
                  <Text style={{ color: '#111', fontSize: 10, textAlign: 'center', fontWeight: 'bold' }}>Bemerkungen</Text> 
                </View>
              </View>
              {days.map(({ weekday, day }) => {
                const entry = emp.entries?.[day.toString().padStart(2, '0')] || {};
                const isSunday = weekday === 'So';
                const isHoliday = holidays[month]?.[day.toString().padStart(2, '0')];
                let beginn = '';
                let pause = '';
                let ende = '';
                let dauer = '';
                let code = entry.code;
                let aufgezeichnet_am = entry.aufgezeichnet_am;
                let bemerkungen = entry.bemerkungen;
                if (isSunday || isHoliday) {
                  code = isHoliday ? 'F' : '';
                  aufgezeichnet_am = '';
                  bemerkungen = '';
                } else {
                  beginn = '08:30';
                  pause = '1:00';
                  dauer = entry.dauer || '';
                  // Calculate Ende if Dauer is present and in H:MM or HH:MM format
                  if (dauer && /^\d{1,2}:\d{2}$/.test(dauer)) {
                    // Beginn + Pause + Dauer
                    const [bh, bm] = beginn.split(':').map(Number);
                    const [ph, pm] = pause.split(':').map(Number);
                    const [dh, dm] = dauer.split(':').map(Number);
                    let totalMin = (bh * 60 + bm) + (ph * 60 + pm) + (dh * 60 + dm);
                    let eh = Math.floor(totalMin / 60);
                    let em = totalMin % 60;
                    ende = `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;
                  } else {
                    ende = '';
                  }
                }
                return (
                  <View style={styles.tableRow} key={day}>
                    <View style={[styles.cell, styles.cellFirst, { alignItems: 'flex-start', justifyContent: 'center' }]}> 
                      <Text style={{ textAlign: 'left' }}>{`${weekday}, ${day.toString().padStart(2, '0')}`}</Text>
                    </View>
                    <View style={[styles.cell, styles.cellSum, { alignItems: 'center', justifyContent: 'center' }]}> 
                      <Text>{beginn}</Text>
                    </View>
                    <View style={[styles.cell, styles.cellSum, { alignItems: 'center', justifyContent: 'center' }]}> 
                      <Text>{pause}</Text>
                    </View>
                    <View style={[styles.cell, styles.cellSum, { alignItems: 'center', justifyContent: 'center' }]}> 
                      <Text>{ende}</Text>
                    </View>
                    <View style={[styles.cell, styles.cellSum, { alignItems: 'center', justifyContent: 'center' }]}> 
                      <Text>{dauer}</Text>
                    </View>
                    <View style={[styles.cell, styles.cellShort, { alignItems: 'center', justifyContent: 'center' }]}> 
                      <Text>{code || ''}</Text>
                    </View>
                    <View style={[styles.cell, styles.cellBemerk, { alignItems: 'center', justifyContent: 'center' }]}> 
                      <Text>{aufgezeichnet_am || ''}</Text>
                    </View>
                    <View style={[styles.cell, { alignItems: 'center', justifyContent: 'center' }]}> 
                      <Text>{bemerkungen || ''}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            {/* Signature and Legend Section - EXACT MATCH TO REFERENCE */}
            <View style={{ marginTop: 18, minHeight: 120, position: 'relative', marginLeft: 48, marginRight: 48 }}>
              {/* Summe and double underline, centered */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 25 }}>
                <Text style={{ fontSize: 10, marginRight: 8 }}>Summe:</Text>
                <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                  <View style={{ borderBottom: '2px solid #111', width: 48, marginBottom: 1 }} />
                  <View style={{ borderBottom: '1px solid #111', width: 48 }} />
                </View>
              </View>
              {/* Signature lines, both on the same row, centered */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 2 }}>
                <View style={{ flexDirection: 'column', alignItems: 'center', marginRight: 60 }}>
                  <View style={{ borderBottom: '1.2px solid #111', width: 220, marginBottom: 2 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 220 }}>
                    <Text style={{ fontSize: 9, width: 60, textAlign: 'center' }}>Datum</Text>
                    <Text style={{ fontSize: 9, width: 160, textAlign: 'center' }}>Unterschrift des Arbeitnehmers</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'column', alignItems: 'center', marginLeft: 60 }}>
                  <View style={{ borderBottom: '1.2px solid #111', width: 220, marginBottom: 2 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 220 }}>
                    <Text style={{ fontSize: 9, width: 60, textAlign: 'center' }}>Datum</Text>
                    <Text style={{ fontSize: 9, width: 160, textAlign: 'center' }}>Unterschrift des Arbeitgebers</Text>
                  </View>
                </View>
              </View>
              {/* Explanation text, left-aligned */}
              <View style={{ marginTop: 8, marginBottom: 2, flexDirection: 'row', justifyContent: 'flex-start' }}>
                <Text style={{ fontSize: 9, textAlign: 'left', maxWidth: 420 }}>* Tragen Sie in diese Spalte eines der folgenden Kürzel ein, wenn es für diesen Kalendertag zutrifft:</Text>
              </View>
              {/* Legend group, centered horizontally, SMALLER */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', marginTop: 2 }}>
                {/* Legend box - smaller */}
                <View style={{ width: 70, height: 70, backgroundColor: '#bdbdbd', border: '1px solid #111', alignItems: 'center', justifyContent: 'center', display: 'flex', marginRight: 12 }}>
                  <Text style={{ fontSize: 10, color: '#444', textAlign: 'center' }}>Schlüssel</Text>
                </View>
                {/* Legend list - smaller */}
                <View style={{ flexDirection: 'column', justifyContent: 'flex-start', marginLeft: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', height: 13 }}>
                    <Text style={{ fontSize: 8, width: 16 }}>K</Text>
                    <Text style={{ fontSize: 8, marginLeft: 2 }}>Krank</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', height: 13 }}>
                    <Text style={{ fontSize: 8, width: 16 }}>U</Text>
                    <Text style={{ fontSize: 8, marginLeft: 2 }}>Urlaub</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', height: 13 }}>
                    <Text style={{ fontSize: 8, width: 16 }}>UU</Text>
                    <Text style={{ fontSize: 8, marginLeft: 2 }}>unbezahlter Urlaub</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', height: 13 }}>
                    <Text style={{ fontSize: 8, width: 16 }}>F</Text>
                    <Text style={{ fontSize: 8, marginLeft: 2 }}>Feiertag</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', height: 13 }}>
                    <Text style={{ fontSize: 8, width: 16 }}>SA</Text>
                    <Text style={{ fontSize: 8, marginLeft: 2 }}>Stundenweise abwesend</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', height: 13 }}>
                    <Text style={{ fontSize: 8, width: 16 }}>SU</Text>
                    <Text style={{ fontSize: 8, marginLeft: 2 }}>Stundenweise Urlaub</Text>
                  </View>
                </View>
              </View>
            </View>
            {/* Footer, always at the physical bottom of the page */}
            <View fixed style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 8, marginLeft: 48, marginRight: 48  }}>
              <Text style={{ fontSize: 8 }}>© DATEV eG 2015, alle Rechte vorbehalten</Text>
              <Text style={{ fontSize: 8 }}>Stand 01/2015</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}; 