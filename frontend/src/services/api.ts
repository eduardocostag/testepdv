import axios, { AxiosAdapter, AxiosResponse } from 'axios';

const env = (import.meta as any).env;
const useRealApi = env.VITE_API_MODE === 'real';

type Any = any;

const storeKey = 'smartfood-demo-db-v3';

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

function seedDb() {
  const companyId = 'company_demo';
  const products = [
    { id: 'prod_classic', companyId, category: { name: 'Burgers' }, name: 'X-Burger Classico', description: 'Burger, queijo e molho da casa', price: 29.9, station: 'chapa', active: true },
    { id: 'prod_smash', companyId, category: { name: 'Burgers' }, name: 'Smash Duplo', description: 'Dois smash burgers com cheddar', price: 39.9, station: 'chapa', active: true },
    { id: 'prod_fries', companyId, category: { name: 'Porcoes' }, name: 'Batata Frita', description: 'Porcao crocante com sal da casa', price: 19.9, station: 'fritadeira', active: true },
    { id: 'prod_coke', companyId, category: { name: 'Bebidas' }, name: 'Coca-Cola Zero', description: 'Lata 350ml gelada', price: 7.9, station: 'bebidas', active: true },
    { id: 'prod_salad', companyId, category: { name: 'Leves' }, name: 'Salada Caesar', description: 'Frango, folhas e molho caesar', price: 32.9, station: 'cozinha', active: true }
  ];

  const tables = Array.from({ length: 12 }, (_, index) => ({
    id: `table_${index + 1}`,
    companyId,
    number: index + 1,
    status: index < 3 ? 'OCCUPIED' : 'FREE',
    orders: []
  }));

  const couriers = [
    { id: 'courier_carlos', companyId, name: 'Carlos Moto', phone: '(51) 98888-1111', vehicle: 'Moto', plate: 'ABC1D23', status: 'AVAILABLE', commissionPerDelivery: 6, orders: [] },
    { id: 'courier_ana', companyId, name: 'Ana Entregas', phone: '(51) 97777-2222', vehicle: 'Moto', plate: 'XYZ9K88', status: 'DELIVERING', commissionPerDelivery: 6, orders: [] }
  ];

  const ingredients = [
    { id: 'ing_meat', companyId, name: 'Carne burger', unit: 'kg', currentStock: 8, minStock: 10 },
    { id: 'ing_bread', companyId, name: 'Pao brioche', unit: 'un', currentStock: 42, minStock: 30 },
    { id: 'ing_cheese', companyId, name: 'Queijo cheddar', unit: 'un', currentStock: 18, minStock: 25 },
    { id: 'ing_potato', companyId, name: 'Batata congelada', unit: 'kg', currentStock: 14, minStock: 8 }
  ];

  const customers = [{ id: 'customer_delivery', companyId, name: 'Cliente Delivery', phone: '(51) 99999-0000', address: 'Av. Ipiranga, 1000' }];
  const employees = [
    { id: 'user_admin', companyId, name: 'Admin Demo', email: 'admin@smartfood.local', role: 'ADMIN', active: true, timeClocks: [] },
    { id: 'user_waiter', companyId, name: 'Garcom Joao', email: 'garcom@smartfood.local', role: 'WAITER', active: true, timeClocks: [] },
    { id: 'user_kitchen', companyId, name: 'Cozinha', email: 'cozinha@smartfood.local', role: 'KITCHEN', active: true, timeClocks: [] }
  ];

  const order1 = {
    id: 'order_table_01',
    companyId,
    tableId: 'table_1',
    table: tables[0],
    customerId: null,
    customer: null,
    courierId: null,
    courier: null,
    origin: 'HALL',
    status: 'PREPARING',
    total: 67.7,
    createdAt: new Date().toISOString(),
    items: [
      { id: 'item_1', orderId: 'order_table_01', productId: 'prod_classic', product: products[0], quantity: 2, unitPrice: 29.9, notes: '1 sem cebola' },
      { id: 'item_2', orderId: 'order_table_01', productId: 'prod_coke', product: products[3], quantity: 1, unitPrice: 7.9, notes: '' }
    ],
    payments: []
  };

  const order2 = {
    id: 'order_ifood_01',
    companyId,
    tableId: null,
    table: null,
    customerId: 'customer_delivery',
    customer: customers[0],
    courierId: 'courier_carlos',
    courier: couriers[0],
    origin: 'IFOOD',
    status: 'OUT_FOR_DELIVERY',
    total: 67.7,
    createdAt: new Date().toISOString(),
    items: [
      { id: 'item_3', orderId: 'order_ifood_01', productId: 'prod_smash', product: products[1], quantity: 1, unitPrice: 39.9, notes: '' },
      { id: 'item_4', orderId: 'order_ifood_01', productId: 'prod_fries', product: products[2], quantity: 1, unitPrice: 19.9, notes: '' },
      { id: 'item_5', orderId: 'order_ifood_01', productId: 'prod_coke', product: products[3], quantity: 1, unitPrice: 7.9, notes: '' }
    ],
    payments: [{ id: 'pay_1', orderId: 'order_ifood_01', method: 'PIX', status: 'PAID', amount: 67.7 }]
  };

  return {
    companyId,
    token: 'smartfood-demo-token',
    user: employees[0],
    products,
    tables,
    couriers,
    ingredients,
    customers,
    employees,
    ifoodConfig: null,
    orders: [order2, order1]
  };
}

