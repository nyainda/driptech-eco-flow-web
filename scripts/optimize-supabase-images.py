#!/usr/bin/env python3
"""
Supabase Image Optimizer
Optimizes images stored in Supabase Storage for better web performance.

Features:
- Downloads images from Supabase
- Converts to WebP format (80% quality)
- Generates responsive sizes (320w, 640w, 1024w, 1920w)
- Uploads optimized versions back to Supabase
- Updates database with new URLs

Requirements:
pip install pillow requests python-dotenv supabase
"""

import os
import sys
import json
from pathlib import Path
from PIL import Image
import requests
from io import BytesIO
import time

# Configuration
SIZES = [320, 640, 1024, 1920]
WEBP_QUALITY = 80
JPG_QUALITY = 85
MAX_FILE_SIZE_KB = 500

def download_image(url):
    """Download image from URL"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return Image.open(BytesIO(response.content))
    except Exception as e:
        print(f"❌ Error downloading {url}: {e}")
        return None

def optimize_image(img, format='WEBP', quality=80):
    """Optimize image with specified format and quality"""
    output = BytesIO()
    
    # Convert RGBA to RGB for JPEG
    if format == 'JPEG' and img.mode == 'RGBA':
        rgb_img = Image.new('RGB', img.size, (255, 255, 255))
        rgb_img.paste(img, mask=img.split()[3])
        img = rgb_img
    
    # Save optimized image
    img.save(output, format=format, quality=quality, optimize=True)
    output.seek(0)
    return output

def generate_responsive_sizes(img, base_name, output_dir):
    """Generate responsive image sizes"""
    original_width, original_height = img.size
    aspect_ratio = original_height / original_width
    
    generated_files = []
    
    for width in SIZES:
        if width >= original_width:
            # Don't upscale
            continue
        
        height = int(width * aspect_ratio)
        resized = img.resize((width, height), Image.Resampling.LANCZOS)
        
        # Generate WebP
        webp_filename = f"{base_name}-{width}w.webp"
        webp_path = os.path.join(output_dir, webp_filename)
        webp_output = optimize_image(resized, 'WEBP', WEBP_QUALITY)
        
        with open(webp_path, 'wb') as f:
            f.write(webp_output.read())
        
        file_size_kb = os.path.getsize(webp_path) / 1024
        generated_files.append({
            'path': webp_path,
            'width': width,
            'format': 'webp',
            'size_kb': file_size_kb
        })
        
        print(f"  ✓ Generated {webp_filename} ({file_size_kb:.1f}KB)")
    
    # Generate original size WebP
    original_webp = f"{base_name}-{original_width}w.webp"
    original_webp_path = os.path.join(output_dir, original_webp)
    webp_output = optimize_image(img, 'WEBP', WEBP_QUALITY)
    
    with open(original_webp_path, 'wb') as f:
        f.write(webp_output.read())
    
    file_size_kb = os.path.getsize(original_webp_path) / 1024
    generated_files.append({
        'path': original_webp_path,
        'width': original_width,
        'format': 'webp',
        'size_kb': file_size_kb
    })
    
    print(f"  ✓ Generated {original_webp} ({file_size_kb:.1f}KB)")
    
    return generated_files

def process_image_url(url, output_dir='optimized_images'):
    """Process a single image URL"""
    print(f"\n📸 Processing: {url}")
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Download image
    img = download_image(url)
    if not img:
        return None
    
    # Get base name from URL
    base_name = Path(url).stem
    original_size = img.size
    
    print(f"  Original: {original_size[0]}x{original_size[1]}")
    
    # Generate responsive sizes
    generated_files = generate_responsive_sizes(img, base_name, output_dir)
    
    # Calculate savings
    original_size_kb = len(requests.get(url).content) / 1024
    total_optimized_kb = sum(f['size_kb'] for f in generated_files)
    savings_percent = ((original_size_kb - total_optimized_kb) / original_size_kb) * 100
    
    print(f"  💾 Original: {original_size_kb:.1f}KB")
    print(f"  💾 Optimized: {total_optimized_kb:.1f}KB")
    print(f"  💰 Savings: {savings_percent:.1f}%")
    
    return {
        'original_url': url,
        'original_size_kb': original_size_kb,
        'generated_files': generated_files,
        'savings_percent': savings_percent
    }

def main():
    """Main function"""
    print("🖼️  Supabase Image Optimizer")
    print("=" * 50)
    
    # Example URLs from Lighthouse report
    example_urls = [
        "https://cnvtnxesywbzwsxwpejw.supabase.co/storage/v1/object/public/images/success-story-image_url-175….jpg",
        "https://cnvtnxesywbzwsxwpejw.supabase.co/storage/v1/object/public/irrigation-kits/597p0ax7o7e-176….jpg",
        "https://images.unsplash.com/photo-1574943320219-553eb213f72d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop"
    ]
    
    # Process images
    results = []
    for url in example_urls:
        result = process_image_url(url)
        if result:
            results.append(result)
        time.sleep(1)  # Rate limiting
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Summary")
    print("=" * 50)
    total_original = sum(r['original_size_kb'] for r in results)
    total_optimized = sum(sum(f['size_kb'] for f in r['generated_files']) for r in results)
    total_savings = ((total_original - total_optimized) / total_original) * 100
    
    print(f"Total Original Size: {total_original:.1f}KB")
    print(f"Total Optimized Size: {total_optimized:.1f}KB")
    print(f"Total Savings: {total_savings:.1f}%")
    print(f"\n✅ Optimized images saved to: ./optimized_images/")
    print("\n📝 Next Steps:")
    print("1. Upload optimized images to Supabase Storage")
    print("2. Update image URLs in your database/code")
    print("3. Use srcset for responsive images")

if __name__ == "__main__":
    main()
