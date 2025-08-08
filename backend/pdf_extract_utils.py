import pdfplumber
import re
from datetime import datetime
import logging

MONTHS_DE = {
    'januar': '01', 'februar': '02', 'märz': '03', 'maerz': '03', 'april': '04', 'mai': '05', 'juni': '06',
    'juli': '07', 'august': '08', 'september': '09', 'oktober': '10', 'november': '11', 'dezember': '12'
}

FIELDS = [
    'Eintritt',
    'StKl',
    'Krankenkasse',
    'Betrag',
    'KV-Brutto',
    'KV-Beitrag',
    'RV-Beitrag',
    'AV-Beitrag',
    'PV-Beitrag',
    'SV-Abzug',
    'Netto',
    'Personal-Nr',
    'Ki.Frbtr',
    'SV-Nummer',
    'Steuer-ID',
    'strasse_hausnummer',
    'plz_ort',
    'Bank',
    'Konto',
]

def normalize_german_number(val):
    """
    Ensures the number is in the format 1322,32 (comma before last two digits).
    Handles input like '1.322,32', '1322,32', '132232', '1.32232', etc.
    """
    if not isinstance(val, str):
        return val
    val = val.strip().replace('.', '')
    # If already in correct format, return
    if re.match(r'^\d+,\d{2}$', val):
        return val
    # If only digits, insert comma before last two digits
    if re.match(r'^\d{3,}$', val):
        return f"{val[:-2]},{val[-2:]}"
    # If comma is not at the right place, fix it
    if ',' in val:
        parts = val.split(',')
        digits = ''.join(parts)
        if len(digits) > 2:
            return f"{digits[:-2]},{digits[-2:]}"
    return val

# Helper for robust table extraction

def extract_table_column_value(header_line, value_line, target_column):
    # Split on 2+ spaces or tabs for both header and value
    header_cols = re.split(r'\s{2,}|\t', header_line.strip())
    value_cols = re.split(r'\s{2,}|\t', value_line.strip())
    # Remove non-numeric leading columns in value row (like 'L', 'E', etc.)
    while value_cols and not re.search(r'\d', value_cols[0]):
        value_cols.pop(0)
    try:
        idx = header_cols.index(target_column)
        if idx < len(value_cols):
            match = re.search(r'(\d{1,3}(?:\.\d{3})*,\d{2})', value_cols[idx])
            if match:
                return normalize_german_number(match.group(1))
    except ValueError:
        pass
    return None

def format_eintritt_date(eintritt):
    if eintritt and re.match(r'^\d{6}$', eintritt):
        return f"{eintritt[:2]}.{eintritt[2:4]}.{eintritt[4:]}"
    return eintritt

def format_kv_brutto(val):
    if val and re.match(r'^\d{3,}$', val) and ',' not in val:
        return f"{val[:-2]},{val[-2:]}"
    return val

def format_date_for_db(date_str):
    """
    Convert date string to YYYY-MM-DD format for database storage.
    Handles formats like DD.MM.YY, DD.MM.YYYY, etc.
    """
    if not date_str:
        return None
    
    # Handle DD.MM.YY format
    if re.match(r'^\d{2}\.\d{2}\.\d{2}$', date_str):
        day, month, year = date_str.split('.')
        # Assume 20xx for years < 50, 19xx for years >= 50
        if int(year) < 50:
            year = f"20{year}"
        else:
            year = f"19{year}"
        return f"{year}-{month}-{day}"
    
    # Handle DD.MM.YYYY format
    elif re.match(r'^\d{2}\.\d{2}\.\d{4}$', date_str):
        day, month, year = date_str.split('.')
        return f"{year}-{month}-{day}"
    
    return date_str