function readDb() {
  const saved = localStorage.getItem(storeKey);
  if (saved) {
    try {
      const db = JSON.parse(saved);
      if (db?.products?.length && db?.tables?.length && Array.isArray(db.orders) && Array.isArray(db.ingredients)) {
        return db;
      }
    } catch {
      localStorage.removeItem(storeKey);
    }
  }
  const db = seedDb();
  writeDb(db);
  return db;
}

function writeDb(db: Any) {
  localStorage.setItem(storeKey, JSON.stringify(db));
}

function withRelations(db: Any, order: Any) {
  const table = order.tableId ? db.tables.find((item: Any) => item.id === order.tableId) : null;
  const customer = order.customerId ? db.customers.find((item: Any) => item.id === order.customerId) : null;
  const courier = order.courierId ? db.couriers.find((item: Any) => item.id === order.courierId) : null;
  return {
    ...order,
    table,
    customer,
    courier,
    items: order.items.map((item: Any) => ({
      ...item,
      product: db.products.find((product: Any) => product.id === item.productId) || item.product
    })),
    payments: order.payments || []
  };
}

function ordersWithRelations(db: Any) {
  return db.orders.map((order: Any) => withRelations(db, order)).sort((a: Any, b: Any) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function recalcTables(db: Any) {
  db.tables = db.tables.map((table: Any) => ({
    ...table,
    orders: ordersWithRelations(db).filter((order: Any) => order.tableId === table.id && !['DELIVERED', 'CANCELED'].includes(order.status))
  }));
}

function dashboard(db: Any) {
  const orders = ordersWithRelations(db);
  const revenue = orders.filter((order: Any) => order.status !== 'CANCELED').reduce((sum: number, order: Any) => sum + Number(order.total), 0);
  const openOrders = orders.filter((order: Any) => !['DELIVERED', 'CANCELED'].includes(order.status)).length;
  const topMap = new Map<string, number>();

  orders.flatMap((order: Any) => order.items).forEach((item: Any) => {
    const name = item.product?.name || 'Produto removido';
    topMap.set(name, (topMap.get(name) || 0) + item.quantity);
  });

  return {
    revenue,
    totalOrders: orders.length,
    openOrders,
    occupiedTables: db.tables.filter((table: Any) => table.status === 'OCCUPIED').length,
    deliveriesInProgress: orders.filter((order: Any) => order.status === 'OUT_FOR_DELIVERY').length,
    lowStock: db.ingredients.filter((item: Any) => Number(item.currentStock) <= Number(item.minStock)),
    topProducts: [...topMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }))
  };
}

