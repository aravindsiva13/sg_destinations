import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const directoryToScan = 'public/images';

async function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file.toLowerCase() === 'brand') continue;
      await processDirectory(fullPath);
    } else if (/\.(jpg|jpeg)$/i.test(file)) {
      if (stat.size > 250 * 1024) {
        const tempPath = `${fullPath}.tmp`;
        try {
          await sharp(fullPath)
            .rotate()
            .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 82, progressive: true, mozjpeg: true })
            .toFile(tempPath);

          const newStat = fs.statSync(tempPath);
          fs.renameSync(tempPath, fullPath);
          const savedMb = ((stat.size - newStat.size) / (1024 * 1024)).toFixed(2);
          console.log(`✓ ${file}: ${(stat.size / 1024 / 1024).toFixed(2)}MB -> ${(newStat.size / 1024 / 1024).toFixed(2)}MB (saved ${savedMb}MB)`);
        } catch (err) {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          console.error(`❌ Error on ${file}:`, err.message);
        }
      }
    }
  }
}

console.log('Starting image optimization...');
processDirectory(directoryToScan).then(() => {
  console.log('🎉 All images optimized successfully!');
});
