import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Farm } from '../../farms/entities/farm.entity.js';
import { Planting } from '../../plantings/entities/planting.entity.js';

@Entity('crop_seasons')
@Unique('UQ_crop_seasons_farm_year', ['farmId', 'year'])
export class CropSeason {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'farm_id',
    type: 'uuid',
  })
  farmId: string;

  @ManyToOne(() => Farm, (farm) => farm.cropSeasons, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'farm_id',
  })
  farm: Relation<Farm>;

  @Column({
    type: 'varchar',
    length: 150,
  })
  name: string;

  @Column({
    type: 'integer',
  })
  year: number;

  @OneToMany(() => Planting, (planting) => planting.cropSeason)
  plantings: Relation<Planting[]>;

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
