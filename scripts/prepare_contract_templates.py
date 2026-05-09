"""
One-shot script to convert template_contract.docx into two Sablon-ready templates:
  backend/lib/templates/contract_cdd.docx
  backend/lib/templates/contract_cdi.docx

Yellow-highlighted runs in each paragraph are merged into one run and replaced
with the appropriate {{variable}} placeholder for Sablon rendering.

Usage:
  python3 scripts/prepare_contract_templates.py
"""

import zipfile
import shutil
import os
import re
import copy
from lxml import etree

SRC = os.path.expanduser("~/Downloads/template_contract.docx")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "lib", "templates")
os.makedirs(OUT_DIR, exist_ok=True)

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

def w(tag):
    return f"{{{W}}}{tag}"

def get_yellow_text(run):
    rpr = run.find(w("rPr"))
    if rpr is None:
        return None
    hl = rpr.find(w("highlight"))
    if hl is not None and hl.get(w("val")) == "yellow":
        return "".join(t.text or "" for t in run.findall(w("t")))
    return None

def is_yellow(run):
    return get_yellow_text(run) is not None

def map_yellow_to_variable(text):
    """Map merged yellow text content to Sablon variable replacement."""
    t = text.strip()

    if "السيد(ة):" in t:
        return "السيد(ة): {{employee_name}}"
    if "تاريخ ومحل الميلاد" in t:
        return "تاريخ ومحل الميلاد: {{birth_date}} - {{birth_place}}"
    if "الرقم الوطني للتعريف" in t:
        return "الرقم الوطني للتعريف: {{nni}}"
    if "الهاتف" in t and ("واتساب" in t or "ساب" in t):
        return "الهاتف / واتساب: {{phone}}"
    if "10,000" in t or "10.000" in t:
        return "{{amount}} أوقية"
    if "المتتبع" in t and ("شيخ" in t or "عامل" in t):
        return "{{job_title}}"
    if "شيخ" in t and "متتبع" in t:
        return "{{job_title}}"
    if "نواكشوط" in t and "بتاريخ" in t:
        return "حرر في نواكشوط بتاريخ {{signing_date}}"
    if "حرر في" in t:
        return "حرر في نواكشوط بتاريخ {{signing_date}}"
    if "nom" in t:
        return "{{employee_name_fr}}"
    # Start date: dots followed by 2026
    if re.search(r'\.+\s*\d{4}', t):
        return "{{start_date}}"
    # Contract number: only dots, colons, spaces
    if re.match(r'^[:\s\.]+$', t) or re.match(r'^[\s\.]+\d{0,4}$', t):
        return "{{contract_number}}"
    # Fallback: keep as variable placeholder based on content
    return None

def merge_yellow_runs_in_para(para):
    """
    In a paragraph, merge consecutive yellow-highlighted runs into one run,
    apply the variable mapping, and remove the yellow highlight.
    Returns True if any yellow runs were processed.
    """
    runs = para.findall(w("r"))
    if not runs:
        return False

    # Group runs into consecutive yellow / non-yellow spans
    # We'll rebuild the paragraph's runs
    i = 0
    children = list(para)
    modified = False

    while i < len(children):
        child = children[i]
        if child.tag != w("r"):
            i += 1
            continue
        if not is_yellow(child):
            i += 1
            continue

        # Found start of a yellow span — collect all consecutive yellow runs
        yellow_runs = []
        j = i
        while j < len(children) and children[j].tag == w("r") and is_yellow(children[j]):
            yellow_runs.append(children[j])
            j += 1

        merged_text = "".join(get_yellow_text(r) for r in yellow_runs)
        replacement = map_yellow_to_variable(merged_text)

        if replacement is not None:
            # Build a single replacement run using the rPr of the first yellow run,
            # but with yellow highlight removed
            first_run = yellow_runs[0]
            new_run = copy.deepcopy(first_run)

            # Remove highlight from rPr
            new_rpr = new_run.find(w("rPr"))
            if new_rpr is not None:
                hl = new_rpr.find(w("highlight"))
                if hl is not None:
                    new_rpr.remove(hl)

            # Set text
            for t_el in new_run.findall(w("t")):
                new_run.remove(t_el)
            t_new = etree.SubElement(new_run, w("t"))
            t_new.text = replacement
            if replacement.startswith(" ") or replacement.endswith(" "):
                t_new.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")

            # Replace yellow runs with single new run
            insert_idx = list(para).index(yellow_runs[0])
            for r in yellow_runs:
                para.remove(r)
            para.insert(insert_idx, new_run)

            # Refresh children list
            children = list(para)
            i = insert_idx + 1
            modified = True
        else:
            # No mapping found — just remove the yellow highlight styling but keep text
            for run in yellow_runs:
                rpr = run.find(w("rPr"))
                if rpr is not None:
                    hl = rpr.find(w("highlight"))
                    if hl is not None:
                        rpr.remove(hl)
            i = j

    return modified

