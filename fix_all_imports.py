#!/usr/bin/env python3
import os
import re
import glob

def fix_imports_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Fix all package imports with versions
    patterns = [
        (r'@radix-ui/react-([^@"]+)@[0-9.]+', r'@radix-ui/react-\1'),
        (r'lucide-react@[0-9.]+', r'lucide-react'),
        (r'cmdk@[0-9.]+', r'cmdk'),
        (r'vaul@[0-9.]+', r'vaul'),
        (r'recharts@[0-9.]+', r'recharts'),
        (r'embla-carousel-react@[0-9.]+', r'embla-carousel-react'),
        (r'class-variance-authority@[0-9.]+', r'class-variance-authority'),
        (r'react-resizable-panels@[0-9.]+', r'react-resizable-panels'),
        (r'@hookform/resolvers@[0-9.]+', r'@hookform/resolvers'),
        (r'zod@[0-9.]+', r'zod'),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed imports in {file_path}")
        return True
    return False

# Find all .tsx and .ts files
all_files = []
all_files.extend(glob.glob('/home/ubuntu/dolores/src/**/*.tsx', recursive=True))
all_files.extend(glob.glob('/home/ubuntu/dolores/src/**/*.ts', recursive=True))

fixed_count = 0
for file_path in all_files:
    if fix_imports_in_file(file_path):
        fixed_count += 1

print(f"Fixed imports in {fixed_count} out of {len(all_files)} files")

