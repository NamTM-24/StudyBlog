import { prisma } from '../config/database.js';

// ---- slug helpers ----
export const slugify = (str: string) => {
    return (
        str
            ?.toString()
            .normalize('NFD')                       // tách dấu
            .replace(/[\u0300-\u036f]/g, '')       // bỏ dấu
            .replace(/đ/gi, 'd')                   // đ -> d
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')           // ký tự ngoài a-z0-9 -> -
            .replace(/(^-|-$)/g, '')               // bỏ - ở đầu/cuối
    ) || 'bai-viet';
};

export async function makeUniqueSlug(title: string, excludePostId?: number): Promise<string> {
    const base = slugify(title);
    let slug = base;
    let i = 0;

    // thử base, nếu trùng thì thêm -1, -2, ...
    while (true) {
        const exist = await prisma.post.findFirst({
            where: {
                slug,
                ...(excludePostId && { id: { not: excludePostId } })
            }
        });
        if (!exist) return slug;
        i += 1;
        slug = `${base}-${i}`;
        // fallback an toàn nếu lặp quá nhiều
        if (i > 100) {
            const stamp = Date.now().toString(36).slice(-4);
            return `${base}-${stamp}`;
        }
    }
}
