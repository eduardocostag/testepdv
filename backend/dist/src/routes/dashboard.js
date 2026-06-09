import { Router } from 'express';
import { prisma } from '../db.js';
export const dashboardRouter = Router();
dashboardRouter.get('/', async (req, res) => {
    const companyId = req.user.companyId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orders = await prisma.order.findMany({ where: { companyId, createdAt: { gte: today } }, include: { items: { include: { product: true } }, payments: true } });
    const revenue = orders.filter((o) => o.status !== 'CANCELED').reduce((sum, o) => sum + Number(o.total), 0);
    const openOrders = orders.filter((o) => !['DELIVERED', 'CANCELED'].includes(o.status)).length;
    const occupiedTables = await prisma.restaurantTable.count({ where: { companyId, status: 'OCCUPIED' } });
    const lowStock = await prisma.ingredient.findMany({ where: { companyId }, take: 20 });
    const topMap = new Map();
    orders.flatMap((o) => o.items).forEach((i) => topMap.set(i.product.name, (topMap.get(i.product.name) || 0) + i.quantity));
    const topProducts = [...topMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));
    res.json({ revenue, totalOrders: orders.length, openOrders, occupiedTables, deliveriesInProgress: orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length, lowStock: lowStock.filter((i) => Number(i.currentStock) <= Number(i.minStock)), topProducts });
});
