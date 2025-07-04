#!/usr/bin/env python3
import os
import re
import glob

def fix_imports_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix radix-ui imports
    content = re.sub(r'@radix-ui/react-([^@"]+)@[0-9.]+', r'@radix-ui/react-\1', content)
    
    # Fix lucide-react imports
    content = re.sub(r'lucide-react@[0-9.]+', r'lucide-react', content)
    
    # Fix other package imports
    content = re.sub(r'cmdk@[0-9.]+', r'cmdk', content)
    content = re.sub(r'vaul@[0-9.]+', r'vaul', content)
    content = re.sub(r'recharts@[0-9.]+', r'recharts', content)
    content = re.sub(r'embla-carousel-react@[0-9.]+', r'embla-carousel-react', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed imports in {file_path}")

# Find all .tsx files in src/components/ui
ui_files = glob.glob('/home/ubuntu/dolores/src/components/ui/*.tsx')

for file_path in ui_files:
    fix_imports_in_file(file_path)

print(f"Fixed imports in {len(ui_files)} files")

