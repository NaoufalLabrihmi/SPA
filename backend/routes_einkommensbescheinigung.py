from fastapi import APIRouter, File, UploadFile, HTTPException, Query, status, Body, Depends
from db import get_connection
from pdf_extract_utils import extract_einkommensbescheinigung_fields
import tempfile
import shutil
import os
import logging
from auth import get_current_user

router = APIRouter()

@router.post("/employees/{employee_id}/einkommensbescheinigung/upload", status_code=status.HTTP_201_CREATED)
async def upload_einkommensbescheinigung(employee_id: int, file: UploadFile = File(...), user=Depends(get_current_user)):
    # Save uploaded file to a temp location
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
    except Exception as e:
        logging.error(f"Failed to save uploaded file: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Speichern der Datei: {str(e)}")
    
    # Extract fields using the utility
    try:
        extracted = extract_einkommensbescheinigung_fields(tmp_path)
    except Exception as e:
        os.remove(tmp_path)
        logging.error(f"PDF extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF extraction error: {str(e)}")
    
    # Store in DB using extracted data and update employee record
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Start transaction
        cursor.execute("START TRANSACTION")
        
        # Insert einkommensbescheinigung record
        cursor.execute("""
            INSERT INTO einkommensbescheinigung
            (employee_id, eintritt, stkl, krankenkasse, betrag, kv_brutto, sv_abzug, netto, monat, jahr)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            employee_id,
            extracted.get('Eintritt'),
            extracted.get('StKl'),
            extracted.get('Krankenkasse'),
            extracted.get('Betrag'),
            extracted.get('KV-Brutto'),
            extracted.get('SV-Abzug'),
            extracted.get('Netto'),
            extracted.get('monat'),
            extracted.get('jahr')
        ))
        
        # Update employee record with extracted values (only if values are not None)
        update_fields = []
        update_values = []
        
        # Debug logging
        logging.info(f"Extracted data: {extracted}")
        
        if extracted.get('StKl') is not None:
            update_fields.append("steuerklasse = %s")
            update_values.append(extracted.get('StKl'))
            logging.info(f"Updating steuerklasse: {extracted.get('StKl')}")
        
        if extracted.get('Krankenkasse') is not None:
            update_fields.append("gesetzliche_krankenkasse = %s")
            update_values.append(extracted.get('Krankenkasse'))
            logging.info(f"Updating gesetzliche_krankenkasse: {extracted.get('Krankenkasse')}")
        
        if extracted.get('Eintritt') is not None:
            # Convert DD.MM.YY format to YYYY-MM-DD for database
            eintritt_date = extracted.get('Eintritt')
            if eintritt_date and '.' in eintritt_date:
                try:
                    day, month, year = eintritt_date.split('.')
                    # Assume 20xx for years < 50, 19xx for years >= 50
                    if len(year) == 2:
                        if int(year) < 50:
                            year = f"20{year}"
                        else:
                            year = f"19{year}"
                    eintritt_date = f"{year}-{month}-{day}"
                except:
                    pass  # Keep original format if conversion fails
            
            update_fields.append("eintrittsdatum = %s")
            update_values.append(eintritt_date)
            logging.info(f"Updating eintrittsdatum: {eintritt_date}")
        
        if extracted.get('Personal-Nr') is not None:
            update_fields.append("arbeitnehmernummer = %s")
            update_values.append(extracted.get('Personal-Nr'))
            logging.info(f"Updating arbeitnehmernummer: {extracted.get('Personal-Nr')}")
        
        if extracted.get('Ki.Frbtr') is not None and extracted.get('Ki.Frbtr') != '':
            update_fields.append("kinderfreibetraege = %s")
            update_values.append(extracted.get('Ki.Frbtr'))
            logging.info(f"Updating kinderfreibetraege: {extracted.get('Ki.Frbtr')}")
        else:
            logging.info("Ki.Frbtr is empty or None - not updating kinderfreibetraege")
        
        if extracted.get('SV-Nummer') is not None:
            update_fields.append("versicherungsnummer = %s")
            update_values.append(extracted.get('SV-Nummer'))
            logging.info(f"Updating versicherungsnummer: {extracted.get('SV-Nummer')}")
        
        if extracted.get('Steuer-ID') is not None:
            update_fields.append("identifikationsnummer = %s")
            update_values.append(extracted.get('Steuer-ID'))
            logging.info(f"Updating identifikationsnummer: {extracted.get('Steuer-ID')}")
        
        if extracted.get('strasse_hausnummer') is not None:
            update_fields.append("strasse_hausnummer = %s")
            update_values.append(extracted.get('strasse_hausnummer'))
            logging.info(f"Updating strasse_hausnummer: {extracted.get('strasse_hausnummer')}")
        
        if extracted.get('plz_ort') is not None:
            update_fields.append("plz_ort = %s")
            update_values.append(extracted.get('plz_ort'))
            logging.info(f"Updating plz_ort: {extracted.get('plz_ort')}")
        
        if extracted.get('Bank') is not None:
            update_fields.append("bic = %s")
            update_values.append(extracted.get('Bank'))
            logging.info(f"Updating bic: {extracted.get('Bank')}")
        
        if extracted.get('Konto') is not None:
            update_fields.append("iban = %s")
            update_values.append(extracted.get('Konto'))
            logging.info(f"Updating iban: {extracted.get('Konto')}")
        
        if extracted.get('KV-Beitrag') is not None:
            update_fields.append("kv = %s")
            update_values.append(extracted.get('KV-Beitrag'))
            logging.info(f"Updating kv: {extracted.get('KV-Beitrag')}")
        
        if extracted.get('RV-Beitrag') is not None:
            update_fields.append("rv = %s")
            update_values.append(extracted.get('RV-Beitrag'))
            logging.info(f"Updating rv: {extracted.get('RV-Beitrag')}")
        
        if extracted.get('AV-Beitrag') is not None:
            update_fields.append("av = %s")
            update_values.append(extracted.get('AV-Beitrag'))
            logging.info(f"Updating av: {extracted.get('AV-Beitrag')}")
        
        if extracted.get('PV-Beitrag') is not None:
            update_fields.append("pv = %s")
            update_values.append(extracted.get('PV-Beitrag'))
            logging.info(f"Updating pv: {extracted.get('PV-Beitrag')}")
        
        # Only update if we have fields to update
        if update_fields:
            update_values.append(employee_id)
            logging.info(f"Updating employee {employee_id} with fields: {update_fields}")
            cursor.execute(f"""
                UPDATE employees 
                SET {', '.join(update_fields)}
                WHERE id = %s
            """, tuple(update_values))
        else:
            logging.info("No fields to update for employee")
        
        # Commit transaction
        cursor.execute("COMMIT")
        cursor.close()
        conn.close()
        
    except Exception as e:
        # Rollback on error
        try:
            cursor.execute("ROLLBACK")
        except:
            pass
        os.remove(tmp_path)
        logging.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    os.remove(tmp_path)
    return {
        "message": "Einkommensbescheinigung gespeichert und Mitarbeiterdaten aktualisiert (Steuerklasse, Krankenkasse, Eintrittsdatum, Personal-Nr, Kinderfreibetrag, SV-Nummer, Steuer-ID, Adresse, Bankdaten, IBAN, KV-Beitrag, RV-Beitrag, AV-Beitrag, PV-Beitrag)", 
        "data": extracted, 
        "monat": extracted.get('monat'), 
        "jahr": extracted.get('jahr'),
        "employee_updated": bool(update_fields)
    }

@router.get("/einkommensbescheinigung/list")
def list_einkommensbescheinigung(employeeId: int = Query(...), user=Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM einkommensbescheinigung
            WHERE employee_id = %s
            ORDER BY jahr DESC, monat DESC, created_at DESC
        """, (employeeId,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return rows
    except Exception as e:
        logging.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/employees/{employee_id}")
def get_employee(employee_id: int, user=Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM employees WHERE id = %s", (employee_id,))
        employee = cursor.fetchone()
        cursor.close()
        conn.close()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        return employee
    except Exception as e:
        logging.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get('/erklaerung_form/{employee_id}')
def get_erklaerung_form(employee_id: int, user=Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM erklaerung_form WHERE employee_id = %s ORDER BY id DESC LIMIT 1', (employee_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        if not row:
            raise HTTPException(status_code=404, detail='Not found')
        return row
    except Exception as e:
        logging.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/einkommensbescheinigung/{record_id}")
def edit_einkommensbescheinigung(record_id: int, data: dict = Body(...), user=Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Start transaction
        cursor.execute("START TRANSACTION")
        
        # Update einkommensbescheinigung record
        update_fields = []
        update_values = []
        
        # Map the fields that can be updated
        field_mapping = {
            'eintritt': 'eintritt',
            'stkl': 'stkl', 
            'krankenkasse': 'krankenkasse',
            'betrag': 'betrag',
            'kv_brutto': 'kv_brutto',
            'sv_abzug': 'sv_abzug',
            'netto': 'netto',
            'monat': 'monat',
            'jahr': 'jahr'
        }
        
        for frontend_field, db_field in field_mapping.items():
            if frontend_field in data and data[frontend_field] is not None:
                update_fields.append(f"{db_field} = %s")
                update_values.append(data[frontend_field])
                logging.info(f"Updating {db_field}: {data[frontend_field]}")
        
        if update_fields:
            update_values.append(record_id)
            cursor.execute(f"""
                UPDATE einkommensbescheinigung 
                SET {', '.join(update_fields)}
                WHERE id = %s
            """, tuple(update_values))
            
            # Commit transaction
            cursor.execute("COMMIT")
            cursor.close()
            conn.close()
            
            return {"message": "Einkommensbescheinigung erfolgreich aktualisiert", "updated": True}
        else:
            cursor.execute("ROLLBACK")
            cursor.close()
            conn.close()
            return {"message": "Keine Änderungen vorgenommen", "updated": False}
            
    except Exception as e:
        # Rollback on error
        try:
            cursor.execute("ROLLBACK")
        except:
            pass
        logging.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/einkommensbescheinigung/{record_id}")
def delete_einkommensbescheinigung(record_id: int, user=Depends(get_current_user)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Check if record exists
        cursor.execute("SELECT id FROM einkommensbescheinigung WHERE id = %s", (record_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Einkommensbescheinigung nicht gefunden")
        
        # Delete the record
        cursor.execute("DELETE FROM einkommensbescheinigung WHERE id = %s", (record_id,))
        
        # Commit transaction
        cursor.execute("COMMIT")
        cursor.close()
        conn.close()
        
        return {"message": "Einkommensbescheinigung erfolgreich gelöscht", "deleted": True}
        
    except HTTPException:
        raise
    except Exception as e:
        # Rollback on error
        try:
            cursor.execute("ROLLBACK")
        except:
            pass
        logging.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
