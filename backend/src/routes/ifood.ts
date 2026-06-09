import { Router } from 'express';
import { prisma } from '../db.js';
import { encryptSecret, syncIfoodCompany, testIfoodConnection } from '../services/ifood.js';

export const ifoodRouter = Router();

function publicConfig(config: any) {
  if (!config) return null;
  return {
    id: config.id,
    merchantId: config.merchantId,
    clientId: config.clientId,
    hasClientSecret: Boolean(config.clientSecret),
    baseUrl: config.baseUrl,
    enabled: config.enabled,
    autoConfirm: config.autoConfirm,
    pollingInterval: config.pollingInterval,
    lastSyncAt: config.lastSyncAt,
    lastSuccessAt: config.lastSuccessAt,
    lastError: config.lastError,
    updatedAt: config.updatedAt
  };
}

ifoodRouter.get('/config', async (req, res) => {
  const config = await prisma.ifoodIntegration.findFirst({ where: { companyId: req.user!.companyId } });
  res.json(publicConfig(config));
});

ifoodRouter.put('/config', async (req, res) => {
  const companyId = req.user!.companyId;
  const current = await prisma.ifoodIntegration.findFirst({ where: { companyId } });
  const clientSecret = String(req.body.clientSecret || '').trim();
  const data = {
    merchantId: String(req.body.merchantId || '').trim(),
    clientId: String(req.body.clientId || '').trim(),
    ...(clientSecret ? { clientSecret: encryptSecret(clientSecret) } : {}),
    baseUrl: String(req.body.baseUrl || 'https://merchant-api.ifood.com.br').replace(/\/$/, ''),
    enabled: Boolean(req.body.enabled),
    autoConfirm: req.body.autoConfirm !== false,
    pollingInterval: Math.max(30, Number(req.body.pollingInterval || 30))
  };
  if (!current && !clientSecret) return res.status(400).json({ message: 'Informe o Client Secret na primeira configuracao.' });
  const config = current
    ? await prisma.ifoodIntegration.update({ where: { id: current.id }, data })
    : await prisma.ifoodIntegration.create({ data: { ...data, companyId, clientSecret: encryptSecret(clientSecret) } });
  res.json(publicConfig(config));
});

ifoodRouter.post('/config/test', async (req, res) => {
  const current = await prisma.ifoodIntegration.findFirst({ where: { companyId: req.user!.companyId } });
  const secret = String(req.body.clientSecret || '').trim();
  const config = {
    ...(current || {}),
    companyId: req.user!.companyId,
    merchantId: String(req.body.merchantId || current?.merchantId || '').trim(),
    clientId: String(req.body.clientId || current?.clientId || '').trim(),
    clientSecret: secret ? encryptSecret(secret) : current?.clientSecret,
    baseUrl: String(req.body.baseUrl || current?.baseUrl || 'https://merchant-api.ifood.com.br').replace(/\/$/, '')
  };
  if (!config.clientId || !config.clientSecret || !config.merchantId) return res.status(400).json({ message: 'Preencha Merchant ID, Client ID e Client Secret.' });
  res.json(await testIfoodConnection(config as any));
});

ifoodRouter.post('/sync', async (req, res) => {
  const config = await prisma.ifoodIntegration.findFirst({ where: { companyId: req.user!.companyId } });
  if (!config) return res.status(400).json({ message: 'Configure a integracao iFood primeiro.' });
  res.json(await syncIfoodCompany(config as any));
});

ifoodRouter.post('/simulate-order', async (req,res)=> {
  const companyId = req.user!.companyId;
  const product = await prisma.product.findFirstOrThrow({ where: { companyId, active: true } });
  const customer = await prisma.customer.create({ data: { companyId, name: req.body.customerName || 'Cliente iFood Simulado', phone: req.body.phone || '(51) 99999-9999', address: req.body.address || 'Rua Simulada, 123' } });
  const order = await prisma.order.create({ data: { companyId, customerId: customer.id, origin: 'IFOOD', externalOrderId: `IFOOD-${Date.now()}`, status: 'NEW', total: Number(product.price) } });
  await prisma.orderItem.create({ data: { orderId: order.id, productId: product.id, quantity: 1, unitPrice: product.price, notes: 'Pedido simulado via mock iFood' } });
  res.status(201).json({ message: 'Pedido iFood simulado recebido', orderId: order.id, externalOrderId: order.externalOrderId });
});

ifoodRouter.patch('/external/:externalOrderId/status', async (req,res)=> {
  const found = await prisma.order.findFirst({ where: { externalOrderId: req.params.externalOrderId, companyId: req.user!.companyId } });
  if (!found) return res.status(404).json({ message: 'Pedido externo nao encontrado' });
  const order = await prisma.order.update({ where: { id: found.id }, data: { status: req.body.status } });
  res.json({ message: 'Status externo atualizado no mock iFood', order });
});
