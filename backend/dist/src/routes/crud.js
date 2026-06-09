import { Router } from 'express';
import { prisma } from '../db.js';
import bcrypt from 'bcryptjs';
export const crudRouter = Router();
async function categoryIdFromName(companyId, categoryName) {
    const name = String(categoryName || '').trim();
    if (!name)
        return undefined;
    const existing = await prisma.category.findFirst({ where: { companyId, name } });
    const category = existing || await prisma.category.create({ data: { companyId, name } });
    return category.id;
}
crudRouter.get('/tables', async (req, res) => res.json(await prisma.restaurantTable.findMany({ where: { companyId: req.user.companyId }, orderBy: { number: 'asc' }, include: { orders: { where: { status: { notIn: ['DELIVERED', 'CANCELED'] } }, include: { items: true } } } })));
crudRouter.patch('/tables/:id', async (req, res) => res.json(await prisma.restaurantTable.update({ where: { id: req.params.id }, data: req.body })));
crudRouter.get('/products', async (req, res) => res.json(await prisma.product.findMany({ where: { companyId: req.user.companyId }, include: { category: true, recipeItems: { include: { ingredient: true } } }, orderBy: { name: 'asc' } })));
crudRouter.post('/products', async (req, res) => {
    const { categoryName, category, price, ...body } = req.body;
    const categoryId = await categoryIdFromName(req.user.companyId, categoryName || category?.name);
    res.status(201).json(await prisma.product.create({
        data: { ...body, price: Number(price || 0), categoryId, companyId: req.user.companyId },
        include: { category: true }
    }));
});
crudRouter.patch('/products/:id', async (req, res) => {
    const { categoryName, category, price, ...body } = req.body;
    const categoryId = await categoryIdFromName(req.user.companyId, categoryName || category?.name);
    res.json(await prisma.product.update({
        where: { id: req.params.id },
        data: { ...body, ...(price === undefined ? {} : { price: Number(price) }), ...(categoryId ? { categoryId } : {}) },
        include: { category: true }
    }));
});
crudRouter.delete('/products/:id', async (req, res) => {
    const linked = await prisma.orderItem.count({ where: { productId: req.params.id } });
    if (linked)
        return res.status(409).json({ message: 'Produto possui historico de pedidos. Pause o produto em vez de excluir.' });
    await prisma.recipeItem.deleteMany({ where: { productId: req.params.id } });
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
});
crudRouter.get('/ingredients', async (req, res) => res.json(await prisma.ingredient.findMany({ where: { companyId: req.user.companyId }, orderBy: { name: 'asc' } })));
crudRouter.post('/ingredients', async (req, res) => {
    const { name, unit, currentStock, minStock } = req.body;
    res.status(201).json(await prisma.ingredient.create({
        data: {
            companyId: req.user.companyId,
            name,
            unit,
            currentStock: Number(currentStock || 0),
            minStock: Number(minStock || 0)
        }
    }));
});
crudRouter.post('/ingredients/:id/movement', async (req, res) => {
    const { type, quantity, description } = req.body;
    const ingredient = await prisma.ingredient.findUniqueOrThrow({ where: { id: req.params.id } });
    const next = type === 'IN' ? Number(ingredient.currentStock) + Number(quantity) : Number(ingredient.currentStock) - Number(quantity);
    const updated = await prisma.ingredient.update({ where: { id: req.params.id }, data: { currentStock: next } });
    await prisma.stockMovement.create({ data: { ingredientId: req.params.id, type, quantity, description } });
    res.json(updated);
});
crudRouter.get('/couriers', async (req, res) => res.json(await prisma.courier.findMany({ where: { companyId: req.user.companyId }, include: { orders: true }, orderBy: { name: 'asc' } })));
crudRouter.post('/couriers', async (req, res) => res.status(201).json(await prisma.courier.create({ data: { ...req.body, companyId: req.user.companyId } })));
crudRouter.patch('/couriers/:id', async (req, res) => res.json(await prisma.courier.update({ where: { id: req.params.id }, data: req.body })));
crudRouter.delete('/couriers/:id', async (req, res) => {
    const linked = await prisma.order.count({ where: { courierId: req.params.id } });
    if (linked)
        return res.status(409).json({ message: 'Motoboy possui historico de entregas e nao pode ser excluido.' });
    await prisma.courier.delete({ where: { id: req.params.id } });
    res.status(204).send();
});
crudRouter.get('/employees', async (req, res) => res.json(await prisma.user.findMany({ where: { companyId: req.user.companyId }, select: { id: true, name: true, email: true, role: true, active: true, timeClocks: true } })));
crudRouter.post('/employees', async (req, res) => {
    const password = await bcrypt.hash(String(req.body.password || '123456'), 10);
    res.status(201).json(await prisma.user.create({
        data: { companyId: req.user.companyId, name: req.body.name, email: req.body.email, role: req.body.role || 'WAITER', active: req.body.active !== false, password },
        select: { id: true, name: true, email: true, role: true, active: true, timeClocks: true }
    }));
});
crudRouter.patch('/employees/:id', async (req, res) => {
    const { password, ...data } = req.body;
    res.json(await prisma.user.update({
        where: { id: req.params.id },
        data: { ...data, ...(password ? { password: await bcrypt.hash(String(password), 10) } : {}) },
        select: { id: true, name: true, email: true, role: true, active: true, timeClocks: true }
    }));
});
crudRouter.delete('/employees/:id', async (req, res) => {
    if (req.params.id === req.user.id)
        return res.status(409).json({ message: 'Voce nao pode excluir seu proprio usuario.' });
    await prisma.timeClock.deleteMany({ where: { userId: req.params.id } });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
});
crudRouter.post('/employees/:id/checkin', async (req, res) => res.json(await prisma.timeClock.create({ data: { userId: req.params.id } })));
crudRouter.post('/employees/:id/checkout', async (req, res) => {
    const open = await prisma.timeClock.findFirst({ where: { userId: req.params.id, checkOut: null }, orderBy: { checkIn: 'desc' } });
    if (!open)
        return res.status(400).json({ message: 'Nenhum ponto aberto' });
    res.json(await prisma.timeClock.update({ where: { id: open.id }, data: { checkOut: new Date() } }));
});
