import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCropDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;
}
