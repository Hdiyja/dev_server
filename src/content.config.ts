import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const logbook = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/logbook" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.enum(['Classical', 'Quantum', 'Superposition'])),
    description: z.string().optional(),
    isDraft: z.boolean().default(false),
  }),
});

export const collections = { logbook };
