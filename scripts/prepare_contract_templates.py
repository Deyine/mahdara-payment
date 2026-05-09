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

def map_yellow_to_segments(text):
    """
    Map merged yellow text to a list of segments. Each segment is either:
      ("text", "literal text")
      ("var",  "variable_name")
    Returns None if no mapping found.
    """
    t = text.strip()

    if "السيد(ة):" in t:
        return [("text", "السيد(ة): "), ("var", "employee_name")]
    if "تاريخ ومحل الميلاد" in t:
        return [("text", "تاريخ ومحل الميلاد: "), ("var", "birth_date"),
                ("text", " - "), ("var", "birth_place")]
    if "الرقم الوطني للتعريف" in t:
        return [("text", "الرقم الوطني للتعريف: "), ("var", "nni")]
    if "الهاتف" in t and ("واتساب" in t or "ساب" in t):
        return [("text", "الهاتف / واتساب: "), ("var", "phone")]
    if "10,000" in t or "10.000" in t:
        return [("var", "amount"), ("text", " أوقية")]
    if "المتتبع" in t and ("شيخ" in t or "عامل" in t):
        return [("var", "job_title")]
    if "شيخ" in t and "متتبع" in t:
        return [("var", "job_title")]
    if "نواكشوط" in t and "بتاريخ" in t:
        return [("text", "حرر في نواكشوط بتاريخ "), ("var", "signing_date")]
    if "حرر في" in t:
        return [("text", "حرر في نواكشوط بتاريخ "), ("var", "signing_date")]
    if "nom" in t:
        return [("var", "employee_name_fr")]
    if re.search(r'\.+\s*\d{4}', t):
        return [("var", "start_date")]
    if re.match(r'^[:\s\.]+$', t) or re.match(r'^[\s\.]+\d{0,4}$', t):
        return [("var", "contract_number")]
    return None

def make_text_run(template_run, text):
    """Build a plain text run, copying formatting from template_run, with yellow removed."""
    new_run = copy.deepcopy(template_run)
    new_rpr = new_run.find(w("rPr"))
    if new_rpr is not None:
        hl = new_rpr.find(w("highlight"))
        if hl is not None:
            new_rpr.remove(hl)
    for t_el in new_run.findall(w("t")):
        new_run.remove(t_el)
    t_new = etree.SubElement(new_run, w("t"))
    t_new.text = text
    if text != text.strip():
        t_new.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    return new_run

def make_mergefield_runs(template_run, var_name):
    """
    Build a sequence of runs implementing a Word MERGEFIELD:
      <w:r><w:fldChar w:fldCharType="begin"/></w:r>
      <w:r><w:instrText> MERGEFIELD =var_name \\* MERGEFORMAT </w:instrText></w:r>
      <w:r><w:fldChar w:fldCharType="separate"/></w:r>
      <w:r>...display text «=var_name»...</w:r>
      <w:r><w:fldChar w:fldCharType="end"/></w:r>
    Returns a list of <w:r> elements. Formatting is copied from template_run.
    """
    def base_run():
        r = copy.deepcopy(template_run)
        # remove yellow highlight
        rpr = r.find(w("rPr"))
        if rpr is not None:
            hl = rpr.find(w("highlight"))
            if hl is not None:
                rpr.remove(hl)
        # strip text/instrText/fldChar children
        for tag in ("t", "instrText", "fldChar"):
            for child in r.findall(w(tag)):
                r.remove(child)
        return r

    runs = []

    # begin
    r1 = base_run()
    fc1 = etree.SubElement(r1, w("fldChar"))
    fc1.set(w("fldCharType"), "begin")
    runs.append(r1)

    # instrText
    r2 = base_run()
    it = etree.SubElement(r2, w("instrText"))
    it.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    it.text = f" MERGEFIELD ={var_name} \\* MERGEFORMAT "
    runs.append(r2)

    # separate
    r3 = base_run()
    fc3 = etree.SubElement(r3, w("fldChar"))
    fc3.set(w("fldCharType"), "separate")
    runs.append(r3)

    # display text
    r4 = base_run()
    t4 = etree.SubElement(r4, w("t"))
    t4.text = f"«={var_name}»"
    runs.append(r4)

    # end
    r5 = base_run()
    fc5 = etree.SubElement(r5, w("fldChar"))
    fc5.set(w("fldCharType"), "end")
    runs.append(r5)

    return runs

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
        segments = map_yellow_to_segments(merged_text)

        if segments is not None:
            first_run = yellow_runs[0]
            insert_idx = list(para).index(first_run)
            for r in yellow_runs:
                para.remove(r)

            offset = 0
            for kind, value in segments:
                if kind == "text":
                    new_run = make_text_run(first_run, value)
                    para.insert(insert_idx + offset, new_run)
                    offset += 1
                else:  # var
                    mf_runs = make_mergefield_runs(first_run, value)
                    for mr in mf_runs:
                        para.insert(insert_idx + offset, mr)
                        offset += 1

            children = list(para)
            i = insert_idx + offset
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
