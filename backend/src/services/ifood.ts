import crypto from 'node:crypto';
import { prisma } from '../db.js';

type IfoodConfig = {
  id: string;
  companyId: string;
  merchantId: string;
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  enabled: boolean;
  autoConfirm: boolean;
  pollingInterval: number;
  lastSyncAt?: string | Date | null;
  lastSuccessAt?: string | Date | null;
  lastError?: string | null;
};

const tokenCache = new Map<string, { token: string; expiresAt: number }>();
let polling = false;

function encryptionKey() {
  return crypto.createHash('sha256').update(process.env.IFOOD_ENCRYPTION_KEY || process.env.JWT_SECRET || 'smartfood-dev-key').digest();
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}.${cipher.getAuthTag().toString('hex')}.${encrypted.toString('hex')}`;
}

export function decryptSecret(value: string) {
  const [ivHex, tagHex, encryptedHex] = String(value || '').split('.');
  if (!ivHex || !tagHex || !encryptedHex) return value;
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
}

async function request(config: IfoodConfig, path: string, init: RequestInit = {}) {
  const token = await getAccessToken(config);
  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  if (!response.ok) throw new Error(`iFood ${response.status}: ${await response.text()}`);
  if (response.status === 204) return null;
  return response.json();
}

async function getAccessToken(config: IfoodConfig) {
  const cached = tokenCache.get(config.companyId);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/authentication/v1.0/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grantType: 'client_credentials',
      clientId: config.clientId,
      clientSecret: decryptSecret(config.clientSecret)
    })
  });
  if (!response.ok) throw new Error(`Falha na autenticacao iFood (${response.status}): ${await response.text()}`);
  const data: any = await response.json();
  const token = data.accessToken || data.access_token;
  if (!token) throw new Error('Token iFood nao retornado.');
  tokenCache.set(config.companyId, { token, expiresAt: Date.now() + Number(data.expiresIn || data.expires_in || 21600) * 1000 });
  return token;
}

async function ensureExternalProduct(companyId: string, item: any) {
  const externalCode = String(item.externalCode || item.id || item.productId || '');
  const name = String(item.name || item.productName || 'Produto iFood');
  const existing = externalCode
    ? await prisma.product.findFirst({ where: { companyId, description: { contains: `[iFood:${externalCode}]` } } })
    : await prisma.product.findFirst({ where: { companyId, name } });
  if (existing) return existing;
  const category = await prisma.category.findFirst({ where: { companyId, name: 'iFood' } })
    || await prisma.category.create({ data: { companyId, name: 'iFood' } });
  return prisma.product.create({
    data: {
      companyId,
      categoryId: category.id,
      name,
      description: `${item.description || 'Importado automaticamente'}${externalCode ? ` [iFood:${externalCode}]` : ''}`,
      price: Number(item.unitPrice || item.price || item.totalPrice || 0),
      station: 'cozinha',
      active: true
    }
  });
}

async function importOrder(config: IfoodConfig, externalOrderId: string) {
  const existing = await prisma.order.findFirst({ where: { companyId: config.companyId, externalOrderId } });
  if (existing) return existing;

  const detail: any = await request(config, `/order/v1.0/orders/${externalOrderId}`);
  const customerData = detail.customer || {};
  const address = detail.delivery?.deliveryAddress || detail.deliveryAddress || {};
  const customer = await prisma.customer.create({
    data: {
      companyId: config.companyId,
      name: customerData.name || 'Cliente iFood',
      phone: customerData.phone?.number || customerData.phone || null,
      address: [address.streetName, address.streetNumber, address.neighborhood, address.city].filter(Boolean).join(', ') || null
    }
  });
  const order = await prisma.order.create({
    data: {
      companyId: config.companyId,
      customerId: customer.id,
      externalOrderId,
      origin: 'IFOOD',
      status: 'NEW',
      notes: detail.additionalInfo || detail.observations || null,
      total: Number(detail.total?.orderAmount || detail.totalPrice || 0)
    }
  });
  for (const item of detail.items || []) {
    const product = await ensureExternalProduct(config.companyId, item);
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || item.price || 0),
        notes: item.observations || item.options?.map((option: any) => option.name).join(', ') || null
      }
    });
  }
  return order;
}

async function acknowledge(config: IfoodConfig, eventIds: string[]) {
  if (!eventIds.length) return;
  await request(config, '/events/v1.0/events/acknowledgment', {
    method: 'POST',
    body: JSON.stringify(eventIds.map((id) => ({ id })))
  });
}

export async function testIfoodConnection(config: IfoodConfig) {
  await getAccessToken(config);
  return { ok: true, message: 'Autenticacao com iFood realizada com sucesso.' };
}

export async function syncIfoodCompany(config: IfoodConfig) {
  const events: any[] = await request(config, `/events/v1.0/events:polling?merchantId=${encodeURIComponent(config.merchantId)}`) || [];
  const acknowledged: string[] = [];
  let imported = 0;

  for (const event of events) {
    const eventId = String(event.id || '');
    if (!eventId) continue;
    const processed = await prisma.ifoodEvent.findFirst({ where: { id: eventId } });
    if (processed) {
      acknowledged.push(eventId);
      continue;
    }
    const code = String(event.code || event.fullCode || '');
    const externalOrderId = String(event.orderId || event.order?.id || '');
    if (code.includes('PLACED') && externalOrderId) {
      const order = await importOrder(config, externalOrderId);
      if (config.autoConfirm) {
        await request(config, `/order/v1.0/orders/${externalOrderId}/confirm`, { method: 'POST', body: '{}' });
        await prisma.order.update({ where: { id: order.id }, data: { status: 'ACCEPTED' } });
      }
      imported += 1;
    }
    await prisma.ifoodEvent.create({ data: { id: eventId, companyId: config.companyId, orderId: externalOrderId || null, code: code || null } });
    acknowledged.push(eventId);
  }

  await acknowledge(config, acknowledged);
  await prisma.ifoodIntegration.update({
    where: { id: config.id },
    data: { lastSyncAt: new Date(), lastSuccessAt: new Date(), lastError: null }
  });
  return { events: events.length, imported, acknowledged: acknowledged.length };
}

export async function syncIfoodStatus(companyId: string, externalOrderId: string, status: string) {
  const config = await prisma.ifoodIntegration.findFirst({ where: { companyId, enabled: true } }) as IfoodConfig | null;
  if (!config) return;
  const endpoint: Record<string, string> = {
    ACCEPTED: 'confirm',
    PREPARING: 'startPreparation',
    READY: 'readyToPickup',
    OUT_FOR_DELIVERY: 'dispatch'
  };
  if (!endpoint[status]) return;
  await request(config, `/order/v1.0/orders/${externalOrderId}/${endpoint[status]}`, { method: 'POST', body: '{}' });
}

export function startIfoodWorker() {
  const interval = Number(process.env.IFOOD_WORKER_INTERVAL_MS || 30_000);
  const run = async () => {
    if (polling) return;
    polling = true;
    try {
      const configs = await prisma.ifoodIntegration.findMany({ where: { enabled: true } }) as IfoodConfig[];
      for (const config of configs) {
        try {
          await syncIfoodCompany(config);
        } catch (error: any) {
          await prisma.ifoodIntegration.update({
            where: { id: config.id },
            data: { lastSyncAt: new Date(), lastError: String(error?.message || error).slice(0, 1000) }
          });
        }
      }
    } catch (error) {
      console.error('Falha no worker iFood:', error);
    } finally {
      polling = false;
    }
  };
  setInterval(run, interval);
  void run();
}
