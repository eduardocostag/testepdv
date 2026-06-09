import { Router } from 'express';
import { prisma } from '../db.js';
import { syncIfoodStatus } from '../services/ifood.js';
export const ordersRouter = Router();
async function recalcOrder(orderId) {
    const items = await prisma.orderItem.findMany({ where: { orderId } });
    const total = items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0);
    return prisma.order.update({ where: { id: orderId }, data: { total } });
}
async function decrementStock(productId, quantity) {
    const recipe = await prisma.recipeItem.findMany({ where: { productId }, include: { ingredient: true } });
    for (const r of recipe) {
        const amount = Number(r.quantity) * quantity;
        await prisma.ingredient.update({ where: { id: r.ingredientId }, data: { currentStock: Number(r.ingredient.currentStock) - amount } });
        await prisma.stockMovement.create({ data: { ingredientId: r.ingredientId, type: 'AUTO_SALE', quantity: amount, description: `Baixa automática por venda` } });
    }
}
ordersRouter.get('/', async (req, res) => {
    const orders = await prisma.order.findMany({
        where: { companyId: req.user.companyId },
        include: { table: true, customer: true, courier: true, items: { include: { product: true } }, payments: true },
        orderBy: { createdAt: 'desc' }, take: 100
    });
    res.json(orders);
});
ordersRouter.post('/', async (req, res) => {
    const { items, customerName, phone, address, discount, serviceFee, subtotal, ...data } = req.body;
    const companyId = req.user.companyId;
    let customerId = data.customerId;
    if (!customerId && data.origin !== 'HALL' && customerName) {
        const existing = phone
            ? await prisma.customer.findFirst({ where: { companyId, phone } })
            : null;
        const customer = existing || await prisma.customer.create({
            data: { companyId, name: customerName, phone, address }
        });
        customerId = customer.id;
    }
    const order = await prisma.order.create({ data: { ...data, customerId, companyId } });
    if (data.tableId)
        await prisma.restaurantTable.update({ where: { id: data.tableId }, data: { status: 'OCCUPIED' } });
    for (const item of items || []) {
        const product = await prisma.product.findUniqueOrThrow({ where: { id: item.productId } });
        await prisma.orderItem.create({ data: { orderId: order.id, productId: item.productId, quantity: item.quantity, unitPrice: product.price, notes: item.notes } });
        await decrementStock(item.productId, item.quantity);
    }
    res.status(201).json(await recalcOrder(order.id));
});
ordersRouter.patch('/:id/status', async (req, res) => {
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    if (['DELIVERED', 'CANCELED'].includes(req.body.status) && order.tableId) {
        await prisma.restaurantTable.update({ where: { id: order.tableId }, data: { status: 'FREE' } });
    }
    if (['DELIVERED', 'CANCELED'].includes(req.body.status) && order.courierId) {
        await prisma.courier.update({ where: { id: order.courierId }, data: { status: 'AVAILABLE' } });
    }
    if (order.externalOrderId) {
        syncIfoodStatus(req.user.companyId, order.externalOrderId, req.body.status).catch((error) => console.error('Falha ao atualizar status no iFood:', error));
    }
    res.json(order);
});
ordersRouter.patch('/:id/courier', async (req, res) => {
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { courierId: req.body.courierId, status: 'OUT_FOR_DELIVERY' } });
    if (req.body.courierId)
        await prisma.courier.update({ where: { id: req.body.courierId }, data: { status: 'DELIVERING' } });
    res.json(order);
});
ordersRouter.post('/:id/payments', async (req, res) => {
    const payment = await prisma.payment.create({ data: { orderId: req.params.id, method: req.body.method, amount: req.body.amount, status: req.body.status || 'PAID' } });
    const payments = await prisma.payment.findMany({ where: { orderId: req.params.id, status: 'PAID' } });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
    const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
    if (paid >= Number(order.total))
        await prisma.order.update({ where: { id: order.id }, data: { status: order.origin === 'HALL' ? 'DELIVERED' : order.status } });
    res.status(201).json(payment);
});
