import { PartialType } from '@nestjs/mapped-types';

import { CreatePlantingDto } from './create-planting.dto.js';

export class UpdatePlantingDto extends PartialType(CreatePlantingDto) {}
