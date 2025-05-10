import json

# Load the enriched Glottolog JSON
with open("../data/glottolog_named_tree.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Recursive function to count all leaf nodes (languages) under a node
def count_languages(node):
    if "children" not in node or not node["children"]:
        return 1
    return sum(count_languages(child) for child in node["children"])

# Get top-level families and their language counts
families = []
for child in data["children"]:
    name = child["name"]
    count = count_languages(child)
    families.append((name, count))

# Sort by language count in descending order
families.sort(key=lambda x: x[1], reverse=True)

# Format as simple output
output = "\n".join([f"{name}: {count}" for name, count in families])
print(output)
