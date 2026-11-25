import api from './axios';
// Authenticated SSE; no JWT in URL. Periodic reconnect also resynchronizes snapshots.
export function subscribeAuction(id,token,onRefresh,onConnection){
 const controller=new AbortController();let timer;
 const run=async()=>{
  try{
   const response=await fetch(`${api.defaults.baseURL}/auctions/${id}/live`,{headers:{Authorization:`Bearer ${token}`},signal:controller.signal});
   if(!response.ok||!response.body)throw new Error('Stream unavailable');
   onConnection(true);const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
   while(!controller.signal.aborted){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let end;while((end=buffer.indexOf('\n\n'))>=0){const message=buffer.slice(0,end);buffer=buffer.slice(end+2);if(message.includes('data: refresh'))onRefresh();}}
  }catch{if(controller.signal.aborted)return;}finally{if(!controller.signal.aborted){onConnection(false);timer=setTimeout(run,1000);}}
 };
 run();return()=>{controller.abort();clearTimeout(timer);};
}
