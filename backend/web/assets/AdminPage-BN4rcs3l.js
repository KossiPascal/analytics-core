import{r as i,j as e,O as K,P as we,a$ as ze,a1 as We,aV as qe,aZ as Ke,az as X,b0 as ke,b1 as ue,b2 as Y,b3 as Te,b4 as Ae,b5 as De,b6 as Qe,b7 as Ee,S as Ze,b8 as Je,b9 as Le,a0 as Ye,ba as Xe,bb as es,bc as ss,bd as ts,ah as is,be as pe,t as Pe,ak as Fe,bf as Be,K as oe,w as Oe,E as $e,af as Ge,bg as Se,aX as Me,bh as ns,aC as Ce,bi as as,J as _e,bj as Ue,as as rs,B as os,bk as Ne,T as ls,bl as cs,bm as ds,bn as ms,ag as us,A as hs,bo as ps,aW as xs,n as gs,y as fs,X as He,bp as vs,h as js,m as bs}from"./vendor-D7DVyZ4J.js";import{P as ys}from"./PageWrapper-DByvcy2O.js";import"./index-LOt97Z-T.js";import{C as ie,b as ne,B as _,a as ae}from"./Card-xrLL0nis.js";import{M as je}from"./Modal-C2QwfZa-.js";import{u as te}from"./useNotification-BHsZS5I0.js";import{b as W,O as be}from"./api.service-BQ96sf-l.js";import{c as de}from"./connection.service-fgnM1_T6.js";import{f as re,i as zs}from"./index-D2KqTHld.js";import{a as me,C as Ss}from"./Chart-BD3719yO.js";import"./PageHeader-C0jmaDHm.js";const Cs="_tabsContainer_1dm8c_2",Ns="_tabs_1dm8c_2",_s="_tab_1dm8c_2",ws="_tabActive_1dm8c_38",ks="_tabDanger_1dm8c_44",Ts="_tabIcon_1dm8c_48",As="_tabLabel_1dm8c_54",Ds="_tabContent_1dm8c_65",Es="_card_1dm8c_70",Is="_cardHeader_1dm8c_78",Rs="_cardTitle_1dm8c_87",Ls="_form_1dm8c_101",Ps="_formGroup_1dm8c_107",Fs="_formLabel_1dm8c_113",Bs="_formInput_1dm8c_119",Os="_formSelect_1dm8c_133",$s="_tableContainer_1dm8c_148",Gs="_table_1dm8c_148",Ms="_buttonGroup_1dm8c_176",Us="_btn_1dm8c_182",Hs="_btnPrimary_1dm8c_195",Vs="_btnOutline_1dm8c_218",Ws="_btnSmall_1dm8c_228",qs="_alert_1dm8c_234",Ks="_alertWarning_1dm8c_242",Qs="_alertDanger_1dm8c_248",Zs="_alertSuccess_1dm8c_254",Js="_alertInfo_1dm8c_260",Ys="_emptyState_1dm8c_267",Xs="_loading_1dm8c_283",et="_checkbox_1dm8c_291",st="_badge_1dm8c_304",tt="_badgeSuccess_1dm8c_313",it="_badgeWarning_1dm8c_318",nt="_badgeDanger_1dm8c_323",at="_grid_1dm8c_329",rt="_grid2_1dm8c_334",ot="_grid3_1dm8c_344",lt="_tokenDisplay_1dm8c_361",ct="_actionsCell_1dm8c_371",dt="_actionBtn_1dm8c_376",mt="_actionBtnDanger_1dm8c_391",s={tabsContainer:Cs,tabs:Ns,tab:_s,tabActive:ws,tabDanger:ks,tabIcon:Ts,tabLabel:As,tabContent:Ds,card:Es,cardHeader:Is,cardTitle:Rs,form:Ls,formGroup:Ps,formLabel:Fs,formInput:Bs,formSelect:Os,tableContainer:$s,table:Gs,buttonGroup:Ms,btn:Us,btnPrimary:Hs,btnOutline:Vs,btnSmall:Ws,alert:qs,alertWarning:Ks,alertDanger:Qs,alertSuccess:Zs,alertInfo:Js,emptyState:Ys,loading:Xs,checkbox:et,badge:st,badgeSuccess:tt,badgeWarning:it,badgeDanger:nt,grid:at,grid2:rt,grid3:ot,tokenDisplay:lt,actionsCell:ct,actionBtn:dt,actionBtnDanger:mt},he=30;function Ie(t=he){const b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";let o="";for(let p=0;p<t;p++)o+=b.charAt(Math.floor(Math.random()*b.length));return o}function ut(){const[t,b]=i.useState([]),[o,p]=i.useState(!0),[n,f]=i.useState(!1),[x,S]=i.useState(!1),[y,m]=i.useState(null),[z,T]=i.useState(!1),[h,A]=i.useState({token:"",isActive:!1}),[a,k]=i.useState(null),[F,H]=i.useState(!1),{showSuccess:U,showError:I}=te(),L=async()=>{p(!0);try{const u=await W.getApiTokens();u?.status===200&&b(u.data||[])}catch{I("Erreur lors du chargement des API")}finally{p(!1)}};i.useEffect(()=>{L()},[]);const w=()=>{T(!1),m(null),A({token:Ie(),isActive:!0}),f(!0)},G=u=>{T(!0),m(u),A({token:u.token,isActive:u.isActive}),f(!0)},j=u=>{m(u),S(!0)},E=async()=>{if(h.token.length!==he){I(`Le token doit contenir exactement ${he} caractères`);return}H(!0);try{const u=z?"update":"create",D=await W.manageApiToken({action:u,id:y?.id,token:h.token,isActive:h.isActive});D?.status===200?(U(z?"API mise à jour avec succès":"API créée avec succès"),f(!1),L()):I(D?.data||"Erreur lors de la sauvegarde")}catch{I("Erreur lors de la sauvegarde")}finally{H(!1)}},d=async()=>{if(y)try{(await W.manageApiToken({action:"delete",id:y.id}))?.status===200?(U("API supprimée avec succès"),S(!1),m(null),L()):I("Erreur lors de la suppression")}catch{I("Erreur lors de la suppression")}},v=(u,D)=>{navigator.clipboard.writeText(u),k(D),setTimeout(()=>k(null),2e3)};return e.jsxs(ie,{children:[e.jsx(ne,{title:e.jsxs("div",{className:s.cardTitle,children:[e.jsx(ze,{size:20}),"Gestion des API d'accès"]}),action:e.jsxs("div",{className:s.buttonGroup,children:[e.jsx(_,{variant:"ghost",size:"sm",onClick:L,disabled:o,children:e.jsx(K,{size:16,className:o?"animate-spin":""})}),e.jsxs(_,{variant:"primary",size:"sm",onClick:w,children:[e.jsx(we,{size:16}),"Nouveau"]})]})}),e.jsx(ae,{children:o?e.jsx("div",{className:s.loading,children:e.jsx(K,{size:24,className:"animate-spin"})}):t.length===0?e.jsxs("div",{className:s.emptyState,children:[e.jsx(ze,{size:48}),e.jsx("p",{children:"Aucune API configurée"}),e.jsxs(_,{variant:"primary",onClick:w,children:[e.jsx(we,{size:16}),"Créer une API"]})]}):e.jsx("div",{className:s.tableContainer,children:e.jsxs("table",{className:s.table,children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Token"}),e.jsx("th",{children:"Statut"}),e.jsx("th",{children:"Actions"})]})}),e.jsx("tbody",{children:t.map(u=>e.jsxs("tr",{children:[e.jsx("td",{children:e.jsxs("div",{className:s.tokenDisplay,children:[u.token.substring(0,8),"...",u.token.substring(u.token.length-8),e.jsx("button",{className:s.actionBtn,onClick:()=>v(u.token,u.id),title:"Copier",children:a===u.id?e.jsx(We,{size:14}):e.jsx(qe,{size:14})})]})}),e.jsx("td",{children:e.jsx("span",{className:`${s.badge} ${u.isActive?s.badgeSuccess:s.badgeDanger}`,children:u.isActive?"Actif":"Inactif"})}),e.jsx("td",{children:e.jsxs("div",{className:s.actionsCell,children:[e.jsx("button",{className:s.actionBtn,onClick:()=>G(u),title:"Modifier",children:e.jsx(Ke,{size:16})}),e.jsx("button",{className:`${s.actionBtn} ${s.actionBtnDanger}`,onClick:()=>j(u),title:"Supprimer",children:e.jsx(X,{size:16})})]})})]},u.id))})]})})}),e.jsx(je,{isOpen:n,onClose:()=>f(!1),title:z?"Modifier API":"Nouvelle API",children:e.jsxs("div",{className:s.form,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsxs("label",{className:s.formLabel,children:["Token (",h.token.length,"/",he," caractères)"]}),e.jsxs("div",{style:{display:"flex",gap:"0.5rem"},children:[e.jsx("input",{type:"text",className:s.formInput,value:h.token,onChange:u=>A({...h,token:u.target.value}),maxLength:he,style:{flex:1,fontFamily:"monospace"}}),e.jsx(_,{variant:"outline",onClick:()=>A({...h,token:Ie()}),title:"Générer un nouveau token",children:e.jsx(K,{size:16})})]})]}),e.jsx("div",{className:s.formGroup,children:e.jsxs("label",{className:s.checkbox,children:[e.jsx("input",{type:"checkbox",checked:h.isActive,onChange:u=>A({...h,isActive:u.target.checked})}),e.jsx("span",{children:"Actif"})]})}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsx(_,{variant:"outline",onClick:()=>f(!1),children:"Annuler"}),e.jsx(_,{variant:"primary",onClick:E,disabled:F,children:F?"Enregistrement...":"Enregistrer"})]})]})}),e.jsx(je,{isOpen:x,onClose:()=>S(!1),title:"Confirmer la suppression",children:e.jsxs("div",{className:s.form,children:[e.jsxs("div",{className:`${s.alert} ${s.alertDanger}`,children:[e.jsx(X,{size:20}),e.jsx("p",{children:"Êtes-vous sûr de vouloir supprimer cette API ? Cette action est irréversible."})]}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsx(_,{variant:"outline",onClick:()=>S(!1),children:"Annuler"}),e.jsxs(_,{variant:"danger",onClick:d,children:[e.jsx(X,{size:16}),"Supprimer"]})]})]})})]})}const ht=[{value:"postgres",label:"PostgreSQL"},{value:"mysql",label:"MySQL"},{value:"mariadb",label:"MariaDB"},{value:"mssql",label:"SQL Server"},{value:"oracle",label:"Oracle"},{value:"mongodb",label:"MongoDB"},{value:"couchdb",label:"CouchDB"},{value:"sqlite",label:"SQLite"},{value:"other",label:"Autre"}],fe=Object.freeze({type:"postgres",name:"",host:"",port:5432,dbname:"",username:"",password:"",ssh_enabled:!1,ssh_host:"",ssh_port:22,ssh_user:"",ssh_password:"",ssh_key:"",ssh_key_pass:""}),Re=t=>({id:t.id,type:t.type,name:t.name,dbname:t.dbname,username:t.username,password:t.password,host:t.host,port:t.port,ssh:t.ssh_enabled?{host:t.ssh_host,port:t.ssh_port,username:t.ssh_user,password:t.ssh_password,key:t.ssh_key}:null}),pt=t=>({id:t.id,type:t.type,name:t.name,dbname:t.dbname,username:t.username,password:t.password,host:t.host,port:t.port,ssh_enabled:!!t.ssh,ssh_host:t.ssh?.host,ssh_port:t.ssh?.port,ssh_user:t.ssh?.username,ssh_password:t.ssh?.password,ssh_key:t.ssh?.key,ssh_key_pass:t.ssh?.key_pass});function xt(){const[t,b]=i.useState(fe),[o,p]=i.useState(!1),[n,f]=i.useState(null),[x,S]=i.useState([]),[y,m]=i.useState(null),[z,T]=i.useState(!1),{showSuccess:h,showError:A}=te(),a=i.useMemo(()=>!t.name?.trim()||!t.host?.trim()||!t.dbname?.trim()||!t.username?.trim()||!t.type?.trim().length?(A("Veuillez renseigner tous les champs obligatoires."),!1):t.port<=0?(A("Invalid database port"),!1):t.ssh_enabled&&(!t.ssh_host||!t.ssh_user)?(A("SSH host and user required"),!1):!0,[t]),k=(j,E)=>{b(d=>({...d,[j]:E}))},F=async()=>{try{const{data:j}=await de.list();S(j)}catch{f({type:"error",msg:"Failed to load connections"})}},H=async()=>{if(a){T(!0),f(null);try{const j=Re(t);y?await de.update(y,j):await de.create(j),b(fe),m(null),F(),f({type:"success",msg:"Connection saved successfully"})}catch(j){f({type:"error",msg:j?.response?.data?.error||"Save failed"})}finally{T(!1)}}},U=j=>{m(j.id??null),b({...fe,...pt(j)}),window.scrollTo({top:0,behavior:"smooth"})},I=async j=>{window.confirm("Delete this connection?")&&(await de.delete(j),F())},L=async j=>{if(a){p(!0),f(null),h(null);try{const E=Re(t),d=await de.test(j,E);if(d?.status===200){const v=d.data?.message||"Connection réussie";f({type:"success",msg:v}),h(v)}else f({type:"error",msg:"Échec du test de connexion."})}catch(E){f({type:"error",msg:E?.response?.data?.error||"Échec du test de connexion."})}finally{p(!1)}}},w=i.memo(function({label:E,name:d,type:v="text",list:u=void 0,placeholder:D=void 0,rows:r=void 0,cols:g=void 0,required:C=!1,icon:V=null,simple:se=!1}){const N=t?.[d]??"",q=e.jsx("label",{className:s.formLabel,htmlFor:"host"+d,children:E});let ee=e.jsx(e.Fragment,{});return v==="textarea"?ee=e.jsxs(e.Fragment,{children:[q,e.jsx("textarea",{id:"host_"+d,name:d,value:N,placeholder:D,className:s.formInput,required:C,rows:r,cols:g,onChange:M=>k(d,M.target.value)})]}):v==="checkbox"?ee=e.jsxs("label",{className:s.checkbox,children:[e.jsx("input",{type:"checkbox",checked:N,onChange:M=>k(d,M.target.checked)}),e.jsx("span",{children:E})]}):v==="select"?ee=e.jsxs(e.Fragment,{children:[q,e.jsx("select",{id:"host_"+d,className:s.formSelect,value:N,onChange:M=>k(d,M.target.value),children:u&&u.map(M=>e.jsx("option",{value:M.value,children:M.label},"select_"+M.value))})]}):ee=e.jsxs(e.Fragment,{children:[q,e.jsx("input",{id:"host_"+d,name:d,type:v,value:N,placeholder:D,className:s.formInput,required:C,onChange:M=>k(d,M.target.value)})]}),se?ee:e.jsx("div",{className:s.formGroup,children:ee})}),G={margin:0,fontSize:"0.875rem"};return e.jsxs("div",{className:"page",children:[e.jsxs("h1",{className:"title",children:[e.jsx(ke,{})," PostgreSQL Connections"]}),e.jsx("div",{className:"card",children:e.jsxs(ie,{children:[e.jsx(ne,{title:e.jsxs("div",{className:s.cardTitle,children:[e.jsx(Y,{size:20}),"Connexion à une base de données"]}),action:e.jsxs("div",{className:s.buttonGroup,children:[e.jsx(_,{variant:"primary",size:"sm",onClick:()=>L("test-ssh"),disabled:o,children:o?e.jsxs(e.Fragment,{children:[e.jsx(ue,{size:16,className:"animate-spin"}),"Test SSH en cours..."]}):e.jsxs(e.Fragment,{children:[e.jsx(ue,{size:16}),"Tester le tunel ssh"]})}),e.jsx(_,{variant:"primary",size:"sm",onClick:()=>L("test-ssh-db"),disabled:o,children:o?e.jsxs(e.Fragment,{children:[e.jsx(ue,{size:16,className:"animate-spin"}),"Test en cours..."]}):e.jsxs(e.Fragment,{children:[e.jsx(ue,{size:16}),"Tester la connexion"]})})]})}),e.jsx(ae,{children:e.jsxs("div",{className:s.form,children:[e.jsxs("div",{className:s.grid+" "+s.grid2,children:[e.jsx(w,{name:"name",label:"Connexion",icon:e.jsx(ke,{}),placeholder:"Ex: Production PostgreSQL"}),e.jsx(w,{name:"dbname",label:"Nom de la base",icon:e.jsx(Y,{}),placeholder:"Ex: kendeya_prod"})]}),e.jsxs("div",{className:s.grid+" "+s.grid3,children:[e.jsx(w,{name:"type",type:"select",list:ht,label:"Type",icon:e.jsx(Y,{}),placeholder:"Ex: postgres",required:!0}),e.jsx(w,{name:"host",label:"URL / Hôte",icon:e.jsx(Te,{}),placeholder:"Ex: 10.0.0.12 ou db.example.com",required:!0}),e.jsx(w,{name:"port",type:"number",label:"Port",icon:e.jsx(Y,{}),placeholder:"Ex: 5432"})]}),e.jsxs("div",{className:s.grid+" "+s.grid3,children:[e.jsx(w,{name:"username",label:"Utilisateur",icon:e.jsx(Ae,{}),placeholder:"Ex: admin",required:!0}),e.jsx(w,{name:"password",type:"password",label:"Mot de passe",icon:e.jsx(De,{}),placeholder:"••••••••"})]}),e.jsx(w,{name:"ssh_enabled",type:"checkbox",label:"Utiliser un tunnel SSH",icon:e.jsx(Qe,{})}),t.ssh_enabled&&e.jsxs("div",{className:s.grid+" "+s.grid3,children:[e.jsx("h3",{children:"🔐 SSH Configuration"}),e.jsx(w,{name:"ssh_host",label:"Hôte SSH",icon:e.jsx(Te,{}),placeholder:"Ex: ssh.example.com",required:!0}),e.jsx(w,{name:"ssh_port",type:"number",label:"Port SSH",icon:e.jsx(Y,{}),placeholder:"Ex: 22"}),e.jsx(w,{name:"ssh_user",label:"Utilisateur SSH",icon:e.jsx(Ae,{}),placeholder:"Ex: ubuntu",required:!0}),e.jsx(w,{name:"ssh_password",type:"password",label:"Mot de passe SSH",icon:e.jsx(De,{}),placeholder:"••••••••"}),e.jsx(w,{name:"ssh_key",type:"textarea",label:"Clé privée SSH",icon:e.jsx(Ee,{}),placeholder:"Coller la clé privée ici",rows:4}),e.jsx(w,{name:"ssh_key_pass",type:"password",label:"PassPhrase Clé privée SSH",icon:e.jsx(Ee,{}),placeholder:"••••••••"})]}),n?.type==="success"&&e.jsxs("div",{className:`${s.alert} ${s.alertSuccess}`,children:[e.jsx(Ze,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"Connexion validée"}),e.jsx("p",{style:G,children:"Les paramètres semblent corrects. Vous pouvez utiliser cette connexion."})]})]}),n?.type==="error"&&e.jsxs("div",{className:`${s.alert} ${s.alertDanger}`,children:[e.jsx(Je,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"Connexion échouée"}),e.jsx("p",{style:G,children:"Vérifiez l'URL, le port, les identifiants et les paramètres SSH."})]})]}),e.jsxs("div",{className:`${s.alert} ${s.alertInfo}`,children:[e.jsx(Le,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"Conseil"}),e.jsx("p",{style:G,children:"Assurez-vous que la base est accessible depuis le serveur et que les ports sont ouverts."})]})]}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsxs(_,{variant:"outline",size:"sm",onClick:()=>b(fe),disabled:o,children:[e.jsx(Ye,{size:16}),"Réinitialiser"]}),e.jsxs(_,{isLoading:z,onClick:()=>H(),color:"success",children:[e.jsx(Xe,{}),y?"Update":"Save"]})]})]})})]})}),e.jsx("div",{className:"list",children:x.map(j=>e.jsxs("div",{className:"item",children:[e.jsxs("div",{children:[e.jsx("strong",{children:j.name}),e.jsx("br",{}),e.jsxs("small",{children:[j.host,":",j.port]})]}),e.jsxs("div",{children:[e.jsx(_,{variant:"outline",size:"sm",onClick:()=>U(j),disabled:o,children:e.jsx(es,{size:16})}),e.jsx(_,{variant:"outline",size:"sm",onClick:()=>I(j.id),disabled:o,children:e.jsx(ss,{size:16})})]})]},j.id))})]})}function gt(){const[t,b]=i.useState(null),[o,p]=i.useState({}),{showSuccess:n,showError:f,showInfo:x}=te(),S=async(m,z)=>{b(m);try{await z(),p(T=>({...T,[m]:"success"}))}catch{p(h=>({...h,[m]:"error"}))}finally{b(null)}},y=[{id:"sync-db",label:"Synchroniser la base",description:"Synchronise les données entre CouchDB et PostgreSQL",icon:e.jsx(K,{size:20}),action:async()=>{(await W.syncDatabase())?.status===200?n("Synchronisation terminée avec succès"):f("Erreur lors de la synchronisation")}},{id:"rebuild-indexes",label:"Reconstruire les index",description:"Reconstruit les index de la base de données pour améliorer les performances",icon:e.jsx(ts,{size:20}),action:async()=>{(await W.rebuildIndexes())?.status===200?n("Index reconstruits avec succès"):f("Erreur lors de la reconstruction des index")}},{id:"vacuum-db",label:"Nettoyer la base",description:"Effectue un VACUUM ANALYZE sur PostgreSQL pour optimiser l'espace",icon:e.jsx(Le,{size:20}),action:async()=>{(await W.vacuumDatabase())?.status===200?n("Nettoyage terminé avec succès"):f("Erreur lors du nettoyage")}},{id:"check-health",label:"Vérifier la santé",description:"Vérifie l'état de santé des connexions aux bases de données",icon:e.jsx(is,{size:20}),action:async()=>{const m=await W.checkDatabaseHealth();if(m?.status===200){const z=m.data;x(`État: ${z?.message||"OK"}`)}else f("Erreur lors de la vérification")}}];return e.jsxs(ie,{children:[e.jsx(ne,{title:e.jsxs("div",{className:s.cardTitle,children:[e.jsx(Y,{size:20}),"Actions sur la base de données"]})}),e.jsxs(ae,{children:[e.jsx("div",{className:`${s.grid} ${s.grid2}`,children:y.map(m=>e.jsx("div",{className:s.card,style:{marginBottom:0},children:e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"1rem"},children:[e.jsx("div",{style:{padding:"0.75rem",borderRadius:"0.5rem",backgroundColor:m.danger?"#fee2e2":"#dbeafe",color:m.danger?"#ef4444":"#3b82f6"},children:m.icon}),e.jsxs("div",{style:{flex:1},children:[e.jsx("h3",{style:{fontSize:"1rem",fontWeight:600,marginBottom:"0.25rem"},children:m.label}),e.jsx("p",{style:{fontSize:"0.875rem",color:"#64748b",marginBottom:"1rem"},children:m.description}),e.jsx(_,{variant:m.danger?"danger":"primary",size:"sm",onClick:()=>S(m.id,m.action),disabled:t!==null,children:t===m.id?e.jsxs(e.Fragment,{children:[e.jsx(K,{size:14,className:"animate-spin"}),"Exécution..."]}):"Exécuter"}),o[m.id]&&e.jsx("span",{style:{marginLeft:"0.75rem",fontSize:"0.8125rem",color:o[m.id]==="success"?"#22c55e":"#ef4444"},children:o[m.id]==="success"?"✓ Succès":"✗ Erreur"})]})]})},m.id))}),e.jsxs("div",{className:`${s.alert} ${s.alertInfo}`,style:{marginTop:"1.5rem"},children:[e.jsx(Y,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"Information"}),e.jsx("p",{style:{margin:0,fontSize:"0.875rem"},children:"Ces actions peuvent prendre du temps en fonction de la taille de la base de données. Ne fermez pas la page pendant l'exécution."})]})]})]})]})}const ft=[{value:"reco-data",label:"Données RECO"},{value:"patients",label:"Patients"},{value:"families",label:"Familles"},{value:"chws-data",label:"Données ASC"},{value:"mentors-data",label:"Données Mentors"},{value:"dashboards",label:"Dashboards"},{value:"reports",label:"Rapports"}];function vt(){const[t,b]=i.useState(!1),[o,p]=i.useState(!1),[n,f]=i.useState(!1),[x,S]=i.useState(!1),[y,m]=i.useState(""),[z,T]=i.useState(""),[h,A]=i.useState(""),[a,k]=i.useState([]),[F,H]=i.useState([]),[U,I]=i.useState([]),[L,w]=i.useState([]),[G,j]=i.useState([]),[E,d]=i.useState([]),[v,u]=i.useState([]),[D,r]=i.useState(new Set),{showSuccess:g,showError:C,showWarning:V}=te();i.useEffect(()=>{se()},[]),i.useEffect(()=>{N()},[a,h]);const se=async()=>{b(!0);try{const[c,B,Q]=await Promise.all([be.getDistrictQuartiers(),be.getRecos(),be.getChws()]);c?.status===200&&I(c.data||[]),B?.status===200&&j(B.data||[]),Q?.status===200&&d(Q.data||[])}catch{C("Erreur lors du chargement des données")}finally{b(!1)}},N=()=>{if(!h||a.length===0){w([]);return}if(["reco-data","patients","families","dashboards","reports"].includes(h)){const c=G.filter(B=>a.includes(B.district_quartier_id));w(c)}else if(h==="chws-data"){const c=E.filter(B=>a.includes(B.district_quartier_id));w(c)}},q=async()=>{if(!y||!z||!h||F.length===0){V("Veuillez remplir tous les champs obligatoires");return}p(!0),u([]),r(new Set);try{const c=await W.getDataToDeleteFromCouchDb({start_date:y,end_date:z,type:h,cible:F});if(c?.status===200&&c.data){const Q=c.data.reduce((le,ge)=>(le.find(l=>l.id===ge.id)||le.push(ge),le),[]);u(Q),Q.length===0&&V("Aucune donnée trouvée pour ces critères")}}catch{C("Erreur lors de la recherche")}finally{p(!1)}},ee=()=>{D.size===v.length?r(new Set):r(new Set(v.map(c=>c.id)))},M=c=>{const B=new Set(D);B.has(c)?B.delete(c):B.add(c),r(B)},xe=async()=>{if(D.size===0){V("Veuillez sélectionner au moins une donnée");return}f(!0);try{const c=v.filter(Q=>D.has(Q.id)).map(Q=>({_deleted:!0,_id:Q.id,_rev:Q.rev,_table:Q.table}));(await W.deleteDataFromCouchDb(c,h))?.status===200?(g(`${D.size} élément(s) supprimé(s) avec succès`),u([]),r(new Set),S(!1)):C("Erreur lors de la suppression")}catch{C("Erreur lors de la suppression")}finally{f(!1)}};return e.jsxs(ie,{children:[e.jsx(ne,{title:e.jsxs("div",{className:s.cardTitle,children:[e.jsx(X,{size:20}),"Supprimer des données CouchDB"]})}),e.jsxs(ae,{children:[e.jsxs("div",{className:`${s.alert} ${s.alertWarning}`,style:{marginBottom:"1.5rem"},children:[e.jsx(pe,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"Attention"}),e.jsx("p",{style:{margin:0,fontSize:"0.875rem"},children:"Cette action est irréversible. Les données supprimées ne pourront pas être récupérées."})]})]}),e.jsxs("div",{className:s.form,children:[e.jsxs("div",{className:`${s.grid} ${s.grid2}`,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Date de début *"}),e.jsx("input",{type:"date",className:s.formInput,value:y,onChange:c=>m(c.target.value)})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Date de fin *"}),e.jsx("input",{type:"date",className:s.formInput,value:z,onChange:c=>T(c.target.value)})]})]}),e.jsxs("div",{className:`${s.grid} ${s.grid2}`,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Type de données *"}),e.jsxs("select",{className:s.formSelect,value:h,onChange:c=>A(c.target.value),children:[e.jsx("option",{value:"",children:"Sélectionner un type"}),ft.map(c=>e.jsx("option",{value:c.value,children:c.label},c.value))]})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Districts/Quartiers *"}),e.jsx("select",{className:s.formSelect,multiple:!0,value:a,onChange:c=>k(Array.from(c.target.selectedOptions,B=>B.value)),style:{minHeight:"100px"},children:U.map(c=>e.jsx("option",{value:c.id,children:c.name},c.id))})]})]}),L.length>0&&e.jsxs("div",{className:s.formGroup,children:[e.jsxs("label",{className:s.formLabel,children:["Cibles * (",h==="chws-data"?"ASC":"RECO",")"]}),e.jsx("select",{className:s.formSelect,multiple:!0,value:F,onChange:c=>H(Array.from(c.target.selectedOptions,B=>B.value)),style:{minHeight:"120px"},children:L.map(c=>e.jsx("option",{value:c.id,children:c.name},c.id))})]}),e.jsx(_,{variant:"primary",onClick:q,disabled:o||t,children:o?e.jsxs(e.Fragment,{children:[e.jsx(K,{size:16,className:"animate-spin"}),"Recherche..."]}):e.jsxs(e.Fragment,{children:[e.jsx(Pe,{size:16}),"Rechercher"]})})]}),v.length>0&&e.jsxs("div",{style:{marginTop:"1.5rem"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"},children:[e.jsxs("h3",{style:{fontSize:"1rem",fontWeight:600},children:[v.length," élément(s) trouvé(s) - ",D.size," sélectionné(s)"]}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsxs(_,{variant:"outline",size:"sm",onClick:ee,children:[D.size===v.length?e.jsx(Fe,{size:16}):e.jsx(Be,{size:16}),D.size===v.length?"Désélectionner tout":"Tout sélectionner"]}),e.jsxs(_,{variant:"danger",size:"sm",onClick:()=>S(!0),disabled:D.size===0,children:[e.jsx(X,{size:16}),"Supprimer (",D.size,")"]})]})]}),e.jsxs("div",{className:s.tableContainer,children:[e.jsxs("table",{className:s.table,children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:"40px"}}),e.jsx("th",{children:"ID"}),e.jsx("th",{children:"Nom"}),e.jsx("th",{children:"Formulaire"}),e.jsx("th",{children:"Utilisateur"}),e.jsx("th",{children:"Table"})]})}),e.jsx("tbody",{children:v.slice(0,100).map(c=>e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("input",{type:"checkbox",checked:D.has(c.id),onChange:()=>M(c.id)})}),e.jsxs("td",{style:{fontFamily:"monospace",fontSize:"0.75rem"},children:[c.id.substring(0,12),"..."]}),e.jsx("td",{children:c.name||"-"}),e.jsx("td",{children:c.form||"-"}),e.jsx("td",{children:c.user||"-"}),e.jsx("td",{children:e.jsx("span",{className:`${s.badge} ${s.badgeWarning}`,children:c.table})})]},c.id))})]}),v.length>100&&e.jsxs("p",{style:{textAlign:"center",padding:"1rem",color:"#64748b"},children:["Affichage des 100 premiers éléments sur ",v.length]})]})]})]}),e.jsx(je,{isOpen:x,onClose:()=>S(!1),title:"Confirmer la suppression",children:e.jsxs("div",{className:s.form,children:[e.jsxs("div",{className:`${s.alert} ${s.alertDanger}`,children:[e.jsx(pe,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"Attention !"}),e.jsxs("p",{style:{margin:"0.5rem 0 0 0"},children:["Vous êtes sur le point de supprimer ",e.jsx("strong",{children:D.size})," élément(s). Cette action est irréversible."]})]})]}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsx(_,{variant:"outline",onClick:()=>S(!1),children:"Annuler"}),e.jsx(_,{variant:"danger",onClick:xe,disabled:n,children:n?e.jsxs(e.Fragment,{children:[e.jsx(K,{size:16,className:"animate-spin"}),"Suppression..."]}):e.jsxs(e.Fragment,{children:[e.jsx(X,{size:16}),"Confirmer la suppression"]})})]})]})})]})}const jt=[{id:"monthly-report",name:"Rapport mensuel",description:"Génère un rapport mensuel d'activités",type:"report"},{id:"vaccination-report",name:"Rapport vaccination",description:"Génère un rapport de suivi vaccinal",type:"report"},{id:"household-summary",name:"Récapitulatif ménages",description:"Génère un récapitulatif des ménages",type:"summary"},{id:"reco-performance",name:"Performance RECO",description:"Génère un rapport de performance des RECO",type:"performance"}];function bt(){const[t,b]=i.useState(""),[o,p]=i.useState(!1),[n,f]=i.useState(null),[x,S]=i.useState({includeCharts:!0,includeTables:!0,pageOrientation:"portrait",paperSize:"A4"}),{showSuccess:y,showError:m,showWarning:z}=te(),T=async()=>{if(!t){z("Veuillez sélectionner un modèle");return}p(!0),f(null);try{const a=await W.generatePdf({templateId:t,config:x});if(a?.status===200&&a.data){const k=a.data;k.url&&(f(k.url),y("PDF généré avec succès"))}else m("Erreur lors de la génération du PDF")}catch{m("Erreur lors de la génération du PDF")}finally{p(!1)}},h=()=>{if(n){const a=document.createElement("a");a.href=n,a.download=`${t}_${new Date().toISOString().split("T")[0]}.pdf`,a.click()}},A=()=>{n&&window.open(n,"_blank")};return e.jsxs(ie,{children:[e.jsx(ne,{title:e.jsxs("div",{className:s.cardTitle,children:[e.jsx(oe,{size:20}),"Générateur de PDF"]})}),e.jsx(ae,{children:e.jsxs("div",{className:s.form,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Modèle de document"}),e.jsx("div",{className:`${s.grid} ${s.grid2}`,children:jt.map(a=>e.jsx("div",{className:s.card,style:{marginBottom:0,cursor:"pointer",border:t===a.id?"2px solid #3b82f6":"1px solid #e2e8f0",backgroundColor:t===a.id?"#eff6ff":"white"},onClick:()=>b(a.id),children:e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"0.75rem"},children:[e.jsx(oe,{size:24,style:{color:t===a.id?"#3b82f6":"#64748b"}}),e.jsxs("div",{children:[e.jsx("h4",{style:{fontSize:"0.9375rem",fontWeight:600,marginBottom:"0.25rem"},children:a.name}),e.jsx("p",{style:{fontSize:"0.8125rem",color:"#64748b",margin:0},children:a.description})]})]})},a.id))})]}),e.jsxs("div",{className:s.card,style:{marginBottom:0},children:[e.jsx("div",{className:s.cardHeader,style:{marginBottom:"1rem"},children:e.jsxs("h4",{className:s.cardTitle,style:{fontSize:"1rem"},children:[e.jsx(Oe,{size:18}),"Configuration"]})}),e.jsxs("div",{className:`${s.grid} ${s.grid2}`,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Orientation"}),e.jsxs("select",{className:s.formSelect,value:x.pageOrientation,onChange:a=>S({...x,pageOrientation:a.target.value}),children:[e.jsx("option",{value:"portrait",children:"Portrait"}),e.jsx("option",{value:"landscape",children:"Paysage"})]})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Taille du papier"}),e.jsxs("select",{className:s.formSelect,value:x.paperSize,onChange:a=>S({...x,paperSize:a.target.value}),children:[e.jsx("option",{value:"A4",children:"A4"}),e.jsx("option",{value:"A3",children:"A3"}),e.jsx("option",{value:"Letter",children:"Letter"}),e.jsx("option",{value:"Legal",children:"Legal"})]})]})]}),e.jsxs("div",{style:{marginTop:"1rem",display:"flex",gap:"1.5rem"},children:[e.jsxs("label",{className:s.checkbox,children:[e.jsx("input",{type:"checkbox",checked:x.includeCharts,onChange:a=>S({...x,includeCharts:a.target.checked})}),e.jsx("span",{children:"Inclure les graphiques"})]}),e.jsxs("label",{className:s.checkbox,children:[e.jsx("input",{type:"checkbox",checked:x.includeTables,onChange:a=>S({...x,includeTables:a.target.checked})}),e.jsx("span",{children:"Inclure les tableaux"})]})]})]}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsx(_,{variant:"primary",onClick:T,disabled:o||!t,children:o?e.jsxs(e.Fragment,{children:[e.jsx(K,{size:16,className:"animate-spin"}),"Génération..."]}):e.jsxs(e.Fragment,{children:[e.jsx(oe,{size:16}),"Générer le PDF"]})}),n&&e.jsxs(e.Fragment,{children:[e.jsxs(_,{variant:"outline",onClick:A,children:[e.jsx($e,{size:16}),"Aperçu"]}),e.jsxs(_,{variant:"outline",onClick:h,children:[e.jsx(Ge,{size:16}),"Télécharger"]})]})]}),n&&e.jsx("div",{className:s.card,style:{marginTop:"1rem",marginBottom:0,padding:0,overflow:"hidden"},children:e.jsx("iframe",{src:n,style:{width:"100%",height:"500px",border:"none"},title:"Aperçu PDF"})})]})})]})}function yt(){const t=i.useRef(null),[b,o]=i.useState(!1),[p,n]=i.useState(""),[f,x]=i.useState([]),[S,y]=i.useState(!1),[m,z]=i.useState(!0),[T,h]=i.useState("#000000"),[A,a]=i.useState(2),{showSuccess:k,showError:F,showWarning:H}=te();i.useEffect(()=>{I(),U()},[]);const U=()=>{const r=t.current;if(!r)return;const g=r.getContext("2d");g&&(g.fillStyle="#ffffff",g.fillRect(0,0,r.width,r.height),g.strokeStyle=T,g.lineWidth=A,g.lineCap="round",g.lineJoin="round")},I=async()=>{z(!0);try{const r=await W.getSignatures();r?.status===200&&x(r.data||[])}catch(r){console.error("Error loading signatures:",r)}finally{z(!1)}},L=r=>{const g=t.current;if(!g)return{x:0,y:0};const C=g.getBoundingClientRect();return"touches"in r?{x:r.touches[0].clientX-C.left,y:r.touches[0].clientY-C.top}:{x:r.clientX-C.left,y:r.clientY-C.top}},w=r=>{const C=t.current?.getContext("2d");if(!C)return;o(!0);const{x:V,y:se}=L(r);C.beginPath(),C.moveTo(V,se)},G=r=>{if(!b)return;const C=t.current?.getContext("2d");if(!C)return;const{x:V,y:se}=L(r);C.strokeStyle=T,C.lineWidth=A,C.lineTo(V,se),C.stroke()},j=()=>{o(!1)},E=()=>{const r=t.current,g=r?.getContext("2d");!g||!r||(g.fillStyle="#ffffff",g.fillRect(0,0,r.width,r.height))},d=async()=>{if(!p.trim()){H("Veuillez entrer un nom pour la signature");return}const r=t.current;if(r){y(!0);try{const g=r.toDataURL("image/png");(await W.saveSignature({name:p,dataUrl:g}))?.status===200?(k("Signature enregistrée avec succès"),n(""),E(),I()):F("Erreur lors de l'enregistrement")}catch{F("Erreur lors de l'enregistrement")}finally{y(!1)}}},v=async r=>{try{(await W.deleteSignature(r))?.status===200?(k("Signature supprimée"),I()):F("Erreur lors de la suppression")}catch{F("Erreur lors de la suppression")}},u=r=>{const g=document.createElement("a");g.href=r.dataUrl,g.download=`${r.name}.png`,g.click()},D=r=>{const g=t.current,C=g?.getContext("2d");if(!C||!g)return;const V=new Image;V.onload=()=>{C.fillStyle="#ffffff",C.fillRect(0,0,g.width,g.height),C.drawImage(V,0,0)},V.src=r.dataUrl,n(r.name)};return e.jsxs(ie,{children:[e.jsx(ne,{title:e.jsxs("div",{className:s.cardTitle,children:[e.jsx(Se,{size:20}),"Gestion des signatures"]})}),e.jsx(ae,{children:e.jsxs("div",{className:`${s.grid} ${s.grid2}`,children:[e.jsxs("div",{children:[e.jsx("h4",{style:{fontSize:"1rem",fontWeight:600,marginBottom:"1rem"},children:"Dessiner une signature"}),e.jsx("div",{style:{border:"2px dashed #e2e8f0",borderRadius:"0.5rem",padding:"1rem",backgroundColor:"#f8fafc"},children:e.jsx("canvas",{ref:t,width:400,height:200,style:{width:"100%",maxWidth:"400px",height:"200px",backgroundColor:"white",borderRadius:"0.375rem",cursor:"crosshair",touchAction:"none"},onMouseDown:w,onMouseMove:G,onMouseUp:j,onMouseLeave:j,onTouchStart:w,onTouchMove:G,onTouchEnd:j})}),e.jsxs("div",{style:{display:"flex",gap:"1rem",marginTop:"1rem",alignItems:"center"},children:[e.jsxs("div",{className:s.formGroup,style:{marginBottom:0},children:[e.jsx("label",{className:s.formLabel,style:{marginBottom:"0.25rem"},children:"Couleur"}),e.jsx("input",{type:"color",value:T,onChange:r=>h(r.target.value),style:{width:"40px",height:"32px",cursor:"pointer"}})]}),e.jsxs("div",{className:s.formGroup,style:{marginBottom:0,flex:1},children:[e.jsxs("label",{className:s.formLabel,style:{marginBottom:"0.25rem"},children:["Épaisseur (",A,"px)"]}),e.jsx("input",{type:"range",min:"1",max:"10",value:A,onChange:r=>a(Number(r.target.value)),style:{width:"100%"}})]})]}),e.jsxs("div",{style:{marginTop:"1rem"},children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Nom de la signature"}),e.jsx("input",{type:"text",className:s.formInput,value:p,onChange:r=>n(r.target.value),placeholder:"Ex: Signature Dr. Diallo"})]}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsxs(_,{variant:"outline",onClick:E,children:[e.jsx(X,{size:16}),"Effacer"]}),e.jsx(_,{variant:"primary",onClick:d,disabled:S,children:S?e.jsxs(e.Fragment,{children:[e.jsx(K,{size:16,className:"animate-spin"}),"Enregistrement..."]}):e.jsxs(e.Fragment,{children:[e.jsx(Me,{size:16}),"Enregistrer"]})})]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{fontSize:"1rem",fontWeight:600,marginBottom:"1rem"},children:"Signatures enregistrées"}),m?e.jsx("div",{className:s.loading,children:e.jsx(K,{size:24,className:"animate-spin"})}):f.length===0?e.jsxs("div",{className:s.emptyState,children:[e.jsx(Se,{size:48}),e.jsx("p",{children:"Aucune signature enregistrée"})]}):e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"0.75rem"},children:f.map(r=>e.jsx("div",{className:s.card,style:{marginBottom:0,padding:"0.75rem"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[e.jsx("img",{src:r.dataUrl,alt:r.name,style:{width:"80px",height:"40px",objectFit:"contain",backgroundColor:"white",borderRadius:"0.25rem",border:"1px solid #e2e8f0"}}),e.jsxs("div",{style:{flex:1},children:[e.jsx("p",{style:{fontWeight:500,marginBottom:"0.125rem"},children:r.name}),e.jsx("p",{style:{fontSize:"0.75rem",color:"#64748b"},children:new Date(r.createdAt).toLocaleDateString("fr-FR")})]}),e.jsxs("div",{className:s.actionsCell,children:[e.jsx("button",{className:s.actionBtn,onClick:()=>D(r),title:"Charger",children:e.jsx(ns,{size:16})}),e.jsx("button",{className:s.actionBtn,onClick:()=>u(r),title:"Télécharger",children:e.jsx(Ge,{size:16})}),e.jsx("button",{className:`${s.actionBtn} ${s.actionBtnDanger}`,onClick:()=>v(r.id),title:"Supprimer",children:e.jsx(X,{size:16})})]})]})},r.id))})]})]})})]})}function zt(){const[t,b]=i.useState([]),[o,p]=i.useState(new Set),[n,f]=i.useState("TRUNCATE"),[x,S]=i.useState(!0),[y,m]=i.useState(!1),[z,T]=i.useState(!1),[h,A]=i.useState(""),[a,k]=i.useState(""),{showSuccess:F,showError:H,showWarning:U}=te(),I="SUPPRIMER";i.useEffect(()=>{L()},[]);const L=async()=>{S(!0);try{const d=await W.getDatabaseEntities();d?.status===200&&b(d.data||[])}catch{H("Erreur lors du chargement des entités")}finally{S(!1)}},w=()=>{o.size===t.length?p(new Set):p(new Set(t.map(d=>d.name)))},G=d=>{const v=new Set(o);v.has(d)?v.delete(d):v.add(d),p(v)},j=()=>{if(o.size===0){U("Veuillez sélectionner au moins une entité");return}A(""),T(!0)},E=async()=>{if(h!==I){U(`Veuillez taper "${I}" pour confirmer`);return}m(!0),k("");try{const d=t.filter(u=>o.has(u.name)),v=await W.truncateDatabase({procide:!0,entities:d,action:n});if(v?.status===200){const u=n==="TRUNCATE"?"vidées":"supprimées";F(`${o.size} table(s) ${u} avec succès`),k(String(v.data)||"Opération terminée avec succès"),p(new Set),T(!1)}else k(String(v?.data)||"Erreur lors de l'opération"),H("Erreur lors de l'opération")}catch{k("Erreur lors de l'exécution de l'opération"),H("Erreur lors de l'opération")}finally{m(!1)}};return e.jsxs(ie,{children:[e.jsx(ne,{title:e.jsxs("div",{className:s.cardTitle,children:[e.jsx(Y,{size:20}),"Tronquer / Supprimer des tables"]})}),e.jsxs(ae,{children:[e.jsxs("div",{className:`${s.alert} ${s.alertDanger}`,style:{marginBottom:"1.5rem"},children:[e.jsx(pe,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"Danger !"}),e.jsxs("p",{style:{margin:"0.25rem 0 0 0",fontSize:"0.875rem"},children:["Cette opération est extrêmement dangereuse et irréversible.",e.jsx("br",{}),e.jsx("strong",{children:"TRUNCATE"})," vide le contenu des tables.",e.jsx("br",{}),e.jsx("strong",{children:"DROP"})," supprime complètement les tables."]})]})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Action à effectuer"}),e.jsxs("div",{style:{display:"flex",gap:"1rem"},children:[e.jsxs("label",{className:s.checkbox,style:{padding:"0.75rem 1rem",border:`2px solid ${n==="TRUNCATE"?"#f59e0b":"#e2e8f0"}`,borderRadius:"0.5rem",backgroundColor:n==="TRUNCATE"?"#fef3c7":"transparent"},children:[e.jsx("input",{type:"radio",name:"action",value:"TRUNCATE",checked:n==="TRUNCATE",onChange:()=>f("TRUNCATE")}),e.jsxs("span",{children:[e.jsx("strong",{children:"TRUNCATE"})," - Vider les tables"]})]}),e.jsxs("label",{className:s.checkbox,style:{padding:"0.75rem 1rem",border:`2px solid ${n==="DROP"?"#ef4444":"#e2e8f0"}`,borderRadius:"0.5rem",backgroundColor:n==="DROP"?"#fee2e2":"transparent"},children:[e.jsx("input",{type:"radio",name:"action",value:"DROP",checked:n==="DROP",onChange:()=>f("DROP")}),e.jsxs("span",{children:[e.jsx("strong",{children:"DROP"})," - Supprimer les tables"]})]})]})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("label",{className:s.formLabel,children:["Tables à traiter (",o.size,"/",t.length," sélectionnées)"]}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsx(_,{variant:"ghost",size:"sm",onClick:L,disabled:x,children:e.jsx(K,{size:14,className:x?"animate-spin":""})}),e.jsx(_,{variant:"outline",size:"sm",onClick:w,children:o.size===t.length?e.jsxs(e.Fragment,{children:[e.jsx(Fe,{size:14}),"Désélectionner"]}):e.jsxs(e.Fragment,{children:[e.jsx(Be,{size:14}),"Tout sélectionner"]})})]})]}),x?e.jsx("div",{className:s.loading,children:e.jsx(K,{size:24,className:"animate-spin"})}):t.length===0?e.jsxs("div",{className:s.emptyState,children:[e.jsx(Y,{size:48}),e.jsx("p",{children:"Aucune entité trouvée"})]}):e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))",gap:"0.5rem",maxHeight:"300px",overflowY:"auto",padding:"0.5rem",border:"1px solid #e2e8f0",borderRadius:"0.5rem"},children:t.map(d=>e.jsxs("label",{className:s.checkbox,style:{padding:"0.5rem 0.75rem",borderRadius:"0.375rem",backgroundColor:o.has(d.name)?"#fee2e2":"transparent",border:`1px solid ${o.has(d.name)?"#ef4444":"transparent"}`},children:[e.jsx("input",{type:"checkbox",checked:o.has(d.name),onChange:()=>G(d.name)}),e.jsx("span",{style:{fontSize:"0.875rem"},children:d.name})]},d.name))})]}),e.jsx("div",{style:{marginTop:"1.5rem"},children:e.jsxs(_,{variant:"danger",onClick:j,disabled:o.size===0,children:[e.jsx(X,{size:16}),n==="TRUNCATE"?"Vider":"Supprimer"," les tables sélectionnées"]})}),a&&e.jsx("div",{className:`${s.alert} ${s.alertInfo}`,style:{marginTop:"1.5rem"},children:e.jsx("pre",{style:{margin:0,whiteSpace:"pre-wrap",fontFamily:"monospace"},children:a})})]}),e.jsx(je,{isOpen:z,onClose:()=>T(!1),title:"Confirmation requise",children:e.jsxs("div",{className:s.form,children:[e.jsxs("div",{className:`${s.alert} ${s.alertDanger}`,children:[e.jsx(pe,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"ATTENTION !"}),e.jsxs("p",{style:{margin:"0.5rem 0 0 0"},children:["Vous êtes sur le point de"," ",e.jsx("strong",{children:n==="TRUNCATE"?"VIDER":"SUPPRIMER"})," ",e.jsx("strong",{children:o.size})," table(s) :"]}),e.jsxs("ul",{style:{margin:"0.5rem 0",paddingLeft:"1.25rem"},children:[Array.from(o).slice(0,5).map(d=>e.jsx("li",{style:{fontSize:"0.875rem"},children:d},d)),o.size>5&&e.jsxs("li",{style:{fontSize:"0.875rem"},children:["... et ",o.size-5," autres"]})]}),e.jsx("p",{style:{margin:"0.5rem 0 0 0",fontWeight:600},children:"Cette action est IRRÉVERSIBLE !"})]})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsxs("label",{className:s.formLabel,children:["Tapez ",e.jsx("strong",{children:I})," pour confirmer"]}),e.jsx("input",{type:"text",className:s.formInput,value:h,onChange:d=>A(d.target.value),placeholder:I,style:{borderColor:h===I?"#22c55e":void 0}})]}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsx(_,{variant:"outline",onClick:()=>T(!1),children:"Annuler"}),e.jsx(_,{variant:"danger",onClick:E,disabled:h!==I||y,children:y?e.jsxs(e.Fragment,{children:[e.jsx(K,{size:16,className:"animate-spin"}),"Exécution..."]}):e.jsxs(e.Fragment,{children:[e.jsx(X,{size:16}),n==="TRUNCATE"?"Vider":"Supprimer"," définitivement"]})})]})]})})]})}const St=[{id:"line",name:"Ligne",icon:e.jsx(cs,{size:20}),description:"Évolution dans le temps",category:"trend"},{id:"area",name:"Zone",icon:e.jsx(ds,{size:20}),description:"Évolution avec remplissage",category:"trend"},{id:"bar",name:"Barres",icon:e.jsx(_e,{size:20}),description:"Comparaison de valeurs",category:"comparison"},{id:"pie",name:"Camembert",icon:e.jsx(ms,{size:20}),description:"Distribution en parts",category:"composition"},{id:"donut",name:"Anneau",icon:e.jsx(us,{size:20}),description:"Distribution avec centre vide",category:"composition"},{id:"radar",name:"Radar",icon:e.jsx(hs,{size:20}),description:"Comparaison multidimensionnelle",category:"comparison"},{id:"radialBar",name:"Barres radiales",icon:e.jsx(Ue,{size:20}),description:"Progression circulaire",category:"comparison"},{id:"scatter",name:"Nuage de points",icon:e.jsx(Ne,{size:20}),description:"Corrélation entre variables",category:"distribution"},{id:"composed",name:"Composé",icon:e.jsx(Ce,{size:20}),description:"Combinaison de types",category:"other"},{id:"treemap",name:"Treemap",icon:e.jsx(Ne,{size:20}),description:"Hiérarchie en rectangles",category:"composition"},{id:"funnel",name:"Entonnoir",icon:e.jsx(ps,{size:20}),description:"Processus séquentiel",category:"other"},{id:"table",name:"Tableau",icon:e.jsx(xs,{size:20}),description:"Données tabulaires",category:"other"}];function ve({title:t,icon:b,items:o,selectedItems:p,onSelectionChange:n,searchPlaceholder:f="Rechercher..."}){const[x,S]=i.useState(!1),[y,m]=i.useState(""),z=i.useMemo(()=>{if(!y)return o;const a=y.toLowerCase();return o.filter(k=>k.name.toLowerCase().includes(a)||k.code?.toLowerCase().includes(a))},[o,y]),T=a=>{p.includes(a)?n(p.filter(k=>k!==a)):n([...p,a])},h=()=>{n(z.map(a=>a.id))},A=()=>{n([])};return e.jsxs("div",{className:P.dimensionSelector,children:[e.jsxs("button",{type:"button",className:P.dimensionHeader,onClick:()=>S(!x),children:[e.jsx("span",{className:P.dimensionIcon,children:b}),e.jsx("span",{className:P.dimensionTitle,children:t}),e.jsx("span",{className:P.dimensionCount,children:p.length>0&&e.jsx("span",{className:P.countBadge,children:p.length})}),x?e.jsx(gs,{size:16}):e.jsx(fs,{size:16})]}),x&&e.jsxs("div",{className:P.dimensionContent,children:[e.jsxs("div",{className:P.dimensionSearch,children:[e.jsx(Pe,{size:16}),e.jsx("input",{type:"text",placeholder:f,value:y,onChange:a=>m(a.target.value)}),y&&e.jsx("button",{type:"button",onClick:()=>m(""),children:e.jsx(He,{size:14})})]}),e.jsxs("div",{className:P.dimensionActions,children:[e.jsx("button",{type:"button",onClick:h,children:"Tout sélectionner"}),e.jsx("button",{type:"button",onClick:A,children:"Tout désélectionner"})]}),e.jsxs("div",{className:P.dimensionItems,children:[z.map(a=>e.jsxs("label",{className:P.dimensionItem,children:[e.jsx("input",{type:"checkbox",checked:p.includes(a.id),onChange:()=>T(a.id)}),e.jsx("span",{className:P.itemName,children:a.name}),a.code&&e.jsx("span",{className:P.itemCode,children:a.code})]},a.id)),z.length===0&&e.jsx("div",{className:P.noResults,children:"Aucun résultat"})]})]})]})}function ye({title:t,items:b,allItems:o,onRemove:p,placeholder:n="Glissez des éléments ici"}){const f=x=>o.find(y=>y.id===x)?.name||x;return e.jsxs("div",{className:P.layoutZone,children:[e.jsx("div",{className:P.layoutZoneHeader,children:t}),e.jsx("div",{className:P.layoutZoneContent,children:b.length===0?e.jsx("div",{className:P.layoutPlaceholder,children:n}):b.map(x=>e.jsxs("div",{className:P.layoutItem,children:[e.jsx(vs,{size:14}),e.jsx("span",{children:f(x)}),e.jsx("button",{type:"button",onClick:()=>p(x),className:P.removeItemBtn,children:e.jsx(He,{size:14})})]},x))})]})}const P={container:"viz-container",dimensionSelector:"viz-dimension-selector",dimensionHeader:"viz-dimension-header",dimensionIcon:"viz-dimension-icon",dimensionTitle:"viz-dimension-title",dimensionCount:"viz-dimension-count",countBadge:"viz-count-badge",dimensionContent:"viz-dimension-content",dimensionSearch:"viz-dimension-search",dimensionActions:"viz-dimension-actions",dimensionItems:"viz-dimension-items",dimensionItem:"viz-dimension-item",itemName:"viz-item-name",itemCode:"viz-item-code",noResults:"viz-no-results",layoutZone:"viz-layout-zone",layoutZoneHeader:"viz-layout-zone-header",layoutZoneContent:"viz-layout-zone-content",layoutPlaceholder:"viz-layout-placeholder",layoutItem:"viz-layout-item",removeItemBtn:"viz-remove-item-btn"};function Ct(){const{showSuccess:t,showError:b}=te(),[o,p]=i.useState("dashboard"),[n,f]=i.useState("bar"),[x,S]=i.useState("Nouvelle visualisation"),[y,m]=i.useState(""),[z,T]=i.useState(["de1","de2","de3"]),[h,A]=i.useState([]),[a,k]=i.useState(["LAST_6_MONTHS"]),[F,H]=i.useState(["ou1","ou2","ou3"]),[U,I]=i.useState(["LAST_6_MONTHS"]),[L,w]=i.useState(["de1","de2","de3"]),[G,j]=i.useState(["ou1"]),[E,d]=i.useState([]),[v,u]=i.useState([]),[D,r]=i.useState([]),[g,C]=i.useState([]),[V,se]=i.useState([]),[N,q]=i.useState({title:"Évolution des consultations",subtitle:"Par type de service",showLegend:!0,showTooltip:!0,showGrid:!0,stacked:!1,animation:!0}),ee=i.useCallback(()=>{const{items:l}=re.list("visualizations",{sortBy:"updatedAt",sortDir:"desc"});se(l)},[]);i.useEffect(()=>{try{zs();const{items:l}=re.list("visualization_data_elements"),{items:O}=re.list("visualization_indicators"),{items:$}=re.list("visualization_periods"),{items:R}=re.list("visualization_org_units");d(l),u(O),r($),C(R),ee()}catch(l){console.error("[VisualizationsTab] Failed to load local data",l),b("Impossible de charger les données locales pour les visualisations.")}},[ee,b]);const M=i.useMemo(()=>[...E,...v,...D,...g],[E,v,D,g]),xe=i.useMemo(()=>V.filter(l=>l.type===o),[V,o]),c=i.useMemo(()=>{const l=[...z,...h];return a.length>0,n==="pie"||n==="donut"||n==="treemap"||n==="funnel"||n==="radialBar"?l.slice(0,6).map(($,R)=>({name:(E.find(J=>J.id===$)||v.find(J=>J.id===$))?.name||$,value:Math.floor(Math.random()*500)+100,color:me.primary[R%me.primary.length]})):n==="radar"?F.slice(0,5).map($=>{const Z={subject:g.find(J=>J.id===$)?.name||$};return l.slice(0,3).forEach(J=>{const ce=E.find(Ve=>Ve.id===J);Z[ce?.name||J]=Math.floor(Math.random()*100)+20}),Z}):n==="scatter"?Array.from({length:20},($,R)=>({name:`Point ${R+1}`,x:Math.floor(Math.random()*100),y:Math.floor(Math.random()*100),z:Math.floor(Math.random()*50)+10})):["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"].slice(0,6).map($=>{const R={name:$};return l.slice(0,4).forEach(Z=>{const J=E.find(ce=>ce.id===Z)||v.find(ce=>ce.id===Z);R[J?.name||Z]=Math.floor(Math.random()*300)+50}),R})},[z,h,a,F,n]),B=i.useMemo(()=>[...z,...h].slice(0,4).map((O,$)=>{const R=E.find(Z=>Z.id===O)||v.find(Z=>Z.id===O);return{dataKey:R?.name||O,name:R?.name||O,color:me.primary[$%me.primary.length],type:n==="composed"?$===0?"bar":"line":void 0}}),[z,h,n]),Q=i.useCallback(()=>{const l={name:x,description:y,type:o,chartType:n,columns:[{dimension:"pe",items:U}],rows:[{dimension:"dx",items:L}],filters:[{dimension:"ou",items:G}],options:N};console.log("Saving visualization:",l);const O=new Date().toISOString(),$={id:`viz-${Date.now()}`,createdAt:O,updatedAt:O,...l};try{re.create("visualizations",$),se(R=>[$,...R])}catch(R){console.error("[VisualizationsTab] Failed to save visualization",R),b("Impossible de sauvegarder la visualisation.");return}t(`Visualisation sauvegardée : "${x}"`)},[x,y,o,n,U,L,G,N,t,b]),le=i.useCallback(()=>{S("Nouvelle visualisation"),m(""),f("bar"),T([]),A([]),k(["THIS_MONTH"]),H([]),I([]),w([]),j([]),q({showLegend:!0,showTooltip:!0,showGrid:!0,stacked:!1,animation:!0})},[]),ge=()=>{if(n==="table")return e.jsx("div",{className:s.tableContainer,children:e.jsxs("table",{className:s.table,children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Indicateur"}),["Jan","Fév","Mar","Avr","Mai","Jun"].map(R=>e.jsx("th",{children:R},R))]})}),e.jsx("tbody",{children:B.slice(0,5).map(R=>e.jsxs("tr",{children:[e.jsx("td",{children:R.name}),Array.from({length:6},(Z,J)=>e.jsx("td",{children:Math.floor(Math.random()*300)+50},J))]},R.dataKey))})]})});const l={data:c,height:350,title:N.title,subtitle:N.subtitle,legend:{enabled:N.showLegend},tooltip:{enabled:N.showTooltip},grid:{horizontal:N.showGrid,vertical:!1},animation:{enabled:N.animation},colors:me.primary},O=["pie","donut","radialBar","treemap","funnel"].includes(n),$=["line","area","bar","radar","scatter","composed"].includes(n);return e.jsx(Ss,{type:n,...l,series:$?B:void 0,dataKey:O?"value":void 0,nameKey:O?"name":void 0,xAxis:{dataKey:n==="radar"?void 0:"name"},options:{stacked:N.stacked,polarAngleAxisKey:n==="radar"?"subject":void 0,xAxisKey:n==="scatter"?"x":void 0,yAxisKey:n==="scatter"?"y":void 0}})};return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        .viz-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .viz-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .viz-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .viz-content {
          display: grid;
          gap: 1.5rem;
        }

        @media (min-width: 1024px) {
          .viz-content {
            grid-template-columns: 350px 1fr;
          }
        }

        .viz-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .viz-main-area {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .viz-section {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .viz-section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.25rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1e293b;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .viz-section-title svg {
          color: #3b82f6;
        }

        .viz-type-selector {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
        }

        .viz-type-option {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.5rem;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .viz-type-option:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .viz-type-option-active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .viz-type-option svg {
          color: #64748b;
        }

        .viz-type-option-active svg {
          color: #3b82f6;
        }

        .viz-type-option span {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748b;
        }

        .viz-type-option-active span {
          color: #3b82f6;
        }

        .viz-saved-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
        }

        .viz-saved-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          background: #ffffff;
        }

        .viz-saved-item-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
        }

        .viz-saved-item-description {
          font-size: 0.8125rem;
          color: #64748b;
        }

        .viz-saved-item-meta {
          display: flex;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .viz-saved-empty {
          padding: 0.75rem;
          font-size: 0.8125rem;
          color: #94a3b8;
          border: 1px dashed #e2e8f0;
          border-radius: 0.5rem;
          text-align: center;
        }

        .viz-chart-type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.5rem;
          padding: 1rem;
        }

        .viz-chart-type-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.375rem;
          padding: 0.75rem 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .viz-chart-type-card:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .viz-chart-type-card-active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .viz-chart-type-card svg {
          color: #64748b;
        }

        .viz-chart-type-card-active svg {
          color: #3b82f6;
        }

        .viz-chart-type-card span {
          font-size: 0.6875rem;
          font-weight: 500;
          color: #64748b;
          text-align: center;
        }

        .viz-chart-type-card-active span {
          color: #3b82f6;
        }

        .viz-dimension-selector {
          border-bottom: 1px solid #e2e8f0;
        }

        .viz-dimension-selector:last-child {
          border-bottom: none;
        }

        .viz-dimension-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.875rem 1rem;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1e293b;
          text-align: left;
          transition: background 0.2s;
        }

        .viz-dimension-header:hover {
          background: #f8fafc;
        }

        .viz-dimension-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 0.375rem;
          background: #eff6ff;
          color: #3b82f6;
        }

        .viz-dimension-title {
          flex: 1;
        }

        .viz-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 0.375rem;
          border-radius: 9999px;
          background: #3b82f6;
          color: white;
          font-size: 0.6875rem;
          font-weight: 600;
        }

        .viz-dimension-content {
          padding: 0 1rem 1rem;
        }

        .viz-dimension-search {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          background: white;
          margin-bottom: 0.75rem;
        }

        .viz-dimension-search svg {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .viz-dimension-search input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.875rem;
          background: transparent;
        }

        .viz-dimension-search button {
          padding: 0.125rem;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #94a3b8;
        }

        .viz-dimension-search button:hover {
          color: #64748b;
        }

        .viz-dimension-actions {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .viz-dimension-actions button {
          padding: 0;
          border: none;
          background: transparent;
          font-size: 0.75rem;
          color: #3b82f6;
          cursor: pointer;
        }

        .viz-dimension-actions button:hover {
          text-decoration: underline;
        }

        .viz-dimension-items {
          max-height: 200px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .viz-dimension-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .viz-dimension-item:hover {
          background: #f8fafc;
        }

        .viz-dimension-item input {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .viz-item-name {
          flex: 1;
          font-size: 0.8125rem;
          color: #1e293b;
        }

        .viz-item-code {
          font-size: 0.6875rem;
          color: #94a3b8;
          font-family: monospace;
        }

        .viz-no-results {
          padding: 1rem;
          text-align: center;
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .viz-layout-section {
          display: grid;
          gap: 1rem;
          padding: 1rem;
        }

        @media (min-width: 640px) {
          .viz-layout-section {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .viz-layout-zone {
          border: 1px dashed #e2e8f0;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .viz-layout-zone-header {
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          background: #f8fafc;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .viz-layout-zone-content {
          min-height: 80px;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .viz-layout-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 60px;
          color: #94a3b8;
          font-size: 0.75rem;
        }

        .viz-layout-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.5rem;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          color: #1e40af;
        }

        .viz-layout-item svg {
          color: #93c5fd;
          cursor: grab;
        }

        .viz-layout-item span {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .viz-remove-item-btn {
          padding: 0.125rem;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #93c5fd;
          display: flex;
          align-items: center;
        }

        .viz-remove-item-btn:hover {
          color: #ef4444;
        }

        .viz-preview-section {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .viz-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .viz-preview-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1e293b;
        }

        .viz-preview-header h3 svg {
          color: #3b82f6;
        }

        .viz-preview-content {
          padding: 1.5rem;
          min-height: 400px;
        }

        .viz-options-panel {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .viz-option-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .viz-option-row label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: #64748b;
          cursor: pointer;
        }

        .viz-option-row input[type="checkbox"] {
          width: 16px;
          height: 16px;
        }

        .viz-option-row input[type="text"] {
          flex: 1;
          min-width: 200px;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .viz-option-row input[type="text"]:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .viz-actions {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
      `}),e.jsxs("div",{className:P.container,children:[e.jsxs("div",{className:s.card,children:[e.jsx("div",{className:s.cardHeader,children:e.jsxs("h2",{className:s.cardTitle,children:[e.jsx(Ce,{size:24}),"Créateur de visualisation"]})}),e.jsx("div",{className:s.form,children:e.jsxs("div",{className:`${s.grid} ${s.grid2}`,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Nom de la visualisation"}),e.jsx("input",{type:"text",className:s.formInput,value:x,onChange:l=>S(l.target.value),placeholder:"Entrez un nom..."})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Description (optionnel)"}),e.jsx("input",{type:"text",className:s.formInput,value:y,onChange:l=>m(l.target.value),placeholder:"Décrivez votre visualisation..."})]})]})})]}),e.jsxs("div",{className:"viz-content",children:[e.jsxs("div",{className:"viz-sidebar",children:[e.jsxs("div",{className:"viz-section",children:[e.jsxs("div",{className:"viz-section-title",children:[e.jsx(oe,{size:18}),"Type de visualisation"]}),e.jsxs("div",{className:"viz-type-selector",children:[e.jsxs("button",{type:"button",className:`viz-type-option ${o==="dashboard"?"viz-type-option-active":""}`,onClick:()=>p("dashboard"),children:[e.jsx(as,{size:24}),e.jsx("span",{children:"Tableau de bord"})]}),e.jsxs("button",{type:"button",className:`viz-type-option ${o==="report"?"viz-type-option-active":""}`,onClick:()=>p("report"),children:[e.jsx(oe,{size:24}),e.jsx("span",{children:"Rapport"})]})]})]}),e.jsxs("div",{className:"viz-section",children:[e.jsxs("div",{className:"viz-section-title",children:[e.jsx(Ce,{size:18}),"Visualisations sauvegardées"]}),e.jsx("div",{className:"viz-saved-list",children:xe.length===0?e.jsx("div",{className:"viz-saved-empty",children:"Aucune visualisation pour ce type."}):xe.map(l=>e.jsxs("div",{className:"viz-saved-item",children:[e.jsx("div",{className:"viz-saved-item-title",children:l.name}),l.description&&e.jsx("div",{className:"viz-saved-item-description",children:l.description}),e.jsxs("div",{className:"viz-saved-item-meta",children:[e.jsx("span",{children:l.chartType}),e.jsx("span",{children:"•"}),e.jsx("span",{children:new Date(l.updatedAt).toLocaleDateString()})]})]},l.id))})]}),e.jsxs("div",{className:"viz-section",children:[e.jsxs("div",{className:"viz-section-title",children:[e.jsx(_e,{size:18}),"Type de graphique"]}),e.jsx("div",{className:"viz-chart-type-grid",children:St.map(l=>e.jsxs("button",{type:"button",className:`viz-chart-type-card ${n===l.id?"viz-chart-type-card-active":""}`,onClick:()=>f(l.id),title:l.description,children:[l.icon,e.jsx("span",{children:l.name})]},l.id))})]}),e.jsxs("div",{className:"viz-section",children:[e.jsxs("div",{className:"viz-section-title",children:[e.jsx(Y,{size:18}),"Dimensions de données"]}),e.jsx(ve,{title:"Éléments de données",icon:e.jsx(Y,{size:16}),items:E,selectedItems:z,onSelectionChange:T,searchPlaceholder:"Rechercher un élément..."}),e.jsx(ve,{title:"Indicateurs",icon:e.jsx(Ue,{size:16}),items:v,selectedItems:h,onSelectionChange:A,searchPlaceholder:"Rechercher un indicateur..."}),e.jsx(ve,{title:"Périodes",icon:e.jsx(rs,{size:16}),items:D,selectedItems:a,onSelectionChange:k,searchPlaceholder:"Rechercher une période..."}),e.jsx(ve,{title:"Unités d'organisation",icon:e.jsx(os,{size:16}),items:g,selectedItems:F,onSelectionChange:H,searchPlaceholder:"Rechercher une unité..."})]})]}),e.jsxs("div",{className:"viz-main-area",children:[e.jsxs("div",{className:"viz-section",children:[e.jsxs("div",{className:"viz-section-title",children:[e.jsx(Ne,{size:18}),"Configuration de la mise en page"]}),e.jsxs("div",{className:"viz-layout-section",children:[e.jsx(ye,{title:"Colonnes",items:U,allItems:M,onRemove:l=>I(U.filter(O=>O!==l)),placeholder:"Colonnes"}),e.jsx(ye,{title:"Lignes",items:L,allItems:M,onRemove:l=>w(L.filter(O=>O!==l)),placeholder:"Lignes"}),e.jsx(ye,{title:"Filtres",items:G,allItems:M,onRemove:l=>j(G.filter(O=>O!==l)),placeholder:"Filtres"})]}),e.jsxs("div",{className:s.alert+" "+s.alertInfo,style:{margin:"0 1rem 1rem"},children:[e.jsx(ls,{size:18}),e.jsxs("div",{children:[e.jsx("strong",{children:"Astuce :"})," Sélectionnez des éléments dans les dimensions ci-dessus, puis réorganisez-les dans les zones Colonnes, Lignes et Filtres pour personnaliser l'affichage de vos données."]})]})]}),e.jsxs("div",{className:"viz-section",children:[e.jsxs("div",{className:"viz-section-title",children:[e.jsx(Oe,{size:18}),"Options d'affichage"]}),e.jsxs("div",{className:"viz-options-panel",children:[e.jsx("div",{className:"viz-option-row",children:e.jsxs("label",{children:["Titre:",e.jsx("input",{type:"text",value:N.title||"",onChange:l=>q({...N,title:l.target.value}),placeholder:"Titre du graphique"})]})}),e.jsx("div",{className:"viz-option-row",children:e.jsxs("label",{children:["Sous-titre:",e.jsx("input",{type:"text",value:N.subtitle||"",onChange:l=>q({...N,subtitle:l.target.value}),placeholder:"Sous-titre du graphique"})]})}),e.jsxs("div",{className:"viz-option-row",children:[e.jsxs("label",{children:[e.jsx("input",{type:"checkbox",checked:N.showLegend,onChange:l=>q({...N,showLegend:l.target.checked})}),"Afficher la légende"]}),e.jsxs("label",{children:[e.jsx("input",{type:"checkbox",checked:N.showTooltip,onChange:l=>q({...N,showTooltip:l.target.checked})}),"Afficher l'infobulle"]}),e.jsxs("label",{children:[e.jsx("input",{type:"checkbox",checked:N.showGrid,onChange:l=>q({...N,showGrid:l.target.checked})}),"Afficher la grille"]}),e.jsxs("label",{children:[e.jsx("input",{type:"checkbox",checked:N.stacked,onChange:l=>q({...N,stacked:l.target.checked})}),"Empilé"]}),e.jsxs("label",{children:[e.jsx("input",{type:"checkbox",checked:N.animation,onChange:l=>q({...N,animation:l.target.checked})}),"Animation"]})]})]})]}),e.jsxs("div",{className:"viz-preview-section",children:[e.jsxs("div",{className:"viz-preview-header",children:[e.jsxs("h3",{children:[e.jsx($e,{size:18}),"Aperçu"]}),e.jsxs("button",{type:"button",className:`${s.btn} ${s.btnOutline} ${s.btnSmall}`,onClick:()=>{T([...z])},children:[e.jsx(K,{size:16}),"Actualiser"]})]}),e.jsx("div",{className:"viz-preview-content",children:ge()}),e.jsxs("div",{className:"viz-actions",children:[e.jsxs("button",{type:"button",className:`${s.btn} ${s.btnPrimary}`,onClick:Q,children:[e.jsx(Me,{size:18}),"Sauvegarder"]}),e.jsxs("button",{type:"button",className:`${s.btn} ${s.btnOutline}`,onClick:le,children:[e.jsx(X,{size:18}),"Réinitialiser"]})]})]})]})]})]})]})}const Nt=[{id:"API_ACCESS",label:"API d'accès",icon:e.jsx(ze,{size:18}),color:"#3b82f6"},{id:"DB_CONNECTION",label:"Connexion BD",icon:e.jsx(ue,{size:18}),color:"#0ea5e9"},{id:"DATABASE",label:"Base de données",icon:e.jsx(Y,{size:18}),color:"#22c55e"},{id:"DELETE_COUCHDB",label:"Supprimer CouchDB",icon:e.jsx(X,{size:18}),color:"#f59e0b",danger:!0},{id:"VISUALIZATIONS",label:"Visualisations",icon:e.jsx(_e,{size:18}),color:"#14b8a6"},{id:"PDF_GENERATOR",label:"Générateur PDF",icon:e.jsx(oe,{size:18}),color:"#8b5cf6"},{id:"SIGNATURE",label:"Signature",icon:e.jsx(Se,{size:18}),color:"#06b6d4"},{id:"TRUNCATE_DATABASE",label:"Tronquer BD",icon:e.jsx(pe,{size:18}),color:"#ef4444",danger:!0}];function Ft(){const[t,b]=i.useState("API_ACCESS"),o=n=>{b(n)},p=()=>{const n=(()=>{switch(t){case"API_ACCESS":return e.jsx(ut,{});case"DB_CONNECTION":return e.jsx(xt,{});case"DATABASE":return e.jsx(gt,{});case"DELETE_COUCHDB":return e.jsx(vt,{});case"VISUALIZATIONS":return e.jsx(Ct,{});case"PDF_GENERATOR":return e.jsx(bt,{});case"SIGNATURE":return e.jsx(yt,{});case"TRUNCATE_DATABASE":return e.jsx(zt,{});default:return null}})();return e.jsx(bs.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},exit:{opacity:0,y:-20},transition:{duration:.2},children:n},t)};return e.jsxs(ys,{title:"Administration",subtitle:"Configuration et maintenance du système",children:[e.jsx("div",{className:s.tabsContainer,children:e.jsx("div",{className:s.tabs,children:Nt.map(n=>e.jsxs("button",{className:`${s.tab} ${t===n.id?s.tabActive:""} ${n.danger?s.tabDanger:""}`,onClick:()=>o(n.id),style:{"--tab-color":n.color},children:[e.jsx("span",{className:s.tabIcon,children:n.icon}),e.jsx("span",{className:s.tabLabel,children:n.label})]},n.id))})}),e.jsx("div",{className:s.tabContent,children:e.jsx(js,{mode:"wait",children:p()})})]})}export{Ft as default};
