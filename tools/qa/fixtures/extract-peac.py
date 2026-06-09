#!/usr/bin/env python3
"""Regenerate peac-amortization.json from the PEAC reference workbook.

The PEAC ".xlsx" is a real lender's factor-rate amortization schedule, used as a
golden-file oracle for our AmoSchedule calculator (LEN-129). If PEAC ships an
updated sheet, drop it in beside this script and re-run:

    python3 extract-peac.py

Dependency-free (stdlib only). The schedule lives in the "Ammoritization
Schedule" block: file rows 45..68 are payment periods 1..24, columns
A..F = period, date, payment, interest, principal, balance.
"""
import json
import os
import zipfile
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
XLSX = os.path.join(HERE, "CapCalc - Amortization Schedule from PEAC.xlsx")
OUT = os.path.join(HERE, "peac-amortization.json")
NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
T = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"


def col(ref):
    letters = "".join(c for c in ref if c.isalpha())
    n = 0
    for c in letters:
        n = n * 26 + (ord(c) - 64)
    return n


def num(x):
    try:
        return round(float(x), 2)
    except (TypeError, ValueError):
        return None


def main():
    z = zipfile.ZipFile(XLSX)
    shared = []
    for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("a:si", NS):
        shared.append("".join(t.text or "" for t in si.iter(T)))
    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows = []
    for row in sheet.find("a:sheetData", NS).findall("a:row", NS):
        cells = {}
        for c in row.findall("a:c", NS):
            v = c.find("a:v", NS)
            val = "" if v is None else v.text
            if c.get("t") == "s":
                val = shared[int(val)]
            cells[col(c.get("r"))] = val
        rows.append(cells)

    schedule = []
    for i in range(44, 68):  # file rows 45..68 -> periods 1..24
        c = rows[i]
        schedule.append({
            "period": int(float(c[1])),
            "payment": num(c.get(3)),
            "interest": num(c.get(4)),
            "principal": num(c.get(5)),
            "balance": num(c.get(6)),
        })

    golden = {
        "source": "CapCalc - Amortization Schedule from PEAC.xlsx",
        "note": "Real lender factor-rate schedule used as golden-file oracle (LEN-129).",
        "inputs": {
            "loan": 250000,
            "factor": 1.38,
            "termMonths": 24,
            "frequency": "monthly",
            "originationFeePct": 2.5,
        },
        "expected": {"totalPayback": 345000, "monthlyPayment": 14375, "periods": 24},
        "schedule": schedule,
    }
    with open(OUT, "w") as f:
        json.dump(golden, f, indent=2)
    print(f"wrote {OUT}: {len(schedule)} periods")


if __name__ == "__main__":
    main()
