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

# --- Load Glottocode → Name mapping ---
languages_df = pd.read_csv("../data/languages_and_dialects_geo.csv", usecols=["glottocode", "name"])
glottocode_to_name = dict(zip(languages_df["glottocode"], languages_df["name"]))

# --- Convert clade to nested dict, replacing glottocodes with names ---
def clade_to_named_dict(clade):
    raw_name = clade.name if clade.name else ""
    # Remove everything from the first square bracket onward
    readable_name = raw_name.split(' [')[0].strip()
    node = {"name": readable_name, "children": []}
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
    "../data/glottolog_named_tree.json",
    "../glottolog_named_tree.json"
]

# Ensure directories exist
for path in output_paths:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(full_tree, f, indent=2, ensure_ascii=False)


print("✅ Full Glottolog tree saved as 'glottolog_named_tree.json' in both data and root folders")
