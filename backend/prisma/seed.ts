import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.stockMovement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurantTable.deleteMany();
  await prisma.courier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.timeClock.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({ data: { name: 'SmartFood Demo', document: '00.000.000/0001-00' } });
  const password = await bcrypt.hash('123456', 10);
  await prisma.user.createMany({ data: [
    { companyId: company.id, name: 'Admin Demo', email: 'admin@smartfood.local', password, role: 'ADMIN' },
    { companyId: company.id, name: 'Garçom João', email: 'garcom@smartfood.local', password, role: 'WAITER' },
    { companyId: company.id, name: 'Cozinha', email: 'cozinha@smartfood.local', password, role: 'KITCHEN' }
  ]});

  for (let i=1; i<=12; i++) await prisma.restaurantTable.create({ data: { companyId: company.id, number: i, status: i <= 4 ? 'OCCUPIED' : 'FREE' } });
  const burgers = await prisma.category.create({ data: { companyId: company.id, name: 'Burgers' } });
  const drinks = await prisma.category.create({ data: { companyId: company.id, name: 'Bebidas' } });
  const sides = await prisma.category.create({ data: { companyId: company.id, name: 'Porções' } });

  const carne = await prisma.ingredient.create({ data: { companyId: company.id, name: 'Carne burger', unit: 'kg', currentStock: 8, minStock: 10 } });
  const pao = await prisma.ingredient.create({ data: { companyId: company.id, name: 'Pão brioche', unit: 'un', currentStock: 42, minStock: 30 } });
  const queijo = await prisma.ingredient.create({ data: { companyId: company.id, name: 'Queijo cheddar', unit: 'un', currentStock: 18, minStock: 25 } });
  await prisma.ingredient.create({ data: { companyId: company.id, name: 'Batata congelada', unit: 'kg', currentStock: 14, minStock: 8 } });

  const classic = await prisma.product.create({ data: { companyId: company.id, categoryId: burgers.id, name: 'X-Burger Clássico', description: 'Burger, queijo e molho da casa', price: 29.9, station: 'chapa' } });
  await prisma.recipeItem.createMany({ data: [
    { productId: classic.id, ingredientId: carne.id, quantity: 0.18 },
    { productId: classic.id, ingredientId: pao.id, quantity: 1 },
    { productId: classic.id, ingredientId: queijo.id, quantity: 1 }
  ]});
  const smash = await prisma.product.create({ data: { companyId: company.id, categoryId: burgers.id, name: 'Smash Duplo', price: 39.9, station: 'chapa' } });
  const fries = await prisma.product.create({ data: { companyId: company.id, categoryId: sides.id, name: 'Batata Frita', price: 19.9, station: 'fritadeira' } });
  const coke = await prisma.product.create({ data: { companyId: company.id, categoryId: drinks.id, name: 'Coca-Cola Zero', price: 7.9, station: 'bebidas' } });

  const customer = await prisma.customer.create({ data: { companyId: company.id, name: 'Cliente Delivery', phone: '(51) 99999-0000', address: 'Av. Ipiranga, 1000 - Porto Alegre' } });
  const c1 = await prisma.courier.create({ data: { companyId: company.id, name: 'Carlos Moto', phone: '(51) 98888-1111', vehicle: 'Moto', plate: 'ABC1D23', status: 'AVAILABLE', commissionPerDelivery: 6 } });
  await prisma.courier.create({ data: { companyId: company.id, name: 'Ana Entregas', phone: '(51) 97777-2222', vehicle: 'Moto', plate: 'XYZ9K88', status: 'DELIVERING', commissionPerDelivery: 6 } });

  const table1 = await prisma.restaurantTable.findFirstOrThrow({ where: { companyId: company.id, number: 1 } });
  const order = await prisma.order.create({ data: { companyId: company.id, tableId: table1.id, origin: 'HALL', status: 'PREPARING', total: 67.7, notes: 'Sem cebola' } });
  await prisma.orderItem.createMany({ data: [
    { orderId: order.id, productId: classic.id, quantity: 2, unitPrice: 29.9, notes: '1 sem cebola' },
    { orderId: order.id, productId: coke.id, quantity: 1, unitPrice: 7.9 }
  ]});

  const delivery = await prisma.order.create({ data: { companyId: company.id, customerId: customer.id, courierId: c1.id, origin: 'IFOOD', status: 'OUT_FOR_DELIVERY', externalOrderId: 'IFOOD-1001', total: 67.7 } });
  await prisma.orderItem.createMany({ data: [
    { orderId: delivery.id, productId: smash.id, quantity: 1, unitPrice: 39.9 },
    { orderId: delivery.id, productId: fries.id, quantity: 1, unitPrice: 19.9 },
    { orderId: delivery.id, productId: coke.id, quantity: 1, unitPrice: 7.9 }
  ]});
  await prisma.payment.create({ data: { orderId: delivery.id, method: 'PIX', status: 'PAID', amount: 67.7 } });
}
main().finally(() => prisma.$disconnect());
