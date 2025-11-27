/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a number if the base slug already exists
 */
export async function generateUniqueSlug(
  title: string, 
  prisma: any, 
  excludeId?: string
): Promise<string> {
  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.competition.findUnique({
      where: { slug },
      select: { id: true }
    });

    // If no existing competition with this slug, or it's the same competition we're editing
    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug;
    }

    // Try with a number suffix
    slug = `${baseSlug}-${counter}`;
    counter++;

    // Safety limit
    if (counter > 100) {
      // Fall back to adding timestamp
      return `${baseSlug}-${Date.now()}`;
    }
  }
}

