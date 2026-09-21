import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';

import { CropSeason } from '../../crop-seasons/entities/crop-season.entity.js';
import { Producer } from '../../producers/entities/producer.entity.js';
import { State } from '../../common/enums/state.enum.js';

@Entity('farms')
@Index('IDX_farms_producer_id', ['producerId'])
@Index('IDX_farms_state', ['state'])
export class Farm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'producer_id',
    type: 'uuid',
  })
  producerId: string;

  @ManyToOne(() => Producer, (producer) => producer.farms, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'producer_id',
  })
  producer: Relation<Producer>;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  city: string;

  @Column({
    type: 'enum',
    enum: State,
  })
  state: State;

  @Column({
    name: 'total_area_ha',
    type: 'decimal',
    precision: 15,
    scale: 4,
  })
  totalArea: string;

  @Column({
    name: 'arable_area_ha',
    type: 'decimal',
    precision: 15,
    scale: 4,
  })
  arableArea: string;

  @Column({
    name: 'vegetation_area_ha',
    type: 'decimal',
    precision: 15,
    scale: 4,
  })
  vegetationArea: string;

  @OneToMany(() => CropSeason, (cropSeason) => cropSeason.farm)
  cropSeasons: Relation<CropSeason[]>;

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
