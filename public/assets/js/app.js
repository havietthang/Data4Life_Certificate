
const App = (function(){
  const LS = {
    users: 'users', diplomas: 'diplomas', issuerQueue: 'issuerQueue', otps:'otps',
    digitized:'digitized', attempts:'attempts', user:'currentUser'
  };
  const defaults = {
    users: [
      { username: "havietthang", fullName: "Hà Việt Thắng" },
      { username: "nguyenvana", fullName: "Nguyễn Văn A" }
    ],
    diplomas: [
diplomas: [
  { id: "GK-2025-001", ownerUsername: "havietthang", title: "Giấy khen Sinh viên Xuất sắc", type: "Giấy khen", name: "Hà Việt Thắng", code: "GK-2025-001", date: "20/10/2025", issuer: "ĐH FPT Cần Thơ", status: "valid", isLegacy:false, img: "assets/img/gk.jpg" },
  { id: "CC-2024-042", ownerUsername: "havietthang", title: "Chứng chỉ IELTS 8.0", type: "Chứng chỉ", name: "Hà Việt Thắng", code: "CC-2024-042", date: "20/04/2023", issuer: "IDP Vietnam", status: "valid", isLegacy:false, img: "assets/img/cc-ielts.jpg" },
  { id: "VB-2023-THPT", ownerUsername: "havietthang", title: "Bằng tốt nghiệp THPT", type: "Văn bằng", name: "Hà Việt Thắng", code: "VB-2023-THPT", date: "15/07/2023", issuer: "Sở GD&ĐT Cần Thơ", status: "valid", isLegacy:false, img: "assets/img/vb-thpt.webp" }
]
  };
  async function tryGet(path){ try{ const r=await fetch(path); if(!r.ok) throw 0; return await r.json(); }catch{return null;} }
  async function loadUsers(){
    const c=localStorage.getItem(LS.users);
    if(c) return JSON.parse(c);
    const remote=await tryGet('data/users.json');
    const data=remote?.users||defaults.users;
    localStorage.setItem(LS.users, JSON.stringify(data));
    return data;
  }
  async function loadDiplomas(){
      const raw = localStorage.getItem(LS.diplomas);
      // Always reset to our bundled defaults for this demo
      const defaultsObj = defaults.diplomas || [];
      localStorage.setItem(LS.diplomas, JSON.stringify(defaultsObj));
      return defaultsObj;
    }
  const saveDiplomas=list=>localStorage.setItem(LS.diplomas, JSON.stringify(list));
  const getUser=()=>{ const r=localStorage.getItem(LS.user); return r?JSON.parse(r):null; };
  const setUser=u=>{ if(u) localStorage.setItem(LS.user, JSON.stringify(u)); else localStorage.removeItem(LS.user); };
  const findUser=(u,arr)=>arr.find(x=>x.username===u);
  const genId=(p='X')=>`${p}${Date.now().toString().slice(-6)}${Math.floor(Math.random()*900+100)}`;
  function statusLabel(s){
    const m={ valid:{text:'Hợp lệ',cls:'badge-valid'}, revoked:{text:'Thu hồi',cls:'badge-revoked'}, expired:{text:'Hết hiệu lực',cls:'badge-expired'}, replaced:{text:'Đã thay thế',cls:'badge-replaced'}, pending:{text:'Chờ phê duyệt',cls:'badge-expired'} };
    return m[s]||{text:s,cls:''};
  }
  const qs=s=>document.querySelector(s);
  const qsa=s=>Array.from(document.querySelectorAll(s));
  const params=()=>{ const p=new URLSearchParams(location.search); const o={}; for(const [k,v] of p.entries()) o[k]=v; return o; };
  const toast=msg=>alert(msg);
  function createOTP(id){ const code=Math.floor(100000+Math.random()*900000).toString(); const exp=Date.now()+5*60*1000; const otps=JSON.parse(localStorage.getItem(LS.otps)||'[]'); otps.push({code,diplomaId:id,exp}); localStorage.setItem(LS.otps, JSON.stringify(otps)); return {code,exp}; }
  function getOTP(code,id){ const otps=JSON.parse(localStorage.getItem(LS.otps)||'[]'); return otps.find(o=>o.code===code&&o.diplomaId===id); }
  const isOTPValid=r=>r && Date.now()<=r.exp;
  function allowAttempt(scope='lookup', limit=6, windowMs=5*60*1000){ const now=Date.now(); const raw=JSON.parse(localStorage.getItem(LS.attempts)||'{}'); const arr=(raw[scope]||[]).filter(ts=>now-ts<windowMs); if(arr.length>=limit)return false; arr.push(now); raw[scope]=arr; localStorage.setItem(LS.attempts, JSON.stringify(raw)); return true; }
  const getIssuerQueue=()=>JSON.parse(localStorage.getItem(LS.issuerQueue)||'[]');
  const saveIssuerQueue=l=>localStorage.setItem(LS.issuerQueue, JSON.stringify(l));
  const getDigitized=()=>JSON.parse(localStorage.getItem(LS.digitized)||'[]');
  const saveDigitized=l=>localStorage.setItem(LS.digitized, JSON.stringify(l));
  return { loadUsers, loadDiplomas, saveDiplomas, getUser, setUser, findUser, genId, statusLabel, qs, qsa, params, toast,
    createOTP, getOTP, isOTPValid, allowAttempt, getIssuerQueue, saveIssuerQueue, getDigitized, saveDigitized };
})();

async function initCitizen(){
  const users = await App.loadUsers();
  await App.loadDiplomas();
  const state=App.qs('#login-state'), login=App.qs('#login-username'), list=App.qs('#my-diplomas');
  App.qs('#btn-login')?.addEventListener('click', ()=>{
    const u=App.findUser(login.value.trim(), users);
    if(!u) return App.toast('Không tìm thấy người dùng');
    App.setUser(u); state.textContent=`Đang đăng nhập: ${u.fullName} (${u.username})`; render();
  });
  App.qs('#btn-logout')?.addEventListener('click', ()=>{ App.setUser(null); state.textContent='Chưa đăng nhập'; list.innerHTML=''; });
  function render(){
    const u=App.getUser(); if(!u){ list.innerHTML=''; return; }
    const diplomas=(JSON.parse(localStorage.getItem('diplomas'))||[]).filter(d=>d.ownerUsername===u.username);
    if(diplomas.length===0){ list.innerHTML='<p class="text-muted small">Chưa có văn bằng.</p>'; return; }
    list.innerHTML = diplomas.map(d=>{
      const st=App.statusLabel(d.status);
      return `<div class="card-min mb-2">
        <div class="d-flex justify-content-between flex-wrap gap-2">
          <div class="d-flex" style="gap:12px;align-items:flex-start">
            ${d.img?`<img src="${d.img}" alt="" style="width:96px;height:64px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb">`:''}
            <div>
          <div>
            <div><strong>${d.title}</strong> · <span class="badge-state ${st.cls}">${st.text}</span></div>
            <div class="text-muted small">Mã seri: <span class="kbd">${d.id}</span> · Ngày cấp: ${d.date} · Đơn vị: ${d.issuer}${d.isLegacy?' · <span class="badge badge-light">Hồ sơ cũ</span>':''}</div>
            <div class="text-muted small">${d.type} — ${d.name}</div>
          </div>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-default btn-sm" data-act="view" data-id="${d.id}"><i class="fa fa-file-pdf-o"></i> Xem</button>
            <button class="btn btn-success btn-sm" data-act="share" data-id="${d.id}"><i class="fa fa-share-alt"></i> Chia sẻ</button>
            <button class="btn btn-warning btn-sm" data-act="report" data-id="${d.id}"><i class="fa fa-flag"></i> Báo sai</button>
          </div>
        </div>
      </div>`;
    }).join('');
    App.qsa('[data-act]').forEach(b=>b.addEventListener('click', handle));
  }
  function handle(e){
    const id=e.currentTarget.getAttribute('data-id');
    const act=e.currentTarget.getAttribute('data-act');
    const d=(JSON.parse(localStorage.getItem('diplomas'))||[]).find(x=>x.id===id);
    if(!d) return;
    if(act==='view'){ App.toast(`Bản điện tử mô phỏng: ${d.title} • ký số bởi ${d.issuer}`); }
    else if(act==='share'){
      const modal=document.querySelector('#modal-share');
      const info=document.querySelector('#share-info');
      const out=document.querySelector('#share-result');
      info.innerHTML=`<p>Chia sẻ <strong>${d.title}</strong> · Mã <span class="kbd">${d.id}</span></p>`;
      out.innerHTML='';
      modal.style.display='block'; modal.classList.add('show');
      document.querySelector('#btn-create-otp').onclick=()=>{
        const {code}=App.createOTP(d.id);
        const base=location.origin + location.pathname.replace('citizen.html','');
        const link = `${base}lookup.html?id=${encodeURIComponent(d.id)}&otp=${code}`;
        out.innerHTML=`<div class="alert alert-info mt-2">OTP: <b>${code}</b> (5 phút) · Link: <a target="_blank" href="${link}">${link}</a></div>`;
      };
      document.querySelector('#btn-close-share').onclick=()=>{ modal.classList.remove('show'); modal.style.display='none'; };
    }
    else if(act==='report'){ App.toast('Đã ghi nhận khiếu nại (mô phỏng).'); }
  }
  render();
}

async function initLookup(){
  await App.loadDiplomas();
  const p=App.params(), input=App.qs('#lookup-id'), out=App.qs('#lookup-result');
  App.qs('#btn-lookup')?.addEventListener('click', doLookup);
  App.qs('#btn-clear')?.addEventListener('click', ()=>{ input.value=''; out.innerHTML=''; });
  if(p.id){ input.value=p.id; doLookup(); }
  function doLookup(){
    if(!App.allowAttempt('lookup',6,5*60*1000)){ out.innerHTML='<p class="text-muted">Bạn đã thử quá nhiều lần. Thử lại sau.</p>'; return; }
    const id=input.value.trim();
    const d=(JSON.parse(localStorage.getItem('diplomas'))||[]).find(x=>x.id===id);
    if(!d){ out.innerHTML='<div class="alert alert-warning">Không tìm thấy văn bằng.</div>'; return; }
    const st=App.statusLabel(d.status);
    const allow = p.otp && App.isOTPValid(App.getOTP(p.otp,id));
    out.innerHTML=`<div class="card-min">
      <div><strong>Kết quả:</strong> <span class="badge-state ${st.cls}">${st.text}</span></div>
      <div class="text-muted small">Mã seri: <span class="kbd">${d.id}</span> · Đơn vị: ${d.issuer} · Ngày cấp: ${d.date}</div>
      ${d.status==='revoked'?`<div class="small"><b>Lý do thu hồi:</b> ${d.revocationReason||'—'}</div>`:''}
      ${allow?`<hr><div><strong>Chi tiết (được chủ văn bằng cấp phép):</strong></div><div>Họ tên: ${d.name}</div><div>Loại văn bằng: ${d.title}</div>`:`<hr><div class="small text-muted">Cần OTP/link tạm thời để xem chi tiết.</div>`}
    </div>`;
  }
}

async function initIssuer(){
  await App.loadDiplomas();
  const users=await App.loadUsers();
  const list=App.qs('#issuer-list');
  App.qs('#btn-create')?.addEventListener('click', ()=>{
    const name=App.qs('#iss-name').value.trim();
    const title=App.qs('#iss-title').value.trim();
    const issuer=App.qs('#iss-issuer').value.trim();
    const date=App.qs('#iss-date').value;
    const owner=App.qs('#iss-owner').value.trim();
    if(!name||!title||!issuer||!date||!owner) return App.toast('Điền đủ thông tin');
    if(!users.find(u=>u.username===owner)) return App.toast('Tài khoản người nhận không tồn tại');
    const id=App.genId('N');
    const q=App.getIssuerQueue(); q.push({ id, ownerUsername:owner, name, title, date, issuer, status:'pending' });
    App.saveIssuerQueue(q); render(); App.toast('Đã tạo hồ sơ phát hành. Chờ phê duyệt.');
  });
  function render(){
    const q=App.getIssuerQueue();
    if(q.length===0){ list.innerHTML='<p class="text-muted small">Chưa có hồ sơ nào.</p>'; return; }
    list.innerHTML=q.map(d=>{
      const st=App.statusLabel(d.status);
      return `<div class="card-min mb-2">
        <div><strong>${d.title}</strong> · <span class="badge-state ${st.cls}">${st.text}</span></div>
        <div class="text-muted small">Mã tạm: <span class="kbd">${d.id}</span> · ${d.date} · ${d.issuer}</div>
        <div class="text-muted small">Chủ sở hữu: ${d.name} (${d.ownerUsername})</div>
      </div>`;
    }).join('');
  }
  render();
}

async function initGov(){
  await App.loadDiplomas();
  const listPending=App.qs('#gov-pending'), listRevoked=App.qs('#gov-revoked');
  function render(){
    const q=App.getIssuerQueue();
    listPending.innerHTML=q.length===0?'<p class="text-muted small">Không có hồ sơ chờ.</p>':
      q.map(d=>`<div class="card-min mb-2">
        <div class="d-flex justify-content-between flex-wrap gap-2">
          <div class="d-flex" style="gap:12px;align-items:flex-start">
            ${d.img?`<img src="${d.img}" alt="" style="width:96px;height:64px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb">`:''}
            <div>
          <div>
            <div><strong>${d.title}</strong> · <span class="badge-state badge-expired">Chờ phê duyệt</span></div>
            <div class="text-muted small">Mã tạm: <span class="kbd">${d.id}</span> · ${d.date} · ${d.issuer}</div>
            <div class="text-muted small">Chủ sở hữu: ${d.name} (${d.ownerUsername})</div>
            <div class="text-muted small">${d.type} — ${d.name}</div>
          </div>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-success btn-sm" data-act="approve" data-id="${d.id}"><i class="fa fa-check"></i> Phê duyệt</button>
            <button class="btn btn-danger btn-sm" data-act="reject" data-id="${d.id}"><i class="fa fa-times"></i> Từ chối</button>
          </div>
        </div>
      </div>`).join('');
    const all=JSON.parse(localStorage.getItem('diplomas'))||[];
    const revoked=all.filter(x=>x.status==='revoked');
    listRevoked.innerHTML = revoked.length===0?'<p class="text-muted small">Chưa có bản ghi thu hồi.</p>':
      `<div class="table-responsive"><table class="table table-bordered">
        <thead class="thead-light"><tr><th>Mã seri</th><th>Trạng thái</th><th>Ngày hiệu lực</th><th>Lý do</th></tr></thead>
        <tbody>${revoked.map(r=>`<tr><td>${r.id}</td><td>Thu hồi</td><td>${r.revokedAt||'—'}</td><td>${r.revocationReason||'—'}</td></tr>`).join('')}</tbody>
      </table></div>`;
    App.qsa('[data-act]').forEach(b=>b.addEventListener('click', handle));
  }
  function handle(e){
    const id=e.currentTarget.getAttribute('data-id');
    const act=e.currentTarget.getAttribute('data-act');
    let q=App.getIssuerQueue();
    if(act==='approve'){
      const i=q.findIndex(x=>x.id===id);
      if(i>-1){
        const item=q.splice(i,1)[0];
        const all=JSON.parse(localStorage.getItem('diplomas'))||[];
        all.push({ id:item.id, ownerUsername:item.ownerUsername, name:item.name, title:item.title, date:item.date, issuer:item.issuer, status:'valid', isLegacy:false });
        localStorage.setItem('diplomas', JSON.stringify(all));
        App.saveIssuerQueue(q); App.toast('Đã phê duyệt'); render();
      }
    }else if(act==='reject'){
      q=q.filter(x=>x.id!==id); App.saveIssuerQueue(q); App.toast('Đã từ chối'); render();
    }
  }
  document.addEventListener('keydown', (ev)=>{
    if(ev.key==='r' && ev.altKey){
      const id=prompt('Nhập mã seri cần thu hồi:');
      if(!id) return;
      const reason=prompt('Lý do thu hồi:');
      const all=JSON.parse(localStorage.getItem('diplomas'))||[];
      const idx=all.findIndex(x=>x.id===id);
      if(idx<0) return App.toast('Không tìm thấy');
      all[idx].status='revoked'; all[idx].revocationReason=reason||''; all[idx].revokedAt=new Date().toISOString().slice(0,10);
      localStorage.setItem('diplomas', JSON.stringify(all));
      App.toast('Đã thu hồi. Đã cập nhật sổ thu hồi.');
      render();
    }
  });
  render();
}

async function initDigitize(){
  const list=App.qs('#dig-list');
  App.qs('#btn-digitize')?.addEventListener('click', ()=>{
    const name=App.qs('#dig-name').value.trim();
    const title=App.qs('#dig-title').value.trim();
    const issuer=App.qs('#dig-issuer').value.trim();
    const date=App.qs('#dig-date').value;
    const ok=App.qs('#dig-commit').checked;
    if(!name||!title||!issuer||!date||!ok) return App.toast('Vui lòng điền đủ thông tin & xác nhận');
    const id=App.genId('L');
    const recs=App.getDigitized(); recs.push({ id, name, title, issuer, date, status:'verifying' });
    App.saveDigitized(recs); render(); App.toast('Đã gửi số hoá. Trạng thái: Đang đối soát.');
  });
  function render(){
    const recs=App.getDigitized();
    if(recs.length===0){ list.innerHTML='<p class="text-muted small">Chưa có hồ sơ số hoá.</p>'; return; }
    list.innerHTML=recs.map(r=>`
      <div class="card-min mb-2">
        <div><strong>${r.title}</strong> · <span class="badge badge-light">${r.status==='verifying'?'Đang đối soát':'Đã xác thực'}</span></div>
        <div class="text-muted small">Mã tạm: <span class="kbd">${r.id}</span> · ${r.date} · ${r.issuer} · ${r.name}</div>
        ${r.status==='verifying'?`<div class="mt-1"><button class="btn btn-success btn-sm" data-act="verify" data-id="${r.id}"><i class="fa fa-check-circle"></i> Đánh dấu ĐÃ XÁC THỰC</button></div>`:''}
      </div>
    `).join('');
    App.qsa('[data-act="verify"]').forEach(b=>b.addEventListener('click', e=>{
      const id=e.currentTarget.getAttribute('data-id');
      const recs=App.getDigitized().map(x=>x.id===id?{...x,status:'verified'}:x);
      App.saveDigitized(recs); render();
    }));
  }
  render();
}

document.addEventListener('DOMContentLoaded', ()=>{
  const p=location.pathname;
  if(p.endsWith('citizen.html')) initCitizen();
  else if(p.endsWith('lookup.html')) initLookup();
  else if(p.endsWith('issuer.html')) initIssuer();
  else if(p.endsWith('gov.html')) initGov();
  else if(p.endsWith('digitize.html')) initDigitize();
});
