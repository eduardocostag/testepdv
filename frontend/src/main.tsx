import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Bike,
  Bot,
  CheckCircle2,
  ChefHat,
  ClipboardCheck,
  Clock3,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Moon,
  Package,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  RefreshCcw,
  Search,
  Settings,
  ShoppingBag,
  Sun,
  Table2,
  Trash2,
  Users,
  Utensils,
  WalletCards,
  XCircle
} from 'lucide-react';
import { api } from './services/api';
import './styles/global.css';

type Any = any;
type Theme = 'dark' | 'light';

const demoMode = true;
const currency = (value: number | string) =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const originLabel: Record<string, string> = {
  HALL: 'Salao',
  COUNTER: 'Balcao',
  DELIVERY: 'Delivery',
  IFOOD: 'iFood',
  WHATSAPP: 'WhatsApp'
};

const statusLabel: Record<string, string> = {
  NEW: 'Novo',
  ACCEPTED: 'Aceito',
  PREPARING: 'Em preparo',
  READY: 'Pronto',
  OUT_FOR_DELIVERY: 'Em entrega',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado',
  FREE: 'Livre',
  OCCUPIED: 'Ocupada',
  WAITING_PAYMENT: 'Aguardando pagamento'
};

const courierStatusLabel: Record<string, string> = {
  AVAILABLE: 'Disponivel',
  DELIVERING: 'Entregando',
  ABSENT: 'Ausente'
};

const roleLabel: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  CASHIER: 'Caixa',
  WAITER: 'Garcom',
  KITCHEN: 'Cozinha',
  COURIER: 'Entregador'
};

const statusFlow: Record<string, string[]> = {
  NEW: ['ACCEPTED', 'PREPARING', 'CANCELED'],
  ACCEPTED: ['PREPARING', 'CANCELED'],
  PREPARING: ['READY', 'CANCELED'],
  READY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELED'],
  DELIVERED: [],
  CANCELED: []
};

