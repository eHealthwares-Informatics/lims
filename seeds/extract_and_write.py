#!/usr/bin/env python3
"""Extract OpenELIS seed data into rxsoft-lis CSV files.

Reads the OpenELIS-Global.sql COPY blocks and generates CSVs
with columns matching rxsoft-lis entities. Uses 'code' column
as the domain key for cross-referencing.
"""

import csv
import os
import re
import sys

SQL_PATH = "/Users/john/develop/OpenELIS-Global-2/db/dbInit/OpenELIS-Global.sql"
OUT_DIR = "/Users/john/develop/rxsoft/rxsoft-lis-backend/seeds"
DICT_OUT_DIR = "/Users/john/develop/rxsoft/healthcare-concepts/seeds"


def parse_copy_blocks(sql_path):
    """Parse PostgreSQL COPY blocks from the SQL dump.
    Returns dict of table_name -> list of dicts (column_name -> value).
    """
    with open(sql_path, "r", encoding="utf-8") as f:
        content = f.read()

    tables = {}
    # Match COPY clinlims.table_name (col1, col2, ...) FROM stdin;
    # followed by data rows, terminated by \.
    pattern = re.compile(
        r'COPY clinlims\.(\w+)\s*\(([^)]+)\)\s*FROM\s*stdin;'
        r'\s*(.*?)'
        r'\\\.',
        re.DOTALL
    )

    for match in pattern.finditer(content):
        table_name = match.group(1)
        col_names = [c.strip().strip('"') for c in match.group(2).split(",")]
        data_text = match.group(3).strip()

        rows = []
        for line in data_text.split("\n"):
            line = line.strip()
            if not line:
                continue
            # Split by tab, preserving \N as None
            values = line.split("\t")
            row = {}
            for i, col in enumerate(col_names):
                val = values[i] if i < len(values) else ""
                if val == "\\N":
                    val = ""
                row[col] = val
            rows.append(row)

        tables[table_name] = {"columns": col_names, "rows": rows}

    return tables


def write_csv(filename, fieldnames, rows, transform_fn=None):
    """Write a CSV file with the given fieldnames and rows."""
    filepath = os.path.join(OUT_DIR, filename)
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            if transform_fn:
                row = transform_fn(row)
            writer.writerow(row)
    print(f"  Wrote {filepath} ({len(rows)} rows)")


def write_csv_to(filename, fieldnames, rows, transform_fn=None, out_dir=DICT_OUT_DIR):
    """Write a CSV file to a given output dir (used for cross-package copies)."""
    filepath = os.path.join(out_dir, filename)
    os.makedirs(out_dir, exist_ok=True)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            if transform_fn:
                row = transform_fn(row)
            writer.writerow(row)
    print(f"  Wrote {filepath} ({len(rows)} rows)")


def clean_val(val):
    """Clean a value for CSV output."""
    if val is None or val == "" or val == "\\N":
        return ""
    return val.strip()


# === TRANSFORM FUNCTIONS ===

def transform_method(row):
    """OpenELIS method -> lis_methods.csv"""
    return {
        "openelisId": clean_val(row.get("id", "")),
        "code": clean_val(row.get("name", "")),
        "name": clean_val(row.get("description", row.get("name", ""))),
        "description": clean_val(row.get("reporting_description", "")),
        "active": "true" if row.get("is_active", "Y") == "Y" else "false",
    }


def transform_test_section(row):
    """OpenELIS test_section -> lis_test_sections.csv"""
    code = clean_val(row.get("name", ""))
    return {
        "openelisId": clean_val(row.get("id", "")),
        "code": code,
        "name": clean_val(row.get("description", code)),
        "description": clean_val(row.get("description", "")),
        "sortOrder": clean_val(row.get("sort_order", "0")),
        "active": "true" if row.get("is_active", "Y") == "Y" else "false",
    }


def transform_uom(row):
    """OpenELIS unit_of_measure -> lis_units_of_measurement.csv"""
    name = clean_val(row.get("name", ""))
    code = f"UOM-{name.replace('/', '-').replace('^', '-')}"
    return {
        "openelisId": clean_val(row.get("id", "")),
        "code": code,
        "name": name,
        "description": clean_val(row.get("description", name)),
        "active": "true",
    }


def transform_project_to_program(row):
    """OpenELIS project -> lis_programs.csv"""
    code = clean_val(row.get("program_code", ""))
    if not code:
        code = f"PRG-{clean_val(row.get('name', '')).upper().replace(' ', '_')}"
    return {
        "openelisId": clean_val(row.get("id", "")),
        "code": code,
        "name": clean_val(row.get("name", "")),
        "description": clean_val(row.get("description", "")),
        "active": "true" if row.get("is_active", "1") in ("Y", "1", "t") else "false",
    }


