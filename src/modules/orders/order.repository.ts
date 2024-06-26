import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderDetails } from '../entities/orderDetails.entity';
import { Products } from '../entities/products.entity';
import { Users } from '../entities/users.entity';
import { Orders } from '../entities/orders.entity';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectRepository(Orders) private orderRepository: Repository<Orders>,
    @InjectRepository(Users) private userRepository: Repository<Users>,
    @InjectRepository(OrderDetails)
    private orderDetailsRepository: Repository<OrderDetails>,
    @InjectRepository(Products) private productRepository: Repository<Products>,
  ) {}

  async createOrder(userId: string, products: Products[]) {
    let total = 0;

    //Verificación del usuario
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const order = new Orders();
    order.date = new Date();
    order.user = user;

    //Agregar a la BD
    const newOrder = await this.orderRepository.save(order);

    // Asociación de la id con el producto
    const productsArray = await Promise.all(
      products.map(async (element) => {
        const product = await this.productRepository.findOneBy({
          id: element.id,
        });

        // VALIDAR LA EXISTENCIA DE LOS PRODUCTOS
        if (!product) {
          throw new NotFoundException(`User with id ${element.id} not found`);
        }
        if (product.stock <= 0) {
          throw new NotFoundException(
            `Product with id ${product.id} doesnt have stock`,
          );
        }

        //Calcular el precio total
        total += Number(product.price);

        //Actualización del stock
        await this.productRepository.update(
          { id: element.id },
          { stock: product.stock - 1 },
        );

        return product;
      }),
    );

    //Creación del orderDetail y agregado a la BD
    const orderDetail = new OrderDetails();

    orderDetail.price = Number(Number(total).toFixed(2));
    orderDetail.products = productsArray;
    orderDetail.order = newOrder;

    await this.orderDetailsRepository.save(orderDetail);

    //Envío al cliente con la compra y la info
    return await this.orderRepository.find({
      where: { id: newOrder.id },
      relations: { orderDetails: true },
    });
  }

  async getOrder(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        orderDetails: {
          products: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }
    return order;
  }
}
