(() => {
  const form=document.getElementById('demo-form');
  if(!form) return;
  const records=new Map();
  const output=document.getElementById('demo-output');
  const approve=document.getElementById('demo-approve');
  const exportButton=document.getElementById('demo-export');
  const presets={complete:['DEMO-101','Primer prodavnice','Chatbot za katalog i status porudžbine','120'],missing:['DEMO-102','Primer servisa','Zakazivanje termina',''],duplicate:['DEMO-101','Primer prodavnice','Chatbot za katalog i status porudžbine','120']};
  let draft=null;
  document.querySelectorAll('[data-demo-preset]').forEach(button=>button.addEventListener('click',()=>{
    const data=presets[button.dataset.demoPreset];
    ['reference','company','need','volume'].forEach((name,i)=>form.elements[name].value=data[i]);
    draft=null;approve.disabled=true;output.textContent='Primer je učitan. Pokrenite proveru.';
  }));
  form.addEventListener('input',()=>{draft=null;approve.disabled=true;output.textContent='Ulaz je promenjen. Ponovo proverite upit.';});
  form.addEventListener('submit',e=>{
    e.preventDefault();draft=null;approve.disabled=true;
    const data=Object.fromEntries(new FormData(form));
    if(records.has(data.reference.trim().toLowerCase())){output.textContent='Duplikat: ovaj upit već postoji. Novi CRM zapis nije napravljen.';return;}
    if(!data.volume.trim()){output.textContent='Potrebna dopuna: koliko upita obrađujete mesečno? Priprema se pitanje za kupca, bez upisa u CRM.';return;}
    draft={reference:data.reference.trim(),company:data.company.trim(),need:data.need.trim(),volume:Number(data.volume),status:'Za razgovor',task:'Proveriti integracije i dogovoriti obim pilota'};
    output.textContent=`NACRT CRM ZAPISA\nFirma: ${draft.company}\nPotreba: ${draft.need}\nUpita mesečno: ${draft.volume}\nZadatak: ${draft.task}\n\nČeka vaše odobrenje. Još ništa nije upisano.`;
    approve.disabled=false;
  });
  approve.addEventListener('click',()=>{
    if(!draft)return;
    records.set(draft.reference.toLowerCase(),draft);
    const list=document.getElementById('demo-records');
    const item=document.createElement('li');
    item.textContent=`${draft.reference} · ${draft.company} · ${draft.status}: ${draft.task}`;
    list.append(item);
    output.textContent='Potvrđeno: jedan CRM zapis i zadatak dodati su u ovu demo sesiju. Sada možete ponovo poslati isti upit da proverite zaštitu od duplikata.';
    draft=null;approve.disabled=true;exportButton.disabled=false;
    window.mfTrack?.('demo_complete');
  });
  exportButton.addEventListener('click',()=>{
    const cell=value=>'"'+String(value).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
    const csv='\uFEFF'+[['Referenca','Firma','Potreba','Mesečni obim','Status','Zadatak'],...[...records.values()].map(r=>[r.reference,r.company,r.need,r.volume,r.status,r.task])].map(row=>row.map(cell).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='mojflow-demo-crm.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
})();
