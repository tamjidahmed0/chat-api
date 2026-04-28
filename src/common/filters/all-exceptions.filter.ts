import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (!(exception instanceof HttpException)) {
      return response.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    }

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // class-validator error
    if (Array.isArray(exceptionResponse?.message)) {
      return response.status(status).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: exceptionResponse.message[0],
        },
      });
    }

    if (exceptionResponse?.code) {
      return response.status(status).json({
        success: false,
        error: {
          code: exceptionResponse.code,
          message: exceptionResponse.message,
        },
      });
    }

    return response.status(status).json({
      success: false,
      error: {
        code: 'ERROR',
        message: exceptionResponse?.message ?? 'Something went wrong',
      },
    });
  }
}