function response(config: Any, data: Any, status = 200): AxiosResponse {
  return {
    data,
    status,
    statusText: status >= 400 ? 'Error' : 'OK',
    headers: {},
    config
  };
}

function parseBody(data: Any) {
  if (!data) return {};
  return typeof data === 'string' ? JSON.parse(data) : data;
}

function normalizeUrl(config: Any) {
  const raw = String(config.url || '/');
  return raw.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
}

const demoAdapter: AxiosAdapter = async (config) => {
  await new Promise((resolve) => setTimeout(resolve, 160));
  const db = readDb();
  const method = String(config.method || 'get').toUpperCase();
  const url = normalizeUrl(config);
  const body = parseBody(config.data);

  recalcTables(db);

  if (method === 'POST' && url === '/auth/login') {
    if (body.email === 'admin@smartfood.local' && body.password === '123456') {
      return response(config, { token: db.token, user: db.user });
    }
    return Promise.reject({ response: response(config, { message: 'Login invalido' }, 401) });
  }

  if (method === 'GET' && url === '/dashboard') return response(config, dashboard(db));
  if (method === 'GET' && url === '/products') return response(config, db.products);
  if (method === 'GET' && url === '/tables') return response(config, db.tables);
  if (method === 'GET' && url === '/orders') return response(config, ordersWithRelations(db));
  if (method === 'GET' && url === '/couriers') {
    const couriers = db.couriers.map((courier: Any) => ({
      ...courier,
      orders: db.orders.filter((order: Any) => order.courierId === courier.id)
    }));
    return response(config, couriers);
  }
  if (method === 'GET' && url === '/ingredients') return response(config, db.ingredients);
  if (method === 'GET' && url === '/employees') return response(config, db.employees);
  if (method === 'GET' && url === '/ifood/config') return response(config, db.ifoodConfig);

  if (method === 'PUT' && url === '/ifood/config') {
    db.ifoodConfig = {
      id: db.ifoodConfig?.id || uid('ifood'),
      merchantId: body.merchantId,
      clientId: body.clientId,
      hasClientSecret: Boolean(body.clientSecret || db.ifoodConfig?.hasClientSecret),
      baseUrl: body.baseUrl || 'https://merchant-api.ifood.com.br',
      enabled: Boolean(body.enabled),
      autoConfirm: body.autoConfirm !== false,
      pollingInterval: Math.max(30, Number(body.pollingInterval || 30)),
      lastSyncAt: db.ifoodConfig?.lastSyncAt || null,
      lastSuccessAt: db.ifoodConfig?.lastSuccessAt || null,
      lastError: null,
      updatedAt: new Date().toISOString()
    };
    writeDb(db);
    return response(config, db.ifoodConfig);
  }

  if (method === 'POST' && url === '/ifood/config/test') {
    if (!body.merchantId || !body.clientId || (!body.clientSecret && !db.ifoodConfig?.hasClientSecret)) {
      return Promise.reject({ response: response(config, { message: 'Preencha Merchant ID, Client ID e Client Secret.' }, 400) });
    }
    return response(config, { ok: true, message: 'Conexao demo validada. No modo real, o backend autenticara na API oficial do iFood.' });
  }

  if (method === 'POST' && url === '/ifood/sync') {
    if (!db.ifoodConfig) return Promise.reject({ response: response(config, { message: 'Configure a integracao iFood primeiro.' }, 400) });
    db.ifoodConfig = { ...db.ifoodConfig, lastSyncAt: new Date().toISOString(), lastSuccessAt: new Date().toISOString(), lastError: null };
    writeDb(db);
    return response(config, { events: 0, imported: 0, acknowledged: 0 });
  }

  if (method === 'POST' && url === '/products') {
    const product = {
      id: uid('prod'),
      companyId: db.companyId,
      category: { name: body.categoryName || 'Geral' },
      name: body.name,
      description: body.description || '',
      price: Number(body.price || 0),
      station: body.station || 'geral',
      active: body.active ?? true
    };
    db.products.push(product);
    writeDb(db);
    return response(config, product, 201);
  }

  const productMatch = url.match(/^\/products\/(.+)$/);
  if (method === 'PATCH' && productMatch) {
    db.products = db.products.map((product: Any) => {
      if (product.id !== productMatch[1]) return product;
      const category = body.categoryName ? { name: body.categoryName } : product.category;
      return { ...product, ...body, category, price: body.price === undefined ? product.price : Number(body.price) };
    });
    writeDb(db);
    return response(config, db.products.find((product: Any) => product.id === productMatch[1]));
  }
  if (method === 'DELETE' && productMatch) {
    const linked = db.orders.some((order: Any) => order.items.some((item: Any) => item.productId === productMatch[1]));
    if (linked) return Promise.reject({ response: response(config, { message: 'Produto possui historico de pedidos. Pause o produto em vez de excluir.' }, 409) });
    db.products = db.products.filter((product: Any) => product.id !== productMatch[1]);
    writeDb(db);
    return response(config, null, 204);
  }

  if (method === 'POST' && url === '/couriers') {
    const courier = {
      id: uid('courier'),
      companyId: db.companyId,
      name: body.name,
      phone: body.phone || '',
      vehicle: body.vehicle || '',
      plate: body.plate || '',
      status: body.status || 'AVAILABLE',
      commissionPerDelivery: Number(body.commissionPerDelivery || 0),
      orders: []
    };
    db.couriers.push(courier);
    writeDb(db);
    return response(config, courier, 201);
  }

  const courierCrudMatch = url.match(/^\/couriers\/(.+)$/);
  if (method === 'PATCH' && courierCrudMatch) {
    db.couriers = db.couriers.map((courier: Any) => (courier.id === courierCrudMatch[1] ? { ...courier, ...body } : courier));
    writeDb(db);
    return response(config, db.couriers.find((courier: Any) => courier.id === courierCrudMatch[1]));
  }
  if (method === 'DELETE' && courierCrudMatch) {
    const linked = db.orders.some((order: Any) => order.courierId === courierCrudMatch[1]);
    if (linked) return Promise.reject({ response: response(config, { message: 'Motoboy possui historico de entregas e nao pode ser excluido.' }, 409) });
    db.couriers = db.couriers.filter((courier: Any) => courier.id !== courierCrudMatch[1]);
    writeDb(db);
    return response(config, null, 204);
  }

  if (method === 'POST' && url === '/employees') {
    const employee = { id: uid('user'), companyId: db.companyId, name: body.name, email: body.email, role: body.role || 'WAITER', active: body.active !== false, timeClocks: [] };
    db.employees.push(employee);
    writeDb(db);
    return response(config, employee, 201);
  }

  const employeeCrudMatch = url.match(/^\/employees\/(.+)$/);
  if (method === 'PATCH' && employeeCrudMatch) {
    db.employees = db.employees.map((employee: Any) => employee.id === employeeCrudMatch[1] ? { ...employee, ...body, password: undefined } : employee);
    writeDb(db);
    return response(config, db.employees.find((employee: Any) => employee.id === employeeCrudMatch[1]));
  }
  if (method === 'DELETE' && employeeCrudMatch) {
    db.employees = db.employees.filter((employee: Any) => employee.id !== employeeCrudMatch[1]);
    writeDb(db);
    return response(config, null, 204);
  }

  if (method === 'POST' && url === '/ingredients') {
    const ingredient = {
      id: uid('ing'),
      companyId: db.companyId,
      name: body.name,
      unit: body.unit || 'un',
      currentStock: Number(body.currentStock || 0),
      minStock: Number(body.minStock || 0)
    };
    db.ingredients.push(ingredient);
    writeDb(db);
    return response(config, ingredient, 201);
  }

  const tableMatch = url.match(/^\/tables\/(.+)$/);
  if (method === 'PATCH' && tableMatch) {
    db.tables = db.tables.map((table: Any) => (table.id === tableMatch[1] ? { ...table, ...body } : table));
    writeDb(db);
    return response(config, db.tables.find((table: Any) => table.id === tableMatch[1]));
  }

  if (method === 'POST' && url === '/orders') {
    let customerId = body.customerId;
    if (!customerId && body.origin !== 'HALL') {
      const existing = body.phone ? db.customers.find((customer: Any) => customer.phone === body.phone) : null;
      const customer = existing || { id: uid('customer'), companyId: db.companyId, name: body.customerName || 'Cliente', phone: body.phone || '', address: body.address || '' };
      if (!existing) db.customers.push(customer);
      customerId = customer.id;
    }

    const items = (body.items || []).map((item: Any) => {
      const product = db.products.find((p: Any) => p.id === item.productId);
      return {
        id: uid('item'),
        productId: item.productId,
        product,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(product?.price || 0),
        notes: item.notes || ''
      };
    });

    const orderId = uid('order');
    const subtotal = items.reduce((sum: number, item: Any) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
    const total = Math.max(0, subtotal - Number(body.discount || 0) + Number(body.serviceFee || 0));
    const order = {
      id: orderId,
      companyId: db.companyId,
      tableId: body.tableId || null,
      customerId: customerId || null,
      courierId: null,
      origin: body.origin || 'HALL',
      status: 'NEW',
      subtotal,
      discount: Number(body.discount || 0),
      serviceFee: Number(body.serviceFee || 0),
      total,
      createdAt: new Date().toISOString(),
      items: items.map((item: Any) => ({ ...item, orderId })),
      payments: []
    };

    db.orders.unshift(order);
    if (body.tableId) db.tables = db.tables.map((table: Any) => (table.id === body.tableId ? { ...table, status: 'OCCUPIED' } : table));
    writeDb(db);
    return response(config, withRelations(db, order), 201);
  }

  const statusMatch = url.match(/^\/orders\/(.+)\/status$/);
  if (method === 'PATCH' && statusMatch) {
    db.orders = db.orders.map((order: Any) => {
      if (order.id !== statusMatch[1]) return order;
      if (['DELIVERED', 'CANCELED'].includes(body.status) && order.tableId) {
        db.tables = db.tables.map((table: Any) => (table.id === order.tableId ? { ...table, status: 'FREE' } : table));
      }
      if (['DELIVERED', 'CANCELED'].includes(body.status) && order.courierId) {
        db.couriers = db.couriers.map((courier: Any) => (courier.id === order.courierId ? { ...courier, status: 'AVAILABLE' } : courier));
      }
      return { ...order, status: body.status };
    });
    writeDb(db);
    return response(config, withRelations(db, db.orders.find((order: Any) => order.id === statusMatch[1])));
  }

  const courierMatch = url.match(/^\/orders\/(.+)\/courier$/);
  if (method === 'PATCH' && courierMatch) {
    db.orders = db.orders.map((order: Any) => (order.id === courierMatch[1] ? { ...order, courierId: body.courierId, status: 'OUT_FOR_DELIVERY' } : order));
    db.couriers = db.couriers.map((courier: Any) => (courier.id === body.courierId ? { ...courier, status: 'DELIVERING' } : courier));
    writeDb(db);
    return response(config, withRelations(db, db.orders.find((order: Any) => order.id === courierMatch[1])));
  }

  const paymentMatch = url.match(/^\/orders\/(.+)\/payments$/);
  if (method === 'POST' && paymentMatch) {
    let payment: Any;
    db.orders = db.orders.map((order: Any) => {
      if (order.id !== paymentMatch[1]) return order;
      payment = {
        id: uid('pay'),
        orderId: order.id,
        method: body.method || 'PIX',
        status: body.status || 'PAID',
        amount: Number(body.amount || order.total),
        discount: Number(body.discount || 0),
        serviceFee: Number(body.serviceFee || 0),
        createdAt: new Date().toISOString()
      };
      const payments = [...(order.payments || []), payment];
      const paid = payments.reduce((sum: number, item: Any) => sum + Number(item.amount), 0);
      return { ...order, payments, status: paid >= Number(order.total) && order.origin === 'HALL' ? 'DELIVERED' : order.status };
    });
    writeDb(db);
    return response(config, payment, 201);
  }

  const stockMatch = url.match(/^\/ingredients\/(.+)\/movement$/);
  if (method === 'POST' && stockMatch) {
    db.ingredients = db.ingredients.map((item: Any) => {
      if (item.id !== stockMatch[1]) return item;
      const amount = Number(body.quantity || 0);
      return { ...item, currentStock: body.type === 'OUT' ? Number(item.currentStock) - amount : Number(item.currentStock) + amount };
    });
    writeDb(db);
    return response(config, db.ingredients.find((item: Any) => item.id === stockMatch[1]));
  }

  const checkInMatch = url.match(/^\/employees\/(.+)\/checkin$/);
  if (method === 'POST' && checkInMatch) {
    db.employees = db.employees.map((employee: Any) =>
      employee.id === checkInMatch[1]
        ? { ...employee, timeClocks: [...(employee.timeClocks || []), { id: uid('clock'), userId: employee.id, checkIn: new Date().toISOString(), checkOut: null }] }
        : employee
    );
    writeDb(db);
    return response(config, { ok: true });
  }

  const checkOutMatch = url.match(/^\/employees\/(.+)\/checkout$/);
  if (method === 'POST' && checkOutMatch) {
    db.employees = db.employees.map((employee: Any) =>
      employee.id === checkOutMatch[1]
        ? { ...employee, timeClocks: (employee.timeClocks || []).map((clock: Any) => (clock.checkOut ? clock : { ...clock, checkOut: new Date().toISOString() })) }
        : employee
    );
    writeDb(db);
    return response(config, { ok: true });
  }

  if (method === 'POST' && url === '/ifood/simulate-order') {
    const product = db.products[0];
    const customer = { id: uid('customer'), companyId: db.companyId, name: body.customerName || 'Cliente iFood Simulado', phone: body.phone || '(51) 99999-9999', address: body.address || 'Rua Simulada, 123' };
    db.customers.push(customer);
    const orderId = uid('order');
    db.orders.unshift({
      id: orderId,
      companyId: db.companyId,
      tableId: null,
      customerId: customer.id,
      courierId: null,
      origin: 'IFOOD',
      status: 'NEW',
      externalOrderId: `IFOOD-${Date.now()}`,
      total: Number(product.price),
      createdAt: new Date().toISOString(),
      items: [{ id: uid('item'), orderId, productId: product.id, product, quantity: 1, unitPrice: Number(product.price), notes: 'Pedido simulado via mock iFood' }],
      payments: []
    });
    writeDb(db);
    return response(config, { message: 'Pedido iFood simulado recebido', orderId }, 201);
  }

  if (method === 'POST' && url === '/assistant/ask') {
    const question = String(body.question || '').toLowerCase();
    if (question.includes('estoque')) {
      const low = db.ingredients.filter((item: Any) => Number(item.currentStock) <= Number(item.minStock)).map((item: Any) => item.name).join(', ') || 'nenhum item critico';
      return response(config, { answer: `Itens com estoque baixo: ${low}.` });
    }
    if (question.includes('motoboy')) {
      const ranked = db.couriers.map((courier: Any) => ({ ...courier, count: db.orders.filter((order: Any) => order.courierId === courier.id).length })).sort((a: Any, b: Any) => b.count - a.count);
      return response(config, { answer: ranked[0] ? `${ranked[0].name} tem mais entregas registradas (${ranked[0].count}).` : 'Nenhum motoboy cadastrado.' });
    }
    if (question.includes('faturamento')) return response(config, { answer: `O faturamento atual esta em ${dashboard(db).revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.` });
    const preparing = db.orders.filter((order: Any) => order.status === 'PREPARING').length;
    return response(config, { answer: `Resumo rapido: existem ${preparing} pedido(s) em preparo. Posso responder sobre estoque, motoboy e faturamento.` });
  }

  return Promise.reject({ response: response(config, { message: `Rota demo nao implementada: ${method} ${url}` }, 404) });
};

export const api = axios.create({
  baseURL: env.VITE_API_URL || 'http://localhost:3333',
  adapter: useRealApi ? undefined : demoAdapter
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
