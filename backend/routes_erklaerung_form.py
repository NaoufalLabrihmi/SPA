from fastapi import APIRouter, HTTPException, Request, Depends
from db import get_connection
from pypdf import PdfReader, PdfWriter
import shutil
import tempfile
from pypdf.generic import NameObject, BooleanObject, DictionaryObject
from fastapi.responses import FileResponse
from fastapi import Request
from auth import get_current_user

router = APIRouter()

reader = PdfReader("erklaerung-zum-beschaeftigungsverhaeltnis_ba047549.pdf")
fields = reader.get_fields()
for field in fields:
    print(field)



@router.get("/employees/erklaerung-pdf/{employee_id}")
def download_erklaerung_pdf(employee_id: int, user=Depends(get_current_user)):
    try:
        # 1. Fetch employee data and erklaerung_form data
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM employees WHERE id = %s", (employee_id,))
        emp = cursor.fetchone() or {}
        cursor.execute("SELECT * FROM erklaerung_form WHERE employee_id = %s", (employee_id,))
        form = cursor.fetchone() or {}
        cursor.close()
        conn.close()
        if not emp and not form:
            raise HTTPException(status_code=404, detail="Employee not found.")

        # 2. Merge data
        merged = {**form, **emp}
        print('DEBUG: arbeitgeber_email in merged:', merged.get('arbeitgeber_email'))

        # 3. Prepare temp file
        template_path = "erklaerung-zum-beschaeftigungsverhaeltnis_ba047549.pdf"
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            temp_path = tmp.name
        shutil.copy(template_path, temp_path)

        # 4. Read PDF fields
        reader = PdfReader(temp_path)
        writer = PdfWriter()
        writer.clone_document_from_reader(reader)
        pdf_fields = reader.get_fields()
        print('DEBUG: chbx_zuE_1v4 field:', pdf_fields.get('chbx_zuE_1v4'))
        print('DEBUG: chbx_46_Arbeitsentgelt_Stunde field:', pdf_fields.get('chbx_46_Arbeitsentgelt_Stunde'))
        print('DEBUG: chbx_46_Arbeitsentgelt_Monat field:', pdf_fields.get('chbx_46_Arbeitsentgelt_Monat'))
        print('DEBUG: chbx_46_Arbeitsentgelt field:', pdf_fields.get('chbx_46_Arbeitsentgelt'))
        print('DEBUG: FULL FIELD chbx_46_Arbeitsentgelt:', reader.get_fields()['chbx_46_Arbeitsentgelt'])

        # Debug: print /AP and /Opt for chbx_46_Arbeitsentgelt
        field = pdf_fields.get('chbx_46_Arbeitsentgelt')
        print('DEBUG: chbx_46_Arbeitsentgelt /AP:', field.get('/AP') if field else None)
        print('DEBUG: chbx_46_Arbeitsentgelt /Opt:', field.get('/Opt') if field else None)

        # Debug: print /AP and /AS for each kid of chbx_46_Arbeitsentgelt
        if field and '/Kids' in field:
            for idx, kid in enumerate(field['/Kids']):
                try:
                    kid_obj = kid.get_object()
                    print(f'DEBUG: chbx_46_Arbeitsentgelt kid {idx} /AP:', kid_obj.get('/AP'))
                    print(f'DEBUG: chbx_46_Arbeitsentgelt kid {idx} /V:', kid_obj.get('/V'))
                    print(f'DEBUG: chbx_46_Arbeitsentgelt kid {idx} /AS:', kid_obj.get('/AS'))
                except Exception as e:
                    print(f'Error reading kid {idx}:', e)

        # Print possible export values for rbtn_1_Erklaerung for debugging
        if 'rbtn_1_Erklaerung' in pdf_fields:
            print('DEBUG: rbtn_1_Erklaerung field:', pdf_fields['rbtn_1_Erklaerung'])

        # 5. Map merged data to PDF fields (use new schema field names)
        db_to_pdf = {
            # Section A
            'erklaerung_typ': 'rbtn_1_Erklaerung',
            'erklaerung_anlass': 'rbtn_2_Anlass',
            # Section B
            'vorname': 'txtf_3_Vorname',
            'geburtsname': 'txtf_4_Nachname',
            'geburtsdatum': 'txtf_5_Geburtsdatum',
            'geschlecht': 'rbtn_6_Geschlecht',
            'staatsangehoerigkeit': 'txtf_7_Staatsangehoerigkeit',
            'wohnsitz': 'txtf_8_Wohnsitz',
            'wohnsitz_seit': 'txtf_9_seit',
            # Section C
            'arbeitgeber_firma': 'txtf_10_Firma',
            'arbeitgeber_strasse': 'txtf_11_Strasse',
            'arbeitgeber_hausnummer': 'txtf_12_Hausnummer',
            'arbeitgeber_plz': 'txtf_13_Postleitzahl',
            'arbeitgeber_ort': 'txtf_14_Ort',
            'arbeitgeber_kontakt': 'txtf_15_Kontaktperson',
            'arbeitgeber_telefon': 'txtf_16_Telefon',
            'arbeitgeber_email': 'txtf_17_E-Mail',
            'arbeitgeber_telefax': 'txtf_18_Telefax',
            'arbeitgeber_betriebsstaette': 'txtf_19_Betriebsnummer',
            'arbeitgeber_gegruendet': 'rbtn_20_Unternehmen_gegruendet',
            # Section D
            'beschaeftigung_beginn': 'txtf_21_Beschaeftigungsverhaeltniss',
            'beschaeftigung_befristung': 'rbtn_22_Beschaeftigungsverhaeltniss',
            'beschaeftigung_befristet_bis': 'txtf_22_Beschaeftigungsverhaeltniss',
            'beschaeftigung_ueberlassung': 'rbtn_23_Dritte',
            'beschaeftigung_arbeitsort': 'rbtn_24_Arbeitsort',
            'beschaeftigung_arbeitsort_adresse': 'txtf_24_Arbeitsort_Adresse',
            'beschaeftigung_berufsbezeichnung': 'txtf_25_Berufsbezeichnung',
            # Section E
            'qualifikation_keine': 'chbx_zuE_1v4',
            'qualifikation_hochschule': 'chbx_zuE_2v4',
            'qualifikation_studiengang': 'txtf_26_Studiengang',
            'qualifikation_hochschulort': 'txtf_27_Hochschulabschluss',
            'qualifikation_hochschul_anerkannt': 'rbtn_28_Abschluss_Ausland',
            'qualifikation_hochschul_nachweis': 'txtf_29_Anerkennungsnachweis',
            'qualifikation_berufsausbildung': 'chbx_zuE_3v4',
            'qualifikation_berufsausbildung_bezeichnung': 'txtf_30_Bezeichnung_Berufsausbildung',
            'qualifikation_berufsausbildung_ort': 'txtf_31_Berufsausbildung_erworben',
            'qualifikation_berufsausbildung_anerkannt': 'rbtn_32_Ausbildung_Ausland',
            'qualifikation_berufsausbildung_nachweis': 'txtf_33_Anerkennungsnachweis',
            'qualifikation_sonstige': 'chbx_zuE_4v4',
            'qualifikation_sonstige_text': 'txtf_34_Qualifikationen',
            'qualifikation_nicht_erforderlich': 'chbx_34_keine_Ausbildung',
            # Section F
            'berufsausuebung_gebunden': 'rbtn_35_Berufsausuebungserlaubnis',
            'berufsausuebung_qualifikation': 'txtf_36_erforderliche_Qualifikation',
            # Section G
            'arbeitszeit_typ': 'rbtn_37_Arbeitszeit',
            'arbeitszeit_stunden': 'txtf_37_Arbeitsstunden_Woche',
            # Section H
            'ueberstunden_verpflichtet': 'rbtn_38_Ueberstunden',
            'ueberstunden_umfang': 'txtf_39_Ueberstundenumpfang',
            'ueberstunden_ausgleich': 'txtf_40_Ueberstundenausgleich',
            # Section I
            'urlaubsanspruch_tage': 'txtf_41_Urlaubsanpruch',
            # Section J
            'arbeitgeber_tarifgebunden': 'rbtn_42_Arbeitgeber_tarifgebunden',
            'arbeitnehmer_tariflich': 'rbtn_43_tarifliche_Arbeitsbedingungen',
            'tarifvertrag': 'txtf_44_Tarifvertrag',
            'entgeltgruppe': 'txtf_45_Entgeltgruppe',
            'entgelt_pro_typ': 'chbx_46_Arbeitsentgelt',
            'entgelt_pro_stunde_wert': 'txtf_46_Entgelt_pro_Stunde',
            'entgelt_pro_monat_wert': 'txtf_46_Entgelt_pro_Monat',
            'geldwerte_leistungen': 'chbx_47_zusaetzlich_geldwerte_Leistungen',
            'geldwerte_leistungen_art': 'txtf_48_Art_geldwerten_Leistung',
            'geldwerte_leistungen_hoehe': 'txtf_49_Hoehe_geldwerten_Leistung',
            'sonstige_berechnung': 'chbx_47_sonstige_Berechnung',
            'sonstige_berechnung_art': 'txtf_50_Art_variablen_Verguetung',
            'sonstige_berechnung_hoehe': 'txtf_51_Hoehe_variable_Verguetung',
            # Section K
            'versicherungspflicht_de': 'rbtn_52_besteht_Versicherungspflicht',
            'versicherungspflicht_begruendung': 'txtf_53_Begruendung_Versicherungspflicht',
            'dvka_ausnahme': 'rbtn_54_Sozialversicherungspflicht_nicht',
            'dvka_nachweis_form': 'txtf_55_Form_Nachweiss',
            'ergaenzende_angaben': 'txtf_56_Ergaemzungen',
            # Section L
            'unterschrift_ort': 'txtf_57_Ort',
            'unterschrift_datum': 'txtf_58_Datum',
        }

        # 6. Build data_map with only available data
        data_map = {}
        for db_field, pdf_field in db_to_pdf.items():
            value = merged.get(db_field)
            if value is not None:
                # Special handling for Geschlecht radio button
                if db_field == "geschlecht":
                    geschlecht_map = {
                        "männlich": "maennlich",
                        "weiblich": "weiblich",
                        "divers": "divers",
                    }
                    export_value = geschlecht_map.get(value)
                    if export_value:
                        data_map[pdf_field] = export_value
                # Special handling for rbtn_1_Erklaerung
                elif db_field == "rbtn_1_Erklaerung":
                    erklaerung_map = {
                        'zur Erteilung eines Aufenthaltstitels zum Zweck der Beschäftigung': 'zur Erteilung eines Aufenthaltstitels zum Zweck der Beschaeftigung',
                        'zur Zustimmung der Aufnahme einer Beschäftigung von Personen mit Duldung oder Aufenthaltsgestattung (Bitte nur die Fragen 3 bis 22, 24 und 25, 37 bis 51 sowie 57 bis 59 ausfüllen)': 'zur Zustimmung der Aufnahme einer Beschaeftigung von Personen mit Duldung oder Aufenthaltsgestattung',
                        'zur Zustimmung zu einer Aufenthaltserlaubnis, die die Beschäftigung nicht erlaubt': 'zur Zustimmung zu einer Aufenthaltserlaubnis, die die Beschaeftigung nicht erlaubt',
                        'zur Erteilung einer Vorabzustimmung der Bundesagentur für Arbeit': 'zur Erteilung einer Vorabzustimmung der Bundesagentur fuer Arbeit',
                        'zur Erteilung einer Arbeitserlaubnis der Bundesagentur für Arbeit': 'zur Erteilung einer Arbeitserlaubnis der Bundesagentur fuer Arbeit',
                    }
                    export_value = erklaerung_map.get(value)
                    if export_value:
                        data_map[pdf_field] = export_value
                else:
                    data_map[pdf_field] = str(value)
        # Section E: handle checkboxes
        checkbox_fields = [
            ('qualifikation_keine', 'chbx_zuE_1v4'),
            ('qualifikation_hochschule', 'chbx_zuE_2v4'),
            ('qualifikation_berufsausbildung', 'chbx_zuE_3v4'),
            ('qualifikation_sonstige', 'chbx_zuE_4v4'),
            ('qualifikation_nicht_erforderlich', 'chbx_34_keine_Ausbildung'),
            ('geldwerte_leistungen', 'chbx_47_zusaetzlich_geldwerte_Leistungen'),
            ('sonstige_berechnung', 'chbx_47_sonstige_Berechnung'),
        ]
        for db_field, pdf_field in checkbox_fields:
            value = merged.get(db_field)
            if value in [1, True, '1', 'true', 'True']:
                data_map[pdf_field] = '/selektiert'
            else:
                data_map[pdf_field] = '/Off'
        # Set chbx_46_Arbeitsentgelt as a radio group: /0 for Stunde, /1 for Monat, /Off for none
        entgelt_typ = merged.get('entgelt_pro_typ')
        if entgelt_typ == 'pro Stunde':
            arbeitsentgelt_state = '/0'
        elif entgelt_typ == 'pro Monat':
            arbeitsentgelt_state = '/1'
        else:
            arbeitsentgelt_state = '/Off'
        data_map['chbx_46_Arbeitsentgelt'] = arbeitsentgelt_state
        # 7. Fill the PDF only on pages with fields
        for i, page in enumerate(writer.pages):
            try:
                writer.update_page_form_field_values(page, data_map)
            except Exception as e:
                print(f"[PDF] No fields to update on page {i+1}: {e}")
                continue
        # Set /V and /AS to the correct export value for chbx_46_Arbeitsentgelt
        if "/AcroForm" in writer._root_object:
            acroform = writer._root_object[NameObject("/AcroForm")]
            if "/Fields" in acroform:
                for field in acroform[NameObject("/Fields")]:
                    field_obj = field.get_object()
                    if field_obj.get("/T") == "chbx_46_Arbeitsentgelt":
                        entgelt_typ = merged.get('entgelt_pro_typ')
                        if "/Kids" in field_obj:
                            kids = field_obj[NameObject("/Kids")]
                            for idx, kid in enumerate(kids):
                                kid_obj = kid.get_object()
                                if idx == 0:
                                    export_value = "/pro Stunde"
                                elif idx == 1:
                                    export_value = "/pro Monat"
                                else:
                                    export_value = "/Off"
                                if (entgelt_typ == 'pro Stunde' and idx == 0) or (entgelt_typ == 'pro Monat' and idx == 1):
                                    kid_obj[NameObject("/AS")] = NameObject(export_value)
                                    field_obj[NameObject("/V")] = NameObject(export_value)
                                else:
                                    kid_obj[NameObject("/AS")] = NameObject("/Off")
                        else:
                            field_obj[NameObject("/V")] = NameObject("/Off")
        # Explicitly set the value for the gender radio group in the AcroForm dictionary and widget appearance
        if 'rbtn_6_Geschlecht' in data_map:
            export_value = data_map['rbtn_6_Geschlecht']
            state_map = {
                "maennlich": "/0",
                "weiblich": "/1",
                "divers": "/2",
            }
            widget_state = state_map.get(export_value)
            if "/AcroForm" in writer._root_object:
                acroform = writer._root_object[NameObject("/AcroForm")]
                acroform[NameObject("/V")] = NameObject(widget_state)
                if "/Fields" in acroform:
                    for field in acroform[NameObject("/Fields")]:
                        field_obj = field.get_object()
                        if field_obj.get("/T") == "rbtn_6_Geschlecht" and "/Kids" in field_obj:
                            for idx, kid in enumerate(field_obj[NameObject("/Kids")]):
                                kid_obj = kid.get_object()
                                if widget_state and idx == ['maennlich', 'weiblich', 'divers'].index(export_value):
                                    kid_obj[NameObject("/AS")] = NameObject(widget_state)
                                else:
                                    kid_obj[NameObject("/AS")] = NameObject("/Off")
        # Explicitly set the value for the rbtn_1_Erklaerung radio group in the AcroForm dictionary and widget appearance
        if 'rbtn_1_Erklaerung' in data_map:
            export_value = data_map['rbtn_1_Erklaerung']
            if "/AcroForm" in writer._root_object:
                acroform = writer._root_object[NameObject("/AcroForm")]
                if "/Fields" in acroform:
                    for field in acroform[NameObject("/Fields")]:
                        field_obj = field.get_object()
                        if field_obj.get("/T") == "rbtn_1_Erklaerung" and "/Kids" in field_obj:
                            kids = field_obj[NameObject("/Kids")]
                            opts = pdf_fields['rbtn_1_Erklaerung'].get('/Opt', [])
                            # Normalize for matching
                            export_value_norm = str(export_value).strip().lower()
                            opts_norm = [str(opt).strip().lower() for opt in opts]
                            try:
                                idx = opts_norm.index(export_value_norm)
                                widget_state = f"/{idx}"
                            except ValueError:
                                widget_state = None
                            # Set /V on AcroForm and field object
                            if widget_state:
                                acroform[NameObject("/V")] = NameObject(widget_state)
                                field_obj[NameObject("/V")] = NameObject(widget_state)
                                for i, kid in enumerate(kids):
                                    kid_obj = kid.get_object()
                                    if i == idx:
                                        kid_obj[NameObject("/AS")] = NameObject(widget_state)
                                    else:
                                        kid_obj[NameObject("/AS")] = NameObject("/Off")
        # Generalize: Set check for all other radio button fields (rbtn_) not handled above
        if "/AcroForm" in writer._root_object:
            acroform = writer._root_object[NameObject("/AcroForm")]
            if "/Fields" in acroform:
                erklaerung_map = {
                    'zur Erteilung eines Aufenthaltstitels zum Zweck der Beschäftigung': 'zur Erteilung eines Aufenthaltstitels zum Zweck der Beschaeftigung',
                    'zur Zustimmung der Aufnahme einer Beschäftigung von Personen mit Duldung oder Aufenthaltsgestattung (Bitte nur die Fragen 3 bis 22, 24 und 25, 37 bis 51 sowie 57 bis 59 ausfüllen)': 'zur Zustimmung der Aufnahme einer Beschaeftigung von Personen mit Duldung oder Aufenthaltsgestattung',
                    'zur Zustimmung zu einer Aufenthaltserlaubnis, die die Beschäftigung nicht erlaubt': 'zur Zustimmung zu einer Aufenthaltserlaubnis, die die Beschaeftigung nicht erlaubt',
                    'zur Erteilung einer Vorabzustimmung der Bundesagentur für Arbeit': 'zur Erteilung einer Vorabzustimmung der Bundesagentur fuer Arbeit',
                    'zur Erteilung einer Arbeitserlaubnis der Bundesagentur für Arbeit': 'zur Erteilung einer Arbeitserlaubnis der Bundesagentur fuer Arbeit',
                }
                arbeitsort_map = {
                    "arbeitgeber_sitz": "Arbeitsort entspricht dem Arbeitgeber-Sitz",
                    "wechselnde_arbeitsorte": "Arbeitnehmerin oder Arbeitnehmer wird an wechselnden Arbeits-/Einsatzorten beschäftigt",
                    "adresse": "Der Arbeitsort befindet sich unter folgender Adresse",
                }
                for pdf_field_name, export_value in data_map.items():
                    if pdf_field_name.startswith("rbtn_") and pdf_field_name not in ["rbtn_6_Geschlecht"]:
                        # Special mapping for rbtn_1_Erklaerung
                        if pdf_field_name == "rbtn_1_Erklaerung":
                            export_value = erklaerung_map.get(merged.get('erklaerung_typ'), export_value)
                        # Special mapping for rbtn_24_Arbeitsort
                        if pdf_field_name == "rbtn_24_Arbeitsort":
                            db_value = merged.get('beschaeftigung_arbeitsort')
                            export_value = arbeitsort_map.get(db_value, export_value)
                            print(f'DEBUG: rbtn_24_Arbeitsort db_value:', db_value)
                            print(f'DEBUG: rbtn_24_Arbeitsort export_value:', export_value)
                            print(f'DEBUG: rbtn_24_Arbeitsort /Opt:', pdf_fields.get(pdf_field_name, {}).get('/Opt', []))
                        # Special mapping for rbtn_28_Abschluss_Ausland (qualifikation_hochschul_anerkannt)
                        if pdf_field_name == "rbtn_28_Abschluss_Ausland":
                            db_value = merged.get('qualifikation_hochschul_anerkannt')
                            opts = pdf_fields.get(pdf_field_name, {}).get('/Opt', [])
                            if db_value == 'Ja' and len(opts) > 0:
                                export_value = opts[0]
                            elif db_value == 'Nein' and len(opts) > 1:
                                export_value = opts[1]
                            else:
                                export_value = export_value
                        # Special mapping for rbtn_32_Ausbildung_Ausland (qualifikation_berufsausbildung_anerkannt)
                        if pdf_field_name == "rbtn_32_Ausbildung_Ausland":
                            db_value = merged.get('qualifikation_berufsausbildung_anerkannt')
                            opts = pdf_fields.get(pdf_field_name, {}).get('/Opt', [])
                            if db_value == 'Ja' and len(opts) > 0:
                                export_value = opts[0]
                            elif db_value == 'Nein' and len(opts) > 1:
                                export_value = opts[1]
                            elif db_value == 'Teilweise' and len(opts) > 2:
                                export_value = opts[2]
                            else:
                                export_value = export_value
                        # Special mapping for rbtn_42_Arbeitgeber_tarifgebunden (arbeitgeber_tarifgebunden)
                        if pdf_field_name == "rbtn_42_Arbeitgeber_tarifgebunden":
                            db_value = merged.get('arbeitgeber_tarifgebunden')
                            opts = pdf_fields.get(pdf_field_name, {}).get('/Opt', [])
                            if db_value == 'Ja' and len(opts) > 0:
                                export_value = opts[0]
                            elif db_value == 'Nein' and len(opts) > 1:
                                export_value = opts[1]
                            else:
                                export_value = export_value
                        # Special mapping for rbtn_43_tarifliche_Arbeitsbedingungen (arbeitnehmer_tariflich)
                        if pdf_field_name == "rbtn_43_tarifliche_Arbeitsbedingungen":
                            db_value = merged.get('arbeitnehmer_tariflich')
                            opts = pdf_fields.get(pdf_field_name, {}).get('/Opt', [])
                            if db_value == 'Ja' and len(opts) > 0:
                                export_value = opts[0]
                            elif db_value == 'Nein' and len(opts) > 1:
                                export_value = opts[1]
                            else:
                                export_value = export_value
                        # Special mapping for rbtn_52_besteht_Versicherungspflicht (versicherungspflicht_de)
                        if pdf_field_name == "rbtn_52_besteht_Versicherungspflicht":
                            db_value = merged.get('versicherungspflicht_de')
                            opts = pdf_fields.get(pdf_field_name, {}).get('/Opt', [])
                            if db_value == 'Ja' and len(opts) > 0:
                                export_value = opts[0]
                            elif db_value == 'Nein' and len(opts) > 1:
                                export_value = opts[1]
                            else:
                                export_value = export_value
                        # Special mapping for rbtn_54_Sozialversicherungspflicht_nicht (dvka_ausnahme)
                        if pdf_field_name == "rbtn_54_Sozialversicherungspflicht_nicht":
                            db_value = merged.get('dvka_ausnahme')
                            opts = pdf_fields.get(pdf_field_name, {}).get('/Opt', [])
                            if db_value == 'Ja' and len(opts) > 0:
                                export_value = opts[0]
                            elif db_value == 'Nein' and len(opts) > 1:
                                export_value = opts[1]
                            else:
                                export_value = export_value
                        # Debug print for rbtn_1_Erklaerung
                        print(f'DEBUG: {pdf_field_name} export_value:', export_value)
                        if pdf_field_name == "rbtn_20_Unternehmen_gegruendet":
                            print(f'DEBUG: {pdf_field_name} export_value:', export_value)
                            print(f'DEBUG: {pdf_field_name} /Opt:', pdf_fields.get(pdf_field_name, {}).get('/Opt', []))
                        for field in acroform[NameObject("/Fields")]:
                            field_obj = field.get_object()
                            if field_obj.get("/T") == pdf_field_name and "/Kids" in field_obj:
                                kids = field_obj[NameObject("/Kids")]
                                opts = pdf_fields.get(pdf_field_name, {}).get('/Opt', [])
                                # Normalize for matching
                                export_value_norm = str(export_value).strip().lower()
                                opts_norm = [str(opt).strip().lower() for opt in opts]
                                try:
                                    idx = opts_norm.index(export_value_norm)
                                    widget_state = f"/{idx}"
                                except ValueError:
                                    widget_state = None
                                if widget_state:
                                    acroform[NameObject("/V")] = NameObject(widget_state)
                                    field_obj[NameObject("/V")] = NameObject(widget_state)
                                    for i, kid in enumerate(kids):
                                        kid_obj = kid.get_object()
                                        if i == idx:
                                            kid_obj[NameObject("/AS")] = NameObject(widget_state)
                                        else:
                                            kid_obj[NameObject("/AS")] = NameObject("/Off")
        # 8. Remove NeedAppearances flag so original checkmark is used
        if "/AcroForm" in writer._root_object:
            acroform = writer._root_object[NameObject("/AcroForm")]
            if NameObject("/NeedAppearances") in acroform:
                del acroform[NameObject("/NeedAppearances")]

        with open(temp_path, "wb") as f_out:
            writer.write(f_out)

        # 9. Return the filled PDF
        return FileResponse(temp_path, filename="erklaerung_beschaeftigung.pdf", media_type="application/pdf")
    except Exception as e:
        import traceback
        print("[PDF ERROR]", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")

@router.get("/erklaerung_form/edit/{employee_id}")
def get_erklaerung_form_for_edit(employee_id: int, user=Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT vorname, geburtsname, geburtsdatum, geschlecht, staatsangehoerigkeit, strasse_hausnummer, plz_ort, betriebsstaette, berufsbezeichnung FROM employees WHERE id = %s", (employee_id,))
        emp = cursor.fetchone()
        if not emp:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Employee not found.")
        # Fetch erklaerung_form fields (new schema)
        cursor.execute("SELECT * FROM erklaerung_form WHERE employee_id = %s", (employee_id,))
        form = cursor.fetchone()
        cursor.close()
        conn.close()
        # If no form, build a dict with all erklaerung_form fields as null
        if not form:
            erklaerung_fields = [
                # Section A
                'erklaerung_typ', 'erklaerung_anlass',
                # Section B
                'wohnsitz', 'wohnsitz_seit',
                # Section C
                'arbeitgeber_firma', 'arbeitgeber_strasse', 'arbeitgeber_hausnummer', 'arbeitgeber_plz', 'arbeitgeber_ort',
                'arbeitgeber_kontakt', 'arbeitgeber_telefon', 'arbeitgeber_email', 'arbeitgeber_telefax', 'arbeitgeber_betriebsstaette', 'arbeitgeber_gegruendet',
                # Section D
                'beschaeftigung_beginn', 'beschaeftigung_befristung', 'beschaeftigung_befristet_bis', 'beschaeftigung_ueberlassung',
                'beschaeftigung_arbeitsort', 'beschaeftigung_arbeitsort_adresse', 'beschaeftigung_berufsbezeichnung',
                # Section E
                'qualifikation_keine', 'qualifikation_hochschule', 'qualifikation_studiengang', 'qualifikation_hochschulort',
                'qualifikation_hochschul_anerkannt', 'qualifikation_hochschul_nachweis', 'qualifikation_berufsausbildung',
                'qualifikation_berufsausbildung_bezeichnung', 'qualifikation_berufsausbildung_ort', 'qualifikation_berufsausbildung_anerkannt',
                'qualifikation_berufsausbildung_nachweis', 'qualifikation_sonstige', 'qualifikation_sonstige_text', 'qualifikation_nicht_erforderlich',
                # Section F
                'berufsausuebung_gebunden', 'berufsausuebung_qualifikation',
                # Section G
                'arbeitszeit_typ', 'arbeitszeit_stunden',
                # Section H
                'ueberstunden_verpflichtet', 'ueberstunden_umfang', 'ueberstunden_ausgleich',
                # Section I
                'urlaubsanspruch_tage',
                # Section J
                'arbeitgeber_tarifgebunden', 'arbeitnehmer_tariflich', 'tarifvertrag', 'entgeltgruppe',
                'entgelt_pro_typ', 'entgelt_pro_stunde_wert', 'entgelt_pro_monat_wert',
                'geldwerte_leistungen', 'geldwerte_leistungen_art', 'geldwerte_leistungen_hoehe',
                'sonstige_berechnung', 'sonstige_berechnung_art', 'sonstige_berechnung_hoehe',
                # Section K
                'versicherungspflicht_de', 'versicherungspflicht_begruendung', 'dvka_ausnahme', 'dvka_nachweis_form', 'ergaenzende_angaben',
                # Section L
                'unterschrift_ort', 'unterschrift_datum'
            ]
            form = {field: None for field in erklaerung_fields}
        # Merge: erklaerung_form values take precedence over employees
        result = {**form, **emp}
        return result
    except Exception as e:
        import traceback
        print("[ERKLAERUNG FORM EDIT ERROR]", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching erklaerung form: {str(e)}")

@router.patch("/erklaerung_form/edit/{employee_id}")
async def edit_erklaerung_form(employee_id: int, req: Request, user=Depends(get_current_user)):
    try:
        data = await req.json()
        if not data:
            raise HTTPException(status_code=400, detail="No data provided for update.")

        # Fields belonging to employees table
        employee_fields = [
            "vorname", "geburtsname", "geburtsdatum", "geschlecht", "staatsangehoerigkeit",
            "strasse_hausnummer", "plz_ort", "betriebsstaette", "berufsbezeichnung"
        ]
        employee_update = {}
        for k in employee_fields:
            if k in data:
                employee_update[k] = data.pop(k)

        # Remove keys that should not be updated
        data.pop("id", None)
        data.pop("employee_id", None)

        # Update employees table if needed
        if employee_update:
            emp_fields = []
            emp_values = []
            for k, v in employee_update.items():
                emp_fields.append(f"{k} = %s")
                emp_values.append(v)
            emp_values.append(employee_id)
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            sql = f"UPDATE employees SET {', '.join(emp_fields)} WHERE id = %s"
            cursor.execute(sql, tuple(emp_values))
            conn.commit()
            cursor.close()
            conn.close()

        # Build field list and values for erklaerung_form (new schema)
        fields = []
        values = []
        for k, v in data.items():
            fields.append(f"{k} = %s")
            values.append(v)

        # Check if form exists
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id FROM erklaerung_form WHERE employee_id = %s", (employee_id,))
        exists = cursor.fetchone()

        if exists:
            # Update
            if fields:
                sql = f"UPDATE erklaerung_form SET {', '.join(fields)} WHERE employee_id = %s"
                values.append(employee_id)
                cursor.execute(sql, tuple(values))
        else:
            # Insert
            columns = ', '.join(['employee_id'] + list(data.keys()))
            placeholders = ', '.join(['%s'] * (len(data) + 1))
            values = [employee_id] + list(data.values())
            sql = f"INSERT INTO erklaerung_form ({columns}) VALUES ({placeholders})"
            cursor.execute(sql, tuple(values))

        conn.commit()
        cursor.close()
        conn.close()
        return {"message": "Erklärung Formular updated successfully"}
    except Exception as e:
        import traceback
        print("[ERKLAERUNG FORM PATCH ERROR]", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error updating erklaerung form: {str(e)}")