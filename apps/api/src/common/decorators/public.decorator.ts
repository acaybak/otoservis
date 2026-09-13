export const IS_PUBLIC_KEY = 'isPublic';
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
