import { Router } from 'express';
import { prisma } from '../db.js';
export const assistantRouter = Router();
assistantRouter.post('/ask', async (req, res) => {
    const q = String(req.body.question || '').toLowerCase();
    const companyId = req.user.companyId;
    if (q.includes('estoque')) {
        const items = await prisma.ingredient.findMany({ where: { companyId } });
        const low = items.filter((i) => Number(i.currentStock) <= Number(i.minStock)).map((i) => i.name).join(', ') || 'nenhum item crítico';
        return res.json({ answer: `Itens com estoque baixo: ${low}.` });
    }
    if (q.includes('motoboy')) {
        const couriers = await prisma.courier.findMany({ where: { companyId }, include: { orders: true } });
        const best = couriers.sort((a, b) => b.orders.length - a.orders.length)[0];
        return res.json({ answer: best ? `${best.name} está com mais entregas registradas (${best.orders.length}).` : 'Nenhum motoboy cadastrado.' });
    }
    if (q.includes('faturamento')) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const orders = await prisma.order.findMany({ where: { companyId, createdAt: { gte: today }, status: { not: 'CANCELED' } } });
        const total = orders.reduce((s, o) => s + Number(o.total), 0);
        return res.json({ answer: `O faturamento de hoje está em R$ ${total.toFixed(2).replace('.', ',')}.` });
    }
    const late = await prisma.order.count({ where: { companyId, status: 'PREPARING' } });
    res.json({ answer: `Resumo rápido: existem ${late} pedido(s) em preparo. Posso responder sobre estoque, motoboy, faturamento e pedidos atrasados.` });
});
