import { PartialType } from '@nestjs/mapped-types';

import { CreateCropSeasonDto } from './create-crop-season.dto.js';

export class UpdateCropSeasonDto extends PartialType(CreateCropSeasonDto) {}
