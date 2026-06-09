from pathlib import Path

p = Path('src/main.tsx')
text = p.read_text(encoding='utf-8')

# Add product images mapping and improve Products component
product_images = """const productImages:Record<string,string>={'1':'🍔','2':'🍕','3':'🍣','4':'🍝','5':'🥗','6':'🍰','7':'☕','8':'🥤','9':'🍷'};"""

# Find where to insert (after demoMode)
insert_pos = text.find('const demoMode')
insert_pos = text.find('\n', insert_pos) + 1
text = text[:insert_pos] + product_images + '\n' + text[insert_pos:]

# Now enhance the Orders productShowcase with visual emojis
old_showcase = '''<div className="productShowcase">{products.slice(0,9).map((p:Any)=>(
            <button type="button" className="productChip" key={p.id} onClick={()=>addProduct(p.id)}>
              <div>
                <strong>{p.name}</strong>
                <small className="productSubtitle">{p.category?.name || ''}</small>
              </div>
              <span>{money(p.price)}</span>
            </button>
          ))}</div>'''

new_showcase = '''<div className="productShowcase">{products.slice(0,9).map((p:Any,idx:number)=>(
            <button type="button" className="productChip" key={p.id} onClick={()=>addProduct(p.id)}>
              <div style={{fontSize:'2rem',textAlign:'center',marginBottom:'4px'}}>
                {productImages[(idx+1).toString()] || '🍽️'}
              </div>
              <div>
                <strong>{p.name}</strong>
                <small className="productSubtitle">{p.category?.name || 'Destaque'}</small>
              </div>
              <span>{money(p.price)}</span>
            </button>
          ))}</div>'''

text = text.replace(old_showcase, new_showcase)

p.write_text(text, encoding='utf-8')
print('Updated Orders with visual product showcase')
