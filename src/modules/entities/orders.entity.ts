import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './users.entity';
import { OrderDetails } from './orderDetails.entity';

@Entity({
  name: 'orders',
})
export class Orders {
  /**
   * UUID generated automatically
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Order creation date.
   */
  @Column()
  date: Date;

  //* Orders 1:1 OrderDetails
  @OneToOne(() => OrderDetails, (orderDetails) => orderDetails.order)
  orderDetails: OrderDetails;

  @ManyToOne(() => Users, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: Users;
}
