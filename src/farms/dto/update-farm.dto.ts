import { PartialType } from '@nestjs/mapped-types';

import { CreateFarmDto } from './create-farm.dto.js';

export class UpdateFarmDto extends PartialType(CreateFarmDto) {}
