#!/usr/bin/env python3
"""
Script to add IrrigationKeywords component to all page files
"""

import os
import re

# Pages directory
PAGES_DIR = "/home/bruce/driptech-eco-flow-web/src/pages"

# Pages that already have IrrigationKeywords
SKIP_PAGES = ["Index.tsx", "Products.tsx", "About.tsx", "Home.tsx", "Admin.tsx", "NotFound.tsx"]

# Import statement to add
IMPORT_STATEMENT = 'import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";'

# Component to add before Footer
COMPONENT = "      <IrrigationKeywords />"

def process_file(filepath):
    """Add IrrigationKeywords import and component to a file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if already has IrrigationKeywords
    if 'IrrigationKeywords' in content:
        return False, "Already has IrrigationKeywords"
    
    # Check if has Footer import
    if 'import Footer' not in content:
        return False, "No Footer import found"
    
    # Add import after Footer import
    content = re.sub(
        r'(import Footer from [^;]+;)',
        r'\1\n' + IMPORT_STATEMENT,
        content,
        count=1
    )
    
    # Add component before Footer component
    # Handle different indentation patterns
    patterns = [
        (r'(\s*)<Footer />', r'\1<IrrigationKeywords />\n\1<Footer />'),
        (r'(\s*)\{/\* Footer \*/\}', r'\1<IrrigationKeywords />\n\1{/* Footer */}'),
    ]
    
    modified = False
    for pattern, replacement in patterns:
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content, count=1)
            modified = True
            break
    
    if not modified:
        return False, "Could not find Footer component"
    
    # Write back
    with open(filepath, 'w') as f:
        f.write(content)
    
    return True, "Updated successfully"

def main():
    """Process all page files"""
    updated_count = 0
    skipped_count = 0
    
    for filename in os.listdir(PAGES_DIR):
        if not filename.endswith('.tsx'):
            continue
        
        if filename in SKIP_PAGES:
            print(f"⊘ Skipping {filename} (in skip list)")
            skipped_count += 1
            continue
        
        filepath = os.path.join(PAGES_DIR, filename)
        success, message = process_file(filepath)
        
        if success:
            print(f"✓ Updated {filename}")
            updated_count += 1
        else:
            print(f"⊘ Skipped {filename}: {message}")
            skipped_count += 1
    
    print(f"\nDone! Updated {updated_count} files, skipped {skipped_count} files")

if __name__ == "__main__":
    main()
