# -*- coding: utf-8 -*-
from Bio import Phylo
import json
import pandas as pd
from io import StringIO
import re
import os

# --- Load Newick trees ---
with open("../data/tree_glottolog_newick.txt", "r", encoding="utf-8") as file:
    newick_data = file.read()

# Parse all trees in the file
trees = list(Phylo.parse(StringIO(newick_data), "newick"))

# --- Load metadata from CSV ---
languages_df = pd.read_csv(
    "../data/languages_and_dialects_geo.csv",
    usecols=["glottocode", "name", "level", "macroarea", "latitude", "longitude"]
)

# Prepare lookup dictionaries
glottocode_to_name = dict(zip(languages_df["glottocode"], languages_df["name"]))
glottocode_to_metadata = languages_df.set_index("glottocode").to_dict(orient="index")

# --- Convert clade to nested dict with metadata ---
def clade_to_named_dict(clade):
    raw_name = clade.name if clade.name else ""
    glottocode_match = re.search(r"[a-z]{4}\d{4}", raw_name)
    glottocode = glottocode_match.group(0) if glottocode_match else None

    readable_name = raw_name.split(" [")[0].strip()

    node = {
        "name": readable_name,
        "children": []
    }

    # If it's a leaf with a valid glottocode, add metadata
    if glottocode and glottocode in glottocode_to_metadata:
        metadata = glottocode_to_metadata[glottocode]
        def safe_value(val):
            return None if pd.isna(val) else val

        node.update({
            "level": safe_value(metadata["level"]),
            "macroarea": safe_value(metadata["macroarea"]),
            "latitude": safe_value(metadata["latitude"]),
            "longitude": safe_value(metadata["longitude"])
        })

    # Process children recursively
    for child in clade.clades:
        node["children"].append(clade_to_named_dict(child))

    return node

# Convert all trees
all_named_trees = [clade_to_named_dict(tree.root) for tree in trees]

# Combine under a virtual root node
full_tree = {
    "name": "Glottolog",
    "children": all_named_trees
}

# Define output paths
output_paths = [
    "../data/glottolog_named_tree_rich.json",
    "../glottolog_named_tree_rich.json"
]

# Ensure directories exist and write JSON
for path in output_paths:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(full_tree, f, indent=2, ensure_ascii=False)

print("Rich Glottolog tree saved as 'glottolog_named_tree_rich.json' in both data and root folders")