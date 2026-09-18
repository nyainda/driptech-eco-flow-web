import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');
const heroImages = [
    'hero-bg-1.jpg',
    'hero-bg-2.jpg',
    'hero-bg-3.jpg',
    'hero-bg-4.jpg',
    'hero-bg-new.jpg'
];

async function optimizeImages() {
    console.log('🖼️  Starting image optimization...\n');

    for (const imageName of heroImages) {
        const inputPath = path.join(publicDir, imageName);
        const baseName = path.basename(imageName, '.jpg');

        if (!fs.existsSync(inputPath)) {
            console.log(`⚠️  Skipping ${imageName} - file not found`);
            continue;
        }

        console.log(`Processing ${imageName}...`);

        try {
            // Get original size
            const originalStats = fs.statSync(inputPath);
            const originalSize = (originalStats.size / 1024).toFixed(2);

            // Generate WebP versions at different sizes for responsive images
            const sizes = [
                { width: 640, suffix: '-mobile' },   // Mobile
                { width: 1024, suffix: '-tablet' },  // Tablet
                { width: 1920, suffix: '-desktop' }, // Desktop
            ];

            for (const size of sizes) {
                const outputPath = path.join(publicDir, `${baseName}${size.suffix}.webp`);

                await sharp(inputPath)
                    .resize(size.width, null, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .webp({ quality: 80, effort: 6 })
                    .toFile(outputPath);

                const stats = fs.statSync(outputPath);
                const newSize = (stats.size / 1024).toFixed(2);
                const savings = ((1 - stats.size / originalStats.size) * 100).toFixed(1);

                console.log(`  ✓ ${baseName}${size.suffix}.webp - ${newSize}KB (${savings}% smaller)`);
            }

            // Also create a highly optimized WebP version to replace the original
            const optimizedPath = path.join(publicDir, `${baseName}.webp`);
            await sharp(inputPath)
                .webp({ quality: 82, effort: 6 })
                .toFile(optimizedPath);

            const optimizedStats = fs.statSync(optimizedPath);
            const optimizedSize = (optimizedStats.size / 1024).toFixed(2);
            const totalSavings = ((1 - optimizedStats.size / originalStats.size) * 100).toFixed(1);

            console.log(`  ✓ ${baseName}.webp - ${optimizedSize}KB (${totalSavings}% smaller than original ${originalSize}KB)\n`);

        } catch (error) {
            console.error(`  ✗ Error processing ${imageName}:`, error.message);
        }
    }

    console.log('✅ Image optimization complete!');
}

optimizeImages().catch(console.error);
