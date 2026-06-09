from pathlib import Path

p = Path('src/main.tsx')
text = p.read_text(encoding='utf-8')

# Improve Tables component - more visual grid
old_tables = '''function Tables(){const [items,setItems]=useState<Any[]>([]); const [loading,setLoading]=useState(false); const load=async()=>{setLoading(true); const {data}=await api.get('/tables'); setItems(data); setLoading(false)}; useEffect(()=>{load()},[]);'''

# Find and replace the whole return statement of Tables
start = text.find('function Tables(){')
end = text.find('\nfunction Products(){', start)
old_func = text[start:end]

new_func = '''function Tables(){
  const [items,setItems]=useState<Any[]>([]);
  const [loading,setLoading]=useState(false);
  const load=async()=>{setLoading(true); const {data}=await api.get('/tables'); setItems(data); setLoading(false)};
  useEffect(()=>{load()},[]);
  async function toggleStatus(table:Any){const next = table.status === 'FREE' ? 'OCCUPIED' : 'FREE'; await api.patch(`/tables/${table.id}`, { status: next }); load()}
  return <><Header title="Mesas" desc="Controle de salão com atualização em tempo real"/><div className="tableGrid">{items.map(t=><div className={`tableCard ${t.status}`} key={t.id} onClick={()=>toggleStatus(t)}><h2>Mesa {t.number}</h2><span>{statusLabel(t.status)}</span><small>{t.orders?.length||0} pedido(s)</small><button type="button" className="secondary" style={{marginTop:'8px'}} onClick={e=>{e.stopPropagation();toggleStatus(t);}}>{t.status==='FREE'?'Ocupar':'Liberar'}</button></div>)}</div>{loading && <div className="card">Atualizando mesas...</div>}</>
}'''

text = text[:start] + new_func + text[end:]

p.write_text(text, encoding='utf-8')
print('Updated Tables component with visual grid')
