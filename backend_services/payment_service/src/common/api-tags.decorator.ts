import { SetMetadata } from '@nestjs/common';

export const API_TAGS_KEY = 'apiTags';

export const ApiTags = (...tags: string[]) => SetMetadata(API_TAGS_KEY, tags);