def transform_type_of_sample(row):
    """OpenELIS type_of_sample -> lis_sample_types.csv"""
    description = clean_val(row.get("description", ""))
    abbrev = clean_val(row.get("local_abbrev", ""))
    return {
        "openelisId": clean_val(row.get("id", "")),
        "key": clean_val(row.get("local_abbrev", description)),
        "name": description,
        "description": description,
        "accessionCode": abbrev[:3].upper() if abbrev else description[:3].upper(),
        "active": "true" if row.get("is_active", "t") in ("Y", "t", "true") else "false",
    }


def transform_status(row):
    """OpenELIS status_of_sample -> lis_statuses.csv"""
    code = clean_val(row.get("code", ""))
    status_type = clean_val(row.get("status_type", "ORDER"))
    return {
        "code": f"{status_type}_{code}",
        "name": clean_val(row.get("name", row.get("description", ""))),
        "description": clean_val(row.get("description", "")),
        "domain": status_type,
        "sortOrder": clean_val(row.get("id", "0")),
        "active": "true" if row.get("is_active", "Y") == "Y" else "false",
    }


def transform_dictionary_category(row):
    """OpenELIS dictionary_category -> csv"""
    name = clean_val(row.get("name", ""))
    code = f"DCT-{name.upper().replace(' ', '_').replace('(', '').replace(')', '')}"
    return {
        "openelisId": clean_val(row.get("id", "")),
        "code": code,
        "name": name,
        "description": clean_val(row.get("description", name)),
        "localAbbrev": clean_val(row.get("local_abbrev", "")),
    }


def transform_source_of_sample(row):
    """OpenELIS source_of_sample -> csv"""
    code = clean_val(row.get("description", "")).upper().replace(" ", "_").replace("'", "")
    return {
        "openelisId": clean_val(row.get("id", "")),
        "code": code,
        "description": clean_val(row.get("description", "")),
        "domain": clean_val(row.get("domain", "H")),
    }


def transform_observation_history_type(row):
    """OpenELIS observation_history_type -> csv"""
    type_name = clean_val(row.get("type_name", ""))
    return {
        "openelisId": clean_val(row.get("id", "")),
        "typeName": type_name,
        "description": clean_val(row.get("description", type_name)),
    }


def transform_reference_table(row):
    """OpenELIS reference_tables -> csv"""
    name = clean_val(row.get("name", ""))
    return {
        "openelisId": clean_val(row.get("id", "")),
        "name": name,
        "keepHistory": clean_val(row.get("keep_history", "N")),
        "isHl7Encoded": clean_val(row.get("is_hl7_encoded", "N")),
    }


def transform_analyte(row):
    """OpenELIS analyte -> csv"""
    name = clean_val(row.get("name", ""))
    code = name.upper().replace(" ", "_").replace("/", "_").replace("-", "_")[:50]
    return {
        "openelisId": clean_val(row.get("id", "")),
        "code": code,
        "name": name,
        "isActive": "true" if row.get("is_active", "Y") == "Y" else "false",
    }


def transform_test(row):
    """OpenELIS test -> lis_test_definitions.csv"""
    description = clean_val(row.get("description", ""))
    name = clean_val(row.get("name", description))
    local_code = clean_val(row.get("local_code", name))
    loinc = clean_val(row.get("loinc", ""))
    return {
        "openelisId": clean_val(row.get("id", "")),
        "code": local_code,
        "name": name,
        "description": description,
        "loinc": loinc,
        "reportingDescription": clean_val(row.get("reporting_description", "")),
        "methodId": clean_val(row.get("method_id", "")),
        "uomId": clean_val(row.get("uom_id", "")),
        "testSectionId": clean_val(row.get("test_section_id", "")),
        "isActive": "true" if row.get("is_active", "Y") == "Y" else "false",
        "isReportable": "true" if row.get("is_reportable", "N") == "Y" else "false",
        "orderable": "true" if row.get("orderable", "t") in ("t", "true", "Y") else "false",
        "sortOrder": clean_val(row.get("sort_order", "0")),
        "guid": clean_val(row.get("guid", "")),
    }


