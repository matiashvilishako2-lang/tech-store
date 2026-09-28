const products=[
{id:1,cat:"washing",name:"SmartWash 8კგ",price:899,icon:"🧺",desc:"8 კგ • A++"},
{id:2,cat:"washing",name:"EcoWash 7კგ",price:699,icon:"🫧",desc:"7 კგ • 1200 RPM"},
{id:3,cat:"washing",name:"PremiumWash 10კგ",price:1199,icon:"🧺",desc:"10 კგ • ინვერტერული"},
{id:4,cat:"tv",name:"Vision 43 Smart TV",price:799,icon:"📺",desc:"43 • 4K"},
{id:5,cat:"tv",name:"Vision 55 4K",price:1299,icon:"📺",desc:"55 • 4K HDR"},
{id:6,cat:"tv",name:"Cinema 65 Smart",price:1699,icon:"📺",desc:"65 • 4K"},
{id:7,cat:"speaker",name:"BoomBox 500",price:349,icon:"🔊",desc:"Bluetooth • ბასი"},
{id:8,cat:"speaker",name:"PartySound 800",price:549,icon:"🔊",desc:"Bluetooth • 800W"},
{id:9,cat:"speaker",name:"HomeSound Mini",price:199,icon:"🔈",desc:"კომპაქტური"}
];
let cart=JSON.parse(localStorage.getItem("cart")||"[]");
const grid=document.querySelector("#grid");
function render(cat="all"){grid.innerHTML=products.filter(p=>cat==="all"||p.cat===cat).map(p=>`<article class="card"><div class="pic">${p.icon}</div><div class="info"><div class="tag">${p.desc}</div><h3>${p.name}</h3><div class="price">${p.price} ₾</div><button class="add" onclick="add(${p.id})">კალათაში დამატება</button></div></article>`).join("")}
function save(){localStorage.setItem("cart",JSON.stringify(cart));document.querySelector("#cartCount").textContent=cart.reduce((a,b)=>a+b.qty,0)}
function add(id){let x=cart.find(i=>i.id===id);x?x.qty++:cart.push({id,qty:1});save();openCart()}
function openCart(){renderCart();document.querySelector("#cartModal").classList.add("show")}
function closeCart(){document.querySelector("#cartModal").classList.remove("show")}
function renderCart(){const b=document.querySelector("#cartItems");if(!cart.length){b.innerHTML="<p>კალათა ცარიელია.</p>";document.querySelector("#cartTotal").textContent="0 ₾";return}b.innerHTML=cart.map(i=>{let p=products.find(x=>x.id===i.id);return `<div class="cart-row"><span>${p.icon}</span><div class="grow"><b>${p.name}</b><br>${p.price} ₾ × ${i.qty}</div><button onclick="change(${i.id},-1)">−</button><button onclick="change(${i.id},1)">+</button></div>`}).join("");document.querySelector("#cartTotal").textContent=cart.reduce((s,i)=>s+products.find(p=>p.id===i.id).price*i.qty,0)+" ₾"}
function change(id,n){let x=cart.find(i=>i.id===id);x.qty+=n;if(x.qty<1)cart=cart.filter(i=>i.id!==id);save();renderCart()}
function openCheckout(){if(!cart.length)return alert("კალათა ცარიელია");closeCart();document.querySelector("#checkoutModal").classList.add("show")}
function closeCheckout(){document.querySelector("#checkoutModal").classList.remove("show")}
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");render(b.dataset.cat)});
document.querySelector("#checkoutForm").onsubmit=async e=>{
e.preventDefault();const f=new FormData(e.target);const product=cart.map(i=>{let p=products.find(x=>x.id===i.id);return `${p.name} x${i.qty}`}).join(", ");const quantity=cart.reduce((s,i)=>s+i.qty,0);const total=cart.reduce((s,i)=>s+products.find(p=>p.id===i.id).price*i.qty,0);
try{const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:f.get("name"),email:f.get("email"),phone:f.get("phone"),address:f.get("address"),product,quantity,total})});const j=await r.json();if(!r.ok)throw Error(j.error||"შეკვეთა ვერ გაიგზავნა");e.target.classList.add("hidden");document.querySelector("#success").classList.remove("hidden");document.querySelector("#success").innerHTML=`შეკვეთა მიღებულია!<br>ნომერი: <b>${j.orderId}</b>`;cart=[];save()}catch(err){alert(err.message)}};
render();save();