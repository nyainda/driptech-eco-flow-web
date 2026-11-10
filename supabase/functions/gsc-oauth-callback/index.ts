import { createClient } from "npm:@supabase/supabase-js@2";
const redirect=(status:string)=>Response.redirect("https://www.dripstech.co.ke/admin?section=analytics&gsc="+encodeURIComponent(status),303);
async function sha(value:string){return [...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,"0")).join("");}
Deno.serve(async req=>{
 const u=new URL(req.url),code=u.searchParams.get("code"),state=u.searchParams.get("state");
 if(u.searchParams.get("error"))return redirect("denied");
 if(!code||!state)return redirect("missing_parameters");
 const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
 const {data:row}=await admin.from("gsc_oauth_states").select("*").eq("state_hash",await sha(state)).gt("expires_at",new Date().toISOString()).maybeSingle();
 if(!row)return redirect("invalid_state");
 await admin.from("gsc_oauth_states").delete().eq("state_hash",await sha(state));
 const tokenRes=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:Deno.env.get("GSC_CLIENT_ID")!,client_secret:Deno.env.get("GSC_CLIENT_SECRET")!,redirect_uri:Deno.env.get("GSC_REDIRECT_URI")||"https://cnvtnxesywbzwsxwpejw.supabase.co/functions/v1/gsc-oauth-callback",grant_type:"authorization_code"})});
 const tokens=await tokenRes.json();if(!tokenRes.ok||!tokens.refresh_token)return redirect("token_exchange_failed");
 const profileRes=await fetch("https://www.googleapis.com/oauth2/v2/userinfo",{headers:{Authorization:"Bearer "+tokens.access_token}});const profile=profileRes.ok?await profileRes.json():{};
 const {error}=await admin.from("gsc_oauth_tokens").upsert({id:1,refresh_token:tokens.refresh_token,connected_email:profile.email||null,property_url:"sc-domain:dripstech.co.ke",updated_at:new Date().toISOString()});
 return redirect(error?"save_failed":"connected");
});