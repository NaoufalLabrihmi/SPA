import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import qr2 from '../assets/pdf/qr2.png';
import footerlogo from '../assets/pdf/footerlogo.png';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    paddingLeft: 48,
    paddingRight: 48,
    paddingTop: 24,
    paddingBottom: 24,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#111',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'light',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  qrBox: {
    width: 60,
    height: 60,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  pageNum: {
    fontSize: 12,
    fontWeight: 'light',
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 4,
  },
  label: {
    fontSize: 8,
    marginBottom: 2,
  },
  underline: {
    borderBottom: '1px solid #888',
    minWidth: 120,
    height: 14,
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 7,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  bold: {
    fontWeight: 'bold',
  },
  box: {
    border: '1px solid #888',
    borderRadius: 2,
    marginBottom: 10,
  },
  boxHeader: {
    backgroundColor: '#f3f3f3',
    borderBottom: '1px solid #888',
    fontWeight: 'bold',
    fontSize: 8,
    padding: 4,
  },
  boxContent: {
    padding: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCol: {
    width: '30%',
    marginBottom: 6,
  },
  gridColWide: {
    width: '65%',
    marginBottom: 6,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  italic: {
    color: '#aaa',
    fontStyle: 'italic',
    marginTop: 6,
  },
  sectionNum: {
    fontWeight: 'bold',
    fontSize: 8,
    marginRight: 4,
  },
  orangeHeader: {
    backgroundColor: '#f7b366',
    color: '#222',
    fontWeight: 'bold',
    fontSize: 8,
    padding: 4,
    borderBottom: '1px solid #888',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    fontSize: 7,
    color: '#222',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerRight: {
    fontSize: 8,
  },
  small: {
    fontSize: 5,
  },
  checkbox: {
    width: 10,
    height: 10,
    border: '1px solid #222',
    marginRight: 2,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
  },
  checkmark: {
    fontSize: 5,
    textAlign: 'center',
    marginTop: -1,
  },
});

const checkboxStyle = StyleSheet.create({
  box: {
    border: '1px solid #888',
    width: 14,
    height: 14,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxWithMargin: {
    border: '1px solid #888',
    width: 14,
    height: 14,
    marginLeft: 8,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: -1,
  },
});

interface EinkommensbescheinigungPDFDocumentProps {
  employee?: any;
  eintritt?: string;
  stkl?: string;
  krankenkasse?: string;
  arbeitszeit_stunden?: string;
  monatlichGleich?: 'Ja' | 'Nein' | '';
  branche?: string;
  entgeltMonate?: any[];
  company?: any;
}

const formatEuro = (val: any, fallback = '') => {
  if (val === null || val === undefined || val === '') return fallback;
  const num = typeof val === 'number' ? val : parseFloat((val + '').replace(',', '.'));
  if (isNaN(num)) return fallback;
  return num.toFixed(2).replace('.', ',');
};

const EinkommensbescheinigungPDFDocument: React.FC<EinkommensbescheinigungPDFDocumentProps> = ({
  employee,
  eintritt,
  stkl,
  krankenkasse,
  arbeitszeit_stunden,
  monatlichGleich,
  branche,
  entgeltMonate = [],
  company,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Einkommensbescheinigung</Text>
            <Text style={styles.subtitle}>- Nachweis über die Höhe des Arbeitsentgelts -</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Image src={qr2} style={{ width: 60, height: 60, objectFit: 'contain' }} />
          </View>
        </View>
        {/* Warning Message */}
        <View style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: 4, 
          padding: 8, 
          marginBottom: 12,
          borderLeft: '4px solid #f39c12'
        }}>
          <Text style={{ 
            fontSize: 8, 
            fontWeight: 'bold', 
            color: '#856404',
            marginBottom: 2
          }}>
            ⚠️ WICHTIGER HINWEIS:
          </Text>
          <Text style={{ 
            fontSize: 7, 
            color: '#856404',
            lineHeight: 1.2
          }}>
            Bitte überprüfen Sie alle extrahierten Daten sorgfältig, bevor Sie diese Einkommensbescheinigung oder den Personalfragebogen verwenden. 
            Die automatische Extraktion kann Fehler enthalten. Vergewissern Sie sich, dass alle Angaben korrekt sind.
          </Text>
        </View>
        {/* Kundennummer & Bedarfsgemeinschaft */}
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Kundennummer:</Text>
            <View style={styles.underline}></View>
          </View>
          <View>
            <Text style={styles.label}>Nummer der Bedarfsgemeinschaft:</Text>
            <View style={styles.underline}><Text style={{ fontSize: 10 }}>07402//0094744</Text></View>
          </View>
        </View>
        {/* Vom Arbeitgeber auszufüllen */}
        <Text style={styles.sectionTitle}>Vom Arbeitgeber auszufüllen</Text>
        <Text style={styles.infoText}>
          Diese Einkommensbescheinigung stellt eine Urkunde dar, zu deren Ausstellung der Arbeitgeber auf Verlangen der Agentur für Arbeit oder des Jobcenters verpflichtet ist (§§ 57, 58 und 60 Abs. 3 Zweites Buch Sozialgesetzbuch (SGB II)). Wer die Art oder Dauer der Erwerbstätigkeit oder die Höhe des Arbeitsentgelts oder der Vergütung nicht, nicht richtig, nicht vollständig oder nicht rechtzeitig mitteilt oder eine Bescheinigung nicht oder nicht rechtzeitig aushändigt, handelt ordnungswidrig (§ 63 Absatz 1 Nrn. 1, 2, und 4 SGB II i. V. m. § 63 Abs. 1a SGB II). Außerdem ist sie/er dem zuständigen Leistungsträger zum Ersatz des daraus entstandenen Schadens verpflichtet (§ 62 SGB II). <Text style={styles.bold}>Eine unvollständig ausgefüllte Einkommensbescheinigung erfordert Rückfragen oder eine Rückgabe zur Ergänzung.</Text> Achten Sie deshalb bitte darauf, dass alle Felder ausgefüllt werden. Die Hinweise bei den Fragen sollen Ihnen das Ausfüllen erleichtern. Etwaige Änderungen oder Ergänzungen der Eintragungen bestätigen Sie bitte mit Unterschrift. Diese Bescheinigung finden Sie auch im Internet unter www.jobcenter.digital.
        </Text>
        {/* Section 1: Angaben zu den persönlichen Daten */}
        <View style={styles.box}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 6 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 10, marginRight: 6 }}>1.</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 10 }}>
              Angaben zu den persönlichen Daten der Arbeitnehmerin/des Arbeitnehmers
            </Text>
          </View>
          <View style={{ padding: 12, paddingBottom: 8 }}>
            {/* First row: Vorname, Familienname, Geburtsdatum */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                <Text>Vorname</Text>
                <View style={{ minWidth: 12 }} />
                <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 8 }}>{employee?.vorname || ''}</Text>
                </View>
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                <Text>Familienname</Text>
                <View style={{ minWidth: 12 }} />
                <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 8 }}>{employee?.geburtsname || ''}</Text>
                </View>
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <Text>Geburtsdatum</Text>
                <View style={{ minWidth: 12 }} />
                <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 8 }}>{employee?.geburtsdatum || ''}</Text>
                </View>
              </View>
            </View>
            {/* Second row: Straße, Hausnummer */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text>Straße, Hausnummer</Text>
              <View style={{ minWidth: 12 }} />
              <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}>{employee?.strasse_hausnummer || ''}</Text>
              </View>
            </View>
            {/* Third row: Anschriftenzusatz */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text>Anschriftenzusatz</Text>
              <View style={{ minWidth: 12 }} />
              <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}>{employee?.anschriftenzusatz || ''}</Text>
              </View>
            </View>
            {/* Fourth row: Postleitzahl, Wohnort */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                <Text>Postleitzahl</Text>
                <View style={{ maxWidth: 7 }} />
                <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 8 }}>{employee?.plz_ort ? (employee.plz_ort.split(' ')[0] || '') : ''}</Text>
                </View>
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <Text>Wohnort</Text>
                <View style={{ minWidth: 12 }} />
                <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 8 }}>{employee?.plz_ort ? (employee.plz_ort.split(' ').slice(1).join(' ') || '') : ''}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        {/* Section 2: Angaben zum Beschäftigungsverhältnis */}
        <View style={styles.box}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 6 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 10, marginRight: 6 }}>2.</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 10 }}>
              Angaben zum Beschäftigungsverhältnis
            </Text>
          </View>
          <View style={{ padding: 12, paddingBottom: 8 }}>
            {/* 2.1 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text>2.1 Die Auszahlung ist/war jeweils fällig am</Text>
              <View style={{ minWidth: 10 }} />
              <View style={{ borderBottom: '1px solid #888', width: 80, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}></Text>
              </View>
              <View style={{ minWidth: 10 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* des laufenden Monats: unchecked */}
                <View style={{ border: '1px solid #888', width: 12, height: 12, marginRight: 2, alignItems: 'center', justifyContent: 'center' }} />
                <Text>des laufenden Monats</Text>
                <View style={{ minWidth: 8 }} />
                {/* des Folgemonats: checked */}
                <View style={{ border: '1px solid #888', width: 12, height: 12, marginRight: 2, marginLeft: 8, alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
                  <Text style={{ fontSize: 10, textAlign: 'center', marginTop: -2 }}>X</Text>
                </View>
                <Text>des Folgemonats</Text>
              </View>
            </View>
            {/* 2.2 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
              <Text>2.2 Das Einkommen ist monatlich gleich hoch</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={checkboxStyle.box}>
                  {monatlichGleich === 'Ja' && <Text style={checkboxStyle.checkmark}>X</Text>}
                </View>
                <Text>Ja</Text>
                <View style={{ minWidth: 8 }} />
                <View style={checkboxStyle.boxWithMargin}>
                  {monatlichGleich === 'Nein' && <Text style={checkboxStyle.checkmark}>X</Text>}
                </View>
                <Text>Nein</Text>
              </View>
            </View>
            {/* 2.3 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text>2.3 Die Beschäftigung wird ausgeübt seit</Text>
              <View style={{ minWidth: 10 }} />
              <View style={{ borderBottom: '1px solid #888', width: 80, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}>{eintritt || ''}</Text>
              </View>
              <Text> ; gegebenenfalls bis</Text>
              <View style={{ minWidth: 10 }} />
              <View style={{ borderBottom: '1px solid #888', width: 80, height: 14, marginLeft: 4 }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text>Falls zutreffend, geben Sie bitte den Kündigungsgrund an:</Text>
              <View style={{ minWidth: 10 }} />
              <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4 }} />
            </View>
            {/* 2.4 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text>2.4 Die tatsächliche wöchentliche Arbeitszeit beträgt</Text>
              <View style={{ minWidth: 10 }} />
              <View style={{ borderBottom: '1px solid #888', width: 40, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}>{arbeitszeit_stunden || ''}</Text>
              </View>
              <Text> Stunden</Text>
            </View>
            {/* 2.5 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text>2.5 Maßgebliche Lohnsteuerklasse</Text>
              <View style={{ minWidth: 10 }} />
              <View style={{ borderBottom: '1px solid #888', width: 20, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}>{stkl || ''}</Text>
              </View>
              <Text> Kinderfreibetrag</Text>
              <View style={{ minWidth: 10 }} />
              <View style={{ borderBottom: '1px solid #888', width: 40, height: 14, marginLeft: 4 }} />
            </View>
            {/* 2.6 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text>2.6 Zuständige Krankenkasse</Text>
              <View style={{ minWidth: 10 }} />
              <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}>{krankenkasse || ''}</Text>
              </View>
            </View>
            {/* 2.7 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
              <Text>2.7 Tarifzugehörigkeit</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ border: '1px solid #888', width: 12, height: 12, marginRight: 2 }} />
                <Text>Ja</Text>
                <View style={{ minWidth: 8 }} />
                <View style={{ border: '1px solid #888', width: 12, height: 12, marginRight: 2, marginLeft: 8 }} />
                <Text>Nein</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text>Wenn ja, geben Sie bitte den Tarifvertrag an:</Text>
              <View style={{ minWidth: 10 }} />
              <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4 }} />
            </View>
            {/* 2.8 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text>2.8 Branche</Text>
              <View style={{ minWidth: 10 }} />
              <View style={{ borderBottom: '1px solid #888', width: 80, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}>{branche || ''}</Text>
              </View>
              <Text> Bezeichnung der ausgeübtenTätigkeit</Text>
              <View style={{ minWidth: 10 }} />
              <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4 }} />
            </View>
            {/* 2.9 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
              <Text>2.9 Gewährung von freier Verpflegung</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ border: '1px solid #888', width: 12, height: 12, marginRight: 2 }} />
                <Text>Ja</Text>
                <View style={{ minWidth: 8 }} />
                <View style={{ border: '1px solid #888', width: 12, height: 12, marginRight: 2, marginLeft: 8 }} />
                <Text>Nein</Text>
              </View>
            </View>
            {/* Mahlzeiten Ja/Nein */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text>Wenn ja, geben Sie bitte die Mahlzeiten an</Text>
                <View style={{ minWidth: 10 }} />
                <View style={{ border: '1px solid #888', width: 12, height: 12, marginRight: 2 }} />
                <Text>Frühstück</Text>
                <View style={{ minWidth: 8 }} />
                <View style={{ border: '1px solid #888', width: 12, height: 12, marginRight: 2, marginLeft: 8 }} />
                <Text>Mittagessen</Text>
                <View style={{ minWidth: 8 }} />
                <View style={{ border: '1px solid #888', width: 12, height: 12, marginRight: 2, marginLeft: 8 }} />
                <Text>Abendessen</Text>
              </View>
            </View>
          </View>
        </View>
        {/* Section 3: Feld für ergänzende Hinweise */}
        <View style={styles.box}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 6 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 10, marginRight: 6 }}>3.</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 10 }}>Feld für ergänzende Hinweise</Text>
          </View>
          <View style={{ minHeight: 36 }} />
        </View>
        {/* Page break before footer to avoid overlap */}
        <View break />
        {/* Footer */}
        <View fixed style={{ position: 'absolute', left: 0, right: 0, bottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 48, marginRight: 48 }}>
          <Image src={footerlogo} style={{ width: 120, height: 40, objectFit: 'contain' }} />
          <Text style={styles.footerRight} render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`} />
        </View>
        {/* Section 4: Für Rückfragen und Schriftwechsel */}
        <View style={styles.box}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 6 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 10, marginRight: 6 }}>4.</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 10 }}>Für Rückfragen und Schriftwechsel</Text>
          </View>
          <View style={{ padding: 12, paddingBottom: 8 }}>
            {/* Name des Arbeitgebers */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text>Name des Arbeitgebers</Text>
              <View style={{ minWidth: 12 }} />
              <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}>{company?.name || ''}</Text>
              </View>
            </View>
            {/* Anschrift des Arbeitgebers */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text>Anschrift des Arbeitgebers</Text>
              <View style={{ minWidth: 12 }} />
              <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}>{company ? `${company.street || ''}, ${company.postal_code || ''} ${company.city || ''}`.trim() : ''}</Text>
              </View>
            </View>
            {/* Ansprechpartner/in */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text>Ansprechpartner/in</Text>
              <View style={{ minWidth: 12 }} />
              <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}>{company?.contact_person || ''}</Text>
              </View>
            </View>
            {/* Telefonnummer */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text>Telefonnummer</Text>
              <View style={{ minWidth: 12 }} />
              <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}>{company?.phone || ''}</Text>
              </View>
            </View>
            {/* Geschäftszeichen */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text>Geschäftszeichen</Text>
              <View style={{ minWidth: 12 }} />
              <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}>{company?.reference || ''}</Text>
              </View>
            </View>
            {/* Betriebsnummer des Arbeitgebers */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text>Betriebsnummer des Arbeitgebers</Text>
              <View style={{ minWidth: 12 }} />
              <View style={{ borderBottom: '1px solid #888', flex: 1, height: 14, marginLeft: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}>{company?.company_number || ''}</Text>
              </View>
            </View>
            {/* Wichtig note */}
            <Text style={{ fontSize: 5, marginTop: 2 }}>
              <Text style={{ fontWeight: 'bold' }}>Wichtig:</Text> Es ist die Betriebsnummer einzutragen, unter der die Arbeitnehmerin/der Arbeitnehmer nach § 28a SGB IV bei der Einzugsstelle gemeldet worden ist.
            </Text>
          </View>
        </View>
        {/* Section 5: Angaben zum laufenden Arbeitsentgelt in Euro */}
        <View style={{ border: '1px solid #888', marginTop: 16, marginBottom: 16 }}>
          {/* Orange header row */}
          <View style={{ flexDirection: 'row', borderBottom: '1px solid #888' }}>
            <View style={{ flex: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 4, flexWrap: 'nowrap' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 10 }}>
                5.  Angaben zum laufenden Arbeitsentgelt in Euro <Text style={{ fontWeight: 'normal', fontSize: 8 }}>(ohne Einmalzahlungen und Nachzahlungen)</Text>
              </Text>
            </View>
            <View style={{ flex: 5 }} />
          </View>
          {/* Months header row */}
          <View style={{ flexDirection: 'row', borderBottom: '1px solid #888' }}>
            <View style={{ flex: 2.5, backgroundColor: '#fff', borderRight: '1px solid #888', padding: 4 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 10 }}>Abrechnungsmonat</Text>
            </View>
            {entgeltMonate.map((m, i) => (
              <View key={i} style={{ flex: 1, borderRight: i < entgeltMonate.length-1 ? '1px solid #888' : undefined, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 10 }}>{(m.monat || '') + '.' + (m.jahr || '')}</Text>
              </View>
            ))}
          </View>
          {/* 5.1 Bruttoarbeitsentgelt (betrag) */}
          <View style={{ flexDirection: 'row', borderBottom: '1px solid #888' }}>
            <View style={{ flex: 2.5, borderRight: '1px solid #888', padding: 4 }}>
              <Text style={{fontSize: 8 }}>5.1 Bruttoarbeitsentgelt (ohne Einmalzahlungen und Nachzahlungen)</Text>
              <Text style={{ fontSize: 6, fontStyle: 'italic', marginTop: 2 }}>
                <Text style={{ fontWeight: 'bold' }}>Hinweis:</Text> Bitte beachten Sie hierzu die Ausfüllhinweise zu 5. Angaben zum laufenden Arbeitsentgelt.
              </Text>
            </View>
            {entgeltMonate.map((v,i) => (
              <View key={i} style={{ flex: 1, borderRight: i < entgeltMonate.length-1 ? '1px solid #888' : undefined, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                <Text style={{ fontSize: 10 }}>{formatEuro(v.betrag)}</Text>
              </View>
            ))}
          </View>
          {/* 5.2 darunter vermögenswirksame Leistungen (empty) */}
          <View style={{ flexDirection: 'row', borderBottom: '1px solid #888', minHeight: 24 }}>
            <View style={{ flex: 2.5, borderRight: '1px solid #888', padding: 4, justifyContent: 'center' }}>
              <Text style={{ fontSize: 8 }}>5.2 darunter vermögenswirksame Leistungen</Text>
            </View>
            {entgeltMonate.map((_,i) => (
              <View key={i} style={{ flex: 1, borderRight: i < entgeltMonate.length-1 ? '1px solid #888' : undefined, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                <Text style={{ fontSize: 10 }}></Text>
              </View>
            ))}
          </View>
          {/* 5.3 sozialversicherungspflichtiges Entgelt (kv_brutto) */}
          <View style={{ flexDirection: 'row', borderBottom: '1px solid #888', minHeight: 24 }}>
            <View style={{ flex: 2.5, borderRight: '1px solid #888', padding: 4, justifyContent: 'center' }}>
              <Text style={{ fontSize: 8 }}>5.3 falls zutreffend, sozialversicherungspflichtiges Entgelt (SV-Brutto; Regelungen des Übergangsbereiches beachten)</Text>
            </View>
            {entgeltMonate.map((v,i) => (
              <View key={i} style={{ flex: 1, borderRight: i < entgeltMonate.length-1 ? '1px solid #888' : undefined, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                <Text style={{ fontSize: 10 }}>{formatEuro(v.kv_brutto)}</Text>
              </View>
            ))}
          </View>
          {/* 5.4 Abzüge (sv_abzug) */}
          <View style={{ flexDirection: 'row', borderBottom: '1px solid #888', minHeight: 24 }}>
            <View style={{ flex: 2.5, borderRight: '1px solid #888', padding: 4, justifyContent: 'center' }}>
              <Text style={{ fontSize: 8 }}>5.4 Abzüge (Steuern, Pflichtbeiträge zur Sozialversicherung, Winterbeschäftigungsumlage)</Text>
              <Text style={{ fontSize: 6, fontStyle: 'italic', marginTop: 2 }}>
                <Text style={{ fontWeight: 'bold' }}>Hinweis:</Text> Beiträge für freiwillige oder private Versicherungen sind von der Arbeitnehmerin/dem Arbeitnehmer gesondert nachzuweisen.
              </Text>
            </View>
            {entgeltMonate.map((v,i) => (
              <View key={i} style={{ flex: 1, borderRight: i < entgeltMonate.length-1 ? '1px solid #888' : undefined, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                <Text style={{ fontSize: 10 }}>{formatEuro(v.sv_abzug)}</Text>
              </View>
            ))}
          </View>
          {/* 5.5 Beitragszuschuss (empty) */}
          <View style={{ flexDirection: 'row', borderBottom: '1px solid #888', minHeight: 24 }}>
            <View style={{ flex: 2.5, borderRight: '1px solid #888', padding: 4, justifyContent: 'center' }}>
              <Text style={{ fontSize: 8 }}>5.5 Bei freiwillig oder privat Versicherten: Beitragszuschuss des Arbeitgebers zur Sozialversicherung</Text>
            </View>
            {entgeltMonate.map((_,i) => (
              <View key={i} style={{ flex: 1, borderRight: i < entgeltMonate.length-1 ? '1px solid #888' : undefined, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                <Text style={{ fontSize: 10 }}>0,00</Text>
              </View>
            ))}
          </View>
          {/* 5.6 Nettoarbeitsentgelt (netto) */}
          <View style={{ flexDirection: 'row', borderBottom: '1px solid #888', minHeight: 24 }}>
            <View style={{ flex: 2.5, borderRight: '1px solid #888', padding: 4, justifyContent: 'center' }}>
              <Text style={{ fontSize: 8 }}>5.6 Nettoarbeitsentgelt (ohne Beitragszuschusses bei freiwilliger oder privater Versicherung)</Text>
            </View>
            {entgeltMonate.map((v,i) => (
              <View key={i} style={{ flex: 1, borderRight: i < entgeltMonate.length-1 ? '1px solid #888' : undefined, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                <Text style={{ fontSize: 10 }}>{formatEuro(v.netto)}</Text>
              </View>
            ))}
          </View>
          {/* 5.7 Vorschuss (empty) */}
          <View style={{ flexDirection: 'row', borderBottom: '1px solid #888', minHeight: 24 }}>
            <View style={{ flex: 2.5, borderRight: '1px solid #888', padding: 4, justifyContent: 'center' }}>
              <Text style={{ fontSize: 8 }}>5.7 falls zutreffend, im laufenden Arbeitsentgelt enthaltener Vorschuss</Text>
            </View>
            {entgeltMonate.map((_,i) => (
              <View key={i} style={{ flex: 1, borderRight: i < entgeltMonate.length-1 ? '1px solid #888' : undefined, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                <Text style={{ fontSize: 10 }}></Text>
              </View>
            ))}
          </View>
          {/* 5.8 Auszahlungsmonat Vorschuss (empty) */}
          <View style={{ flexDirection: 'row', borderBottom: '1px solid #888', minHeight: 24 }}>
            <View style={{ flex: 2.5, borderRight: '1px solid #888', padding: 4, justifyContent: 'center' }}>
              <Text style={{ fontSize: 8 }}>5.8 falls zutreffend, Auszahlungsmonat des Vorschusses</Text>
            </View>
            {entgeltMonate.map((_,i) => (
              <View key={i} style={{ flex: 1, borderRight: i < entgeltMonate.length-1 ? '1px solid #888' : undefined, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                <Text style={{ fontSize: 10 }}></Text>
              </View>
            ))}
          </View>
          {/* 5.9 Brutto-Stundenlohn (empty) */}
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 2.5, borderRight: '1px solid #888', padding: 4, justifyContent: 'center' }}>
              <Text style={{ fontSize: 8 }}>5.9 Höhe des Brutto-Stundenlohnes</Text>
            </View>
            {entgeltMonate.map((_,i) => (
              <View key={i} style={{ flex: 1, borderRight: i < entgeltMonate.length-1 ? '1px solid #888' : undefined, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                <Text style={{ fontSize: 10 }}>0,00</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Section 6 */}
        <View style={{ border: '1px solid #888', marginTop: 8, padding: 8 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 2 }}>6. Weitere laufende Leistungen</Text>
          <Text style={{ fontSize: 9, marginBottom: 6 }}>
            Weitere laufende Leistungen (die nicht im Brutto- und Nettoarbeitsentgelt enthalten sind: zum Beispiel Fahrtkostenerstattung, Saison-Kurzarbeitergeld, Kurzarbeitergeld, Zuschüsse zum Krankengeld, vom Arbeitgeber gezahltes Kindergeld)
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 }}>
            <Text style={{ fontSize: 9, marginRight: 4 }}>Art</Text>
            <View style={{ borderBottom: '1px solid #888', flex: 1, marginRight: 8, minWidth: 120 }} />
            <View style={{ borderBottom: '1px solid #888', width: 60, marginRight: 4, marginLeft: 16 }} />
            <Text style={{ fontSize: 9, marginRight: 2 }}>0,00</Text>
            <Text style={{ fontSize: 9 }}>Euro</Text>
          </View>
        </View>
        {/* Section 7 */}
        <View break style={{ border: '1px solid #888', marginTop: 8, padding: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 8, paddingBottom: 0 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 0 }}>7. Einmalzahlungen und Nachzahlungen</Text>
              <Text style={{ fontSize: 9, marginTop: 2, marginBottom: 0 }}>
                Im oben bescheinigten Zeitraum sind Einmalzahlungen (zum Beispiel 13. Monatsgehalt, Weihnachtsgeld, zusätzliches Urlaubsgeld) und/oder Nachzahlungen (zum Beispiel durch rückwirkende Tariferhöhungen, nachträgliche Berechnungen von Zuschlägen) angefallen oder diese fallen in den kommenden 12 Monaten an.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16, marginTop: 8 }}>
              <View style={{ width: 14, height: 14, border: '1px solid #888', marginRight: 4 }} />
              <Text style={{ fontSize: 8, marginRight: 10 }}>Ja</Text>
              <View style={{ width: 14, height: 14, border: '1px solid #888', marginRight: 4 }} />
              <Text style={{ fontSize: 8 }}>Nein</Text>
            </View>
          </View>
          {/* Table */}
          <View style={{ border: '1px solid #888', marginTop: 8, marginHorizontal: 8, marginBottom: 8 }}>
            {/* Table header */}
            <View style={{ flexDirection: 'row', borderBottom: '1px solid #888', backgroundColor: '#fff', minHeight: 32 }}>
              <View style={{ flex: 2.5, borderRight: '1px solid #888', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: 'normal', fontSize: 9 }}>Art der Zahlung</Text>
              </View>
              <View style={{ flex: 1.5, borderRight: '1px solid #888', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: 'normal', fontSize: 9 }}>Fälligkeit</Text>
              </View>
              <View style={{ flex: 1.5, borderRight: '1px solid #888', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: 'normal', fontSize: 9 }}>Bruttobetrag</Text>
                <Text style={{ fontWeight: 'normal', fontSize: 6 }}>(sofern bereits abgerechnet)</Text>
              </View>
              <View style={{ flex: 1.5, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: 'normal', fontSize: 9 }}>Nettobetrag</Text>
                <Text style={{ fontWeight: 'normal', fontSize: 6 }}>(sofern bereits abgerechnet)</Text>
              </View>
            </View>
            {/* Table rows */}
            {[0,1,2].map((row) => (
              <View key={row} style={{ flexDirection: 'row', borderBottom: row < 2 ? '1px solid #888' : undefined, minHeight: 28 }}>
                <View style={{ flex: 2.5, borderRight: '1px solid #888' }} />
                <View style={{ flex: 1.5, borderRight: '1px solid #888' }} />
                <View style={{ flex: 1.5, borderRight: '1px solid #888', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Text style={{ fontSize: 10, marginRight: 2 }}></Text>
                  <Text style={{ fontSize: 8 }}>Euro</Text>
                </View>
                <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Text style={{ fontSize: 10, marginRight: 2 }}></Text>
                  <Text style={{ fontSize: 8 }}>Euro</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        {/* Section 8 */}
        <View style={{ border: '1px solid #888', marginTop: 8, padding: 12 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 10 }}>8. Firmenstempel, Unterschrift</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <View style={{ borderBottom: '1px solid #888', height: 18, flexDirection: 'row', alignItems: 'center' }} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ borderBottom: '1px solid #888', height: 18, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 8 }}>
                  {company ? `${company.name || ''}${company.name ? ', ' : ''}${company.street || ''}, ${company.postal_code || ''} ${company.city || ''}`.replace(/, ,/, ',').trim() : ''}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 2 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 9 }}>Datum/Unterschrift des Arbeitgebers oder seiner/seines Beauftragten</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 9 }}>Name und Anschrift (Firmenstempel)</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default EinkommensbescheinigungPDFDocument; 