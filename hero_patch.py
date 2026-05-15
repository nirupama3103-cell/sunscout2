path = "/workspaces/sunscout2/public/index.html"
with open(path) as f:
    html = f.read()

# 1. Hide the old header div completely
html = html.replace(
    '<div class="header">',
    '<div class="header" style="display:none">',
    1
)

# 2. Hide the old standalone search bar wrapper
# Find the search-input and hide its parent container
html = html.replace(
    'class="search-input"',
    'class="search-input" style="display:none"',
    1
)

# 3. Also hide the search wrapper div if it exists
html = html.replace(
    '<div class="search-wrap">',
    '<div class="search-wrap" style="display:none">',
    1
)

with open(path, "w") as f:
    f.write(html)

print("Done! Duplicate header and search bar hidden.")