def transform_result_limit(row):
    """OpenELIS result_limits -> lis_reference_ranges.csv"""
    return {
        "testId": clean_val(row.get("test_id", "")),
        "testResultTypeId": clean_val(row.get("test_result_type_id", "")),
        "minAge": clean_val(row.get("min_age", "0")),
        "maxAge": clean_val(row.get("max_age", "")),
        "gender": clean_val(row.get("gender", "")),
        "lowNormal": clean_val(row.get("low_normal", "")),
        "highNormal": clean_val(row.get("high_normal", "")),
        "lowValid": clean_val(row.get("low_valid", "")),
        "highValid": clean_val(row.get("high_valid", "")),
        "normalDictionaryId": clean_val(row.get("normal_dictionary_id", "")),
        "alwaysValidate": clean_val(row.get("always_validate", "")),
    }


def transform_sampletype_test(row):
    """OpenELIS sampletype_test -> csv"""
    return {
        "sampleTypeId": clean_val(row.get("sample_type_id", "")),
        "testId": clean_val(row.get("test_id", "")),
        "isPanel": clean_val(row.get("is_panel", "")),
    }


def transform_test_result(row):
    """OpenELIS test_result -> csv"""
    return {
        "testId": clean_val(row.get("test_id", "")),
        "resultGroup": clean_val(row.get("result_group", "")),
        "testResultType": clean_val(row.get("tst_rslt_type", "")),
        "value": clean_val(row.get("value", "")),
        "significantDigits": clean_val(row.get("significant_digits", "")),
        "sortOrder": clean_val(row.get("sort_order", "")),
        "isQuantifiable": "true" if row.get("is_quantifiable", "f") in ("t", "true", "Y") else "false",
        "isActive": "true" if row.get("is_active", "t") in ("t", "true", "Y") else "false",
        "isNormal": clean_val(row.get("is_normal", "")),
    }


def transform_panel(row):
    """OpenELIS panel -> lis_panels.csv"""
    name = clean_val(row.get("name", ""))
    code = name.upper().replace(" ", "_").replace("/", "_").replace("-", "_")[:50]
    return {
        "code": code,
        "name": name,
        "description": clean_val(row.get("description", name)),
        "sortOrder": clean_val(row.get("sort_order", "0")),
        "isActive": "true" if row.get("is_active", "Y") == "Y" else "false",
    }


def transform_panel_item(row):
    """OpenELIS panel_item -> lis_panel_items.csv"""
    return {
        "panelId": clean_val(row.get("panel_id", "")),
        "testId": clean_val(row.get("test_id", "")),
        "sortOrder": clean_val(row.get("sort_order", "0")),
    }


def transform_dictionary(row):
    """OpenELIS dictionary -> csv"""
    entry = clean_val(row.get("dict_entry", ""))
    code = entry.upper().replace(" ", "_").replace("/", "_").replace("-", "_").replace("(", "").replace(")", "")[:50]
    return {
        "code": code,
        "dictEntry": entry,
        "localAbbrev": clean_val(row.get("local_abbrev", "")),
        "dictionaryCategoryId": clean_val(row.get("dictionary_category_id", "")),
        "displayKey": clean_val(row.get("display_key", "")),
        "sortOrder": clean_val(row.get("sort_order", "0")),
        "isActive": "true" if row.get("is_active", "Y") == "Y" else "false",
    }


