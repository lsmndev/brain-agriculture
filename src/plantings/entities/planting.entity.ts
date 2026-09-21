import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { CropSeason } from '../../crop-seasons/entities/crop-season.entity.js';
import { Crop } from '../../crops/entities/crop.entity.js';

@Entity('plantings')
@Unique('UQ_plantings_crop_season_crop', ['cropSeasonId', 'cropId'])
@Index('IDX_plantings_crop_id', ['cropId'])
export class Planting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'crop_season_id',
    type: 'uuid',
  })
  cropSeasonId: string;

  @ManyToOne(() => CropSeason, (cropSeason) => cropSeason.plantings, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'crop_season_id',
  })
  cropSeason: Relation<CropSeason>;

  @Column({
    name: 'crop_id',
    type: 'uuid',
  })
  cropId: string;

  @ManyToOne(() => Crop, (crop) => crop.plantings, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'crop_id',
  })
  crop: Relation<Crop>;

  @Column({
    name: 'planted_area_ha',
    type: 'numeric',
    precision: 15,
    scale: 4,
  })
  plantedAreaHa: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}
