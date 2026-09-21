import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';

import { Farm } from '../../farms/entities/farm.entity.js';
import { DocumentType } from '../../common/enums/document-type.enum.js';

@Entity('producers')
export class Producer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 14,
    unique: true,
  })
  document: string;

  @Column({
    name: 'document_type',
    type: 'enum',
    enum: DocumentType,
    enumName: 'document_type_enum',
  })
  documentType: DocumentType;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  @OneToMany(() => Farm, (farm) => farm.producer)
  farms: Relation<Farm[]>;

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
