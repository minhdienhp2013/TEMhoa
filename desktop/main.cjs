const {app,BrowserWindow,dialog,session}=require('electron');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
let server,win,origin;
const packagedRoot=()=>app.isPackaged?path.join(process.resourcesPath,'app'):path.resolve(__dirname,'..');
function stopServer(){if(server&&!server.killed){spawn('taskkill',['/pid',String(server.pid),'/T','/F'],{windowsHide:true});server=undefined}}
function startServer(root,env){return new Promise((resolve,reject)=>{
 const ps=path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
 server=spawn(ps,['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'Mo-TemHoa-Windows.ps1')],{windowsHide:true,env:{...process.env,...env}});
 let output='',errors='',settled=false;
 const timer=setTimeout(()=>{settled=true;stopServer();reject(new Error('Dịch vụ TEMhoa khởi động quá thời gian. '+errors.slice(-1500)))},30000);
 server.stdout.on('data',chunk=>{output+=chunk.toString();const match=output.match(/Tem Hoa: (http:\/\/127\.0\.0\.1:\d+\/)/);if(match&&!settled){settled=true;clearTimeout(timer);resolve(match[1])}});
 server.stderr.on('data',chunk=>{errors+=chunk.toString()});
 server.on('error',error=>{if(!settled){settled=true;clearTimeout(timer);reject(error)}});
 server.on('exit',code=>{if(!settled){settled=true;clearTimeout(timer);reject(new Error('Không mở được dịch vụ TEMhoa ('+code+'). '+errors.slice(-1500)))}else if(win&&!app.isQuitting){dialog.showErrorBox('TEMhoa','Dịch vụ đã dừng. Vui lòng mở lại phần mềm.');app.quit()}});
})}
if(!app.requestSingleInstanceLock())app.quit();
else{
 app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus()}});
 app.whenReady().then(async()=>{
  const root=packagedRoot(),templates=path.join(app.getPath('userData'),'Mau-Tem-Hoa');
  fs.mkdirSync(templates,{recursive:true});
  const seeds=path.join(root,'Mau-Tem-Hoa');
  if(fs.existsSync(seeds))for(const name of fs.readdirSync(seeds)){if(name.endsWith('.json')&&!fs.existsSync(path.join(templates,name)))fs.copyFileSync(path.join(seeds,name),path.join(templates,name))}
  const resources=app.isPackaged?process.resourcesPath:path.resolve(root);
  const ai=app.isPackaged?path.join(resources,'ai','temhoa-ai.exe'):path.join(root,'build-ai','temhoa-ai','temhoa-ai.exe');
  const models=app.isPackaged?path.join(resources,'models'):path.join(root,'build-models');
  const url=await startServer(root,{TEMHOA_DESKTOP:'1',TEMHOA_TEMPLATE_ROOT:templates,TEMHOA_AI_EXE:ai,U2NET_HOME:models});origin=new URL(url).origin;
  const trusted=url=>{try{return new URL(url).origin===origin}catch{return false}};
  session.defaultSession.setPermissionCheckHandler((contents,permission,requestingOrigin)=>permission==='local-fonts'&&trusted(requestingOrigin)&&contents?.id===win?.webContents.id);
  session.defaultSession.setPermissionRequestHandler((contents,permission,callback,details)=>callback(permission==='local-fonts'&&contents.id===win?.webContents.id&&trusted(details.requestingUrl||contents.getURL())));
  win=new BrowserWindow({width:1440,height:960,minWidth:1000,minHeight:650,title:'TEMhoa',show:false,autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(event,url)=>{if(!trusted(url))event.preventDefault()});
  win.once('ready-to-show',()=>win.show());
  await win.loadURL(url);
  try{const css=fs.readFileSync(path.join(root,'professional-ui.css'),'utf8');await win.webContents.insertCSS(css)}catch(error){console.warn('TEMhoa UI:',error.message)}
 }).catch(error=>{dialog.showErrorBox('Không mở được TEMhoa',error.message);app.quit()});
 app.on('window-all-closed',()=>app.quit());
 app.on('before-quit',()=>{app.isQuitting=true;stopServer()});
}
