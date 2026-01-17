// LocalStorage keys
const LS_CART='min2_cart'; const LS_USER='min2_user';

const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const state={
  products:[
    {sku:'CF001',name:'Espresso',base:2.00,desc:'Concentrated shot of coffee with rich crema.'},
    {sku:'CF002',name:'Americano',base:2.50,desc:'Espresso diluted with hot water for a smooth finish.'},
    {sku:'CF003',name:'Latte',base:3.00,desc:'Espresso with plenty of steamed milk, light foam.'},
    {sku:'CF004',name:'Cappuccino',base:3.00,desc:'Equal parts espresso, steamed milk and foam.'},
    {sku:'CF005',name:'Mocha',base:3.50,desc:'Chocolate + espresso + steamed milk.'},
    {sku:'CF006',name:'Cold Brew',base:3.80,desc:'Slow-steeped, bold and refreshing.'}
  ],
  sizePrice:{Small:0, Medium:0.5, Large:1.0},
  milkMods:{Whole:0, Skim:0, Almond:0.4, Oat:0.4},
  cart: JSON.parse(localStorage.getItem(LS_CART) || '[]'), // items: {sku,name,size,milk,sugar,qty,unit}
  user: JSON.parse(localStorage.getItem(LS_USER) || 'null')
};

function saveCart(){ localStorage.setItem(LS_CART, JSON.stringify(state.cart)); }
function saveUser(){ state.user?localStorage.setItem(LS_USER, JSON.stringify(state.user)):localStorage.removeItem(LS_USER); }
function format(n){ return '$'+n.toFixed(2); }

function renderNav(){
  const login=$('#nav-login'), reg=$('#nav-register'), logout=$('#nav-logout'), admin=$('#admin-badge');
  if(state.user){ login?.classList.add('hidden'); reg?.classList.add('hidden'); logout?.classList.remove('hidden'); }
  else { login?.classList.remove('hidden'); reg?.classList.remove('hidden'); logout?.classList.add('hidden'); }
  if(admin) admin.textContent = state.user?.role==='admin' ? ' (Admin)' : '';
  const cc=$('#cart-count'); if(cc){ const c=state.cart.reduce((s,i)=>s+i.qty,0); cc.textContent=c?`Cart (${c})`:'Cart'; }
}

function renderHome(){
  const host=$('#types'); if(!host) return;
  host.innerHTML = state.products.map(p=>`
    <article class="card">
      <img src="https://picsum.photos/seed/${p.sku}/600/400" alt="${p.name}">
      <h3>${p.name}</h3>
      <p class="small">${p.desc}</p>
      <p><span class="badge">Base price: ${format(p.base)}</span></p>
    </article>
  `).join('');
}

function lineUnitPrice(sku,size,milk){
  const p = state.products.find(x=>x.sku===sku);
  return p.base + (state.sizePrice[size]||0) + (state.milkMods[milk]||0);
}

function addDetailedItem({sku,size,milk,sugar,qty}){
  qty=Math.max(1,Math.min(10,parseInt(qty||'1',10)));
  const p=state.products.find(x=>x.sku===sku);
  const unit=lineUnitPrice(sku,size,milk);
  // Combine same items
  const key = (i)=> i.sku===sku && i.size===size && i.milk===milk && i.sugar===sugar;
  const ex = state.cart.find(key);
  if(ex){ ex.qty = Math.min(10, ex.qty + qty); }
  else state.cart.push({sku,name:p.name,size,milk,sugar,qty,unit});
  saveCart(); renderNav(); renderCart();
}

