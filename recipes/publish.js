// Owner login: the owner's recipes are published to the site for everyone.
// Visitors see the published recipes read-only; they can still plan a week and use the shopping list.
var OK_KEY="recipe-box-owner",owner=null,pubT=null,pubMsg="",pubBusy=false,pubOk=0;
try{owner=localStorage.getItem(OK_KEY)}catch(e){}
function setOwner(k){owner=k;try{if(k)localStorage.setItem(OK_KEY,k);else localStorage.removeItem(OK_KEY)}catch(e){}document.body.classList.toggle("visitor",!owner)}
function pubDoc(){return JSON.stringify({R:S.R,rt:S.rt||{},del:S.del||{}})}
// Owner: send the current recipes to the site.
function publish(){if(!owner)return;if(pubBusy){clearTimeout(pubT);pubT=setTimeout(publish,1500);return}
if(hasData()&&Date.now()-offFail>=60000){offload();clearTimeout(pubT);pubT=setTimeout(publish,4000);return}
pubBusy=true;fetch("/api/recipes",{method:"PUT",headers:{"content-type":"application/json","x-owner-key":owner},body:pubDoc()})
.then(function(r){if(r.status===401){setOwner(null);pubMsg="Your owner password changed. Log in again to keep publishing.";draw();return}if(!r.ok)throw 0;pubOk=Date.now();pubMsg=""},function(){pubMsg="Couldn’t reach the site. Your changes are saved here and will go live when you’re back online."})
.then(function(){pubBusy=false;if(view==="owner")draw()})}
function schedulePub(){if(!owner)return;clearTimeout(pubT);pubT=setTimeout(publish,1200)}
// Everyone: load the published recipes.
function pull(){return fetch("/api/recipes?t="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.json():null}).then(function(d){
if(!d||!Array.isArray(d.R)){if(owner)schedulePub();return}
if(owner){var m=merge(S,{R:d.R,rt:d.rt||{},del:d.del||{},seen:[],plan:S.plan.slice(),shop:Object.assign({},S.shop),ps:Object.assign({},S.ps),ss:Object.assign({},S.ss)});
if(canon(m)!==canon(S))apply(m);else if(JSON.stringify(S.R)!==JSON.stringify(d.R))schedulePub();return}
var ids={};d.R.forEach(function(r){ids[r.id]=1});
if(JSON.stringify(S.R)===JSON.stringify(d.R))return;
S.R=d.R;S.plan=S.plan.filter(function(id){return ids[id]});snap=take();save0();if(view!=="new"&&view!=="edit")draw()}).catch(function(){})}
function ownerLogin(){var i=document.getElementById("opw"),k=i.value,m=document.getElementById("omsg");if(!k){i.focus();return}m.textContent="Checking…";
fetch("/api/recipes?check",{method:"POST",headers:{"x-owner-key":k}}).then(function(r){
if(r.ok){setOwner(k);pubMsg="";view="list";draw();pull();return}
m.textContent=r.status===503?"The owner password hasn’t been set up on the site yet.":r.status===401?"That password isn’t right. Try again.":"Couldn’t check right now. Try again in a moment."},function(){m.textContent="Couldn’t reach the site. Check your connection."})}
function ownerOut(){setOwner(null);view="list";draw()}
function ownerv(){var h=nav()+'<h1>Owner</h1>';
if(owner){var st=pubBusy?"Publishing…":pubMsg?pubMsg:pubOk?"Live on the site as of "+new Date(pubOk).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})+".":"Your recipes go live on the site automatically.";
return h+'<p>You’re logged in. Every recipe you add, edit or delete here goes live on the site for everyone.</p><p role="status"'+(pubMsg?' style="color:#b3261e"':' class="mute"')+'>'+esc(st)+'</p><p><button class="btn" onclick="publish()">Publish now</button></p><p><button class="ghost" onclick="ownerOut()">Log out on this device</button></p>'}
return h+'<p>Log in to add and edit recipes. Your changes go live on the site for everyone.</p><label for="opw">Owner password</label><input id="opw" type="password" autocomplete="current-password" onkeydown="if(event.key===&quot;Enter&quot;)ownerLogin()"><p><button class="btn" onclick="ownerLogin()">Log in</button></p><p id="omsg" class="mute" role="status">'+esc(pubMsg)+'</p>'}
(function(){
document.body.classList.toggle("visitor",!owner);
var nav0=nav;nav=function(){return nav0().replace("<hr>",'<button role="menuitem" onclick="tm(0);go(&quot;owner&quot;)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'+(owner?"Owner (logged in)":"Owner login")+'</button><hr>')};
var draw0=draw;draw=function(){if(view==="owner"){document.getElementById("app").innerHTML=ownerv();lastDraw="owner";window.scrollTo(0,0);return}draw0()};
var save1=save;save=function(){save1();schedulePub()};
var apply0=apply;apply=function(m){apply0(m);schedulePub()};
if((view==="new"||view==="edit")&&!owner)view="list";
draw();pull();
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")pull()});
})();
