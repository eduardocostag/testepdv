function id() { return Math.random().toString(36).slice(2, 9); }

function matchCondition(value: any, condition: any): boolean {
	if (condition && typeof condition === 'object') {
		if ('notIn' in condition) return !condition.notIn.includes(value);
		if ('gte' in condition) return new Date(value) >= new Date(condition.gte);
		if ('not' in condition) return value !== condition.not;
		if ('contains' in condition) return String(value || '').includes(condition.contains);
	}
	return value === condition;
}

function matchWhere(item: any, where: any): boolean {
	if (!where) return true;
	return Object.keys(where).every((key) => {
		const condition = where[key];
		if (typeof condition === 'object' && !Array.isArray(condition) && condition !== null && !('notIn' in condition || 'gte' in condition || 'contains' in condition || 'not' in condition)) {
			return matchWhere(item[key], condition);
		}
		return matchCondition(item[key], condition);
	});
}

const collections: Record<string, any[]> = {};

function clone(value: any) {
	return JSON.parse(JSON.stringify(value));
}

function applyInclude(name: string, item: any, include: any) {
	if (!include) return item;
	const result: any = { ...item };
	if (name === 'order') {
		if (include.table) result.table = clone(collections.restaurantTable.find(t => t.id === item.tableId) || null);
		if (include.customer) result.customer = clone(collections.customer.find(c => c.id === item.customerId) || null);
		if (include.courier) result.courier = clone(collections.courier.find(c => c.id === item.courierId) || null);
		if (include.items) {
			const items = collections.orderItem.filter(i => i.orderId === item.id).map(i => ({ ...i }));
			if (include.items.include?.product) {
				for (const entry of items) {
					entry.product = clone(collections.product.find(p => p.id === entry.productId) || null);
				}
			}
			result.items = items;
		}
		if (include.payments) result.payments = collections.payment.filter(p => p.orderId === item.id).map(p => ({ ...p }));
	}
	if (name === 'restaurantTable') {
		if (include.orders) {
			let orders = collections.order.filter(o => o.tableId === item.id);
			if (include.orders.where) orders = orders.filter(o => matchWhere(o, include.orders.where));
			if (include.orders.include?.items) {
				orders = orders.map(order => ({
					...order,
					items: collections.orderItem.filter(i => i.orderId === order.id).map(i => ({ ...i }))
				}));
			}
			result.orders = orders;
		}
	}
	if (name === 'product') {
		if (include.category) result.category = clone(collections.category.find(c => c.id === item.categoryId) || null);
		if (include.recipeItems) {
			let items = collections.recipeItem.filter(r => r.productId === item.id).map(r => ({ ...r }));
			if (include.recipeItems.include?.ingredient) {
				for (const entry of items) {
					entry.ingredient = clone(collections.ingredient.find(i => i.id === entry.ingredientId) || null);
				}
			}
			result.recipeItems = items;
		}
	}
	if (name === 'courier') {
		if (include.orders) result.orders = collections.order.filter(o => o.courierId === item.id).map(o => ({ ...o }));
	}
	if (name === 'user') {
		if (include.timeClocks) result.timeClocks = collections.timeClock.filter(t => t.userId === item.id).map(t => ({ ...t }));
	}
	return result;
}

function sortItems(items: any[], orderBy: any) {
	if (!orderBy) return items;
	const key = Object.keys(orderBy)[0];
	const direction = orderBy[key] === 'desc' ? -1 : 1;
	return [...items].sort((a, b) => {
		if (a[key] < b[key]) return -1 * direction;
		if (a[key] > b[key]) return 1 * direction;
		return 0;
	});
}

