import { IsInt, IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class CreateCropSeasonDto {
  @IsUUID()
  farmId: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name: string;

  @IsInt()
  year: number;
}