function renderCart(){
  const host=$('#cart'); if(!host) return;
  if(!state.cart.length){
    host.innerHTML = '<p class="notice">Your cart is empty. Use the form above to add drinks.</p>';
    $('#totals').textContent=''; renderNav(); return;
  }
  host.innerHTML = `
    <table class="table">
      <thead><tr><th>Item</th><th>Size</th><th>Milk</th><th>Sugar</th><th>Qty</th><th>Unit</th><th>Value</th><th></th></tr></thead>
      <tbody>
        ${state.cart.map(i=>`
          <tr>
            <td>${i.name}</td>
            <td>${i.size}</td>
            <td>${i.milk}</td>
            <td>${i.sugar}</td>
            <td><input class="qty" data-key="${i.sku}|${i.size}|${i.milk}|${i.sugar}" type="number" min="1" max="10" value="${i.qty}"></td>
            <td>${format(i.unit)}</td>
            <td>${format(i.unit*i.qty)}</td>
            <td><button class="btn rm" data-key="${i.sku}|${i.size}|${i.milk}|${i.sugar}">Remove</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  $$('.qty',host).forEach(inp=> inp.addEventListener('input', e=>{
    const [sku,size,milk,sugar]=e.target.dataset.key.split('|');
    const item = state.cart.find(i=> i.sku===sku && i.size===size && i.milk===milk && i.sugar===sugar);
    if(item){ item.qty=Math.max(1,Math.min(10,parseInt(e.target.value||'1',10))); saveCart(); renderCart(); }
  }));
  $$('.rm',host).forEach(btn=> btn.addEventListener('click', e=>{
    const [sku,size,milk,sugar]=e.target.dataset.key.split('|');
    state.cart = state.cart.filter(i=> !(i.sku===sku && i.size===size && i.milk===milk && i.sugar===sugar));
    saveCart(); renderCart();
  }));
  const subtotal = state.cart.reduce((s,i)=> s + i.qty*i.unit, 0);
  $('#totals').innerHTML = `Subtotal: <strong>${format(subtotal)}</strong>`;
  renderNav();
}

// Auth minimal
function login(username,password){
  if(username==='admin' && password==='admin'){ // redirect to cart
    state.user={username, role:'admin'}; saveUser(); location.href='cart.html'; return true;
  }
  const users = JSON.parse(localStorage.getItem('min2_users') || '[]');
  const found = users.find(u=>u.username===username && u.password===password);
  if(found){ state.user={username, role:'user'}; saveUser(); location.href='index.html'; return true; }
  return false;
}
function registerUser({username,email,password}){
  const users = JSON.parse(localStorage.getItem('min2_users') || '[]');
  if(users.find(u=>u.username===username)) return {ok:false,msg:'Username already exists'};
  users.push({username,email,password}); localStorage.setItem('min2_users', JSON.stringify(users)); return {ok:true};
}

document.addEventListener('DOMContentLoaded', ()=>{
  const page=document.body.dataset.page;
  renderNav();
  if(page==='home'){ renderHome(); }
  if(page==='cart'){
    // build add form
    const add = $('#add-form');
    if(add){
      // populate selects
      const typeSel = $('#f-type'); typeSel.innerHTML = state.products.map(p=> `<option value="${p.sku}">${p.name}</option>`).join('');
      const sizeSel = $('#f-size'); sizeSel.innerHTML = Object.keys(state.sizePrice).map(s=> `<option>${s}</option>`).join('');
      const milkSel = $('#f-milk'); milkSel.innerHTML = Object.keys(state.milkMods).map(m=> `<option>${m}</option>`).join('');
      $('#f-sugar').value = '0';
      add.addEventListener('submit', e=>{
        e.preventDefault();
        addDetailedItem({
          sku: $('#f-type').value,
          size: $('#f-size').value,
          milk: $('#f-milk').value,
          sugar: $('#f-sugar').value + ' tsp',
          qty: $('#f-qty').value
        });
        add.reset();
      });
    }
    renderCart();
  }
  if(page==='login'){
    $('#loginForm')?.addEventListener('submit', e=>{
      e.preventDefault();
      const ok = login($('#username').value.trim(), $('#password').value);
      if(!ok){ const m=$('#loginMsg'); m.textContent='Invalid credentials'; m.style.color='crimson'; }
    });
  }
  if(page==='register'){
    $('#regForm')?.addEventListener('submit', e=>{
      e.preventDefault();
      const data={username:$('#r-username').value.trim(), email:$('#r-email').value.trim(), password:$('#r-password').value};
      if(!data.username || !data.email || data.password.length<4){ alert('Fill all fields (password ≥ 4)'); return; }
      const res=registerUser(data);
      if(res.ok){ alert('Account created. Please login.'); location.href='login.html'; } else alert(res.msg);
    });
  }
  $('#nav-logout')?.addEventListener('click', (e)=>{ e.preventDefault(); state.user=null; saveUser(); location.href='index.html'; });
});