def main():
    print("Parsing OpenELIS-Global.sql COPY blocks...")
    tables = parse_copy_blocks(SQL_PATH)
    print(f"  Found {len(tables)} COPY blocks with data")

    # === METHODS ===
    if "method" in tables:
        write_csv(
            "lis_methods.csv",
            ["openelisId", "code", "name", "description", "active"],
            tables["method"]["rows"],
            transform_method,
        )

    # === TEST SECTIONS ===
    if "test_section" in tables:
        write_csv(
            "lis_test_sections.csv",
            ["openelisId", "code", "name", "description", "sortOrder", "active"],
            tables["test_section"]["rows"],
            transform_test_section,
        )

    # === UNITS OF MEASUREMENT ===
    if "unit_of_measure" in tables:
        write_csv(
            "lis_units_of_measurement.csv",
            ["openelisId", "code", "name", "description", "active"],
            tables["unit_of_measure"]["rows"],
            transform_uom,
        )

    # === PROGRAMS (from OpenELIS project) ===
    if "project" in tables:
        write_csv(
            "lis_programs.csv",
            ["openelisId", "code", "name", "description", "active"],
            tables["project"]["rows"],
            transform_project_to_program,
        )

    # === SAMPLE TYPES ===
    if "type_of_sample" in tables:
        write_csv(
            "lis_sample_types.csv",
            ["openelisId", "key", "name", "description", "accessionCode", "active"],
            tables["type_of_sample"]["rows"],
            transform_type_of_sample,
        )

    # === STATUSES ===
    if "status_of_sample" in tables:
        write_csv(
            "lis_statuses.csv",
            ["code", "name", "description", "domain", "sortOrder", "active"],
            tables["status_of_sample"]["rows"],
            transform_status,
        )

    # === DICTIONARY CATEGORIES ===
    if "dictionary_category" in tables:
        dict_fields = ["openelisId", "code", "name", "description", "localAbbrev"]
        write_csv(
            "lis_dictionary_categories.csv",
            dict_fields,
            tables["dictionary_category"]["rows"],
            transform_dictionary_category,
        )
        write_csv_to(
            "lis_dictionary_categories.csv",
            dict_fields,
            tables["dictionary_category"]["rows"],
            transform_dictionary_category,
        )

    # === SOURCES OF SAMPLE ===
    if "source_of_sample" in tables:
        write_csv(
            "lis_source_of_samples.csv",
            ["openelisId", "code", "description", "domain"],
            tables["source_of_sample"]["rows"],
            transform_source_of_sample,
        )

    # === OBSERVATION HISTORY TYPES ===
    if "observation_history_type" in tables:
        write_csv(
            "lis_observation_history_types.csv",
            ["openelisId", "typeName", "description"],
            tables["observation_history_type"]["rows"],
            transform_observation_history_type,
        )

    # === REFERENCE TABLES ===
    if "reference_tables" in tables:
        write_csv(
            "lis_reference_tables.csv",
            ["openelisId", "name", "keepHistory", "isHl7Encoded"],
            tables["reference_tables"]["rows"],
            transform_reference_table,
        )

    # === ANALYTES ===
    if "analyte" in tables:
        write_csv(
            "lis_analytes.csv",
            ["openelisId", "code", "name", "isActive"],
            tables["analyte"]["rows"],
            transform_analyte,
        )

    # === TESTS ===
    if "test" in tables:
        write_csv(
            "lis_test_definitions.csv",
            [
                "openelisId", "code", "name", "description", "loinc",
                "reportingDescription", "methodId", "uomId",
                "testSectionId", "isActive", "isReportable",
                "orderable", "sortOrder", "guid",
            ],
            tables["test"]["rows"],
            transform_test,
        )

    # === RESULT LIMITS ===
    if "result_limits" in tables:
        write_csv(
            "lis_reference_ranges.csv",
            [
                "testId", "testResultTypeId", "minAge", "maxAge",
                "gender", "lowNormal", "highNormal", "lowValid",
                "highValid", "normalDictionaryId", "alwaysValidate",
            ],
            tables["result_limits"]["rows"],
            transform_result_limit,
        )

    # === SAMPLETYPE_TEST ===
    if "sampletype_test" in tables:
        write_csv(
            "lis_sampletype_tests.csv",
            ["sampleTypeId", "testId", "isPanel"],
            tables["sampletype_test"]["rows"],
            transform_sampletype_test,
        )

    # === TEST RESULTS ===
    if "test_result" in tables:
        write_csv(
            "lis_test_results.csv",
            [
                "testId", "resultGroup", "testResultType",
                "value", "significantDigits", "sortOrder",
                "isQuantifiable", "isActive", "isNormal",
            ],
            tables["test_result"]["rows"],
            transform_test_result,
        )

    # === PANELS ===
    if "panel" in tables:
        write_csv(
            "lis_panels.csv",
            ["code", "name", "description", "sortOrder", "isActive"],
            tables["panel"]["rows"],
            transform_panel,
        )

    # === PANEL ITEMS ===
    if "panel_item" in tables:
        write_csv(
            "lis_panel_items.csv",
            ["panelId", "testId", "sortOrder"],
            tables["panel_item"]["rows"],
            transform_panel_item,
        )

    # === DICTIONARY ===
    if "dictionary" in tables:
        dict_fields = [
            "code", "dictEntry", "localAbbrev",
            "dictionaryCategoryId", "displayKey",
            "sortOrder", "isActive",
        ]
        write_csv(
            "lis_dictionary_entries.csv",
            dict_fields,
            tables["dictionary"]["rows"],
            transform_dictionary,
        )
        write_csv_to(
            "lis_dictionary_entries.csv",
            dict_fields,
            tables["dictionary"]["rows"],
            transform_dictionary,
        )

    print("\nDone! All CSV files generated.")


if __name__ == "__main__":
    main()