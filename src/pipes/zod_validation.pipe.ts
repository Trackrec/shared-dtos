import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      let parsedValue = value;

      // Handle `param` and `query` types differently
      if (metadata.type === 'param') {
        parsedValue = this.convertParams(value);
      } else if (metadata.type === 'query') {
        parsedValue = this.convertQuery(value);
      }

      // Validate the processed value using the schema
      return this.schema.parse(parsedValue);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(this.formatZodError(error));
      }
      throw new BadRequestException('Validation failed');
    }
  }

  private convertParams(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([key, val]) => [key, isNaN(Number(val)) ? val : Number(val)]),
      );
    }
    return value as Record<string, unknown>;
  }

  private convertQuery(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([key, val]) => [
          key,
          isNaN(Number(val)) || val === '' ? val : Number(val),
        ]),
      );
    }
    return value as Record<string, unknown>;
  }

  /**
   * Formats Zod errors into an array of error messages.
   */
  private formatZodError(error: ZodError): string[] {
    return error.errors.map((err) => {
      const path = err.path.join(' > ') || 'root';
      const message = err.message;
      return `${path}: ${message}`;
    });
  }
}
