import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExceptionService {
  handle(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'credentials already exist',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    throw error;
  }
}