def find_split_index(paras):
    """Return the index of the CDI contract title paragraph."""
    for idx, para in enumerate(paras):
        text = "".join(t.text or "" for t in para.findall(f".//{w('t')}"))
        if "عقد إسداء خدمة غير محدد المدة" in text:
            return idx
    return None

def write_docx_with_paragraphs(src_zip, paragraphs, output_path):
    """
    Write a new DOCX file that contains only the given paragraphs in the body.
    All other parts (styles, fonts, relationships, etc.) are copied from src_zip.
    """
    # Parse original document.xml to get the full tree
    original_xml = src_zip.read("word/document.xml")
    tree = etree.fromstring(original_xml)
    body = tree.find(w("body"))

    # Remove all existing paragraphs and tables from body (keep sectPr)
    sect_pr = body.find(w("sectPr"))
    for child in list(body):
        body.remove(child)

    for para in paragraphs:
        body.append(para)

    if sect_pr is not None:
        body.append(sect_pr)

    new_xml = etree.tostring(tree, xml_declaration=True, encoding="UTF-8", standalone=True)

    # Write new DOCX
    with zipfile.ZipFile(src_zip.filename, "r") as src:
        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as dst:
            for item in src.infolist():
                if item.filename == "word/document.xml":
                    dst.writestr(item, new_xml)
                else:
                    dst.writestr(item, src.read(item.filename))

    print(f"  Written: {output_path}")

def main():
    print(f"Reading: {SRC}")
    with zipfile.ZipFile(SRC, "r") as zf:
        xml_content = zf.read("word/document.xml")

    tree = etree.fromstring(xml_content)
    body = tree.find(w("body"))
    all_paras = [child for child in body if child.tag in (w("p"), w("tbl"))]

    # Process all paragraphs: merge yellow runs and apply variable mapping
    print("Processing yellow-highlighted runs...")
    for para in all_paras:
        if para.tag == w("p"):
            merge_yellow_runs_in_para(para)

    # Find split point between CDD and CDI
    split_idx = find_split_index(all_paras)
    if split_idx is None:
        print("WARNING: Could not find CDI title paragraph. Writing full document as CDD only.")
        cdd_paras = all_paras
        cdi_paras = []
    else:
        print(f"Split found at paragraph index {split_idx}")
        cdd_paras = all_paras[:split_idx]
        cdi_paras = all_paras[split_idx:]

    cdd_out = os.path.join(OUT_DIR, "contract_cdd.docx")
    cdi_out = os.path.join(OUT_DIR, "contract_cdi.docx")

    with zipfile.ZipFile(SRC, "r") as zf:
        print(f"Writing CDD template ({len(cdd_paras)} blocks)...")
        write_docx_with_paragraphs(zf, cdd_paras, cdd_out)
        if cdi_paras:
            print(f"Writing CDI template ({len(cdi_paras)} blocks)...")
            write_docx_with_paragraphs(zf, cdi_paras, cdi_out)
        else:
            print("No CDI paragraphs found — copying full doc as CDI fallback.")
            shutil.copy(SRC, cdi_out)

    print("\nDone. Templates ready:")
    print(f"  CDD: {cdd_out}")
    print(f"  CDI: {cdi_out}")
    print("\nVerify the templates by opening them in LibreOffice/Word and checking")
    print("that {{variable_name}} placeholders appear where yellow text was.")

if __name__ == "__main__":
    main()