const paymentMethodLabel: Record<string, string> = {
  PIX: 'PIX',
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Credito',
  DEBIT_CARD: 'Debito',
  MIXED: 'Misto'
};

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');

  useEffect(() => {
    document.body.classList.toggle('light-mode', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}

function useRemote<T>(loader: () => Promise<T>, deps: React.DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setData(await loader());
    } catch (err: Any) {
      setError(err?.response?.data?.message || 'Nao foi possivel carregar os dados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, deps);

  return { data, loading, error, reload: load, setData };
}

function DemoBanner() {
  if (!demoMode) return null;
  return (
    <div className="demoBanner">
      <AlertTriangle size={16} />
      <span>
        <strong>Modo demo</strong> Use <code>admin@smartfood.local</code> / <code>123456</code>.
      </span>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="emptyState">
      <CheckCircle2 size={22} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function LoadingBlock({ label = 'Carregando...' }: { label?: string }) {
  return <div className="loadingBlock">{label}</div>;
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="errorBlock">
      <XCircle size={18} />
      <span>{message}</span>
      {onRetry && (
        <button className="secondary compact" type="button" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

function Header({ title, desc, action }: { title: string; desc: string; action?: React.ReactNode }) {
  return (
    <header className="pageHeader">
      <div>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {action}
    </header>
  );
}

function Metric({ title, value, icon: Icon, tone }: Any) {
  return (
    <div className={`metric ${tone || ''}`}>
      <span className="metricIcon">
        <Icon size={20} />
      </span>
      <small>{title}</small>
      <strong>{value}</strong>
    </div>
  );
}

function PublicHome() {
  return (
    <div className="home">
      <DemoBanner />
      <nav className="homeNav">
        <b>SmartFood PDV</b>
        <Link to="/login">Entrar</Link>
      </nav>
      <section className="hero">
        <div className="heroText">
          <span className="pill">PDV + Cozinha + Delivery</span>
          <h1>SmartFood PDV</h1>
          <p>Operacao de restaurante em uma tela: mesas, pedidos, cozinha, estoque, entregas, pagamentos e equipe.</p>
          <Link className="primary heroCta" to="/login">
            Acessar painel
          </Link>
        </div>
        <div className="heroVisual" aria-hidden="true">
          <div className="ticket">
            <span>Pedido #1842</span>
            <strong>2x Smash Duplo</strong>
            <strong>1x Batata Frita</strong>
            <em>Pronto em 08 min</em>
          </div>
          <div className="stationCard">
            <Utensils size={34} />
            <b>Chapa</b>
            <span>5 em preparo</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@smartfood.local');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      nav('/app');
    } catch {
      setError('Email ou senha invalidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <form onSubmit={submit} className="loginPanel">
        <DemoBanner />
        <div>
          <span className="pill">Acesso seguro</span>
          <h1>Entrar no SmartFood</h1>
          <p>Use as credenciais demo para explorar a operacao completa.</p>
        </div>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Senha
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
        </label>
        <button className="primary" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar no painel'}
        </button>
        {error && <small className="danger">{error}</small>}
      </form>
    </div>
  );
}

function NavMenuItem({ to, Icon, label }: Any) {
  return (
    <NavLink to={to} end={to === '/app'} className={({ isActive }) => (isActive ? 'navLink activeLink' : 'navLink')}>
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

function ShellHeader({ onRefresh, theme, onThemeToggle }: Any) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  function resetDemo() {
    Object.keys(localStorage).filter((key) => key.startsWith('smartfood-demo-db')).forEach((key) => localStorage.removeItem(key));
    onRefresh();
  }

  return (
    <div className="shellHeader">
      <div className="shellHeaderTitle">
        <span className="eyebrow">SmartFood PDV</span>
        <strong>Operacao ao vivo</strong>
        <small>Restaurante SmartFood Demo</small>
      </div>
      <div className="shellHeaderActions">
        <button className="iconButton" type="button" onClick={onThemeToggle} title="Alternar tema">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button className="secondary compact" type="button" onClick={onRefresh}>
          <RefreshCcw size={16} /> Atualizar
        </button>
        <button className="secondary compact" type="button" onClick={resetDemo}>
          Restaurar demo
        </button>
        <span className="liveClock">{now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="userPill">{user.name || 'Administrador'}</span>
      </div>
    </div>
  );
}

function Layout() {
  const nav = useNavigate();
  const { theme, setTheme } = useTheme();
  const [refreshKey, setRefreshKey] = useState(0);
  const items = [
    ['/app', LayoutDashboard, 'Hoje'],
    ['/app/sell', ReceiptText, 'Vender'],
    ['/app/operation', ChefHat, 'Operacao'],
    ['/app/registers', Package, 'Cadastros'],
    ['/app/reports', BarChart3, 'Relatorios']
  ];

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    nav('/');
  }

  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <span>SF</span>
          <div>
            <strong>SmartFood</strong>
          </div>
        </div>
        <div className="navStack">
          {items.map(([to, Icon, label]: Any) => (
            <NavMenuItem key={to} to={to} Icon={Icon} label={label} />
          ))}
        </div>
        <button className="navLink logoutButton" onClick={logout}>
          <LogOut size={18} /> Sair
        </button>
      </aside>
      <main>
        <div key={refreshKey}>
          <Routes>
            <Route index element={<Today />} />
            <Route path="sell" element={<POS />} />
            <Route path="operation" element={<Operation />} />
            <Route path="registers" element={<Registers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="dashboard" element={<Today />} />
            <Route path="pos" element={<POS />} />
            <Route path="tables" element={<Tables />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="kitchen" element={<Kitchen />} />
            <Route path="couriers" element={<Couriers />} />
            <Route path="payments" element={<Payments />} />
            <Route path="stock" element={<Stock />} />
            <Route path="employees" element={<Employees />} />
            <Route path="assistant" element={<Assistant />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function Protected() {
  return localStorage.getItem('token') ? <Layout /> : <Navigate to="/login" />;
}

function Today() {
  const { data, loading, error, reload } = useRemote<Any>(async () => {
    const [dashboardRes, ordersRes, tablesRes, ingredientsRes, couriersRes, employeesRes] = await Promise.all([
      api.get('/dashboard'),
      api.get('/orders'),
      api.get('/tables'),
      api.get('/ingredients'),
      api.get('/couriers'),
      api.get('/employees')
    ]);
    return {
      dashboard: dashboardRes.data,
      orders: ordersRes.data,
      tables: tablesRes.data,
      ingredients: ingredientsRes.data,
      couriers: couriersRes.data,
      employees: employeesRes.data
    };
  });

  if (loading) return <LoadingBlock />;
  if (error || !data) return <ErrorBlock message={error} onRetry={reload} />;

  const d = data.dashboard;
  const orders = data.orders || [];
  const tables = data.tables || [];
  const ingredients = data.ingredients || [];
  const couriers = data.couriers || [];
  const employees = data.employees || [];
  const now = Date.now();
  const openOrders = orders.filter((order: Any) => !['DELIVERED', 'CANCELED'].includes(order.status));
  const lateOrders = openOrders.filter((order: Any) => now - new Date(order.createdAt).getTime() > 15 * 60 * 1000);
  const deliveryReadyWithoutCourier = openOrders.filter((order: Any) => ['DELIVERY', 'IFOOD', 'WHATSAPP'].includes(order.origin) && order.status === 'READY' && !order.courierId);
  const tablesWithoutOrders = tables.filter((table: Any) => table.status === 'OCCUPIED' && (!table.orders || table.orders.length === 0));
  const lowStock = ingredients.filter((item: Any) => Number(item.currentStock) <= Number(item.minStock));
  const pendingPayments = orders.filter((order: Any) => {
    const paid = (order.payments || []).reduce((sum: number, payment: Any) => sum + Number(payment.amount), 0);
    return Number(order.total) > paid && !['CANCELED'].includes(order.status);
  });
  const availableCouriers = couriers.filter((courier: Any) => courier.status === 'AVAILABLE');
  const workingEmployees = employees.filter((employee: Any) => employee.timeClocks?.some((time: Any) => !time.checkOut));
  const alerts = [
    ...lateOrders.map((order: Any) => ({ tone: 'danger', title: `Pedido #${order.id.slice(-5)} atrasado`, text: `${statusLabel[order.status]} ha mais de 15 min`, to: '/app/operation' })),
    ...deliveryReadyWithoutCourier.map((order: Any) => ({ tone: 'warning', title: `Entrega #${order.id.slice(-5)} sem motoboy`, text: 'Pedido pronto aguardando despacho', to: '/app/operation' })),
    ...tablesWithoutOrders.map((table: Any) => ({ tone: 'warning', title: `Mesa ${table.number} ocupada sem comanda`, text: 'Confira se precisa abrir pedido ou liberar', to: '/app/operation' })),
    ...lowStock.map((item: Any) => ({ tone: 'danger', title: `${item.name} abaixo do minimo`, text: `${Number(item.currentStock)} ${item.unit} disponivel`, to: '/app/registers' })),
    ...pendingPayments.slice(0, 4).map((order: Any) => ({ tone: 'info', title: `Pagamento pendente #${order.id.slice(-5)}`, text: `${currency(order.total)} em aberto`, to: '/app/reports' }))
  ].slice(0, 8);

  return (
    <>
      <div className="grid4">
        <Metric title="Faturamento" value={currency(d.revenue)} icon={WalletCards} tone="cyan" />
        <Metric title="Pedidos abertos" value={d.openOrders} icon={Clock3} tone="amber" />
        <Metric title="Alertas" value={alerts.length} icon={AlertTriangle} tone="red" />
        <Metric title="Equipe no ponto" value={workingEmployees.length} icon={Users} tone="green" />
      </div>
      <div className="managerGrid">
        <section className="card attentionPanel">
          <div className="cardTitle">
            <AlertTriangle size={18} />
            <h3>Acoes recomendadas</h3>
          </div>
          {alerts.length ? (
            alerts.map((alert: Any, index) => (
              <Link className={`attentionItem ${alert.tone}`} to={alert.to} key={`${alert.title}-${index}`}>
                <strong>{alert.title}</strong>
                <span>{alert.text}</span>
              </Link>
            ))
          ) : (
            <EmptyState title="Tudo em ordem" text="Nenhuma pendencia critica agora." />
          )}
        </section>
        <section className="card automationPanel">
          <div className="cardTitle">
            <Bot size={18} />
            <h3>Automacoes do gestor</h3>
          </div>
          <p className="row"><span>Lista de compras</span><b>{lowStock.length} item(ns)</b></p>
          <p className="row"><span>Motoboys livres</span><b>{availableCouriers.length}</b></p>
          <p className="row"><span>Pagamentos pendentes</span><b>{pendingPayments.length}</b></p>
          <p className="row"><span>Ticket medio</span><b>{currency(d.totalOrders ? d.revenue / d.totalOrders : 0)}</b></p>
          <div className="actions">
            <Link className="secondary compact" to="/app/registers">Comprar estoque</Link>
            <Link className="secondary compact" to="/app/operation">Despachar entregas</Link>
            <Link className="secondary compact" to="/app/reports">Resumo do dia</Link>
          </div>
        </section>
      </div>
      <section className="quickActions">
        <Link to="/app/sell"><ReceiptText size={18} /><span>Vender</span><small>PDV rapido com pagamento</small></Link>
        <Link to="/app/operation"><ChefHat size={18} /><span>Operacao</span><small>Mesas, pedidos, cozinha e entregas</small></Link>
        <Link to="/app/registers"><Package size={18} /><span>Cadastros</span><small>Cardapio, estoque e equipe</small></Link>
        <Link to="/app/reports"><CreditCard size={18} /><span>Relatorios</span><small>Caixa e resumo do dia</small></Link>
      </section>
    </>
  );
}

function POS() {
  const [products, setProducts] = useState<Any[]>([]);
  const [tables, setTables] = useState<Any[]>([]);
  const [category, setCategory] = useState('Todos');
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState('COUNTER');
  const [tableId, setTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [discount, setDiscount] = useState('0');
  const [serviceFee, setServiceFee] = useState('0');
  const [cart, setCart] = useState<Any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [productsRes, tablesRes] = await Promise.all([api.get('/products'), api.get('/tables')]);
    setProducts(productsRes.data.filter((product: Any) => product.active));
    setTables(tablesRes.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const categories = ['Todos', ...Array.from(new Set(products.map((product) => product.category?.name || 'Geral')))];
  const filtered = products.filter((product) => {
    const matchCategory = category === 'Todos' || (product.category?.name || 'Geral') === category;
    const matchQuery = `${product.name} ${product.station}`.toLowerCase().includes(query.toLowerCase());
    return matchCategory && matchQuery;
  });
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const discountValue = Math.max(0, Number(discount || 0));
  const serviceValue = Math.max(0, Number(serviceFee || 0));
  const total = Math.max(0, subtotal - discountValue + serviceValue);

  function addToCart(product: Any) {
    setCart((current) => {
      const found = current.find((item) => item.productId === product.id);
      if (found) return current.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { productId: product.id, name: product.name, price: Number(product.price), quantity: 1, notes: '' }];
    });
  }

  function updateCart(index: number, key: string, value: Any) {
    setCart((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  }

  async function finishSale() {
    setMessage('');
    if (!cart.length) return setMessage('Adicione produtos antes de finalizar.');
    if (origin === 'HALL' && !tableId) return setMessage('Selecione uma mesa para venda de salao.');

    const { data: order } = await api.post('/orders', {
      origin,
      tableId: origin === 'HALL' ? tableId : undefined,
      customerName: origin !== 'HALL' ? customerName || 'Cliente balcao' : undefined,
      discount: discountValue,
      serviceFee: serviceValue,
      items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity, notes: item.notes }))
    });

    if (total > 0) {
      await api.post(`/orders/${order.id}/payments`, {
        method: paymentMethod,
        amount: total,
        status: 'PAID',
        discount: discountValue,
        serviceFee: serviceValue
      });
    }

    setCart([]);
    setDiscount('0');
    setServiceFee('0');
    setCustomerName('');
    setTableId('');
    setMessage(`Venda finalizada: #${order.id.slice(-5)} / ${currency(total)}`);
    load();
  }

  return (
    <>
      {message && <div className="successBlock">{message}</div>}
      <section className="posShell">
        <div className="posCatalog">
          <div className="posToolbar">
            <div className="toolbar">
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar item ou estacao" />
            </div>
            <div className="tabStrip">
              {categories.map((item) => (
                <button key={item} className={category === item ? 'tab activeTab' : 'tab'} type="button" onClick={() => setCategory(item)}>{item}</button>
              ))}
            </div>
          </div>
          {loading ? <LoadingBlock /> : (
            <div className="posProductGrid">
              {filtered.map((product) => (
                <button className="posProduct" key={product.id} type="button" onClick={() => addToCart(product)}>
                  <span>{product.category?.name || 'Geral'} / {product.station}</span>
                  <strong>{product.name}</strong>
                  <b>{currency(product.price)}</b>
                </button>
              ))}
            </div>
          )}
        </div>
        <aside className="posCart">
          <div className="cardTitle">
            <ReceiptText size={18} />
            <h3>Comanda</h3>
          </div>
          <div className="inlineRow">
            <label>
              Origem
              <select value={origin} onChange={(event) => setOrigin(event.target.value)}>
                <option value="COUNTER">Balcao</option>
                <option value="HALL">Salao</option>
                <option value="DELIVERY">Delivery</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </label>
            {origin === 'HALL' ? (
              <label>
                Mesa
                <select value={tableId} onChange={(event) => setTableId(event.target.value)}>
                  <option value="">Selecione</option>
                  {tables.map((table) => <option key={table.id} value={table.id}>Mesa {table.number}</option>)}
                </select>
              </label>
            ) : (
              <label>
                Cliente
                <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Opcional" />
              </label>
            )}
          </div>
          <div className="cartLines">
            {cart.length === 0 && <EmptyState title="Carrinho vazio" text="Toque nos produtos para vender." />}
            {cart.map((item, index) => (
              <div className="cartLine" key={item.productId}>
                <div>
                  <strong>{item.name}</strong>
                  <small>{currency(item.price)} un.</small>
                </div>
                <input type="number" min="1" value={item.quantity} onChange={(event) => updateCart(index, 'quantity', Number(event.target.value))} />
                <button className="iconButton dangerButton" type="button" onClick={() => setCart((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <div className="inlineRow">
            <label>
              Desconto
              <input type="number" min="0" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} />
            </label>
            <label>
              Taxa servico
              <input type="number" min="0" step="0.01" value={serviceFee} onChange={(event) => setServiceFee(event.target.value)} />
            </label>
          </div>
          <label>
            Pagamento
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="PIX">PIX</option>
              <option value="CASH">Dinheiro</option>
              <option value="CREDIT_CARD">Credito</option>
              <option value="DEBIT_CARD">Debito</option>
            </select>
          </label>
          <div className="totalsBox">
            <p><span>Subtotal</span><b>{currency(subtotal)}</b></p>
            <p><span>Desconto</span><b>- {currency(discountValue)}</b></p>
            <p><span>Taxa</span><b>{currency(serviceValue)}</b></p>
            <strong><span>Total</span><b>{currency(total)}</b></strong>
          </div>
          <button className="primary saleButton" type="button" onClick={finishSale}>
            <DollarSign size={18} /> Finalizar venda
          </button>
          <button className="secondary" type="button" onClick={() => window.print()}>
            <Printer size={16} /> Imprimir recibo
          </button>
        </aside>
      </section>
    </>
  );
}

function Kitchen() {
  const { data, loading, error, reload } = useRemote<Any[]>(async () => (await api.get('/orders')).data);
  const orders = (data || []).filter((order) => ['NEW', 'ACCEPTED', 'PREPARING', 'READY'].includes(order.status));
  const stations = ['chapa', 'fritadeira', 'cozinha', 'bebidas', 'bar', 'geral'];

  async function move(id: string, status: string) {
    await api.patch(`/orders/${id}/status`, { status });
    reload();
  }

  return (
    <>
      <Header title="Cozinha KDS" desc="Fila por estacao, tempo de preparo e avancos rapidos." action={<button className="secondary" onClick={reload}><RefreshCcw size={16} /> Atualizar</button>} />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={reload} />}
      <div className="kdsBoard">
        {stations.map((station) => {
          const stationOrders = orders.filter((order) => order.items.some((item: Any) => (item.product?.station || 'geral') === station));
          return (
            <section className="kdsColumn" key={station}>
              <div className="kdsTitle">
                <h3>{station}</h3>
                <span>{stationOrders.length}</span>
              </div>
              {stationOrders.length === 0 && <EmptyState title="Livre" text="Sem itens nesta estacao." />}
              {stationOrders.map((order) => {
                const minutes = Math.max(1, Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000));
                const stationItems = order.items.filter((item: Any) => (item.product?.station || 'geral') === station);
                return (
                  <article className={minutes > 15 ? 'kdsTicket lateTicket' : 'kdsTicket'} key={`${station}-${order.id}`}>
                    <div className="orderHeader">
                      <div>
                        <b>#{order.id.slice(-5)} / {statusLabel[order.status]}</b>
                        <small>{order.table ? `Mesa ${order.table.number}` : order.customer?.name || originLabel[order.origin]}</small>
                      </div>
                      <span className="badge">{minutes} min</span>
                    </div>
                    {stationItems.map((item: Any) => (
                      <p key={item.id}><strong>{item.quantity}x</strong> {item.product.name}{item.notes ? <small> / {item.notes}</small> : null}</p>
                    ))}
                    <div className="actions">
                      {order.status === 'NEW' && <button className="secondary compact" onClick={() => move(order.id, 'ACCEPTED')}>Aceitar</button>}
                      {order.status !== 'PREPARING' && order.status !== 'READY' && <button className="secondary compact" onClick={() => move(order.id, 'PREPARING')}>Preparar</button>}
                      {order.status !== 'READY' && <button className="primary compact" onClick={() => move(order.id, 'READY')}>Pronto</button>}
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </>
  );
}

function Operation() {
  const [tab, setTab] = useState('tables');
  const tabs = [
    ['tables', Table2, 'Mesas'],
    ['orders', ChefHat, 'Pedidos'],
    ['kitchen', Utensils, 'Cozinha'],
    ['couriers', Bike, 'Entregas']
  ];

  return (
    <>
      <div className="sectionTabs">
        {tabs.map(([id, Icon, label]: Any) => (
          <button key={id} className={tab === id ? 'sectionTab activeSectionTab' : 'sectionTab'} type="button" onClick={() => setTab(id)}>
            <Icon size={17} /> {label}
          </button>
        ))}
      </div>
      {tab === 'tables' && <Tables />}
      {tab === 'orders' && <Orders />}
      {tab === 'kitchen' && <Kitchen />}
      {tab === 'couriers' && <Couriers />}
    </>
  );
}

function Registers() {
  const [tab, setTab] = useState('products');
  const tabs = [
    ['products', ShoppingBag, 'Cardapio'],
    ['stock', Package, 'Estoque'],
    ['employees', Users, 'Equipe'],
    ['integrations', Settings, 'Integracoes']
  ];

  return (
    <>
      <div className="sectionTabs">
        {tabs.map(([id, Icon, label]: Any) => (
          <button key={id} className={tab === id ? 'sectionTab activeSectionTab' : 'sectionTab'} type="button" onClick={() => setTab(id)}>
            <Icon size={17} /> {label}
          </button>
        ))}
      </div>
      {tab === 'products' && <Products />}
      {tab === 'stock' && <Stock />}
      {tab === 'employees' && <Employees />}
      {tab === 'integrations' && <Integrations />}
    </>
  );
}

function Integrations() {
  const [form, setForm] = useState({
    merchantId: '',
    clientId: '',
    clientSecret: '',
    baseUrl: 'https://merchant-api.ifood.com.br',
    enabled: false,
    autoConfirm: true,
    pollingInterval: 30
  });
  const [status, setStatus] = useState<Any>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await api.get('/ifood/config');
    if (!data) return;
    setStatus(data);
    setForm((current) => ({
      ...current,
      merchantId: data.merchantId || '',
      clientId: data.clientId || '',
      clientSecret: '',
      baseUrl: data.baseUrl || current.baseUrl,
      enabled: Boolean(data.enabled),
      autoConfirm: data.autoConfirm !== false,
      pollingInterval: Number(data.pollingInterval || 30)
    }));
  }

  useEffect(() => {
    load();
  }, []);

  async function run(action: 'save' | 'test' | 'sync') {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      if (action === 'save') {
        const { data } = await api.put('/ifood/config', form);
        setStatus(data);
        setForm((current) => ({ ...current, clientSecret: '' }));
        setMessage('Configuracao salva. A sincronizacao automatica respeitara o status ativado.');
      }
      if (action === 'test') {
        const { data } = await api.post('/ifood/config/test', form);
        setMessage(data.message);
      }
      if (action === 'sync') {
        const { data } = await api.post('/ifood/sync', {});
        setMessage(`Sincronizacao concluida: ${data.imported} pedido(s) importado(s), ${data.acknowledged} evento(s) confirmado(s).`);
        await load();
      }
    } catch (err: Any) {
      setError(err?.response?.data?.message || 'Nao foi possivel concluir a operacao.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header title="Integracoes" desc="Conecte o iFood uma vez e deixe o sistema receber pedidos e devolver status automaticamente." />
      {message && <div className="successBlock">{message}</div>}
      {error && <ErrorBlock message={error} />}
      <div className="integrationGrid">
        <section className="card integrationIntro">
          <div className="integrationBrand">iFood</div>
          <h3>Pedidos automaticos</h3>
          <p>O backend autentica na Merchant API, consulta eventos a cada 30 segundos, evita duplicidades, cria o pedido e atualiza o status no iFood.</p>
          <div className="integrationStatus">
            <span className={status?.enabled ? 'statusOk' : 'statusPending'}>{status?.enabled ? 'Sincronizacao ativa' : 'Sincronizacao pausada'}</span>
            <p><span>Credenciais</span><b>{status?.hasClientSecret ? 'Configuradas' : 'Pendentes'}</b></p>
            <p><span>Ultimo sucesso</span><b>{status?.lastSuccessAt ? new Date(status.lastSuccessAt).toLocaleString('pt-BR') : 'Ainda nao sincronizado'}</b></p>
            {status?.lastError && <p className="danger"><span>Ultimo erro</span><b>{status.lastError}</b></p>}
          </div>
        </section>
        <form className="card integrationForm" onSubmit={(event) => { event.preventDefault(); run('save'); }}>
          <div className="cardTitle"><Settings size={18} /><h3>Credenciais da aplicacao</h3></div>
          <label>
            Merchant ID
            <input value={form.merchantId} onChange={(event) => setForm({ ...form, merchantId: event.target.value })} placeholder="ID da loja no iFood" />
          </label>
          <label>
            Client ID
            <input value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })} placeholder="Client ID do Portal Developer" />
          </label>
          <label>
            Client Secret
            <input type="password" value={form.clientSecret} onChange={(event) => setForm({ ...form, clientSecret: event.target.value })} placeholder={status?.hasClientSecret ? 'Deixe vazio para manter o segredo atual' : 'Client Secret do Portal Developer'} />
          </label>
          <label>
            URL da Merchant API
            <input value={form.baseUrl} onChange={(event) => setForm({ ...form, baseUrl: event.target.value })} />
          </label>
          <div className="inlineRow">
            <label>
              Intervalo de sincronizacao
              <input type="number" min="30" value={form.pollingInterval} onChange={(event) => setForm({ ...form, pollingInterval: Number(event.target.value) })} />
            </label>
            <label>
              Sincronizacao
              <select value={form.enabled ? 'enabled' : 'disabled'} onChange={(event) => setForm({ ...form, enabled: event.target.value === 'enabled' })}>
                <option value="disabled">Pausada</option>
                <option value="enabled">Ativa</option>
              </select>
            </label>
          </div>
          <label className="checkLabel">
            <input type="checkbox" checked={form.autoConfirm} onChange={(event) => setForm({ ...form, autoConfirm: event.target.checked })} />
            Confirmar automaticamente pedidos importados
          </label>
          <div className="actions">
            <button className="secondary" type="button" disabled={busy} onClick={() => run('test')}>Testar conexao</button>
            <button className="secondary" type="button" disabled={busy || !status} onClick={() => run('sync')}>Sincronizar agora</button>
            <button className="primary" type="submit" disabled={busy}>{busy ? 'Processando...' : 'Salvar configuracao'}</button>
          </div>
        </form>
      </div>
    </>
  );
}

function Reports() {
  const [actionMessage, setActionMessage] = useState('');
  const { data, loading, error, reload } = useRemote<Any>(async () => {
    const [dashboardRes, ordersRes, ingredientsRes, couriersRes] = await Promise.all([
      api.get('/dashboard'),
      api.get('/orders'),
      api.get('/ingredients'),
      api.get('/couriers')
    ]);
    return {
      dashboard: dashboardRes.data,
      orders: ordersRes.data,
      ingredients: ingredientsRes.data,
      couriers: couriersRes.data
    };
  });

  if (loading) return <LoadingBlock />;
  if (error || !data) return <ErrorBlock message={error} onRetry={reload} />;

  const orders = data.orders || [];
  const paidOrders = orders.filter((order: Any) => (order.payments || []).some((payment: Any) => payment.status === 'PAID'));
  const validOrders = orders.filter((order: Any) => order.status !== 'CANCELED');
  const paidPayments = validOrders.flatMap((order: Any) => order.payments || []).filter((payment: Any) => payment.status === 'PAID');
  const paymentTotals = paidPayments.reduce((acc: Record<string, number>, payment: Any) => {
    acc[payment.method] = (acc[payment.method] || 0) + Number(payment.amount || 0);
    return acc;
  }, {});
  const originTotals = validOrders.reduce((acc: Record<string, number>, order: Any) => {
    acc[order.origin] = (acc[order.origin] || 0) + Number(order.total || 0);
    return acc;
  }, {});
  const canceled = orders.filter((order: Any) => order.status === 'CANCELED');
  const lowStock = (data.ingredients || []).filter((item: Any) => Number(item.currentStock) <= Number(item.minStock));
  const courierCommissions = (data.couriers || []).reduce((sum: number, courier: Any) => sum + courier.orders.length * Number(courier.commissionPerDelivery), 0);
  const receivedTotal = paidPayments.reduce((sum: number, payment: Any) => sum + Number(payment.amount || 0), 0);
  const expectedTotal = validOrders.reduce((sum: number, order: Any) => sum + Number(order.total || 0), 0);
  const pendingAmount = Math.max(0, expectedTotal - receivedTotal);
  const openOrders = validOrders.filter((order: Any) => !['DELIVERED'].includes(order.status));
  const closingChecks = [
    { label: 'Pedidos finalizados', ok: openOrders.length === 0, detail: openOrders.length ? `${openOrders.length} em aberto` : 'Tudo concluido' },
    { label: 'Recebimentos conciliados', ok: pendingAmount < 0.01, detail: pendingAmount ? `${currency(pendingAmount)} pendente` : 'Valores conferidos' },
    { label: 'Estoque revisado', ok: lowStock.length === 0, detail: lowStock.length ? `${lowStock.length} item(ns) para comprar` : 'Sem itens criticos' }
  ];
  const readyToClose = closingChecks.every((item) => item.ok);
  const reportText = [
    `Resumo SmartFood`,
    `Vendas esperadas: ${currency(expectedTotal)}`,
    `Total recebido: ${currency(receivedTotal)}`,
    `Pendente: ${currency(pendingAmount)}`,
    `Pedidos: ${orders.length}`,
    `Pagos: ${paidOrders.length}`,
    `Cancelados: ${canceled.length}`,
    `Ticket medio: ${currency(validOrders.length ? expectedTotal / validOrders.length : 0)}`,
    `Comissoes de entrega: ${currency(courierCommissions)}`,
    `Estoque baixo: ${lowStock.map((item: Any) => item.name).join(', ') || 'nenhum'}`
  ].join('\n');

  async function copyReport() {
    await navigator.clipboard.writeText(reportText);
    setActionMessage('Resumo copiado para compartilhar.');
  }

  async function replenish(item: Any) {
    const suggestedQuantity = Math.max(0, Number(item.minStock) * 2 - Number(item.currentStock));
    await api.post(`/ingredients/${item.id}/movement`, {
      type: 'IN',
      quantity: suggestedQuantity,
      description: 'Reposicao sugerida pelo fechamento'
    });
    setActionMessage(`${item.name}: entrada de ${suggestedQuantity} ${item.unit} registrada.`);
    reload();
  }

  return (
    <>
      {actionMessage && <div className="successBanner"><CheckCircle2 size={17} />{actionMessage}</div>}
      <div className="grid4">
        <Metric title="Vendas esperadas" value={currency(expectedTotal)} icon={WalletCards} tone="cyan" />
        <Metric title="Recebido" value={currency(receivedTotal)} icon={CheckCircle2} tone="green" />
        <Metric title="Pendente" value={currency(pendingAmount)} icon={Clock3} tone="red" />
        <Metric title="Ticket medio" value={currency(validOrders.length ? expectedTotal / validOrders.length : 0)} icon={ReceiptText} tone="amber" />
      </div>
      <section className={`card closingPanel ${readyToClose ? 'ready' : ''}`}>
        <div className="closingSummary">
          <span className="closingIcon"><ClipboardCheck size={24} /></span>
          <div>
            <small>Fechamento assistido</small>
            <h3>{readyToClose ? 'Dia pronto para fechar' : 'Ainda existem pendencias'}</h3>
            <p>{readyToClose ? 'Operacao, recebimentos e estoque conferidos.' : 'Resolva os pontos abaixo antes de encerrar o caixa.'}</p>
          </div>
        </div>
        <div className="closingChecks">
          {closingChecks.map((item) => (
            <div className={item.ok ? 'done' : ''} key={item.label}>
              {item.ok ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
              <span><b>{item.label}</b><small>{item.detail}</small></span>
            </div>
          ))}
        </div>
        <div className="actions">
          <button className="secondary compact" type="button" onClick={copyReport}><ReceiptText size={16} /> Copiar resumo</button>
          <button className="secondary compact" type="button" onClick={() => window.print()}><Printer size={16} /> Imprimir</button>
        </div>
      </section>
      <div className="reportGrid">
        <section className="card">
          <div className="cardTitle"><CreditCard size={18} /><h3>Meios de pagamento</h3></div>
          {Object.keys(paymentTotals).length ? Object.entries(paymentTotals).map(([method, total]) => (
            <p className="row" key={method}><span>{paymentMethodLabel[method] || method}</span><b>{currency(total as number)}</b></p>
          )) : <EmptyState title="Sem pagamentos" text="Os recebimentos aparecem aqui." />}
        </section>
        <section className="card">
          <div className="cardTitle"><Package size={18} /><h3>Lista de compras</h3></div>
          {lowStock.length ? lowStock.map((item: Any) => (
            <div className="purchaseItem" key={item.id}>
              <span>
                <b>{item.name}</b>
                <small>Atual: {Number(item.currentStock)} {item.unit} · Comprar: {Math.max(0, Number(item.minStock) * 2 - Number(item.currentStock))} {item.unit}</small>
              </span>
              <button className="secondary compact" type="button" onClick={() => replenish(item)}>Registrar entrada</button>
            </div>
          )) : <EmptyState title="Estoque ok" text="Nada abaixo do minimo." />}
        </section>
        <section className="card">
          <div className="cardTitle"><BarChart3 size={18} /><h3>Vendas por canal</h3></div>
          {Object.entries(originTotals).map(([origin, total]) => (
            <div className="channelRow" key={origin}>
              <p className="row"><span>{originLabel[origin] || origin}</span><b>{currency(total as number)}</b></p>
              <span className="channelTrack"><i style={{ width: `${expectedTotal ? Math.max(4, Number(total) / expectedTotal * 100) : 0}%` }} /></span>
            </div>
          ))}
        </section>
        <section className="card reportText">
          <div className="cardTitle"><Printer size={18} /><h3>Resumo do dia</h3></div>
          <pre>{reportText}</pre>
        </section>
      </div>
      <Payments />
    </>
  );
}

function Tables() {
  const [selectedId, setSelectedId] = useState('');
  const { data, loading, error, reload } = useRemote<Any[]>(async () => (await api.get('/tables')).data);
  const tables = data || [];
  const selectedTable = tables.find((table) => table.id === selectedId) || tables[0];

  async function toggleStatus(table: Any) {
    const status = table.status === 'FREE' ? 'OCCUPIED' : 'FREE';
    await api.patch(`/tables/${table.id}`, { status });
    reload();
  }

  return (
    <>
      <Header title="Mesas" desc="Mapa do salao para liberar, ocupar e acompanhar pedidos ativos." />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={reload} />}
      <div className="tablesWorkspace">
        <div className="tableGrid">
          {tables.map((table) => (
            <button className={`tableCard ${table.status} ${selectedTable?.id === table.id ? 'selectedTable' : ''}`} key={table.id} type="button" onClick={() => setSelectedId(table.id)}>
              <span className="tableNumber">Mesa {table.number}</span>
              <strong>{statusLabel[table.status]}</strong>
              <small>{table.orders?.length || 0} pedido(s) ativo(s)</small>
            </button>
          ))}
        </div>
        {selectedTable && (
          <aside className="tableDetail">
            <div className="cardTitle">
              <Table2 size={18} />
              <h3>Mesa {selectedTable.number}</h3>
            </div>
            <span className={`statusPill ${selectedTable.status}`}>{statusLabel[selectedTable.status]}</span>
            <div className="tableOrders">
              {(selectedTable.orders || []).length === 0 && <EmptyState title="Sem comanda" text="Abra um pedido para esta mesa." />}
              {(selectedTable.orders || []).map((order: Any) => (
                <div className="tableOrder" key={order.id}>
                  <strong>#{order.id.slice(-5)}</strong>
                  <span>{statusLabel[order.status] || order.status}</span>
                  <small>{order.items?.length || 0} item(ns)</small>
                </div>
              ))}
            </div>
            <div className="actions">
              <button className="secondary" type="button" onClick={() => toggleStatus(selectedTable)}>
                {selectedTable.status === 'FREE' ? 'Ocupar mesa' : 'Liberar mesa'}
              </button>
              <Link className="primary" to="/app/pos">Abrir venda</Link>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}

function Products() {
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState('');
  const [actionError, setActionError] = useState('');
  const [form, setForm] = useState({ name: '', categoryName: '', station: 'chapa', price: '0', description: '' });
  const { data, loading, error, reload } = useRemote<Any[]>(async () => (await api.get('/products')).data);
  const products = data || [];
  const filtered = products.filter((product) => {
    const haystack = `${product.name} ${product.category?.name || ''} ${product.station || ''}`.toLowerCase();
    return haystack.includes(filter.toLowerCase());
  });

  async function createProduct(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      categoryName: form.categoryName.trim() || 'Geral',
      station: form.station.trim() || 'geral',
      price: Number(form.price || 0),
      description: form.description.trim(),
      active: true
    };
    if (editingId) await api.patch(`/products/${editingId}`, payload);
    else await api.post('/products', payload);
    setEditingId('');
    setForm({ name: '', categoryName: '', station: 'chapa', price: '0', description: '' });
    reload();
  }

  async function toggleProduct(product: Any) {
    await api.patch(`/products/${product.id}`, { active: !product.active });
    reload();
  }

  function editProduct(product: Any) {
    setEditingId(product.id);
    setForm({ name: product.name, categoryName: product.category?.name || '', station: product.station || 'geral', price: String(product.price), description: product.description || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteProduct(product: Any) {
    if (!window.confirm(`Excluir ${product.name}?`)) return;
    setActionError('');
    try {
      await api.delete(`/products/${product.id}`);
      reload();
    } catch (err: Any) {
      setActionError(err?.response?.data?.message || 'Nao foi possivel excluir o produto.');
    }
  }

  return (
    <>
      <Header title="Produtos" desc="Cardapio, precos, estacoes de preparo e status de venda." />
      <div className="managementGrid">
        <form className="card quickForm" onSubmit={createProduct}>
          <div className="cardTitle">
            <Plus size={18} />
            <h3>{editingId ? 'Editar produto' : 'Novo produto'}</h3>
          </div>
          <div className="inlineRow">
            <label>
              Nome
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex: Burger da casa" />
            </label>
            <label>
              Categoria
              <input value={form.categoryName} onChange={(event) => setForm({ ...form, categoryName: event.target.value })} placeholder="Ex: Burgers" />
            </label>
          </div>
          <div className="inlineRow">
            <label>
              Estacao
              <select value={form.station} onChange={(event) => setForm({ ...form, station: event.target.value })}>
                <option value="chapa">Chapa</option>
                <option value="fritadeira">Fritadeira</option>
                <option value="bebidas">Bebidas</option>
                <option value="cozinha">Cozinha</option>
                <option value="bar">Bar</option>
              </select>
            </label>
            <label>
              Preco
              <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
            </label>
          </div>
          <label>
            Descricao
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Detalhes visiveis para a equipe" />
          </label>
          <div className="actions">
            {editingId && <button className="secondary" type="button" onClick={() => { setEditingId(''); setForm({ name: '', categoryName: '', station: 'chapa', price: '0', description: '' }); }}>Cancelar</button>}
            <button className="primary" type="submit">{editingId ? 'Salvar alteracoes' : 'Cadastrar produto'}</button>
          </div>
        </form>
        <section className="card insightCard">
          <div className="cardTitle">
            <ShoppingBag size={18} />
            <h3>Resumo do cardapio</h3>
          </div>
          <p className="row"><span>Produtos ativos</span><b>{products.filter((product) => product.active).length}</b></p>
          <p className="row"><span>Produtos pausados</span><b>{products.filter((product) => !product.active).length}</b></p>
          <p className="row"><span>Preco medio</span><b>{currency(products.reduce((sum, product) => sum + Number(product.price), 0) / Math.max(products.length, 1))}</b></p>
        </section>
      </div>
      <div className="toolbar">
        <Search size={18} />
        <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filtrar produto, categoria ou estacao" />
      </div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={reload} />}
      {actionError && <ErrorBlock message={actionError} />}
      <div className="productGrid">
        {filtered.map((product) => (
          <article className="productCard" key={product.id}>
            <div className="productArt">
              <Utensils size={24} />
            </div>
            <div>
              <small>{product.category?.name || 'Sem categoria'} / {product.station}</small>
              <h3>{product.name}</h3>
              <p>{product.description || 'Produto disponivel no cardapio.'}</p>
            </div>
            <div className="productFooter">
              <strong>{currency(product.price)}</strong>
              <div className="actions">
                <button className={product.active ? 'statusOk statusButton' : 'statusOff statusButton'} type="button" onClick={() => toggleProduct(product)}>{product.active ? 'Ativo' : 'Pausado'}</button>
                <button className="iconButton" title="Editar produto" type="button" onClick={() => editProduct(product)}><Pencil size={15} /></button>
                <button className="iconButton dangerButton" title="Excluir produto" type="button" onClick={() => deleteProduct(product)}><Trash2 size={15} /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function Orders() {
  const [orders, setOrders] = useState<Any[]>([]);
  const [products, setProducts] = useState<Any[]>([]);
  const [tables, setTables] = useState<Any[]>([]);
  const [couriers, setCouriers] = useState<Any[]>([]);
  const [origin, setOrigin] = useState('HALL');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [tableId, setTableId] = useState('');
  const [items, setItems] = useState<Any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, productsRes, tablesRes, couriersRes] = await Promise.all([
        api.get('/orders'),
        api.get('/products'),
        api.get('/tables'),
        api.get('/couriers')
      ]);
      setOrders(ordersRes.data);
      setProducts(ordersRes.data ? productsRes.data : []);
      setTables(tablesRes.data);
      setCouriers(couriersRes.data);
    } catch (err: Any) {
      setError(err?.response?.data?.message || 'Nao foi possivel carregar pedidos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const validItems = items.filter((item) => item.productId && item.quantity > 0);
  const total = validItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + Number(product?.price || 0) * Number(item.quantity || 0);
  }, 0);

  function addProduct(productId: string) {
    setItems((current) => {
      const found = current.find((item) => item.productId === productId);
      if (found) {
        return current.map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { productId, quantity: 1, notes: '' }];
    });
  }

  function updateLine(index: number, key: string, value: Any) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  }

  async function createOrder(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!validItems.length) return setError('Adicione pelo menos um produto.');
    if (origin === 'HALL' && !tableId) return setError('Selecione uma mesa.');
    if (origin !== 'HALL' && !customerName.trim()) return setError('Informe o cliente.');

    try {
      await api.post('/orders', {
        origin,
        tableId: origin === 'HALL' ? tableId : undefined,
        customerName: origin !== 'HALL' ? customerName.trim() : undefined,
        phone: origin !== 'HALL' ? phone.trim() : undefined,
        items: validItems
      });
      setItems([]);
      setCustomerName('');
      setPhone('');
      setTableId('');
      load();
    } catch (err: Any) {
      setError(err?.response?.data?.message || 'Nao foi possivel criar o pedido.');
    }
  }

  async function updateStatus(id: string, status: string) {
    await api.patch(`/orders/${id}/status`, { status });
    load();
  }

  async function assignCourier(orderId: string, courierId: string) {
    if (!courierId) return;
    await api.patch(`/orders/${orderId}/courier`, { courierId });
    load();
  }

  async function simulateIfood() {
    await api.post('/ifood/simulate-order', {});
    load();
  }

  const columns = ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'];

  return (
    <>
      <Header
        title="Pedidos"
        desc="Crie pedidos, envie para cozinha, acompanhe entrega e feche pagamentos."
        action={
          <button className="secondary" type="button" onClick={simulateIfood}>
            <Plus size={16} /> Simular iFood
          </button>
        }
      />
      {error && <ErrorBlock message={error} />}
      <div className="orderWorkspace">
        <section className="card orderBuilder">
          <div className="cardTitle">
            <ChefHat size={18} />
            <h3>Novo pedido</h3>
          </div>
          <form onSubmit={createOrder} className="cardForm">
            <div className="inlineRow">
              <label>
                Origem
                <select value={origin} onChange={(event) => setOrigin(event.target.value)}>
                  <option value="HALL">Salao</option>
                  <option value="DELIVERY">Delivery</option>
                  <option value="IFOOD">iFood</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </label>
              {origin === 'HALL' ? (
                <label>
                  Mesa
                  <select value={tableId} onChange={(event) => setTableId(event.target.value)}>
                    <option value="">Selecione</option>
                    {tables.map((table) => (
                      <option key={table.id} value={table.id}>
                        Mesa {table.number} - {statusLabel[table.status]}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  Cliente
                  <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nome do cliente" />
                </label>
              )}
            </div>
            {origin !== 'HALL' && (
              <label>
                Telefone
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Telefone ou WhatsApp" />
              </label>
            )}
            <div className="productPicker">
              {products.slice(0, 8).map((product) => (
                <button key={product.id} type="button" className="productChip" onClick={() => addProduct(product.id)}>
                  <span>{product.name}</span>
                  <b>{currency(product.price)}</b>
                </button>
              ))}
            </div>
            <div className="orderLines">
              {items.length === 0 && <EmptyState title="Comanda vazia" text="Clique em um produto para adicionar ao pedido." />}
              {items.map((item, index) => (
                <div className="orderLine" key={`${item.productId}-${index}`}>
                  <select value={item.productId} onChange={(event) => updateLine(index, 'productId', event.target.value)}>
                    <option value="">Selecionar produto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {currency(product.price)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) => updateLine(index, 'quantity', Number(event.target.value))}
                  />
                  <input value={item.notes} onChange={(event) => updateLine(index, 'notes', event.target.value)} placeholder="Observacoes" />
                  <button className="iconButton dangerButton" type="button" onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="summaryFooter">
              <span>Total</span>
              <strong>{currency(total)}</strong>
            </div>
            <button className="primary" type="submit">
              Enviar para cozinha
            </button>
          </form>
        </section>
        <section className="card">
          <div className="cardTitle">
            <Clock3 size={18} />
            <h3>Fila ativa</h3>
          </div>
          <div className="statusStack">
            {columns.map((status) => (
              <p className="row" key={status}>
                <span>{statusLabel[status]}</span>
                <b>{orders.filter((order) => order.status === status).length}</b>
              </p>
            ))}
          </div>
        </section>
      </div>
      {loading && <LoadingBlock label="Atualizando pedidos..." />}
      <div className="kanban">
        {columns.map((status) => (
          <section className="card kanbanColumn" key={status}>
            <h3>{statusLabel[status]}</h3>
            {orders.filter((order) => order.status === status).length === 0 && (
              <EmptyState title="Sem pedidos" text="Nada nessa etapa agora." />
            )}
            {orders
              .filter((order) => order.status === status)
              .map((order) => (
                <article className="order" key={order.id}>
                  <div className="orderHeader">
                    <div>
                      <b>#{order.id.slice(-5)} / {originLabel[order.origin] || order.origin}</b>
                      <small>{order.table ? `Mesa ${order.table.number}` : order.customer?.name || order.customer?.phone || 'Cliente'}</small>
                    </div>
                    <span className="badge">{currency(order.total)}</span>
                  </div>
                  {order.items.map((item: Any) => (
                    <p key={item.id}>
                      {item.quantity}x {item.product.name}
                      {item.notes ? <small> / {item.notes}</small> : null}
                    </p>
                  ))}
                  {order.origin !== 'HALL' && (
                    <select className="fullSelect" defaultValue="" onChange={(event) => assignCourier(order.id, event.target.value)}>
                      <option value="">Atribuir motoboy</option>
                      {couriers.map((courier) => (
                        <option key={courier.id} value={courier.id}>
                          {courier.name} - {courierStatusLabel[courier.status] || courier.status}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="actions">
                    {statusFlow[order.status].map((next) => (
                      <button key={next} className="secondary compact" type="button" onClick={() => updateStatus(order.id, next)}>
                        {statusLabel[next]}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
          </section>
        ))}
      </div>
    </>
  );
}

function Couriers() {
  const [editingId, setEditingId] = useState('');
  const [actionError, setActionError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', vehicle: 'Moto', plate: '', commissionPerDelivery: '6' });
  const { data, loading, error, reload } = useRemote<Any[]>(async () => (await api.get('/couriers')).data);
  const couriers = data || [];

  async function createCourier(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      vehicle: form.vehicle.trim(),
      plate: form.plate.trim(),
      commissionPerDelivery: Number(form.commissionPerDelivery || 0),
      status: 'AVAILABLE'
    };
    if (editingId) await api.patch(`/couriers/${editingId}`, payload);
    else await api.post('/couriers', payload);
    setEditingId('');
    setForm({ name: '', phone: '', vehicle: 'Moto', plate: '', commissionPerDelivery: '6' });
    reload();
  }

  async function setCourierStatus(courier: Any, status: string) {
    await api.patch(`/couriers/${courier.id}`, { status });
    reload();
  }

  function editCourier(courier: Any) {
    setEditingId(courier.id);
    setForm({ name: courier.name, phone: courier.phone || '', vehicle: courier.vehicle || 'Moto', plate: courier.plate || '', commissionPerDelivery: String(courier.commissionPerDelivery || 0) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteCourier(courier: Any) {
    if (!window.confirm(`Excluir ${courier.name}?`)) return;
    setActionError('');
    try {
      await api.delete(`/couriers/${courier.id}`);
      reload();
    } catch (err: Any) {
      setActionError(err?.response?.data?.message || 'Nao foi possivel excluir o motoboy.');
    }
  }

  return (
    <>
      <Header title="Motoboys" desc="Acompanhe entregadores, status e comissao prevista." />
      <div className="managementGrid">
        <form className="card quickForm" onSubmit={createCourier}>
          <div className="cardTitle">
            <Plus size={18} />
            <h3>{editingId ? 'Editar motoboy' : 'Novo motoboy'}</h3>
          </div>
          <div className="inlineRow">
            <label>
              Nome
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome do entregador" />
            </label>
            <label>
              Telefone
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="WhatsApp" />
            </label>
          </div>
          <div className="inlineRow">
            <label>
              Veiculo
              <input value={form.vehicle} onChange={(event) => setForm({ ...form, vehicle: event.target.value })} />
            </label>
            <label>
              Placa
              <input value={form.plate} onChange={(event) => setForm({ ...form, plate: event.target.value })} placeholder="ABC1D23" />
            </label>
          </div>
          <label>
            Comissao por entrega
            <input type="number" min="0" step="0.01" value={form.commissionPerDelivery} onChange={(event) => setForm({ ...form, commissionPerDelivery: event.target.value })} />
          </label>
          <div className="actions">
            {editingId && <button className="secondary" type="button" onClick={() => { setEditingId(''); setForm({ name: '', phone: '', vehicle: 'Moto', plate: '', commissionPerDelivery: '6' }); }}>Cancelar</button>}
            <button className="primary" type="submit">{editingId ? 'Salvar alteracoes' : 'Cadastrar motoboy'}</button>
          </div>
        </form>
        <section className="card insightCard">
          <div className="cardTitle">
            <Bike size={18} />
            <h3>Entregas</h3>
          </div>
          <p className="row"><span>Disponiveis</span><b>{couriers.filter((courier) => courier.status === 'AVAILABLE').length}</b></p>
          <p className="row"><span>Em rota</span><b>{couriers.filter((courier) => courier.status === 'DELIVERING').length}</b></p>
          <p className="row"><span>Comissao prevista</span><b>{currency(couriers.reduce((sum, courier) => sum + courier.orders.length * Number(courier.commissionPerDelivery), 0))}</b></p>
        </section>
      </div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={reload} />}
      {actionError && <ErrorBlock message={actionError} />}
      <div className="grid3">
        {couriers.map((courier) => (
          <article className="card personCard" key={courier.id}>
            <div className="avatar">
              <Bike size={22} />
            </div>
            <h3>{courier.name}</h3>
            <p>{courier.phone || 'Sem telefone'}</p>
            <span className={`statusPill ${courier.status}`}>{courierStatusLabel[courier.status]}</span>
            <p>Entregas: {courier.orders.length}</p>
            <strong>{currency(courier.orders.length * Number(courier.commissionPerDelivery))}</strong>
            <div className="actions">
              <button className="secondary compact" disabled={courier.status === 'AVAILABLE'} onClick={() => setCourierStatus(courier, 'AVAILABLE')}>Disponivel</button>
              <button className="secondary compact" disabled={courier.status === 'ABSENT'} onClick={() => setCourierStatus(courier, 'ABSENT')}>Ausente</button>
              <button className="iconButton" title="Editar motoboy" onClick={() => editCourier(courier)}><Pencil size={15} /></button>
              <button className="iconButton dangerButton" title="Excluir motoboy" onClick={() => deleteCourier(courier)}><Trash2 size={15} /></button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function Payments() {
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, { amount: string; method: string }>>({});
  const { data, loading, error, reload } = useRemote<Any[]>(async () => (await api.get('/orders')).data);
  const orders = data || [];

  async function pay(order: Any) {
    const paid = (order.payments || []).reduce((sum: number, payment: Any) => sum + Number(payment.amount), 0);
    const draft = paymentDrafts[order.id] || { amount: String(Math.max(0, Number(order.total) - paid)), method: 'PIX' };
    await api.post(`/orders/${order.id}/payments`, { method: draft.method, amount: Number(draft.amount || 0), status: 'PAID' });
    setPaymentDrafts((current) => ({ ...current, [order.id]: { amount: '', method: 'PIX' } }));
    reload();
  }

  return (
    <>
      <Header title="Pagamentos" desc="Fechamento rapido por PIX, dinheiro ou cartao." />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={reload} />}
      <div className="card tableWrap">
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Origem</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Acao</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const paid = (order.payments || []).reduce((sum: number, payment: Any) => sum + Number(payment.amount), 0);
              const isPaid = paid >= Number(order.total);
              const remaining = Math.max(0, Number(order.total) - paid);
              const draft = paymentDrafts[order.id] || { amount: String(remaining), method: 'PIX' };
              return (
                <tr key={order.id}>
                  <td>#{order.id.slice(-5)}</td>
                  <td>{originLabel[order.origin] || order.origin}</td>
                  <td>{currency(order.total)}</td>
                  <td>
                    <span className={isPaid ? 'statusOk' : 'statusPending'}>{isPaid ? 'Pago' : `${currency(remaining)} pendente`}</span>
                  </td>
                  <td>
                    <div className="paymentControls">
                      <select disabled={isPaid} value={draft.method} onChange={(event) => setPaymentDrafts((current) => ({ ...current, [order.id]: { ...draft, method: event.target.value } }))}>
                        <option value="PIX">PIX</option>
                        <option value="CASH">Dinheiro</option>
                        <option value="CREDIT_CARD">Credito</option>
                        <option value="DEBIT_CARD">Debito</option>
                      </select>
                      <input disabled={isPaid} type="number" min="0" step="0.01" value={draft.amount} onChange={(event) => setPaymentDrafts((current) => ({ ...current, [order.id]: { ...draft, amount: event.target.value } }))} />
                      <button className="secondary compact" disabled={isPaid} onClick={() => pay(order)}>Receber</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Stock() {
  const [form, setForm] = useState({ name: '', unit: 'un', currentStock: '0', minStock: '0' });
  const [adjustments, setAdjustments] = useState<Record<string, string>>({});
  const { data, loading, error, reload } = useRemote<Any[]>(async () => (await api.get('/ingredients')).data);
  const ingredients = data || [];

  async function createIngredient(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    await api.post('/ingredients', {
      name: form.name.trim(),
      unit: form.unit.trim() || 'un',
      currentStock: Number(form.currentStock || 0),
      minStock: Number(form.minStock || 0)
    });
    setForm({ name: '', unit: 'un', currentStock: '0', minStock: '0' });
    reload();
  }

  async function moveStock(id: string, unit: string, type: 'IN' | 'OUT') {
    const quantity = Number(adjustments[id] || 0);
    if (quantity <= 0) return;
    await api.post(`/ingredients/${id}/movement`, { type, quantity, description: `${type === 'IN' ? 'Entrada' : 'Saida'} manual de ${quantity} ${unit}` });
    setAdjustments((current) => ({ ...current, [id]: '' }));
    reload();
  }

  return (
    <>
      <Header title="Estoque" desc="Insumos, minimo operacional e reposicao rapida." />
      <div className="managementGrid">
        <form className="card quickForm" onSubmit={createIngredient}>
          <div className="cardTitle">
            <Plus size={18} />
            <h3>Novo insumo</h3>
          </div>
          <div className="inlineRow">
            <label>
              Nome
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex: Tomate" />
            </label>
            <label>
              Unidade
              <input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="kg, un, l" />
            </label>
          </div>
          <div className="inlineRow">
            <label>
              Estoque atual
              <input type="number" min="0" step="0.001" value={form.currentStock} onChange={(event) => setForm({ ...form, currentStock: event.target.value })} />
            </label>
            <label>
              Estoque minimo
              <input type="number" min="0" step="0.001" value={form.minStock} onChange={(event) => setForm({ ...form, minStock: event.target.value })} />
            </label>
          </div>
          <button className="primary" type="submit">Cadastrar insumo</button>
        </form>
        <section className="card insightCard">
          <div className="cardTitle">
            <Package size={18} />
            <h3>Alertas</h3>
          </div>
          <p className="row"><span>Insumos cadastrados</span><b>{ingredients.length}</b></p>
          <p className="row"><span>Abaixo do minimo</span><b>{ingredients.filter((item) => Number(item.currentStock) <= Number(item.minStock)).length}</b></p>
          <p className="row"><span>Saudaveis</span><b>{ingredients.filter((item) => Number(item.currentStock) > Number(item.minStock)).length}</b></p>
        </section>
      </div>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={reload} />}
      <div className="stockGrid">
        {ingredients.map((item) => {
          const low = Number(item.currentStock) <= Number(item.minStock);
          const ratio = Math.min(100, Math.round((Number(item.currentStock) / Math.max(Number(item.minStock), 1)) * 100));
          return (
            <article className="card stockCard" key={item.id}>
              <div className="stockTop">
                <div>
                  <h3>{item.name}</h3>
                  <span>{low ? 'Comprar' : 'OK'}</span>
                </div>
              </div>
              <div className="stockBar">
                <span style={{ width: `${ratio}%` }} />
              </div>
              <p>
                Atual: <b>{Number(item.currentStock)} {item.unit}</b> / minimo {Number(item.minStock)} {item.unit}
              </p>
              <div className="stockAdjust">
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={adjustments[item.id] || ''}
                  onChange={(event) => setAdjustments((current) => ({ ...current, [item.id]: event.target.value }))}
                  placeholder={`Qtd. em ${item.unit}`}
                />
                <button className="secondary compact" onClick={() => moveStock(item.id, item.unit, 'IN')}>Entrada</button>
                <button className="secondary compact" onClick={() => moveStock(item.id, item.unit, 'OUT')}>Saida</button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function Employees() {
  const [editingId, setEditingId] = useState('');
  const [actionError, setActionError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: 'WAITER', password: '', active: true });
  const { data, loading, error, reload } = useRemote<Any[]>(async () => (await api.get('/employees')).data);
  const employees = data || [];

  async function saveEmployee(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    const payload = { ...form, name: form.name.trim(), email: form.email.trim(), password: form.password || undefined };
    if (editingId) await api.patch(`/employees/${editingId}`, payload);
    else await api.post('/employees', payload);
    setEditingId('');
    setForm({ name: '', email: '', role: 'WAITER', password: '', active: true });
    reload();
  }

  function editEmployee(employee: Any) {
    setEditingId(employee.id);
    setForm({ name: employee.name, email: employee.email, role: employee.role, password: '', active: employee.active !== false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteEmployee(employee: Any) {
    if (!window.confirm(`Excluir ${employee.name}?`)) return;
    setActionError('');
    try {
      await api.delete(`/employees/${employee.id}`);
      reload();
    } catch (err: Any) {
      setActionError(err?.response?.data?.message || 'Nao foi possivel excluir o funcionario.');
    }
  }

  async function checkIn(id: string) {
    await api.post(`/employees/${id}/checkin`, {});
    reload();
  }

  async function checkOut(id: string) {
    await api.post(`/employees/${id}/checkout`, {});
    reload();
  }

  return (
    <>
      <Header title="Equipe" desc="Controle simples de ponto e funcoes do time." />
      <form className="card quickForm employeeForm" onSubmit={saveEmployee}>
        <div className="cardTitle"><Users size={18} /><h3>{editingId ? 'Editar funcionario' : 'Novo funcionario'}</h3></div>
        <div className="inlineRow">
          <label>Nome<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nome completo" /></label>
          <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="email@restaurante.com" /></label>
        </div>
        <div className="inlineRow">
          <label>
            Funcao
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              {Object.entries(roleLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Senha {editingId && '(deixe vazia para manter)'}<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={editingId ? 'Manter senha atual' : 'Senha inicial'} /></label>
        </div>
        <label className="checkLabel"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Usuario ativo</label>
        <div className="actions">
          {editingId && <button className="secondary" type="button" onClick={() => { setEditingId(''); setForm({ name: '', email: '', role: 'WAITER', password: '', active: true }); }}>Cancelar</button>}
          <button className="primary" type="submit">{editingId ? 'Salvar alteracoes' : 'Cadastrar funcionario'}</button>
        </div>
      </form>
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={reload} />}
      {actionError && <ErrorBlock message={actionError} />}
      <div className="grid3">
        {employees.map((employee) => {
          const working = employee.timeClocks?.some((time: Any) => !time.checkOut);
          return (
            <article className="card personCard" key={employee.id}>
              <div className="avatar">
                <Users size={22} />
              </div>
              <h3>{employee.name}</h3>
              <p>{employee.email}</p>
              <span className={working ? 'statusOk' : 'statusPending'}>{working ? 'No ponto' : 'Fora do ponto'}</span>
              <p>{roleLabel[employee.role] || employee.role}</p>
              <div className="actions">
                <button className="secondary compact" disabled={working} onClick={() => checkIn(employee.id)}>
                  Entrada
                </button>
                <button className="secondary compact" disabled={!working} onClick={() => checkOut(employee.id)}>
                  Saida
                </button>
                <button className="iconButton" title="Editar funcionario" onClick={() => editEmployee(employee)}><Pencil size={15} /></button>
                <button className="iconButton dangerButton" title="Excluir funcionario" onClick={() => deleteEmployee(employee)}><Trash2 size={15} /></button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function Assistant() {
  const [question, setQuestion] = useState('Qual produto esta com estoque baixo?');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestions = useMemo(
    () => ['Qual produto esta com estoque baixo?', 'Como esta o faturamento?', 'Qual motoboy tem mais entregas?', 'Quantos pedidos estao em preparo?'],
    []
  );

  async function ask(event?: React.FormEvent) {
    event?.preventDefault();
    setLoading(true);
    const { data } = await api.post('/assistant/ask', { question });
    setAnswer(data.answer);
    setLoading(false);
  }

  return (
    <>
      <Header title="Assistente" desc="Pergunte sobre estoque, faturamento, pedidos e entregas." />
      <section className="assistantPanel">
        <div className="assistantHero">
          <Bot size={42} />
          <h2>Analise operacional instantanea</h2>
          <p>Use perguntas curtas para consultar indicadores do restaurante demo.</p>
        </div>
        <form className="card assistantForm" onSubmit={ask}>
          <label>
            Pergunta
            <input value={question} onChange={(event) => setQuestion(event.target.value)} />
          </label>
          <button className="primary" disabled={loading}>
            {loading ? 'Consultando...' : 'Perguntar'}
          </button>
          <div className="suggestions">
            {suggestions.map((item) => (
              <button key={item} className="secondary compact" type="button" onClick={() => setQuestion(item)}>
                {item}
              </button>
            ))}
          </div>
          {answer && <div className="answer">{answer}</div>}
        </form>
      </section>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app/*" element={<Protected />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
