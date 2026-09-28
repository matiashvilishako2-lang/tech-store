require("dotenv").config();
const express=require("express");
const helmet=require("helmet");
const rateLimit=require("express-rate-limit");
const {createClient}=require("@supabase/supabase-js");
const {Resend}=require("resend");

const app=express();
const PORT=process.env.PORT||3000;

const required=["SUPABASE_URL","SUPABASE_PUBLISHABLE_KEY","SUPABASE_SECRET_KEY","ADMIN_EMAIL"];
for(const k of required){if(!process.env[k]) console.warn(`Missing environment variable: ${k}`);}

const supabaseAdmin=createClient(
  process.env.SUPABASE_URL||"",
  process.env.SUPABASE_SECRET_KEY||"",
  {auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}}
);

const resend=process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

app.use(helmet({
  contentSecurityPolicy:false
}));
app.use(express.json({limit:"32kb"}));
app.use(rateLimit({
  windowMs:15*60*1000,
  limit:120,
  standardHeaders:"draft-7",
  legacyHeaders:false
}));
app.use(express.static("public"));

function clean(v,max=500){
  return String(v??"").trim().slice(0,max);
}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
function adminEmail(){return String(process.env.ADMIN_EMAIL||"").trim().toLowerCase();}

async function requireAdmin(req,res,next){
  try{
    const auth=req.headers.authorization||"";
    if(!auth.startsWith("Bearer ")) return res.status(401).json({error:"ავტორიზაცია საჭიროა"});
    const token=auth.slice(7);
    const {data,error}=await supabaseAdmin.auth.getUser(token);
    if(error||!data?.user) return res.status(401).json({error:"სესია არასწორია ან ვადაგასულია"});
    if(String(data.user.email||"").toLowerCase()!==adminEmail()){
      return res.status(403).json({error:"Admin წვდომა აკრძალულია"});
    }
    req.admin=data.user;
    next();
  }catch(e){
    console.error(e);
    res.status(401).json({error:"ავტორიზაციის შეცდომა"});
  }
}

app.get("/api/config",(req,res)=>{
  res.json({
    supabaseUrl:process.env.SUPABASE_URL||"",
    supabasePublishableKey:process.env.SUPABASE_PUBLISHABLE_KEY||""
  });
});

app.post("/api/orders",async(req,res)=>{
  try{
    const name=clean(req.body.name,120);
    const email=clean(req.body.email,180);
    const phone=clean(req.body.phone,40);
    const address=clean(req.body.address,500);
    const product=clean(req.body.product,1000);
    const quantity=Number(req.body.quantity||1);
    const total=Number(req.body.total||0);

    if(!name||!email||!phone||!address||!product) return res.status(400).json({error:"ყველა ველი აუცილებელია"});
    if(!validEmail(email)) return res.status(400).json({error:"ელფოსტა არასწორია"});
    if(!Number.isInteger(quantity)||quantity<1||quantity>100) return res.status(400).json({error:"რაოდენობა არასწორია"});
    if(!Number.isFinite(total)||total<0) return res.status(400).json({error:"ფასი არასწორია"});

    const {data,error}=await supabaseAdmin.from("orders").insert({
      customer_name:name,customer_email:email,customer_phone:phone,
      customer_address:address,product,quantity,total
    }).select("id,created_at").single();

    if(error){
      console.error("DB insert:",error);
      return res.status(500).json({error:"შეკვეთის შენახვა ვერ მოხერხდა"});
    }

    // Email notification is secondary: the order remains saved even if email fails.
    let emailSent=false;
    if(resend && process.env.ADMIN_NOTIFICATION_EMAIL){
      const result=await resend.emails.send({
        from:process.env.MAIL_FROM||"Tech Store <onboarding@resend.dev>",
        to:[process.env.ADMIN_NOTIFICATION_EMAIL],
        subject:`ახალი შეკვეთა #${data.id.slice(0,8)}`,
        html:`<h2>ახალი შეკვეთა</h2>
        <p><b>შეკვეთის ID:</b> ${data.id}</p>
        <p><b>სახელი:</b> ${escapeHtml(name)}</p>
        <p><b>ელფოსტა:</b> ${escapeHtml(email)}</p>
        <p><b>ტელეფონი:</b> ${escapeHtml(phone)}</p>
        <p><b>მისამართი:</b> ${escapeHtml(address)}</p>
        <p><b>ნივთი:</b> ${escapeHtml(product)}</p>
        <p><b>რაოდენობა:</b> ${quantity}</p>
        <p><b>ჯამი:</b> ${total} ₾</p>`
      });
      emailSent=!result.error;
      if(result.error) console.error("Email:",result.error);
    }

    res.json({ok:true,orderId:data.id,emailSent});
  }catch(e){
    console.error(e);
    res.status(500).json({error:"სერვერის შეცდომა"});
  }
});

function escapeHtml(s){
 return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

app.get("/api/admin/orders",requireAdmin,async(req,res)=>{
  const {data,error}=await supabaseAdmin.from("orders").select("*").order("created_at",{ascending:false});
  if(error)return res.status(500).json({error:"შეკვეთების ჩატვირთვა ვერ მოხერხდა"});
  res.json(data);
});

app.patch("/api/admin/orders/:id",requireAdmin,async(req,res)=>{
  const allowed=["ახალი","დამუშავება","გაგზავნილი","დასრულებული","გაუქმებული"];
  const status=clean(req.body.status,30);
  if(!allowed.includes(status))return res.status(400).json({error:"არასწორი სტატუსი"});
  const {data,error}=await supabaseAdmin.from("orders").update({status}).eq("id",req.params.id).select().single();
  if(error)return res.status(500).json({error:"სტატუსის შეცვლა ვერ მოხერხდა"});
  res.json(data);
});

app.get("*",(req,res)=>{
  if(req.path.startsWith("/api/")) return res.status(404).json({error:"Not found"});
  res.sendFile(require("path").join(__dirname,"public","index.html"));
});

app.listen(PORT,()=>console.log(`Tech Store running on port ${PORT}`));
