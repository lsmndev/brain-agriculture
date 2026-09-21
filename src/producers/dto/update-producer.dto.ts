import { PartialType } from '@nestjs/swagger';

import { CreateProducerDto } from './create-producer.dto.js';

export class UpdateProducerDto extends PartialType(CreateProducerDto) {}