export async function mountAdmin({content,api,esc,label,arrow,toast,onLogout}) {
 const d=await api('/api/admin/data');
 content.innerHTML=label('FEED7 / STUDIO CONTROL','Everything,<br><em>in one place.</em>',`${d.requests.length} requests · ${d.clients.length} clients · ${d.projects.length} projects`)+`<div class="filters admin-tabs">${['Requests','Clients','Projects','Services','Studio','FAQ'].map(t=>`<button data-tab="${t.toLowerCase()}">${t}</button>`).join('')}<button id="logout">Sign out ↗</button></div><div id="admin-table"></div>`;
 const table=content.querySelector('#admin-table');
 const input=(name,title,value='',type='text')=>`<label>${title}<input name="${name}" type="${type}" value="${esc(value)}" required maxlength="200"></label>`;
 const area=(name,title,value='',max=5000)=>`<label>${title}<textarea name="${name}" rows="4" maxlength="${max}" required>${esc(value)}</textarea></label>`;
 const select=(name,title,values,value)=>`<label>${title}<select name="${name}">${values.map(v=>`<option ${v===value?'selected':''}>${esc(v)}</option>`).join('')}</select></label>`;
 const submit=title=>`<p class="form-error" role="alert"></p><button class="button primary">${title} ${arrow}</button>`;
 const safe=handler=>async e=>{e.preventDefault();const f=e.currentTarget,b=f.querySelector('[type=submit],button:not([type=button])');if(b)b.disabled=true;try{await handler(Object.fromEntries(new FormData(f)),f);}catch(err){f.querySelector('.form-error').textContent=err.message;}finally{if(b)b.disabled=false;}};
 async function refresh(tab){await mountAdmin({content,api,esc,label,arrow,toast,onLogout});content.querySelector(`[data-tab="${tab}"]`).click();}
 async function saveContent(key,value){await api('/api/admin/content/'+key,{method:'PUT',body:JSON.stringify({value})});toast('Content saved. Reload the studio to see it.');}
 function render(tab){content.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('selected',b.dataset.tab===tab));
  if(tab==='requests'){
   table.innerHTML=d.requests.length?d.requests.map(r=>`<details class="admin-request"><summary><span>${esc(r.reference)}<small>${esc(r.name)} / ${esc(r.serviceTitle)}</small></span><span class="status-badge">${esc(r.status)}</span></summary><p><a href="mailto:${esc(r.email)}">${esc(r.email)}</a> · ${esc(r.phone||'No phone')} · ${esc(r.company||'Independent')}</p><p class="preserve">${esc(r.message)}</p><form data-update="${r.id}">${select('status','Request status',['New','Reviewing','In discussion','In progress','Completed','Closed'],r.status)}<label>Update for the client portal<textarea name="update" maxlength="2000" placeholder="Optional client-visible update"></textarea></label>${submit('Save update')}</form></details>`).join(''):'<div class="success-card"><h3>A fresh start.</h3><p>New project briefs will appear in this inbox.</p></div>';
   table.querySelectorAll('form').forEach(f=>f.onsubmit=safe(async data=>{await api('/api/admin/requests/'+f.dataset.update,{method:'PATCH',body:JSON.stringify(data)});toast('Request and client portal updated.');await refresh(tab);}));return;
  }
  if(tab==='clients'||tab==='projects'){
   const client=tab==='clients';
   const fields=r=>input('name',client?'Client name':'Project title',r?.name)+(client?input('email','Email',r?.email,'email')+`<label>Company<input name="company" value="${esc(r?.company||'')}" maxlength="150"></label>`:area('description','Project description',r?.description||'')+(r?select('status','Project status',['Planning','In progress','Review','Completed','Archived'],r.status):`<label>Client<select name="clientId"><option value="">No client yet</option>${d.clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label>`));
   table.innerHTML=`<details class="admin-request"><summary><h3>+ Add ${client?'client':'project'}</h3></summary><form id="add-record">${fields()}${submit('Create')}</form></details>`+d[tab].map(r=>`<details class="admin-request"><summary><span>${esc(r.name)}<small>${esc(r.email||r.status)}</small></span><span>↗</span></summary><form data-edit="${r.id}">${fields(r)}${submit('Save changes')}</form></details>`).join('');
   table.querySelector('#add-record').onsubmit=safe(async data=>{await api('/api/admin/'+tab,{method:'POST',body:JSON.stringify(data)});toast('Record created.');await refresh(tab);});
   table.querySelectorAll('[data-edit]').forEach(f=>f.onsubmit=safe(async data=>{await api('/api/admin/'+tab+'/'+f.dataset.edit,{method:'PATCH',body:JSON.stringify(data)});toast('Changes saved.');await refresh(tab);}));return;
  }
  if(tab==='services'){
   table.innerHTML='<p class="muted">Edit the service directory used by search, project requests, and the studio. One capability per line.</p>'+d.services.map((s,i)=>`<details class="admin-request"><summary><span>${esc(s.title)}<small>${esc(s.category)}</small></span><span>↗</span></summary><form data-service="${i}">${input('title','Service title',s.title)}${select('category','Category',['Creative','Technology','Growth','Support'],s.category)}${input('short','Short introduction',s.short)}${area('description','Description',s.description)}${area('items','Capabilities / one per line',s.items.join('\n'))}${submit('Save service')}</form></details>`).join('');
   table.querySelectorAll('[data-service]').forEach(f=>f.onsubmit=safe(async data=>{const i=Number(f.dataset.service),next=structuredClone(d.services);next[i]={...next[i],...data,items:data.items.split('\n').map(x=>x.trim()).filter(Boolean)};await saveContent('services',next);d.services=next;}));return;
  }
  if(tab==='studio'){
   table.innerHTML='<p class="muted">Edit each camera chapter’s editorial layer. Put headline line breaks where the text should wrap. Architecture and camera positions are authored in the studio scene.</p>'+d.chapters.map((c,i)=>`<details class="admin-request"><summary><span>0${i+1} / ${esc(c.label)}</span><span>↗</span></summary><form data-scene="${i}">${input('label','Chapter label',c.label)}${input('eyebrow','Eyebrow',c.eyebrow)}${area('title','Headline',c.title,200)}${area('body','Introduction',c.body,1000)}${input('action','Button label',c.action)}${input('tag','Scene tag',c.tag)}${submit('Save chapter')}</form></details>`).join('');
   table.querySelectorAll('[data-scene]').forEach(f=>f.onsubmit=safe(async data=>{const i=Number(f.dataset.scene),next=structuredClone(d.chapters);next[i]={...next[i],...data};await saveContent('chapters',next);d.chapters=next;}));return;
  }
  if(tab==='faq'){
   table.innerHTML='<p class="muted">Keep answers clear and consistent with the current services.</p>'+d.faqs.map(([q,a],i)=>`<details class="admin-request"><summary><span>${esc(q)}</span><span>↗</span></summary><form data-faq="${i}">${input('question','Question',q)}${area('answer','Answer',a)}${submit('Save answer')}</form></details>`).join('');
   table.querySelectorAll('[data-faq]').forEach(f=>f.onsubmit=safe(async data=>{const i=Number(f.dataset.faq),next=structuredClone(d.faqs);next[i]=[data.question,data.answer];await saveContent('faqs',next);d.faqs=next;}));
  }
 }
 content.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>render(b.dataset.tab));content.querySelector('#logout').onclick=onLogout;render('requests');
}
