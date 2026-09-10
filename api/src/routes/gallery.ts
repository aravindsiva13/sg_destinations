import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler, HttpError } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';

export const galleryRouter = Router();

const adminWrite = [requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER)];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// PUBLIC ENDPOINTS
// ---------------------------------------------------------------------------

// Public: Get all published gallery categories with images ordered by sortOrder
galleryRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.galleryCategory.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    res.json(categories);
  }),
);

// Public: Get single category by slug
galleryRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const category = await prisma.galleryCategory.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!category || !category.published) {
      throw new HttpError(404, 'Gallery category not found');
    }
    res.json(category);
  }),
);

// ---------------------------------------------------------------------------
// ADMIN ENDPOINTS
// ---------------------------------------------------------------------------

// Admin: Get all categories (including unpublished)
galleryRouter.get(
  '/admin/all',
  ...adminWrite,
  asyncHandler(async (_req, res) => {
    const categories = await prisma.galleryCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    res.json(categories);
  }),
);

const categoryInput = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
});

// Admin: Create Category
galleryRouter.post(
  '/categories',
  ...adminWrite,
  validateBody(categoryInput),
  asyncHandler(async (req, res) => {
    const data = req.body;
    let slug = data.slug ? slugify(data.slug) : slugify(data.name);

    // Ensure unique slug
    let candidate = slug;
    let counter = 1;
    while (await prisma.galleryCategory.findUnique({ where: { slug: candidate } })) {
      candidate = `${slug}-${counter++}`;
    }
    slug = candidate;

    const category = await prisma.galleryCategory.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        sortOrder: data.sortOrder,
        published: data.published,
      },
      include: { images: true },
    });

    await recordAudit({ actor: req.user, action: 'create', entity: 'GalleryCategory', entityId: category.id });
    res.status(201).json(category);
  }),
);

// Admin: Update Category
galleryRouter.put(
  '/categories/:id',
  ...adminWrite,
  validateBody(categoryInput.partial()),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.galleryCategory.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Category not found');

    const data = { ...req.body };
    if (data.slug) {
      data.slug = slugify(data.slug);
      const duplicate = await prisma.galleryCategory.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (duplicate) throw new HttpError(409, 'Slug already in use by another category');
    }

    const updated = await prisma.galleryCategory.update({
      where: { id },
      data,
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });

    await recordAudit({ actor: req.user, action: 'update', entity: 'GalleryCategory', entityId: updated.id });
    res.json(updated);
  }),
);

// Admin: Delete Category (cascade deletes images)
galleryRouter.delete(
  '/categories/:id',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.galleryCategory.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Category not found');

    await prisma.galleryCategory.delete({ where: { id } });
    await recordAudit({ actor: req.user, action: 'delete', entity: 'GalleryCategory', entityId: id });
    res.json({ ok: true, id });
  }),
);

// Admin: Batch replace all images in a category (supports drag-and-drop order save)
const syncImagesInput = z.object({
  images: z.array(
    z.union([
      z.string(),
      z.object({
        url: z.string().min(1),
        alt: z.string().optional().nullable(),
        sortOrder: z.number().optional(),
      }),
    ]),
  ),
});

galleryRouter.put(
  '/categories/:id/images',
  ...adminWrite,
  validateBody(syncImagesInput),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await prisma.galleryCategory.findUnique({ where: { id } });
    if (!category) throw new HttpError(404, 'Category not found');

    const incomingImages = req.body.images.map(
      (item: string | { url: string; alt?: string | null; sortOrder?: number }, index: number) => {
        if (typeof item === 'string') {
          return {
            categoryId: id,
            url: item,
            alt: `${category.name} photo ${index + 1}`,
            sortOrder: index,
          };
        }
        return {
          categoryId: id,
          url: item.url,
          alt: item.alt ?? `${category.name} photo ${index + 1}`,
          sortOrder: item.sortOrder ?? index,
        };
      },
    );

    // Replace images in a transaction
    await prisma.$transaction([
      prisma.galleryImage.deleteMany({ where: { categoryId: id } }),
      ...(incomingImages.length > 0
        ? [prisma.galleryImage.createMany({ data: incomingImages })]
        : []),
    ]);

    const refreshed = await prisma.galleryCategory.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });

    await recordAudit({
      actor: req.user,
      action: 'update',
      entity: 'GalleryCategoryImages',
      entityId: id,
    });

    res.json(refreshed);
  }),
);

// Admin: Delete a single image
galleryRouter.delete(
  '/images/:id',
  ...adminWrite,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.galleryImage.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Image not found');

    await prisma.galleryImage.delete({ where: { id } });
    await recordAudit({ actor: req.user, action: 'delete', entity: 'GalleryImage', entityId: id });
    res.json({ ok: true, id });
  }),
);