def extract_einkommensbescheinigung_fields(pdf_path):
    results = {field: None for field in FIELDS}
    results['monat'] = None
    results['jahr'] = None
    lines = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    lines.extend(text.split('\n'))
    except Exception as e:
        logging.error(f"PDF extraction error: {e}")
        raise RuntimeError(f"PDF extraction error: {str(e)}")

    # Monat/Jahr extraction (look for 'für <Monat> <Jahr>' or 'f[üu]r <Monat> <Jahr>')
    for line in lines:
        match = re.search(r'f[üu]r\s+([A-Za-zäöüÄÖÜ]+)\s+(\d{4})', line, re.IGNORECASE)
        if match:
            month_str = match.group(1).lower().replace('ä', 'ae')
            year_str = match.group(2)
            month_num = MONTHS_DE.get(month_str)
            if month_num:
                results['monat'] = month_num
            else:
                results['monat'] = month_str  # fallback
            results['jahr'] = year_str
            break
    # Fallback to current month/year if not found
    now = datetime.now()
    if not results['monat']:
        results['monat'] = now.strftime("%m")
    if not results['jahr']:
        results['jahr'] = now.strftime("%Y")

    # Eintritt (eintrittsdatum) - extract and format for DB
    try:
        for idx, line in enumerate(lines):
            if 'Eintritt' in line and idx + 1 < len(lines):
                match = re.search(r'\d{6}', lines[idx + 1])
                if match:
                    results['Eintritt'] = format_eintritt_date(match.group(0))
                    break
    except Exception as e:
        logging.warning(f"Eintritt extraction failed: {e}")

    # StKl (Steuerklasse) - extract from table
    try:
        for idx, line in enumerate(lines):
            if 'StKl' in line or 'Steuerklasse' in line:
                # Look for number in the same line or next line
                match = re.search(r'(\d)', line)
                if match:
                    results['StKl'] = match.group(1)
                    break
                elif idx + 1 < len(lines):
                    match = re.search(r'(\d)', lines[idx + 1])
                    if match:
                        results['StKl'] = match.group(1)
                        break
    except Exception as e:
        logging.warning(f"StKl extraction failed: {e}")

    # Krankenkasse (gesetzliche_krankenkasse) - extract from table
    try:
        for idx, line in enumerate(lines):
            if 'Krankenkasse' in line and 'KK %' in line:
                header_cols = line.strip().split()
                try:
                    kk_idx = header_cols.index('Krankenkasse')
                except ValueError:
                    kk_idx = None
                    for i, col in enumerate(header_cols):
                        if 'Krankenkasse' in col:
                            kk_idx = i
                            break
                if kk_idx is not None and idx + 1 < len(lines):
                    next_line = lines[idx + 1].strip().split()
                    krankenkasse_words = []
                    for word in next_line[kk_idx:]:
                        if re.match(r'^\d', word):
                            break
                        krankenkasse_words.append(word)
                    if krankenkasse_words:
                        results['Krankenkasse'] = ' '.join(krankenkasse_words)
                break
    except Exception as e:
        logging.warning(f"Krankenkasse extraction failed: {e}")

    # Betrag (look for label, then next line)
    try:
        for idx, line in enumerate(lines):
            if 'Betrag' in line:
                # Look for number in the next line
                if idx + 1 < len(lines):
                    match = re.search(r'(\d{1,3}(?:\.\d{3})*,\d{2})', lines[idx + 1])
                    if match:
                        results['Betrag'] = normalize_german_number(match.group(1))
                        break
    except Exception as e:
        logging.warning(f"Betrag extraction failed: {e}")

    # KV-Brutto (improved logic for numbers with dot and split values)
    try:
        for idx, line in enumerate(lines):
            if 'KV-Brutto' in line:
                header_cols = line.strip().split()
                try:
                    kv_idx = header_cols.index('KV-Brutto')
                except ValueError:
                    kv_idx = None
                    for i, col in enumerate(header_cols):
                        if 'KV-Brutto' in col:
                            kv_idx = i
                            break
                if kv_idx is not None and idx + 1 < len(lines):
                    value_cols = lines[idx + 1].strip().split()
                    # Remove leading non-numeric columns (like 'L', 'E', etc.)
                    while value_cols and not re.search(r'\d', value_cols[0]):
                        value_cols = value_cols[1:]
                    # Try to join split numbers (e.g., 1.322 ,32)
                    if len(value_cols) > kv_idx:
                        val = value_cols[kv_idx]
                        # If the value is split (e.g., 1.322 ,32), join with next col
                        if re.match(r'^\d{1,3}(?:\.\d{3})*$', val) and kv_idx + 1 < len(value_cols) and re.match(r'^,\d{2}$', value_cols[kv_idx + 1]):
                            val = val + value_cols[kv_idx + 1]
                        elif re.match(r'^\d{1,3}(?:\.\d{3})*,\d{2}$', val):
                            pass  # already in correct format
                        elif kv_idx + 2 < len(value_cols) and value_cols[kv_idx + 1] == ',' and re.match(r'^\d{2}$', value_cols[kv_idx + 2]):
                            val = val + ',' + value_cols[kv_idx + 2]
                        elif kv_idx + 1 < len(value_cols) and re.match(r'^\d{2}$', value_cols[kv_idx + 1]):
                            val = val + ',' + value_cols[kv_idx + 1]
                        # Normalize and assign
                        results['KV-Brutto'] = normalize_german_number(val)
                break
    except Exception as e:
        logging.warning(f"KV-Brutto extraction failed: {e}")

    # KV-Beitrag, RV-Beitrag, AV-Beitrag, PV-Beitrag extraction
    try:
        for idx, line in enumerate(lines):
            if 'KV-Beitrag' in line or 'RV-Beitrag' in line or 'AV-Beitrag' in line or 'PV-Beitrag' in line:
                logging.info(f"Found contribution headers in line: {line}")
                header_cols = line.strip().split()
                logging.info(f"Header columns: {header_cols}")

                # Map header labels to their indices
                header_index_map = {}
                for i, col in enumerate(header_cols):
                    if 'KV-Brutto' in col:
                        header_index_map['KV-Brutto'] = i
                    if 'RV-Brutto' in col:
                        header_index_map['RV-Brutto'] = i
                    if 'AV-Brutto' in col:
                        header_index_map['AV-Brutto'] = i
                    if 'PV-Brutto' in col:
                        header_index_map['PV-Brutto'] = i
                    if 'KV-Beitrag' in col:
                        header_index_map['KV-Beitrag'] = i
                    if 'RV-Beitrag' in col:
                        header_index_map['RV-Beitrag'] = i
                    if 'AV-Beitrag' in col:
                        header_index_map['AV-Beitrag'] = i
                    if 'PV-Beitrag' in col:
                        header_index_map['PV-Beitrag'] = i

                logging.info(f"Header index map: {header_index_map}")

                # Determine the first real data column in the header (aligns with first numeric in value row)
                possible_starts = [
                    header_index_map.get('KV-Brutto'), header_index_map.get('RV-Brutto'),
                    header_index_map.get('AV-Brutto'), header_index_map.get('PV-Brutto'),
                    header_index_map.get('KV-Beitrag'), header_index_map.get('RV-Beitrag'),
                    header_index_map.get('AV-Beitrag'), header_index_map.get('PV-Beitrag'),
                ]
                possible_starts = [x for x in possible_starts if x is not None]
                if not possible_starts:
                    continue
                start_idx = min(possible_starts)
                logging.info(f"Detected start index for numeric data: {start_idx}")

                if idx + 1 < len(lines):
                    value_line = lines[idx + 1]
                    logging.info(f"Value line: {value_line}")
                    value_cols = value_line.strip().split()
                    logging.info(f"Raw value columns: {value_cols}")

                    # Remove leading non-numeric columns (like 'L', 'E', etc.)
                    while value_cols and not re.search(r'\d', value_cols[0]):
                        value_cols = value_cols[1:]
                    logging.info(f"Value columns after cleanup: {value_cols}")

                    def read_value_for(label: str):
                        if label not in header_index_map:
                            return None
                        rel_index = header_index_map[label] - start_idx
                        if rel_index < 0 or rel_index >= len(value_cols):
                            logging.info(f"Relative index {rel_index} out of range for label {label}")
                            return None
                        val = value_cols[rel_index]
                        # Join split decimals like ['28', ',39']
                        if re.match(r'^\d+$', val) and rel_index + 1 < len(value_cols) and re.match(r'^,\d{2}$', value_cols[rel_index + 1]):
                            val = val + value_cols[rel_index + 1]
                        # Remove possible 'E' marker adjacent to value (e.g. 'E' column before value)
                        val = val.strip()
                        if val.upper() == 'E' and rel_index + 1 < len(value_cols):
                            val = value_cols[rel_index + 1]
                        # Normalize numbers that are like 2839 → 28,39
                        return normalize_german_number(val)

                    kvb = read_value_for('KV-Beitrag')
                    rvb = read_value_for('RV-Beitrag')
                    avb = read_value_for('AV-Beitrag')
                    pvb = read_value_for('PV-Beitrag')

                    if kvb is not None:
                        results['KV-Beitrag'] = kvb
                        logging.info(f"Extracted KV-Beitrag: {kvb}")
                    if rvb is not None:
                        results['RV-Beitrag'] = rvb
                        logging.info(f"Extracted RV-Beitrag: {rvb}")
                    if avb is not None:
                        results['AV-Beitrag'] = avb
                        logging.info(f"Extracted AV-Beitrag: {avb}")
                    if pvb is not None:
                        results['PV-Beitrag'] = pvb
                        logging.info(f"Extracted PV-Beitrag: {pvb}")
                break
    except Exception as e:
        logging.warning(f"Contribution extraction failed: {e}")

    # SV-Abzug (look for label, then next line)
    try:
        for idx, line in enumerate(lines):
            if 'SV-rechtliche Abzüge' in line:
                if idx + 1 < len(lines):
                    match = re.search(r'(\d{1,3}(?:\.\d{3})*,\d{2})', lines[idx + 1])
                    if match:
                        results['SV-Abzug'] = normalize_german_number(match.group(1))
                        break
    except Exception as e:
        logging.warning(f"SV-Abzug extraction failed: {e}")

    # Netto (look for label, then next line)
    try:
        for idx, line in enumerate(lines):
            if 'Netto-Verdienst' in line or 'Netto-Verdiens' in line:
                if idx + 1 < len(lines):
                    match = re.search(r'(\d{1,3}(?:\.\d{3})*,\d{2})', lines[idx + 1])
                    if match:
                        results['Netto'] = normalize_german_number(match.group(1))
                        break
    except Exception as e:
        logging.warning(f"Netto extraction failed: {e}")

    # Personal-Nr (arbeitnehmernummer) - extract from PDF
    try:
        for idx, line in enumerate(lines):
            if 'Personal-Nr' in line or 'Pers.-Nr' in line:
                # Look for number in the same line or next line
                match = re.search(r'(\d{5,})', line)
                if match:
                    results['Personal-Nr'] = match.group(1)
                    break
                elif idx + 1 < len(lines):
                    match = re.search(r'(\d{5,})', lines[idx + 1])
                    if match:
                        results['Personal-Nr'] = match.group(1)
                        break
    except Exception as e:
        logging.warning(f"Personal-Nr extraction failed: {e}")

    # Ki.Frbtr (kinderfreibetraege) - extract from PDF using table-aware logic
    try:
        for idx, line in enumerate(lines):
            if 'Ki.Frbtr' in line or 'Ki.Frbtr.' in line:
                logging.info(f"Found Ki.Frbtr header in line: {line}")
                
                # IMPROVED APPROACH: Use column-based positioning with better alignment
                header_cols = line.strip().split()
                logging.info(f"Header columns: {header_cols}")
                
                # Find the index of Ki.Frbtr in the header
                kifrbtr_idx = None
                for i, col in enumerate(header_cols):
                    if 'Ki.Frbtr' in col:
                        kifrbtr_idx = i
                        logging.info(f"Ki.Frbtr found at column index: {kifrbtr_idx}")
                        break
                
                if kifrbtr_idx is not None and idx + 1 < len(lines):
                    value_line = lines[idx + 1]
                    logging.info(f"Value line: {value_line}")
                    value_cols = value_line.strip().split()
                    logging.info(f"Value columns: {value_cols}")
                    
                    # Check if value line has enough columns (Ki.Frbtr is typically at position 3-4)
                    if len(value_cols) <= 4:
                        logging.info(f"Value line has only {len(value_cols)} columns, Ki.Frbtr column likely missing - setting to null")
                        val = None
                    else:
                        # IMPROVED: Handle empty spaces in columns by using more robust alignment
                        # If the value columns don't align properly, try to find the Ki.Frbtr value by position
                        if len(value_cols) > kifrbtr_idx:
                            val = value_cols[kifrbtr_idx]
                            logging.info(f"Ki.Frbtr column value: '{val}'")
                            
                            # Check if the value is empty or just whitespace
                            if not val or not val.strip():
                                logging.info("Ki.Frbtr column is empty, trying alternative method...")
                                # Find all numbers in the value line
                                number_matches = re.findall(r'\b(\d+)\b', value_line)
                                logging.info(f"All numbers found: {number_matches}")
                                
                                # Look for numbers that are likely Ki.Frbtr values (small numbers, not dates or IDs)
                                for num in number_matches:
                                    num_val = int(num)
                                    # Ki.Frbtr is typically 0-10 range, not dates or IDs
                                    if 0 < num_val <= 10:
                                        results['Ki.Frbtr'] = f"{num_val / 10:.1f}"
                                        logging.info(f"Ki.Frbtr FINAL extracted (alternative): {results['Ki.Frbtr']}")
                                        break
                                else:
                                    logging.info("No suitable Ki.Frbtr value found in alternative method")
                                    val = None
                        else:
                            logging.info(f"Ki.Frbtr column index {kifrbtr_idx} is out of range for value columns {len(value_cols)}")
                            val = None
                    
                    # ONLY process if it's a valid number and not empty
                    if val and val.strip():
                        # Check for comma-separated decimal (e.g., 0,5)
                        if re.match(r'^\d+,\d+$', val.strip()):
                            results['Ki.Frbtr'] = val.replace(',', '.')
                            logging.info(f"Ki.Frbtr FINAL extracted (comma): {results['Ki.Frbtr']}")
                        # Check for dot-separated decimal (e.g., 0.5)
                        elif re.match(r'^\d+\.\d+$', val.strip()):
                            results['Ki.Frbtr'] = val
                            logging.info(f"Ki.Frbtr FINAL extracted (dot): {results['Ki.Frbtr']}")
                        # Check for plain number (e.g., 05 -> 0.5)
                        elif re.match(r'^\d+$', val.strip()):
                            num_val = int(val)
                            if num_val < 100:
                                results['Ki.Frbtr'] = f"{num_val / 10:.1f}"
                            else:
                                results['Ki.Frbtr'] = val
                            logging.info(f"Ki.Frbtr FINAL extracted (number): {results['Ki.Frbtr']}")
                        else:
                            logging.info(f"Ki.Frbtr value '{val}' is not a valid number format, NOT setting anything")
                    else:
                        logging.info(f"Ki.Frbtr value '{val}' is empty, NOT setting anything")
                else:
                    logging.info(f"Ki.Frbtr column index {kifrbtr_idx} is out of range for value columns {len(value_cols)}")
                    # Don't use fallback method - if column alignment fails, don't extract anything
                    logging.info("Column alignment failed, NOT extracting Ki.Frbtr to avoid cross-contamination")
                break
    except Exception as e:
        logging.warning(f"Ki.Frbtr extraction failed: {e}")

    # SV-Nummer (versicherungsnummer) - extract from PDF
    try:
        for idx, line in enumerate(lines):
            if 'SV-Nummer' in line:
                # Look for SV-Nummer pattern (e.g., 09130389K613)
                match = re.search(r'(\d{8,}[A-Z]\d{3})', line)
                if match:
                    results['SV-Nummer'] = match.group(1)
                    break
                elif idx + 1 < len(lines):
                    match = re.search(r'(\d{8,}[A-Z]\d{3})', lines[idx + 1])
                    if match:
                        results['SV-Nummer'] = match.group(1)
                        break
    except Exception as e:
        logging.warning(f"SV-Nummer extraction failed: {e}")

    # Steuer-ID (identifikationsnummer) - extract from PDF
    try:
        for idx, line in enumerate(lines):
            if 'Steuer-ID' in line:
                # Look for Steuer-ID pattern (e.g., 45476214031)
                match = re.search(r'(\d{11})', line)
                if match:
                    results['Steuer-ID'] = match.group(1)
                    break
                elif idx + 1 < len(lines):
                    match = re.search(r'(\d{11})', lines[idx + 1])
                    if match:
                        results['Steuer-ID'] = match.group(1)
                        break
    except Exception as e:
        logging.warning(f"Steuer-ID extraction failed: {e}")

    # Address extraction - strasse_hausnummer and plz_ort
    try:
        # Look for address lines after employee name
        for idx, line in enumerate(lines):
            # Skip lines that are likely headers or table data
            if any(header in line.lower() for header in ['personal-nr', 'geburtsdatum', 'stkl', 'krankenkasse', 'brutto', 'netto', 'betrag']):
                continue
            
            # Look for lines that contain street patterns (German street names)
            if re.search(r'\b[A-Za-zäöüÄÖÜ]+straße\s+\d+', line) or re.search(r'\b[A-Za-zäöüÄÖÜ]+str\.\s+\d+', line):
                logging.info(f"Found potential street line: {line}")
                # Extract street and house number
                street_match = re.search(r'([A-Za-zäöüÄÖÜ]+straße\s+\d+|[A-Za-zäöüÄÖÜ]+str\.\s+\d+)', line)
                if street_match:
                    results['strasse_hausnummer'] = street_match.group(1).strip()
                    logging.info(f"Extracted strasse_hausnummer: {results['strasse_hausnummer']}")
                
                # Look for PLZ and city in the same line or next line
                plz_city_match = re.search(r'(\d{5})\s+([A-Za-zäöüÄÖÜß\s]+)', line)
                if plz_city_match:
                    plz = plz_city_match.group(1)
                    city = plz_city_match.group(2).strip()
                    logging.info(f"PLZ match found: '{plz_city_match.group(0)}'")
                    logging.info(f"PLZ: '{plz}', City: '{city}'")
                    results['plz_ort'] = f"{plz} {city}"
                    logging.info(f"Extracted plz_ort: {results['plz_ort']}")
                elif idx + 1 < len(lines):
                    # Try next line for PLZ and city
                    next_line = lines[idx + 1]
                    logging.info(f"Checking next line for PLZ: '{next_line}'")
                    plz_city_match = re.search(r'(\d{5})\s+([A-Za-zäöüÄÖÜß\s]+)', next_line)
                    if plz_city_match:
                        plz = plz_city_match.group(1)
                        city = plz_city_match.group(2).strip()
                        logging.info(f"PLZ match found in next line: '{plz_city_match.group(0)}'")
                        logging.info(f"PLZ: '{plz}', City: '{city}'")
                        results['plz_ort'] = f"{plz} {city}"
                        logging.info(f"Extracted plz_ort from next line: {results['plz_ort']}")
                break
    except Exception as e:
        logging.warning(f"Address extraction failed: {e}")

    # Bank and Konto extraction
    try:
        # Search through all lines more thoroughly
        for idx, line in enumerate(lines):
            logging.info(f"Checking line {idx}: {line}")
            
            # Define flexible label regexes to handle OCR spacing like 'B a nk' / 'K o nto'
            bank_label_regex = re.compile(r"b\s*a\s*n?\s*k", re.IGNORECASE)
            konto_label_regex = re.compile(r"k\s*o\s*n\s*t\s*o", re.IGNORECASE)
            
            # Look for Bank label robustly
            if bank_label_regex.search(line):
                logging.info(f"Found Bank label in line: {line}")
                
                # Extract bank name: everything after the Bank label up to known terminators or EOL
                # Known terminators: Konto, SV-AG, Zus., Gesamtkosten, Auszahlungsbetrag
                bank_name_match = re.search(
                    r"(?:b\s*a\s*n?\s*k|bank)\s*[:\-]?\s*(.+?)\s*(?=(?:k\s*o\s*n\s*t\s*o|SV-AG|Zus\.|Gesamtkosten|Auszahlungsbetrag)|$)",
                    line,
                    re.IGNORECASE,
                )
                if bank_name_match:
                    bank_name = bank_name_match.group(1).strip()
                    # Collapse multiple spaces
                    bank_name = re.sub(r"\s{2,}", " ", bank_name)
                    if bank_name:
                        results['Bank'] = bank_name
                        logging.info(f"Extracted Bank: {results['Bank']}")
                else:
                    logging.info("No bank name matched with robust pattern; will continue to search next lines if needed")
                
                # Look for Konto in the same line or next few lines
                konto_match = re.search(r"(?:k\s*o\s*n\s*t\s*o|konto)\s*[:\-]?\s*([A-Z0-9\s]+?)(?=\s+[A-Z]|$)", line, re.IGNORECASE)
                if konto_match:
                    konto = konto_match.group(1).strip()
                    # Clean up the IBAN by removing extra spaces and ensuring it's complete
                    konto = re.sub(r'\s+', ' ', konto).strip()
                    results['Konto'] = konto
                    logging.info(f"Extracted Konto from same line: {results['Konto']}")
                else:
                    logging.info("No konto match found in same line")
                
                # If Konto not found, check next few lines
                if not results.get('Konto'):
                    for next_idx in range(idx + 1, min(idx + 4, len(lines))):
                        next_line = lines[next_idx]
                        logging.info(f"Checking line {next_idx} for Konto: '{next_line}'")
                        konto_match = re.search(r"(?:k\s*o\s*n\s*t\s*o|konto)\s*[:\-]?\s*([A-Z0-9\s]+?)(?=\s+[A-Z]|$)", next_line, re.IGNORECASE)
                        if konto_match:
                            konto = konto_match.group(1).strip()
                            # Clean up the IBAN by removing extra spaces and ensuring it's complete
                            konto = re.sub(r'\s+', ' ', konto).strip()
                            results['Konto'] = konto
                            logging.info(f"Extracted Konto from line {next_idx}: {results['Konto']}")
                            break
                        else:
                            logging.info(f"No konto match found in line {next_idx}")
                break
            
            # Also look for Konto if Bank wasn't found
            elif konto_label_regex.search(line):
                logging.info(f"Found Konto label in line: {line}")
                konto_match = re.search(r"(?:k\s*o\s*n\s*t\s*o|konto)\s*[:\-]?\s*([A-Z0-9\s]+?)(?=\s+[A-Z]|$)", line, re.IGNORECASE)
                if konto_match:
                    konto = konto_match.group(1).strip()
                    # Clean up the IBAN by removing extra spaces and ensuring it's complete
                    konto = re.sub(r'\s+', ' ', konto).strip()
                    results['Konto'] = konto
                    logging.info(f"Extracted Konto: {results['Konto']}")
                else:
                    logging.info("No konto match found with current patterns")
                break
        else:
            logging.info("No Bank or Konto lines found in primary search")
    except Exception as e:
        logging.warning(f"Bank/Konto extraction failed: {e}")

    # Fallback: Look for IBAN pattern if Bank/Konto extraction failed
    if not results.get('Konto'):
        logging.info("Trying fallback IBAN extraction...")
        try:
            for idx, line in enumerate(lines):
                # Look for IBAN pattern (DE followed by 2 digits, then 4 groups of 4 digits)
                # This pattern matches the full IBAN: DE30 8505 0300 1225 4209 34
                iban_match = re.search(r'DE\d{2}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{2}', line)
                if iban_match:
                    konto = iban_match.group(0)
                    results['Konto'] = konto
                    logging.info(f"Extracted IBAN via fallback: {results['Konto']}")
                    break
                # Also try a more flexible pattern that might catch partial IBANs
                iban_match = re.search(r'DE\d{2}\s+\d{4}\s+\d{4}\s+\d{4}\s+\d{4}', line)
                if iban_match:
                    konto = iban_match.group(0)
                    results['Konto'] = konto
                    logging.info(f"Extracted partial IBAN via fallback: {results['Konto']}")
                    break
        except Exception as e:
            logging.warning(f"Fallback IBAN extraction failed: {e}")

    # Fallback: Look for Bank name if Bank extraction failed
    if not results.get('Bank'):
        logging.info("Trying fallback Bank extraction...")
        try:
            for idx, line in enumerate(lines):
                if bank_label_regex.search(line):
                    logging.info(f"Found Bank label in fallback: {line}")
                    bank_name_match = re.search(
                        r"(?:b\s*a\s*n?\s*k|bank)\s*[:\-]?\s*(.+?)\s*(?=(?:k\s*o\s*n\s*t\s*o|SV-AG|Zus\.|Gesamtkosten|Auszahlungsbetrag)|$)",
                        line,
                        re.IGNORECASE,
                    )
                    if bank_name_match:
                        bank_name = bank_name_match.group(1).strip()
                        bank_name = re.sub(r"\s{2,}", " ", bank_name)
                        if bank_name and len(bank_name) > 2:
                            results['Bank'] = bank_name
                            logging.info(f"Extracted Bank via fallback: {results['Bank']}")
                            break
                    else:
                        logging.info("Bank regex pattern didn't match in fallback")
        except Exception as e:
            logging.warning(f"Fallback Bank extraction failed: {e}")

    # Final logging to show what was extracted
    logging.info(f"FINAL Ki.Frbtr result: {results.get('Ki.Frbtr')}")
    logging.info(f"FINAL Ki.Frbtr type: {type(results.get('Ki.Frbtr'))}")

    return results 