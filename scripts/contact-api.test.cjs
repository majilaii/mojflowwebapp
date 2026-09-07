const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('src/app/api/contact/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function handler(providerResult={data:{id:'test-only'},error:null},key='test-only') {
  const deliveries=[];
  const context={exports:{},process:{env:{RESEND_API_KEY:key}},console:{error(){}},require(name){
    if(name==='next/server')return {NextResponse:{json:(body,options={})=>({status:options.status||200,body})}};
    if(name==='resend')return {Resend:class{emails={send:async data=>{deliveries.push(data);return providerResult;}}}};
    throw new Error('Unexpected dependency: '+name);
  }};
  vm.runInNewContext(code,context);
  return {post:context.exports.POST,deliveries};
}
const valid={name:'Test',email:'test@example.com',message:'Synthetic inquiry',topic:'ai',company:'Example',source:'/ai-pilot',website:''};
test('invalid inputs cannot reach the email provider',async()=>{
  const h=handler();
  for(const data of [null,[],{}, {...valid,website:'bot'}, {...valid,email:'bad'}, {...valid,message:' '}, {...valid,name:'a'.repeat(121)}, {...valid,message:'a'.repeat(6001)}, {...valid,source:'/kontakt?email=private'}, {...valid,position:'unknown'}, {...valid,position:42}]) {
    assert.equal((await h.post({json:async()=>data})).status,400);
  }
  assert.equal((await h.post({json:async()=>{throw Error('invalid')}})).status,400);
  assert.equal(h.deliveries.length,0);
});
test('successful inquiry uses correct recipient, reply-to and source',async()=>{
  const h=handler();const r=await h.post({json:async()=>valid});
  assert.equal(r.status,200);assert.equal(r.body.ok,true);
  assert.equal(h.deliveries.length,1);assert.equal(h.deliveries[0].to,'contact@mojflow.com');
  assert.equal(h.deliveries[0].replyTo,valid.email);assert.match(h.deliveries[0].text,/Page: \/ai-pilot/);
});
test('application keeps selected position in delivered message',async()=>{
  const h=handler();await h.post({json:async()=>({...valid,position:'j3'})});
  assert.match(h.deliveries[0].subject,/AI Engineer/);assert.match(h.deliveries[0].text,/Position: AI Engineer/);
});
test('provider rejection never reports success',async()=>{
  const h=handler({error:{name:'validation_error'}});const r=await h.post({json:async()=>valid});
  assert.equal(r.status,502);assert.notEqual(r.body.ok,true);
});
test('missing configuration cannot send email',async()=>{
  const h=handler(undefined,'');const r=await h.post({json:async()=>valid});
  assert.equal(r.status,500);assert.equal(h.deliveries.length,0);
});
