import type { ZodType } from 'zod';
import { ZodError } from 'zod';
import { ValidationError } from './errors.js';

export function validate<T>(schema: ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError(details);
    }
    throw err;
  }
}