function makeCollection(name: string, initial: any[] = []) {
	const items: any[] = initial.map(i => ({ ...i }));
	collections[name] = items;

	return {
		findMany: async ({ where, include, orderBy, take, select }: any = {}) => {
			let results = items.filter(item => matchWhere(item, where));
			results = sortItems(results, orderBy);
			if (typeof take === 'number') results = results.slice(0, take);
			results = results.map(item => {
				const record = applyInclude(name, item, include);
				if (name === 'user' && select?.timeClocks) {
					record.timeClocks = collections.timeClock.filter(t => t.userId === record.id).map(t => ({ ...t }));
				}
				return record;
			});
			if (select && Object.keys(select).length) {
				results = results.map(item => {
					const selected: any = {};
					for (const key of Object.keys(select)) {
						if (select[key] === true) {
							selected[key] = item[key];
						}
					}
					return selected;
				});
			}
			return results;
		},
		findFirst: async function(this: any, { where, include, orderBy }: any = {}) {
			const list = await this.findMany({ where, include, orderBy });
			return list[0] || null;
		},
		findUniqueOrThrow: async ({ where, include }: any = {}) => {
			const key = Object.keys(where)[0];
			const val = where[key];
			const found = items.find(it => it[key] === val);
			if (!found) throw new Error('Not found');
			return applyInclude(name, { ...found }, include);
		},
		create: async ({ data }: any) => {
			const obj = {
				id: id(),
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				...(name === 'timeClock' ? { checkIn: new Date().toISOString(), checkOut: null } : {}),
				...data
			};
			items.push(obj);
			return obj;
		},
		createMany: async ({ data }: any) => {
			for (const d of data) items.push({ id: id(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...d });
			return { count: data.length };
		},
		update: async ({ where, data }: any) => {
			const key = Object.keys(where)[0];
			const val = where[key];
			const idx = items.findIndex(it => it[key] === val);
			if (idx === -1) throw new Error('Not found');
			items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
			return items[idx];
		},
		delete: async ({ where }: any) => {
			const key = Object.keys(where)[0];
			const val = where[key];
			const idx = items.findIndex(it => it[key] === val);
			if (idx === -1) throw new Error('Not found');
			return items.splice(idx, 1)[0];
		},
		deleteMany: async ({ where }: any = {}) => {
			const before = items.length;
			for (let index = items.length - 1; index >= 0; index--) {
				if (matchWhere(items[index], where)) items.splice(index, 1);
			}
			return { count: before - items.length };
		},
		count: async ({ where }: any = {}) => {
			const list = items.filter(item => matchWhere(item, where));
			return list.length;
		}
	} as any;
}

let prisma: any;

if (process.env.USE_MOCK_DB === '1') {
	const companyId = 'company-demo';
	const users = [{ id: 'user-demo', companyId, name: 'Administrador', email: 'admin@smartfood.local', password: '123456', role: 'ADMIN', active: true, createdAt: new Date().toISOString() }];
	const tables = Array.from({ length: 8 }).map((_, i) => ({ id: `table-${i + 1}`, companyId, number: i + 1, status: i < 3 ? 'OCCUPIED' : 'FREE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
	const categories = [
		{ id: 'cat-1', companyId, name: 'Burgers', createdAt: new Date().toISOString() },
		{ id: 'cat-2', companyId, name: 'Bebidas', createdAt: new Date().toISOString() },
		{ id: 'cat-3', companyId, name: 'Porções', createdAt: new Date().toISOString() }
	];
	const ingredients = [
		{ id: 'ing-1', companyId, name: 'Carne burger', unit: 'kg', currentStock: 8, minStock: 10, createdAt: new Date().toISOString() },
		{ id: 'ing-2', companyId, name: 'Pão brioche', unit: 'un', currentStock: 42, minStock: 30, createdAt: new Date().toISOString() },
		{ id: 'ing-3', companyId, name: 'Queijo cheddar', unit: 'un', currentStock: 18, minStock: 25, createdAt: new Date().toISOString() },
		{ id: 'ing-4', companyId, name: 'Batata congelada', unit: 'kg', currentStock: 14, minStock: 8, createdAt: new Date().toISOString() }
	];
	const products = [
		{ id: 'prod-1', companyId, categoryId: 'cat-1', name: 'X-Burger Clássico', description: 'Burger, queijo e molho da casa', price: 29.9, station: 'chapa', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
		{ id: 'prod-2', companyId, categoryId: 'cat-1', name: 'Smash Duplo', description: 'Smash burger com queijo', price: 39.9, station: 'chapa', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
		{ id: 'prod-3', companyId, categoryId: 'cat-2', name: 'Coca-Cola Zero', description: 'Refrigerante 350ml', price: 7.9, station: 'bebidas', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
		{ id: 'prod-4', companyId, categoryId: 'cat-3', name: 'Batata Frita', description: 'Porção de batata frita', price: 19.9, station: 'fritadeira', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
	];
	const recipeItems = [
		{ id: 'r-1', productId: 'prod-1', ingredientId: 'ing-1', quantity: 0.18 },
		{ id: 'r-2', productId: 'prod-1', ingredientId: 'ing-2', quantity: 1 },
		{ id: 'r-3', productId: 'prod-1', ingredientId: 'ing-3', quantity: 1 },
		{ id: 'r-4', productId: 'prod-4', ingredientId: 'ing-4', quantity: 0.35 }
	];
	const couriers = [
		{ id: 'cour-1', companyId, name: 'Carlos Moto', phone: '(51) 98888-1111', vehicle: 'Moto', plate: 'ABC1D23', status: 'AVAILABLE', commissionPerDelivery: 6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
		{ id: 'cour-2', companyId, name: 'Ana Entregas', phone: '(51) 97777-2222', vehicle: 'Moto', plate: 'XYZ9K88', status: 'DELIVERING', commissionPerDelivery: 6, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
	];
	const customers = [
		{ id: 'cust-1', companyId, name: 'Cliente Delivery', phone: '(51) 99999-0000', address: 'Av. Ipiranga, 1000', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
	];
	const orders = [
		{ id: 'order-1', companyId, tableId: 'table-1', origin: 'HALL', status: 'PREPARING', total: 67.7, notes: 'Sem cebola', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
		{ id: 'order-2', companyId, customerId: 'cust-1', courierId: 'cour-1', origin: 'IFOOD', status: 'OUT_FOR_DELIVERY', externalOrderId: 'IFOOD-1001', total: 67.7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
		{ id: 'order-3', companyId, tableId: 'table-2', origin: 'HALL', status: 'DELIVERED', total: 27.9, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
	];
	const orderItems = [
		{ id: 'oi-1', orderId: 'order-1', productId: 'prod-1', quantity: 2, unitPrice: 29.9, notes: '1 sem cebola' },
		{ id: 'oi-2', orderId: 'order-1', productId: 'prod-3', quantity: 1, unitPrice: 7.9 },
		{ id: 'oi-3', orderId: 'order-2', productId: 'prod-2', quantity: 1, unitPrice: 39.9 },
		{ id: 'oi-4', orderId: 'order-2', productId: 'prod-4', quantity: 1, unitPrice: 19.9 },
		{ id: 'oi-5', orderId: 'order-2', productId: 'prod-3', quantity: 1, unitPrice: 7.9 },
		{ id: 'oi-6', orderId: 'order-3', productId: 'prod-3', quantity: 1, unitPrice: 7.9 },
		{ id: 'oi-7', orderId: 'order-3', productId: 'prod-4', quantity: 1, unitPrice: 19.9 }
	];
	const payments = [
		{ id: 'pay-1', orderId: 'order-2', method: 'PIX', status: 'PAID', amount: 67.7, createdAt: new Date().toISOString() }
	];
	const stockMovements = [
		{ id: 'sm-1', ingredientId: 'ing-1', type: 'OUT', quantity: 1.5, description: 'Venda inicial', createdAt: new Date().toISOString() }
	];
	const timeClocks: any[] = [];

	const _prisma: any = {
		user: makeCollection('user', users),
		company: makeCollection('company', [{ id: companyId, name: 'SmartFood Demo', createdAt: new Date().toISOString() }]),
		restaurantTable: makeCollection('restaurantTable', tables),
		category: makeCollection('category', categories),
		ingredient: makeCollection('ingredient', ingredients),
		product: makeCollection('product', products),
		recipeItem: makeCollection('recipeItem', recipeItems),
		courier: makeCollection('courier', couriers),
		customer: makeCollection('customer', customers),
		order: makeCollection('order', orders),
		orderItem: makeCollection('orderItem', orderItems),
		payment: makeCollection('payment', payments),
		stockMovement: makeCollection('stockMovement', stockMovements),
		timeClock: makeCollection('timeClock', timeClocks),
		ifoodIntegration: makeCollection('ifoodIntegration', []),
		ifoodEvent: makeCollection('ifoodEvent', [])
	};

	prisma = _prisma;

} else {
	const { PrismaClient } = await import('@prisma/client');
	const _real = new PrismaClient();
	prisma = _real;
}

export { prisma };
