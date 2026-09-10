import { Router } from 'express';
import { z } from 'zod';
import { existsSync, mkdirSync, promises as fs } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { prisma } from '../prisma.js';
import { asyncHandler, HttpError } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';

export const mediaRouter = Router();

const adminWrite = [requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER)];

export function getUploadsDir(): string {
  const dir =
    process.env.UPLOADS_DIR ||
    resolve(process.cwd(), process.cwd().endsWith('api') ? 'uploads' : 'api/uploads');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

mediaRouter.get(
  '/',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    const { folder } = req.query as Record<string, string>;
    const media = await prisma.media.findMany({
      where: folder ? { folder } : {},
      orderBy: { createdAt: 'desc' },
    });
    res.json(media);
  }),
);

const mediaInput = z.object({
  url: z.string().min(1),
  alt: z.string().optional(),
  folder: z.string().optional(),
});

mediaRouter.post(
  '/',
  ...adminWrite,
  validateBody(mediaInput),
  asyncHandler(async (req, res) => {
    const item = await prisma.media.create({ data: req.body });
    await recordAudit({ actor: req.user, action: 'create', entity: 'Media', entityId: item.id });
    res.status(201).json(item);
  }),
);

function parseImagePayload(name: string, data: string) {
  const match = data.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
  let buffer: Buffer;
  let ext = '.jpg';
  if (match) {
    const mime = match[1];
    buffer = Buffer.from(match[2], 'base64');
    if (mime === 'image/png') ext = '.png';
    else if (mime === 'image/webp') ext = '.webp';
    else if (mime === 'image/gif') ext = '.gif';
    else if (mime === 'image/svg+xml') ext = '.svg';
    else ext = '.jpg';
  } else {
    buffer = Buffer.from(data, 'base64');
    const originalExt = extname(name || '').toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(originalExt)) {
      ext = originalExt === '.jpeg' ? '.jpg' : originalExt;
    }
  }

  const safeStem = (name || 'upload')
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .slice(0, 30);
  const filename = `${Date.now()}-${safeStem || 'img'}-${Math.random().toString(36).slice(2, 7)}${ext}`;

  return { filename, url: `/api/uploads/${filename}`, buffer };
}

// Single or batch upload endpoint
mediaRouter.post(
  '/upload',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    const uploadsDir = getUploadsDir();

    const { files, name, data, alt, folder } = req.body as {
      files?: Array<{ name: string; data: string; alt?: string; folder?: string }>;
      name?: string;
      data?: string;
      alt?: string;
      folder?: string;
    };

    if (Array.isArray(files) && files.length > 0) {
      const results = [];
      for (const item of files) {
        if (!item.data) continue;
        const { filename, url, buffer } = parseImagePayload(item.name, item.data);
        await fs.writeFile(join(uploadsDir, filename), buffer);

        const record = await prisma.media.create({
          data: {
            url,
            alt: item.alt || item.name || '',
            folder: item.folder || folder || 'uploads',
          },
        });
        results.push(record);
      }

      await recordAudit({
        actor: req.user,
        action: 'create',
        entity: 'Media',
        entityId: results.map((r) => r.id).join(','),
      });

      return res.status(201).json({ items: results });
    }

    if (!data) {
      throw new HttpError(400, 'Image data is required');
    }

    const { filename, url, buffer } = parseImagePayload(name || 'image', data);
    await fs.writeFile(join(uploadsDir, filename), buffer);

    const record = await prisma.media.create({
      data: {
        url,
        alt: alt || name || '',
        folder: folder || 'uploads',
      },
    });

    await recordAudit({
      actor: req.user,
      action: 'create',
      entity: 'Media',
      entityId: record.id,
    });

    res.status(201).json(record);
  }),
);

mediaRouter.delete(
  '/:id',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    await prisma.media.delete({ where: { id: req.params.id } });
    await recordAudit({ actor: req.user, action: 'delete', entity: 'Media', entityId: req.params.id });
    res.json({ ok: true });
  }),
);
