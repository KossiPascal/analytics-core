import{r as t,j as e,O as U,P as Ce,a$ as je,a1 as $e,aV as Oe,aZ as Fe,az as Z,b0 as be,b1 as X,S as Me,b2 as Ue,b3 as Te,a0 as He,b4 as Ve,ah as We,b5 as me,t as _e,ak as Ae,b6 as De,K as ae,w as Ee,E as Ie,af as Le,b7 as ye,aX as Re,b8 as qe,aC as ze,b9 as Ke,J as Se,ba as Pe,as as Qe,B as Ze,bb as Ne,T as Je,bc as Ye,bd as Xe,be as es,ag as ss,A as ts,bf as is,aW as ns,n as as,y as rs,X as Ge,bg as os,h as ls,m as cs}from"./vendor-DFGYZ_wF.js";import{P as ds}from"./PageWrapper-DWRofYCI.js";import"./index-BC_zVJW2.js";import{C as se,b as te,B as C,a as ie}from"./Card-u96RFiNH.js";import{M as ge}from"./Modal-BQz-rFxQ.js";import{u as ee}from"./useNotification-D2EwFN3d.js";import{b as $,O as fe}from"./api.service-15xUT6X-.js";import{f as ne,i as ms}from"./index-DoOOHFLb.js";import{a as ce,C as us}from"./Chart-BqYCwWKD.js";import"./PageHeader-DGBv7mmA.js";const hs="_tabsContainer_1dm8c_2",ps="_tabs_1dm8c_2",xs="_tab_1dm8c_2",gs="_tabActive_1dm8c_38",fs="_tabDanger_1dm8c_44",vs="_tabIcon_1dm8c_48",js="_tabLabel_1dm8c_54",bs="_tabContent_1dm8c_65",ys="_card_1dm8c_70",zs="_cardHeader_1dm8c_78",Ns="_cardTitle_1dm8c_87",Ss="_form_1dm8c_101",Cs="_formGroup_1dm8c_107",ws="_formLabel_1dm8c_113",ks="_formInput_1dm8c_119",Ts="_formSelect_1dm8c_133",_s="_tableContainer_1dm8c_148",As="_table_1dm8c_148",Ds="_buttonGroup_1dm8c_176",Es="_btn_1dm8c_182",Is="_btnPrimary_1dm8c_195",Ls="_btnOutline_1dm8c_218",Rs="_btnSmall_1dm8c_228",Ps="_alert_1dm8c_234",Gs="_alertWarning_1dm8c_242",Bs="_alertDanger_1dm8c_248",$s="_alertSuccess_1dm8c_254",Os="_alertInfo_1dm8c_260",Fs="_emptyState_1dm8c_267",Ms="_loading_1dm8c_283",Us="_checkbox_1dm8c_291",Hs="_badge_1dm8c_304",Vs="_badgeSuccess_1dm8c_313",Ws="_badgeWarning_1dm8c_318",qs="_badgeDanger_1dm8c_323",Ks="_grid_1dm8c_329",Qs="_grid2_1dm8c_334",Zs="_grid3_1dm8c_344",Js="_tokenDisplay_1dm8c_361",Ys="_actionsCell_1dm8c_371",Xs="_actionBtn_1dm8c_376",et="_actionBtnDanger_1dm8c_391",s={tabsContainer:hs,tabs:ps,tab:xs,tabActive:gs,tabDanger:fs,tabIcon:vs,tabLabel:js,tabContent:bs,card:ys,cardHeader:zs,cardTitle:Ns,form:Ss,formGroup:Cs,formLabel:ws,formInput:ks,formSelect:Ts,tableContainer:_s,table:As,buttonGroup:Ds,btn:Es,btnPrimary:Is,btnOutline:Ls,btnSmall:Rs,alert:Ps,alertWarning:Gs,alertDanger:Bs,alertSuccess:$s,alertInfo:Os,emptyState:Fs,loading:Ms,checkbox:Us,badge:Hs,badgeSuccess:Vs,badgeWarning:Ws,badgeDanger:qs,grid:Ks,grid2:Qs,grid3:Zs,tokenDisplay:Js,actionsCell:Ys,actionBtn:Xs,actionBtnDanger:et},de=30;function we(i=de){const b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";let d="";for(let p=0;p<i;p++)d+=b.charAt(Math.floor(Math.random()*b.length));return d}function st(){const[i,b]=t.useState([]),[d,p]=t.useState(!0),[n,f]=t.useState(!1),[x,v]=t.useState(!1),[y,r]=t.useState(null),[z,c]=t.useState(!1),[h,k]=t.useState({token:"",isActive:!1}),[a,T]=t.useState(null),[G,H]=t.useState(!1),{showSuccess:O,showError:A}=ee(),P=async()=>{p(!0);try{const u=await $.getApiTokens();u?.status===200&&b(u.data||[])}catch{A("Erreur lors du chargement des API")}finally{p(!1)}};t.useEffect(()=>{P()},[]);const F=()=>{c(!1),r(null),k({token:we(),isActive:!0}),f(!0)},V=u=>{c(!0),r(u),k({token:u.token,isActive:u.isActive}),f(!0)},q=u=>{r(u),v(!0)},B=async()=>{if(h.token.length!==de){A(`Le token doit contenir exactement ${de} caractères`);return}H(!0);try{const u=z?"update":"create",_=await $.manageApiToken({action:u,id:y?.id,token:h.token,isActive:h.isActive});_?.status===200?(O(z?"API mise à jour avec succès":"API créée avec succès"),f(!1),P()):A(_?.data||"Erreur lors de la sauvegarde")}catch{A("Erreur lors de la sauvegarde")}finally{H(!1)}},j=async()=>{if(y)try{(await $.manageApiToken({action:"delete",id:y.id}))?.status===200?(O("API supprimée avec succès"),v(!1),r(null),P()):A("Erreur lors de la suppression")}catch{A("Erreur lors de la suppression")}},N=(u,_)=>{navigator.clipboard.writeText(u),T(_),setTimeout(()=>T(null),2e3)};return e.jsxs(se,{children:[e.jsx(te,{title:e.jsxs("div",{className:s.cardTitle,children:[e.jsx(je,{size:20}),"Gestion des API d'accès"]}),action:e.jsxs("div",{className:s.buttonGroup,children:[e.jsx(C,{variant:"ghost",size:"sm",onClick:P,disabled:d,children:e.jsx(U,{size:16,className:d?"animate-spin":""})}),e.jsxs(C,{variant:"primary",size:"sm",onClick:F,children:[e.jsx(Ce,{size:16}),"Nouveau"]})]})}),e.jsx(ie,{children:d?e.jsx("div",{className:s.loading,children:e.jsx(U,{size:24,className:"animate-spin"})}):i.length===0?e.jsxs("div",{className:s.emptyState,children:[e.jsx(je,{size:48}),e.jsx("p",{children:"Aucune API configurée"}),e.jsxs(C,{variant:"primary",onClick:F,children:[e.jsx(Ce,{size:16}),"Créer une API"]})]}):e.jsx("div",{className:s.tableContainer,children:e.jsxs("table",{className:s.table,children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Token"}),e.jsx("th",{children:"Statut"}),e.jsx("th",{children:"Actions"})]})}),e.jsx("tbody",{children:i.map(u=>e.jsxs("tr",{children:[e.jsx("td",{children:e.jsxs("div",{className:s.tokenDisplay,children:[u.token.substring(0,8),"...",u.token.substring(u.token.length-8),e.jsx("button",{className:s.actionBtn,onClick:()=>N(u.token,u.id),title:"Copier",children:a===u.id?e.jsx($e,{size:14}):e.jsx(Oe,{size:14})})]})}),e.jsx("td",{children:e.jsx("span",{className:`${s.badge} ${u.isActive?s.badgeSuccess:s.badgeDanger}`,children:u.isActive?"Actif":"Inactif"})}),e.jsx("td",{children:e.jsxs("div",{className:s.actionsCell,children:[e.jsx("button",{className:s.actionBtn,onClick:()=>V(u),title:"Modifier",children:e.jsx(Fe,{size:16})}),e.jsx("button",{className:`${s.actionBtn} ${s.actionBtnDanger}`,onClick:()=>q(u),title:"Supprimer",children:e.jsx(Z,{size:16})})]})})]},u.id))})]})})}),e.jsx(ge,{isOpen:n,onClose:()=>f(!1),title:z?"Modifier API":"Nouvelle API",children:e.jsxs("div",{className:s.form,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsxs("label",{className:s.formLabel,children:["Token (",h.token.length,"/",de," caractères)"]}),e.jsxs("div",{style:{display:"flex",gap:"0.5rem"},children:[e.jsx("input",{type:"text",className:s.formInput,value:h.token,onChange:u=>k({...h,token:u.target.value}),maxLength:de,style:{flex:1,fontFamily:"monospace"}}),e.jsx(C,{variant:"outline",onClick:()=>k({...h,token:we()}),title:"Générer un nouveau token",children:e.jsx(U,{size:16})})]})]}),e.jsx("div",{className:s.formGroup,children:e.jsxs("label",{className:s.checkbox,children:[e.jsx("input",{type:"checkbox",checked:h.isActive,onChange:u=>k({...h,isActive:u.target.checked})}),e.jsx("span",{children:"Actif"})]})}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsx(C,{variant:"outline",onClick:()=>f(!1),children:"Annuler"}),e.jsx(C,{variant:"primary",onClick:B,disabled:G,children:G?"Enregistrement...":"Enregistrer"})]})]})}),e.jsx(ge,{isOpen:x,onClose:()=>v(!1),title:"Confirmer la suppression",children:e.jsxs("div",{className:s.form,children:[e.jsxs("div",{className:`${s.alert} ${s.alertDanger}`,children:[e.jsx(Z,{size:20}),e.jsx("p",{children:"Êtes-vous sûr de vouloir supprimer cette API ? Cette action est irréversible."})]}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsx(C,{variant:"outline",onClick:()=>v(!1),children:"Annuler"}),e.jsxs(C,{variant:"danger",onClick:j,children:[e.jsx(Z,{size:16}),"Supprimer"]})]})]})})]})}const ke={connectionName:"",databaseName:"",username:"",password:"",host:"",port:"",type:"postgres",sshEnabled:!1,sshHost:"",sshPort:"22",sshUser:"",sshPassword:"",sshKey:""};function tt(){const[i,b]=t.useState(ke),[d,p]=t.useState(!1),[n,f]=t.useState(null),{showSuccess:x,showError:v}=ee(),y=t.useMemo(()=>i.databaseName.trim().length>0&&i.host.trim().length>0&&i.port.trim().length>0&&i.username.trim().length>0&&i.type.trim().length>0,[i]),r=(c,h)=>{b(k=>({...k,[c]:h}))},z=async()=>{if(!y){v("Veuillez renseigner tous les champs obligatoires.");return}p(!0),f(null);try{const c=await $.testDatabaseConnection({connectionName:i.connectionName,databaseName:i.databaseName,username:i.username,password:i.password,host:i.host,port:i.port,type:i.type,ssh:i.sshEnabled?{host:i.sshHost,port:i.sshPort,username:i.sshUser,password:i.sshPassword,key:i.sshKey}:null});if(c?.status===200){const h=c.data?.message;x(h||"Connexion réussie."),f("success")}else v("Échec du test de connexion."),f("error")}catch{v("Échec du test de connexion."),f("error")}finally{p(!1)}};return e.jsxs(se,{children:[e.jsx(te,{title:e.jsxs("div",{className:s.cardTitle,children:[e.jsx(X,{size:20}),"Connexion à une base de données"]}),action:e.jsx("div",{className:s.buttonGroup,children:e.jsx(C,{variant:"primary",size:"sm",onClick:z,disabled:d,children:d?e.jsxs(e.Fragment,{children:[e.jsx(be,{size:16,className:"animate-spin"}),"Test en cours..."]}):e.jsxs(e.Fragment,{children:[e.jsx(be,{size:16}),"Tester la connexion"]})})})}),e.jsx(ie,{children:e.jsxs("div",{className:s.form,children:[e.jsxs("div",{className:s.grid+" "+s.grid2,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,htmlFor:"connectionName",children:"Connexion"}),e.jsx("input",{id:"connectionName",className:s.formInput,placeholder:"Ex: Production PostgreSQL",value:i.connectionName,onChange:c=>r("connectionName",c.target.value)})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,htmlFor:"databaseName",children:"Nom de la base"}),e.jsx("input",{id:"databaseName",className:s.formInput,placeholder:"Ex: kendeya_prod",value:i.databaseName,onChange:c=>r("databaseName",c.target.value),required:!0})]})]}),e.jsxs("div",{className:s.grid+" "+s.grid3,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,htmlFor:"dbType",children:"Type"}),e.jsxs("select",{id:"dbType",className:s.formSelect,value:i.type,onChange:c=>r("type",c.target.value),children:[e.jsx("option",{value:"postgres",children:"PostgreSQL"}),e.jsx("option",{value:"mysql",children:"MySQL"}),e.jsx("option",{value:"mariadb",children:"MariaDB"}),e.jsx("option",{value:"mssql",children:"SQL Server"}),e.jsx("option",{value:"oracle",children:"Oracle"}),e.jsx("option",{value:"mongodb",children:"MongoDB"}),e.jsx("option",{value:"couchdb",children:"CouchDB"}),e.jsx("option",{value:"sqlite",children:"SQLite"}),e.jsx("option",{value:"other",children:"Autre"})]})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,htmlFor:"host",children:"URL / Hôte"}),e.jsx("input",{id:"host",className:s.formInput,placeholder:"Ex: 10.0.0.12 ou db.example.com",value:i.host,onChange:c=>r("host",c.target.value),required:!0})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,htmlFor:"port",children:"Port"}),e.jsx("input",{id:"port",className:s.formInput,placeholder:"5432",value:i.port,onChange:c=>r("port",c.target.value),required:!0})]})]}),e.jsxs("div",{className:s.grid+" "+s.grid3,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,htmlFor:"username",children:"Utilisateur"}),e.jsx("input",{id:"username",className:s.formInput,placeholder:"Ex: admin",value:i.username,onChange:c=>r("username",c.target.value),required:!0})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,htmlFor:"password",children:"Mot de passe"}),e.jsx("input",{id:"password",type:"password",className:s.formInput,placeholder:"••••••••",value:i.password,onChange:c=>r("password",c.target.value)})]})]}),e.jsx("div",{className:s.formGroup,children:e.jsxs("label",{className:s.checkbox,children:[e.jsx("input",{type:"checkbox",checked:i.sshEnabled,onChange:c=>r("sshEnabled",c.target.checked)}),e.jsx("span",{children:"Utiliser un tunnel SSH"})]})}),i.sshEnabled&&e.jsxs("div",{className:s.grid+" "+s.grid3,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,htmlFor:"sshHost",children:"Hôte SSH"}),e.jsx("input",{id:"sshHost",className:s.formInput,placeholder:"Ex: ssh.example.com",value:i.sshHost,onChange:c=>r("sshHost",c.target.value)})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,htmlFor:"sshPort",children:"Port SSH"}),e.jsx("input",{id:"sshPort",className:s.formInput,placeholder:"22",value:i.sshPort,onChange:c=>r("sshPort",c.target.value)})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,htmlFor:"sshUser",children:"Utilisateur SSH"}),e.jsx("input",{id:"sshUser",className:s.formInput,placeholder:"Ex: ubuntu",value:i.sshUser,onChange:c=>r("sshUser",c.target.value)})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,htmlFor:"sshPassword",children:"Mot de passe SSH"}),e.jsx("input",{id:"sshPassword",type:"password",className:s.formInput,placeholder:"••••••••",value:i.sshPassword,onChange:c=>r("sshPassword",c.target.value)})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,htmlFor:"sshKey",children:"Clé privée SSH"}),e.jsx("textarea",{id:"sshKey",className:s.formInput,placeholder:"Coller la clé privée ici",rows:4,value:i.sshKey,onChange:c=>r("sshKey",c.target.value)})]})]}),n==="success"&&e.jsxs("div",{className:`${s.alert} ${s.alertSuccess}`,children:[e.jsx(Me,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"Connexion validée"}),e.jsx("p",{style:{margin:0,fontSize:"0.875rem"},children:"Les paramètres semblent corrects. Vous pouvez utiliser cette connexion."})]})]}),n==="error"&&e.jsxs("div",{className:`${s.alert} ${s.alertDanger}`,children:[e.jsx(Ue,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"Connexion échouée"}),e.jsx("p",{style:{margin:0,fontSize:"0.875rem"},children:"Vérifiez l\\'URL, le port, les identifiants et les paramètres SSH."})]})]}),e.jsxs("div",{className:`${s.alert} ${s.alertInfo}`,children:[e.jsx(Te,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"Conseil"}),e.jsx("p",{style:{margin:0,fontSize:"0.875rem"},children:"Assurez-vous que la base est accessible depuis le serveur et que les ports sont ouverts."})]})]}),e.jsx("div",{className:s.buttonGroup,children:e.jsxs(C,{variant:"outline",size:"sm",onClick:()=>b(ke),disabled:d,children:[e.jsx(He,{size:16}),"Réinitialiser"]})})]})})]})}function it(){const[i,b]=t.useState(null),[d,p]=t.useState({}),{showSuccess:n,showError:f,showInfo:x}=ee(),v=async(r,z)=>{b(r);try{await z(),p(c=>({...c,[r]:"success"}))}catch{p(h=>({...h,[r]:"error"}))}finally{b(null)}},y=[{id:"sync-db",label:"Synchroniser la base",description:"Synchronise les données entre CouchDB et PostgreSQL",icon:e.jsx(U,{size:20}),action:async()=>{(await $.syncDatabase())?.status===200?n("Synchronisation terminée avec succès"):f("Erreur lors de la synchronisation")}},{id:"rebuild-indexes",label:"Reconstruire les index",description:"Reconstruit les index de la base de données pour améliorer les performances",icon:e.jsx(Ve,{size:20}),action:async()=>{(await $.rebuildIndexes())?.status===200?n("Index reconstruits avec succès"):f("Erreur lors de la reconstruction des index")}},{id:"vacuum-db",label:"Nettoyer la base",description:"Effectue un VACUUM ANALYZE sur PostgreSQL pour optimiser l'espace",icon:e.jsx(Te,{size:20}),action:async()=>{(await $.vacuumDatabase())?.status===200?n("Nettoyage terminé avec succès"):f("Erreur lors du nettoyage")}},{id:"check-health",label:"Vérifier la santé",description:"Vérifie l'état de santé des connexions aux bases de données",icon:e.jsx(We,{size:20}),action:async()=>{const r=await $.checkDatabaseHealth();if(r?.status===200){const z=r.data;x(`État: ${z?.message||"OK"}`)}else f("Erreur lors de la vérification")}}];return e.jsxs(se,{children:[e.jsx(te,{title:e.jsxs("div",{className:s.cardTitle,children:[e.jsx(X,{size:20}),"Actions sur la base de données"]})}),e.jsxs(ie,{children:[e.jsx("div",{className:`${s.grid} ${s.grid2}`,children:y.map(r=>e.jsx("div",{className:s.card,style:{marginBottom:0},children:e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"1rem"},children:[e.jsx("div",{style:{padding:"0.75rem",borderRadius:"0.5rem",backgroundColor:r.danger?"#fee2e2":"#dbeafe",color:r.danger?"#ef4444":"#3b82f6"},children:r.icon}),e.jsxs("div",{style:{flex:1},children:[e.jsx("h3",{style:{fontSize:"1rem",fontWeight:600,marginBottom:"0.25rem"},children:r.label}),e.jsx("p",{style:{fontSize:"0.875rem",color:"#64748b",marginBottom:"1rem"},children:r.description}),e.jsx(C,{variant:r.danger?"danger":"primary",size:"sm",onClick:()=>v(r.id,r.action),disabled:i!==null,children:i===r.id?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:14,className:"animate-spin"}),"Exécution..."]}):"Exécuter"}),d[r.id]&&e.jsx("span",{style:{marginLeft:"0.75rem",fontSize:"0.8125rem",color:d[r.id]==="success"?"#22c55e":"#ef4444"},children:d[r.id]==="success"?"✓ Succès":"✗ Erreur"})]})]})},r.id))}),e.jsxs("div",{className:`${s.alert} ${s.alertInfo}`,style:{marginTop:"1.5rem"},children:[e.jsx(X,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"Information"}),e.jsx("p",{style:{margin:0,fontSize:"0.875rem"},children:"Ces actions peuvent prendre du temps en fonction de la taille de la base de données. Ne fermez pas la page pendant l'exécution."})]})]})]})]})}const nt=[{value:"reco-data",label:"Données RECO"},{value:"patients",label:"Patients"},{value:"families",label:"Familles"},{value:"chws-data",label:"Données ASC"},{value:"mentors-data",label:"Données Mentors"},{value:"dashboards",label:"Dashboards"},{value:"reports",label:"Rapports"}];function at(){const[i,b]=t.useState(!1),[d,p]=t.useState(!1),[n,f]=t.useState(!1),[x,v]=t.useState(!1),[y,r]=t.useState(""),[z,c]=t.useState(""),[h,k]=t.useState(""),[a,T]=t.useState([]),[G,H]=t.useState([]),[O,A]=t.useState([]),[P,F]=t.useState([]),[V,q]=t.useState([]),[B,j]=t.useState([]),[N,u]=t.useState([]),[_,o]=t.useState(new Set),{showSuccess:g,showError:S,showWarning:M}=ee();t.useEffect(()=>{Y()},[]),t.useEffect(()=>{w()},[a,h]);const Y=async()=>{b(!0);try{const[m,I,W]=await Promise.all([fe.getDistrictQuartiers(),fe.getRecos(),fe.getChws()]);m?.status===200&&A(m.data||[]),I?.status===200&&q(I.data||[]),W?.status===200&&j(W.data||[])}catch{S("Erreur lors du chargement des données")}finally{b(!1)}},w=()=>{if(!h||a.length===0){F([]);return}if(["reco-data","patients","families","dashboards","reports"].includes(h)){const m=V.filter(I=>a.includes(I.district_quartier_id));F(m)}else if(h==="chws-data"){const m=B.filter(I=>a.includes(I.district_quartier_id));F(m)}},J=async()=>{if(!y||!z||!h||G.length===0){M("Veuillez remplir tous les champs obligatoires");return}p(!0),u([]),o(new Set);try{const m=await $.getDataToDeleteFromCouchDb({start_date:y,end_date:z,type:h,cible:G});if(m?.status===200&&m.data){const W=m.data.reduce((oe,pe)=>(oe.find(l=>l.id===pe.id)||oe.push(pe),oe),[]);u(W),W.length===0&&M("Aucune donnée trouvée pour ces critères")}}catch{S("Erreur lors de la recherche")}finally{p(!1)}},ue=()=>{_.size===N.length?o(new Set):o(new Set(N.map(m=>m.id)))},re=m=>{const I=new Set(_);I.has(m)?I.delete(m):I.add(m),o(I)},he=async()=>{if(_.size===0){M("Veuillez sélectionner au moins une donnée");return}f(!0);try{const m=N.filter(W=>_.has(W.id)).map(W=>({_deleted:!0,_id:W.id,_rev:W.rev,_table:W.table}));(await $.deleteDataFromCouchDb(m,h))?.status===200?(g(`${_.size} élément(s) supprimé(s) avec succès`),u([]),o(new Set),v(!1)):S("Erreur lors de la suppression")}catch{S("Erreur lors de la suppression")}finally{f(!1)}};return e.jsxs(se,{children:[e.jsx(te,{title:e.jsxs("div",{className:s.cardTitle,children:[e.jsx(Z,{size:20}),"Supprimer des données CouchDB"]})}),e.jsxs(ie,{children:[e.jsxs("div",{className:`${s.alert} ${s.alertWarning}`,style:{marginBottom:"1.5rem"},children:[e.jsx(me,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"Attention"}),e.jsx("p",{style:{margin:0,fontSize:"0.875rem"},children:"Cette action est irréversible. Les données supprimées ne pourront pas être récupérées."})]})]}),e.jsxs("div",{className:s.form,children:[e.jsxs("div",{className:`${s.grid} ${s.grid2}`,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Date de début *"}),e.jsx("input",{type:"date",className:s.formInput,value:y,onChange:m=>r(m.target.value)})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Date de fin *"}),e.jsx("input",{type:"date",className:s.formInput,value:z,onChange:m=>c(m.target.value)})]})]}),e.jsxs("div",{className:`${s.grid} ${s.grid2}`,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Type de données *"}),e.jsxs("select",{className:s.formSelect,value:h,onChange:m=>k(m.target.value),children:[e.jsx("option",{value:"",children:"Sélectionner un type"}),nt.map(m=>e.jsx("option",{value:m.value,children:m.label},m.value))]})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Districts/Quartiers *"}),e.jsx("select",{className:s.formSelect,multiple:!0,value:a,onChange:m=>T(Array.from(m.target.selectedOptions,I=>I.value)),style:{minHeight:"100px"},children:O.map(m=>e.jsx("option",{value:m.id,children:m.name},m.id))})]})]}),P.length>0&&e.jsxs("div",{className:s.formGroup,children:[e.jsxs("label",{className:s.formLabel,children:["Cibles * (",h==="chws-data"?"ASC":"RECO",")"]}),e.jsx("select",{className:s.formSelect,multiple:!0,value:G,onChange:m=>H(Array.from(m.target.selectedOptions,I=>I.value)),style:{minHeight:"120px"},children:P.map(m=>e.jsx("option",{value:m.id,children:m.name},m.id))})]}),e.jsx(C,{variant:"primary",onClick:J,disabled:d||i,children:d?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:16,className:"animate-spin"}),"Recherche..."]}):e.jsxs(e.Fragment,{children:[e.jsx(_e,{size:16}),"Rechercher"]})})]}),N.length>0&&e.jsxs("div",{style:{marginTop:"1.5rem"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"},children:[e.jsxs("h3",{style:{fontSize:"1rem",fontWeight:600},children:[N.length," élément(s) trouvé(s) - ",_.size," sélectionné(s)"]}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsxs(C,{variant:"outline",size:"sm",onClick:ue,children:[_.size===N.length?e.jsx(Ae,{size:16}):e.jsx(De,{size:16}),_.size===N.length?"Désélectionner tout":"Tout sélectionner"]}),e.jsxs(C,{variant:"danger",size:"sm",onClick:()=>v(!0),disabled:_.size===0,children:[e.jsx(Z,{size:16}),"Supprimer (",_.size,")"]})]})]}),e.jsxs("div",{className:s.tableContainer,children:[e.jsxs("table",{className:s.table,children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:"40px"}}),e.jsx("th",{children:"ID"}),e.jsx("th",{children:"Nom"}),e.jsx("th",{children:"Formulaire"}),e.jsx("th",{children:"Utilisateur"}),e.jsx("th",{children:"Table"})]})}),e.jsx("tbody",{children:N.slice(0,100).map(m=>e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("input",{type:"checkbox",checked:_.has(m.id),onChange:()=>re(m.id)})}),e.jsxs("td",{style:{fontFamily:"monospace",fontSize:"0.75rem"},children:[m.id.substring(0,12),"..."]}),e.jsx("td",{children:m.name||"-"}),e.jsx("td",{children:m.form||"-"}),e.jsx("td",{children:m.user||"-"}),e.jsx("td",{children:e.jsx("span",{className:`${s.badge} ${s.badgeWarning}`,children:m.table})})]},m.id))})]}),N.length>100&&e.jsxs("p",{style:{textAlign:"center",padding:"1rem",color:"#64748b"},children:["Affichage des 100 premiers éléments sur ",N.length]})]})]})]}),e.jsx(ge,{isOpen:x,onClose:()=>v(!1),title:"Confirmer la suppression",children:e.jsxs("div",{className:s.form,children:[e.jsxs("div",{className:`${s.alert} ${s.alertDanger}`,children:[e.jsx(me,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"Attention !"}),e.jsxs("p",{style:{margin:"0.5rem 0 0 0"},children:["Vous êtes sur le point de supprimer ",e.jsx("strong",{children:_.size})," élément(s). Cette action est irréversible."]})]})]}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsx(C,{variant:"outline",onClick:()=>v(!1),children:"Annuler"}),e.jsx(C,{variant:"danger",onClick:he,disabled:n,children:n?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:16,className:"animate-spin"}),"Suppression..."]}):e.jsxs(e.Fragment,{children:[e.jsx(Z,{size:16}),"Confirmer la suppression"]})})]})]})})]})}const rt=[{id:"monthly-report",name:"Rapport mensuel",description:"Génère un rapport mensuel d'activités",type:"report"},{id:"vaccination-report",name:"Rapport vaccination",description:"Génère un rapport de suivi vaccinal",type:"report"},{id:"household-summary",name:"Récapitulatif ménages",description:"Génère un récapitulatif des ménages",type:"summary"},{id:"reco-performance",name:"Performance RECO",description:"Génère un rapport de performance des RECO",type:"performance"}];function ot(){const[i,b]=t.useState(""),[d,p]=t.useState(!1),[n,f]=t.useState(null),[x,v]=t.useState({includeCharts:!0,includeTables:!0,pageOrientation:"portrait",paperSize:"A4"}),{showSuccess:y,showError:r,showWarning:z}=ee(),c=async()=>{if(!i){z("Veuillez sélectionner un modèle");return}p(!0),f(null);try{const a=await $.generatePdf({templateId:i,config:x});if(a?.status===200&&a.data){const T=a.data;T.url&&(f(T.url),y("PDF généré avec succès"))}else r("Erreur lors de la génération du PDF")}catch{r("Erreur lors de la génération du PDF")}finally{p(!1)}},h=()=>{if(n){const a=document.createElement("a");a.href=n,a.download=`${i}_${new Date().toISOString().split("T")[0]}.pdf`,a.click()}},k=()=>{n&&window.open(n,"_blank")};return e.jsxs(se,{children:[e.jsx(te,{title:e.jsxs("div",{className:s.cardTitle,children:[e.jsx(ae,{size:20}),"Générateur de PDF"]})}),e.jsx(ie,{children:e.jsxs("div",{className:s.form,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Modèle de document"}),e.jsx("div",{className:`${s.grid} ${s.grid2}`,children:rt.map(a=>e.jsx("div",{className:s.card,style:{marginBottom:0,cursor:"pointer",border:i===a.id?"2px solid #3b82f6":"1px solid #e2e8f0",backgroundColor:i===a.id?"#eff6ff":"white"},onClick:()=>b(a.id),children:e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:"0.75rem"},children:[e.jsx(ae,{size:24,style:{color:i===a.id?"#3b82f6":"#64748b"}}),e.jsxs("div",{children:[e.jsx("h4",{style:{fontSize:"0.9375rem",fontWeight:600,marginBottom:"0.25rem"},children:a.name}),e.jsx("p",{style:{fontSize:"0.8125rem",color:"#64748b",margin:0},children:a.description})]})]})},a.id))})]}),e.jsxs("div",{className:s.card,style:{marginBottom:0},children:[e.jsx("div",{className:s.cardHeader,style:{marginBottom:"1rem"},children:e.jsxs("h4",{className:s.cardTitle,style:{fontSize:"1rem"},children:[e.jsx(Ee,{size:18}),"Configuration"]})}),e.jsxs("div",{className:`${s.grid} ${s.grid2}`,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Orientation"}),e.jsxs("select",{className:s.formSelect,value:x.pageOrientation,onChange:a=>v({...x,pageOrientation:a.target.value}),children:[e.jsx("option",{value:"portrait",children:"Portrait"}),e.jsx("option",{value:"landscape",children:"Paysage"})]})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Taille du papier"}),e.jsxs("select",{className:s.formSelect,value:x.paperSize,onChange:a=>v({...x,paperSize:a.target.value}),children:[e.jsx("option",{value:"A4",children:"A4"}),e.jsx("option",{value:"A3",children:"A3"}),e.jsx("option",{value:"Letter",children:"Letter"}),e.jsx("option",{value:"Legal",children:"Legal"})]})]})]}),e.jsxs("div",{style:{marginTop:"1rem",display:"flex",gap:"1.5rem"},children:[e.jsxs("label",{className:s.checkbox,children:[e.jsx("input",{type:"checkbox",checked:x.includeCharts,onChange:a=>v({...x,includeCharts:a.target.checked})}),e.jsx("span",{children:"Inclure les graphiques"})]}),e.jsxs("label",{className:s.checkbox,children:[e.jsx("input",{type:"checkbox",checked:x.includeTables,onChange:a=>v({...x,includeTables:a.target.checked})}),e.jsx("span",{children:"Inclure les tableaux"})]})]})]}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsx(C,{variant:"primary",onClick:c,disabled:d||!i,children:d?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:16,className:"animate-spin"}),"Génération..."]}):e.jsxs(e.Fragment,{children:[e.jsx(ae,{size:16}),"Générer le PDF"]})}),n&&e.jsxs(e.Fragment,{children:[e.jsxs(C,{variant:"outline",onClick:k,children:[e.jsx(Ie,{size:16}),"Aperçu"]}),e.jsxs(C,{variant:"outline",onClick:h,children:[e.jsx(Le,{size:16}),"Télécharger"]})]})]}),n&&e.jsx("div",{className:s.card,style:{marginTop:"1rem",marginBottom:0,padding:0,overflow:"hidden"},children:e.jsx("iframe",{src:n,style:{width:"100%",height:"500px",border:"none"},title:"Aperçu PDF"})})]})})]})}function lt(){const i=t.useRef(null),[b,d]=t.useState(!1),[p,n]=t.useState(""),[f,x]=t.useState([]),[v,y]=t.useState(!1),[r,z]=t.useState(!0),[c,h]=t.useState("#000000"),[k,a]=t.useState(2),{showSuccess:T,showError:G,showWarning:H}=ee();t.useEffect(()=>{A(),O()},[]);const O=()=>{const o=i.current;if(!o)return;const g=o.getContext("2d");g&&(g.fillStyle="#ffffff",g.fillRect(0,0,o.width,o.height),g.strokeStyle=c,g.lineWidth=k,g.lineCap="round",g.lineJoin="round")},A=async()=>{z(!0);try{const o=await $.getSignatures();o?.status===200&&x(o.data||[])}catch(o){console.error("Error loading signatures:",o)}finally{z(!1)}},P=o=>{const g=i.current;if(!g)return{x:0,y:0};const S=g.getBoundingClientRect();return"touches"in o?{x:o.touches[0].clientX-S.left,y:o.touches[0].clientY-S.top}:{x:o.clientX-S.left,y:o.clientY-S.top}},F=o=>{const S=i.current?.getContext("2d");if(!S)return;d(!0);const{x:M,y:Y}=P(o);S.beginPath(),S.moveTo(M,Y)},V=o=>{if(!b)return;const S=i.current?.getContext("2d");if(!S)return;const{x:M,y:Y}=P(o);S.strokeStyle=c,S.lineWidth=k,S.lineTo(M,Y),S.stroke()},q=()=>{d(!1)},B=()=>{const o=i.current,g=o?.getContext("2d");!g||!o||(g.fillStyle="#ffffff",g.fillRect(0,0,o.width,o.height))},j=async()=>{if(!p.trim()){H("Veuillez entrer un nom pour la signature");return}const o=i.current;if(o){y(!0);try{const g=o.toDataURL("image/png");(await $.saveSignature({name:p,dataUrl:g}))?.status===200?(T("Signature enregistrée avec succès"),n(""),B(),A()):G("Erreur lors de l'enregistrement")}catch{G("Erreur lors de l'enregistrement")}finally{y(!1)}}},N=async o=>{try{(await $.deleteSignature(o))?.status===200?(T("Signature supprimée"),A()):G("Erreur lors de la suppression")}catch{G("Erreur lors de la suppression")}},u=o=>{const g=document.createElement("a");g.href=o.dataUrl,g.download=`${o.name}.png`,g.click()},_=o=>{const g=i.current,S=g?.getContext("2d");if(!S||!g)return;const M=new Image;M.onload=()=>{S.fillStyle="#ffffff",S.fillRect(0,0,g.width,g.height),S.drawImage(M,0,0)},M.src=o.dataUrl,n(o.name)};return e.jsxs(se,{children:[e.jsx(te,{title:e.jsxs("div",{className:s.cardTitle,children:[e.jsx(ye,{size:20}),"Gestion des signatures"]})}),e.jsx(ie,{children:e.jsxs("div",{className:`${s.grid} ${s.grid2}`,children:[e.jsxs("div",{children:[e.jsx("h4",{style:{fontSize:"1rem",fontWeight:600,marginBottom:"1rem"},children:"Dessiner une signature"}),e.jsx("div",{style:{border:"2px dashed #e2e8f0",borderRadius:"0.5rem",padding:"1rem",backgroundColor:"#f8fafc"},children:e.jsx("canvas",{ref:i,width:400,height:200,style:{width:"100%",maxWidth:"400px",height:"200px",backgroundColor:"white",borderRadius:"0.375rem",cursor:"crosshair",touchAction:"none"},onMouseDown:F,onMouseMove:V,onMouseUp:q,onMouseLeave:q,onTouchStart:F,onTouchMove:V,onTouchEnd:q})}),e.jsxs("div",{style:{display:"flex",gap:"1rem",marginTop:"1rem",alignItems:"center"},children:[e.jsxs("div",{className:s.formGroup,style:{marginBottom:0},children:[e.jsx("label",{className:s.formLabel,style:{marginBottom:"0.25rem"},children:"Couleur"}),e.jsx("input",{type:"color",value:c,onChange:o=>h(o.target.value),style:{width:"40px",height:"32px",cursor:"pointer"}})]}),e.jsxs("div",{className:s.formGroup,style:{marginBottom:0,flex:1},children:[e.jsxs("label",{className:s.formLabel,style:{marginBottom:"0.25rem"},children:["Épaisseur (",k,"px)"]}),e.jsx("input",{type:"range",min:"1",max:"10",value:k,onChange:o=>a(Number(o.target.value)),style:{width:"100%"}})]})]}),e.jsxs("div",{style:{marginTop:"1rem"},children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Nom de la signature"}),e.jsx("input",{type:"text",className:s.formInput,value:p,onChange:o=>n(o.target.value),placeholder:"Ex: Signature Dr. Diallo"})]}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsxs(C,{variant:"outline",onClick:B,children:[e.jsx(Z,{size:16}),"Effacer"]}),e.jsx(C,{variant:"primary",onClick:j,disabled:v,children:v?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:16,className:"animate-spin"}),"Enregistrement..."]}):e.jsxs(e.Fragment,{children:[e.jsx(Re,{size:16}),"Enregistrer"]})})]})]})]}),e.jsxs("div",{children:[e.jsx("h4",{style:{fontSize:"1rem",fontWeight:600,marginBottom:"1rem"},children:"Signatures enregistrées"}),r?e.jsx("div",{className:s.loading,children:e.jsx(U,{size:24,className:"animate-spin"})}):f.length===0?e.jsxs("div",{className:s.emptyState,children:[e.jsx(ye,{size:48}),e.jsx("p",{children:"Aucune signature enregistrée"})]}):e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"0.75rem"},children:f.map(o=>e.jsx("div",{className:s.card,style:{marginBottom:0,padding:"0.75rem"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.75rem"},children:[e.jsx("img",{src:o.dataUrl,alt:o.name,style:{width:"80px",height:"40px",objectFit:"contain",backgroundColor:"white",borderRadius:"0.25rem",border:"1px solid #e2e8f0"}}),e.jsxs("div",{style:{flex:1},children:[e.jsx("p",{style:{fontWeight:500,marginBottom:"0.125rem"},children:o.name}),e.jsx("p",{style:{fontSize:"0.75rem",color:"#64748b"},children:new Date(o.createdAt).toLocaleDateString("fr-FR")})]}),e.jsxs("div",{className:s.actionsCell,children:[e.jsx("button",{className:s.actionBtn,onClick:()=>_(o),title:"Charger",children:e.jsx(qe,{size:16})}),e.jsx("button",{className:s.actionBtn,onClick:()=>u(o),title:"Télécharger",children:e.jsx(Le,{size:16})}),e.jsx("button",{className:`${s.actionBtn} ${s.actionBtnDanger}`,onClick:()=>N(o.id),title:"Supprimer",children:e.jsx(Z,{size:16})})]})]})},o.id))})]})]})})]})}function ct(){const[i,b]=t.useState([]),[d,p]=t.useState(new Set),[n,f]=t.useState("TRUNCATE"),[x,v]=t.useState(!0),[y,r]=t.useState(!1),[z,c]=t.useState(!1),[h,k]=t.useState(""),[a,T]=t.useState(""),{showSuccess:G,showError:H,showWarning:O}=ee(),A="SUPPRIMER";t.useEffect(()=>{P()},[]);const P=async()=>{v(!0);try{const j=await $.getDatabaseEntities();j?.status===200&&b(j.data||[])}catch{H("Erreur lors du chargement des entités")}finally{v(!1)}},F=()=>{d.size===i.length?p(new Set):p(new Set(i.map(j=>j.name)))},V=j=>{const N=new Set(d);N.has(j)?N.delete(j):N.add(j),p(N)},q=()=>{if(d.size===0){O("Veuillez sélectionner au moins une entité");return}k(""),c(!0)},B=async()=>{if(h!==A){O(`Veuillez taper "${A}" pour confirmer`);return}r(!0),T("");try{const j=i.filter(u=>d.has(u.name)),N=await $.truncateDatabase({procide:!0,entities:j,action:n});if(N?.status===200){const u=n==="TRUNCATE"?"vidées":"supprimées";G(`${d.size} table(s) ${u} avec succès`),T(String(N.data)||"Opération terminée avec succès"),p(new Set),c(!1)}else T(String(N?.data)||"Erreur lors de l'opération"),H("Erreur lors de l'opération")}catch{T("Erreur lors de l'exécution de l'opération"),H("Erreur lors de l'opération")}finally{r(!1)}};return e.jsxs(se,{children:[e.jsx(te,{title:e.jsxs("div",{className:s.cardTitle,children:[e.jsx(X,{size:20}),"Tronquer / Supprimer des tables"]})}),e.jsxs(ie,{children:[e.jsxs("div",{className:`${s.alert} ${s.alertDanger}`,style:{marginBottom:"1.5rem"},children:[e.jsx(me,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"Danger !"}),e.jsxs("p",{style:{margin:"0.25rem 0 0 0",fontSize:"0.875rem"},children:["Cette opération est extrêmement dangereuse et irréversible.",e.jsx("br",{}),e.jsx("strong",{children:"TRUNCATE"})," vide le contenu des tables.",e.jsx("br",{}),e.jsx("strong",{children:"DROP"})," supprime complètement les tables."]})]})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Action à effectuer"}),e.jsxs("div",{style:{display:"flex",gap:"1rem"},children:[e.jsxs("label",{className:s.checkbox,style:{padding:"0.75rem 1rem",border:`2px solid ${n==="TRUNCATE"?"#f59e0b":"#e2e8f0"}`,borderRadius:"0.5rem",backgroundColor:n==="TRUNCATE"?"#fef3c7":"transparent"},children:[e.jsx("input",{type:"radio",name:"action",value:"TRUNCATE",checked:n==="TRUNCATE",onChange:()=>f("TRUNCATE")}),e.jsxs("span",{children:[e.jsx("strong",{children:"TRUNCATE"})," - Vider les tables"]})]}),e.jsxs("label",{className:s.checkbox,style:{padding:"0.75rem 1rem",border:`2px solid ${n==="DROP"?"#ef4444":"#e2e8f0"}`,borderRadius:"0.5rem",backgroundColor:n==="DROP"?"#fee2e2":"transparent"},children:[e.jsx("input",{type:"radio",name:"action",value:"DROP",checked:n==="DROP",onChange:()=>f("DROP")}),e.jsxs("span",{children:[e.jsx("strong",{children:"DROP"})," - Supprimer les tables"]})]})]})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsxs("label",{className:s.formLabel,children:["Tables à traiter (",d.size,"/",i.length," sélectionnées)"]}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsx(C,{variant:"ghost",size:"sm",onClick:P,disabled:x,children:e.jsx(U,{size:14,className:x?"animate-spin":""})}),e.jsx(C,{variant:"outline",size:"sm",onClick:F,children:d.size===i.length?e.jsxs(e.Fragment,{children:[e.jsx(Ae,{size:14}),"Désélectionner"]}):e.jsxs(e.Fragment,{children:[e.jsx(De,{size:14}),"Tout sélectionner"]})})]})]}),x?e.jsx("div",{className:s.loading,children:e.jsx(U,{size:24,className:"animate-spin"})}):i.length===0?e.jsxs("div",{className:s.emptyState,children:[e.jsx(X,{size:48}),e.jsx("p",{children:"Aucune entité trouvée"})]}):e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))",gap:"0.5rem",maxHeight:"300px",overflowY:"auto",padding:"0.5rem",border:"1px solid #e2e8f0",borderRadius:"0.5rem"},children:i.map(j=>e.jsxs("label",{className:s.checkbox,style:{padding:"0.5rem 0.75rem",borderRadius:"0.375rem",backgroundColor:d.has(j.name)?"#fee2e2":"transparent",border:`1px solid ${d.has(j.name)?"#ef4444":"transparent"}`},children:[e.jsx("input",{type:"checkbox",checked:d.has(j.name),onChange:()=>V(j.name)}),e.jsx("span",{style:{fontSize:"0.875rem"},children:j.name})]},j.name))})]}),e.jsx("div",{style:{marginTop:"1.5rem"},children:e.jsxs(C,{variant:"danger",onClick:q,disabled:d.size===0,children:[e.jsx(Z,{size:16}),n==="TRUNCATE"?"Vider":"Supprimer"," les tables sélectionnées"]})}),a&&e.jsx("div",{className:`${s.alert} ${s.alertInfo}`,style:{marginTop:"1.5rem"},children:e.jsx("pre",{style:{margin:0,whiteSpace:"pre-wrap",fontFamily:"monospace"},children:a})})]}),e.jsx(ge,{isOpen:z,onClose:()=>c(!1),title:"Confirmation requise",children:e.jsxs("div",{className:s.form,children:[e.jsxs("div",{className:`${s.alert} ${s.alertDanger}`,children:[e.jsx(me,{size:20}),e.jsxs("div",{children:[e.jsx("strong",{children:"ATTENTION !"}),e.jsxs("p",{style:{margin:"0.5rem 0 0 0"},children:["Vous êtes sur le point de"," ",e.jsx("strong",{children:n==="TRUNCATE"?"VIDER":"SUPPRIMER"})," ",e.jsx("strong",{children:d.size})," table(s) :"]}),e.jsxs("ul",{style:{margin:"0.5rem 0",paddingLeft:"1.25rem"},children:[Array.from(d).slice(0,5).map(j=>e.jsx("li",{style:{fontSize:"0.875rem"},children:j},j)),d.size>5&&e.jsxs("li",{style:{fontSize:"0.875rem"},children:["... et ",d.size-5," autres"]})]}),e.jsx("p",{style:{margin:"0.5rem 0 0 0",fontWeight:600},children:"Cette action est IRRÉVERSIBLE !"})]})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsxs("label",{className:s.formLabel,children:["Tapez ",e.jsx("strong",{children:A})," pour confirmer"]}),e.jsx("input",{type:"text",className:s.formInput,value:h,onChange:j=>k(j.target.value),placeholder:A,style:{borderColor:h===A?"#22c55e":void 0}})]}),e.jsxs("div",{className:s.buttonGroup,children:[e.jsx(C,{variant:"outline",onClick:()=>c(!1),children:"Annuler"}),e.jsx(C,{variant:"danger",onClick:B,disabled:h!==A||y,children:y?e.jsxs(e.Fragment,{children:[e.jsx(U,{size:16,className:"animate-spin"}),"Exécution..."]}):e.jsxs(e.Fragment,{children:[e.jsx(Z,{size:16}),n==="TRUNCATE"?"Vider":"Supprimer"," définitivement"]})})]})]})})]})}const dt=[{id:"line",name:"Ligne",icon:e.jsx(Ye,{size:20}),description:"Évolution dans le temps",category:"trend"},{id:"area",name:"Zone",icon:e.jsx(Xe,{size:20}),description:"Évolution avec remplissage",category:"trend"},{id:"bar",name:"Barres",icon:e.jsx(Se,{size:20}),description:"Comparaison de valeurs",category:"comparison"},{id:"pie",name:"Camembert",icon:e.jsx(es,{size:20}),description:"Distribution en parts",category:"composition"},{id:"donut",name:"Anneau",icon:e.jsx(ss,{size:20}),description:"Distribution avec centre vide",category:"composition"},{id:"radar",name:"Radar",icon:e.jsx(ts,{size:20}),description:"Comparaison multidimensionnelle",category:"comparison"},{id:"radialBar",name:"Barres radiales",icon:e.jsx(Pe,{size:20}),description:"Progression circulaire",category:"comparison"},{id:"scatter",name:"Nuage de points",icon:e.jsx(Ne,{size:20}),description:"Corrélation entre variables",category:"distribution"},{id:"composed",name:"Composé",icon:e.jsx(ze,{size:20}),description:"Combinaison de types",category:"other"},{id:"treemap",name:"Treemap",icon:e.jsx(Ne,{size:20}),description:"Hiérarchie en rectangles",category:"composition"},{id:"funnel",name:"Entonnoir",icon:e.jsx(is,{size:20}),description:"Processus séquentiel",category:"other"},{id:"table",name:"Tableau",icon:e.jsx(ns,{size:20}),description:"Données tabulaires",category:"other"}];function xe({title:i,icon:b,items:d,selectedItems:p,onSelectionChange:n,searchPlaceholder:f="Rechercher..."}){const[x,v]=t.useState(!1),[y,r]=t.useState(""),z=t.useMemo(()=>{if(!y)return d;const a=y.toLowerCase();return d.filter(T=>T.name.toLowerCase().includes(a)||T.code?.toLowerCase().includes(a))},[d,y]),c=a=>{p.includes(a)?n(p.filter(T=>T!==a)):n([...p,a])},h=()=>{n(z.map(a=>a.id))},k=()=>{n([])};return e.jsxs("div",{className:E.dimensionSelector,children:[e.jsxs("button",{type:"button",className:E.dimensionHeader,onClick:()=>v(!x),children:[e.jsx("span",{className:E.dimensionIcon,children:b}),e.jsx("span",{className:E.dimensionTitle,children:i}),e.jsx("span",{className:E.dimensionCount,children:p.length>0&&e.jsx("span",{className:E.countBadge,children:p.length})}),x?e.jsx(as,{size:16}):e.jsx(rs,{size:16})]}),x&&e.jsxs("div",{className:E.dimensionContent,children:[e.jsxs("div",{className:E.dimensionSearch,children:[e.jsx(_e,{size:16}),e.jsx("input",{type:"text",placeholder:f,value:y,onChange:a=>r(a.target.value)}),y&&e.jsx("button",{type:"button",onClick:()=>r(""),children:e.jsx(Ge,{size:14})})]}),e.jsxs("div",{className:E.dimensionActions,children:[e.jsx("button",{type:"button",onClick:h,children:"Tout sélectionner"}),e.jsx("button",{type:"button",onClick:k,children:"Tout désélectionner"})]}),e.jsxs("div",{className:E.dimensionItems,children:[z.map(a=>e.jsxs("label",{className:E.dimensionItem,children:[e.jsx("input",{type:"checkbox",checked:p.includes(a.id),onChange:()=>c(a.id)}),e.jsx("span",{className:E.itemName,children:a.name}),a.code&&e.jsx("span",{className:E.itemCode,children:a.code})]},a.id)),z.length===0&&e.jsx("div",{className:E.noResults,children:"Aucun résultat"})]})]})]})}function ve({title:i,items:b,allItems:d,onRemove:p,placeholder:n="Glissez des éléments ici"}){const f=x=>d.find(y=>y.id===x)?.name||x;return e.jsxs("div",{className:E.layoutZone,children:[e.jsx("div",{className:E.layoutZoneHeader,children:i}),e.jsx("div",{className:E.layoutZoneContent,children:b.length===0?e.jsx("div",{className:E.layoutPlaceholder,children:n}):b.map(x=>e.jsxs("div",{className:E.layoutItem,children:[e.jsx(os,{size:14}),e.jsx("span",{children:f(x)}),e.jsx("button",{type:"button",onClick:()=>p(x),className:E.removeItemBtn,children:e.jsx(Ge,{size:14})})]},x))})]})}const E={container:"viz-container",dimensionSelector:"viz-dimension-selector",dimensionHeader:"viz-dimension-header",dimensionIcon:"viz-dimension-icon",dimensionTitle:"viz-dimension-title",dimensionCount:"viz-dimension-count",countBadge:"viz-count-badge",dimensionContent:"viz-dimension-content",dimensionSearch:"viz-dimension-search",dimensionActions:"viz-dimension-actions",dimensionItems:"viz-dimension-items",dimensionItem:"viz-dimension-item",itemName:"viz-item-name",itemCode:"viz-item-code",noResults:"viz-no-results",layoutZone:"viz-layout-zone",layoutZoneHeader:"viz-layout-zone-header",layoutZoneContent:"viz-layout-zone-content",layoutPlaceholder:"viz-layout-placeholder",layoutItem:"viz-layout-item",removeItemBtn:"viz-remove-item-btn"};function mt(){const{showSuccess:i,showError:b}=ee(),[d,p]=t.useState("dashboard"),[n,f]=t.useState("bar"),[x,v]=t.useState("Nouvelle visualisation"),[y,r]=t.useState(""),[z,c]=t.useState(["de1","de2","de3"]),[h,k]=t.useState([]),[a,T]=t.useState(["LAST_6_MONTHS"]),[G,H]=t.useState(["ou1","ou2","ou3"]),[O,A]=t.useState(["LAST_6_MONTHS"]),[P,F]=t.useState(["de1","de2","de3"]),[V,q]=t.useState(["ou1"]),[B,j]=t.useState([]),[N,u]=t.useState([]),[_,o]=t.useState([]),[g,S]=t.useState([]),[M,Y]=t.useState([]),[w,J]=t.useState({title:"Évolution des consultations",subtitle:"Par type de service",showLegend:!0,showTooltip:!0,showGrid:!0,stacked:!1,animation:!0}),ue=t.useCallback(()=>{const{items:l}=ne.list("visualizations",{sortBy:"updatedAt",sortDir:"desc"});Y(l)},[]);t.useEffect(()=>{try{ms();const{items:l}=ne.list("visualization_data_elements"),{items:L}=ne.list("visualization_indicators"),{items:R}=ne.list("visualization_periods"),{items:D}=ne.list("visualization_org_units");j(l),u(L),o(R),S(D),ue()}catch(l){console.error("[VisualizationsTab] Failed to load local data",l),b("Impossible de charger les données locales pour les visualisations.")}},[ue,b]);const re=t.useMemo(()=>[...B,...N,..._,...g],[B,N,_,g]),he=t.useMemo(()=>M.filter(l=>l.type===d),[M,d]),m=t.useMemo(()=>{const l=[...z,...h];return a.length>0,n==="pie"||n==="donut"||n==="treemap"||n==="funnel"||n==="radialBar"?l.slice(0,6).map((R,D)=>({name:(B.find(Q=>Q.id===R)||N.find(Q=>Q.id===R))?.name||R,value:Math.floor(Math.random()*500)+100,color:ce.primary[D%ce.primary.length]})):n==="radar"?G.slice(0,5).map(R=>{const K={subject:g.find(Q=>Q.id===R)?.name||R};return l.slice(0,3).forEach(Q=>{const le=B.find(Be=>Be.id===Q);K[le?.name||Q]=Math.floor(Math.random()*100)+20}),K}):n==="scatter"?Array.from({length:20},(R,D)=>({name:`Point ${D+1}`,x:Math.floor(Math.random()*100),y:Math.floor(Math.random()*100),z:Math.floor(Math.random()*50)+10})):["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"].slice(0,6).map(R=>{const D={name:R};return l.slice(0,4).forEach(K=>{const Q=B.find(le=>le.id===K)||N.find(le=>le.id===K);D[Q?.name||K]=Math.floor(Math.random()*300)+50}),D})},[z,h,a,G,n]),I=t.useMemo(()=>[...z,...h].slice(0,4).map((L,R)=>{const D=B.find(K=>K.id===L)||N.find(K=>K.id===L);return{dataKey:D?.name||L,name:D?.name||L,color:ce.primary[R%ce.primary.length],type:n==="composed"?R===0?"bar":"line":void 0}}),[z,h,n]),W=t.useCallback(()=>{const l={name:x,description:y,type:d,chartType:n,columns:[{dimension:"pe",items:O}],rows:[{dimension:"dx",items:P}],filters:[{dimension:"ou",items:V}],options:w};console.log("Saving visualization:",l);const L=new Date().toISOString(),R={id:`viz-${Date.now()}`,createdAt:L,updatedAt:L,...l};try{ne.create("visualizations",R),Y(D=>[R,...D])}catch(D){console.error("[VisualizationsTab] Failed to save visualization",D),b("Impossible de sauvegarder la visualisation.");return}i(`Visualisation sauvegardée : "${x}"`)},[x,y,d,n,O,P,V,w,i,b]),oe=t.useCallback(()=>{v("Nouvelle visualisation"),r(""),f("bar"),c([]),k([]),T(["THIS_MONTH"]),H([]),A([]),F([]),q([]),J({showLegend:!0,showTooltip:!0,showGrid:!0,stacked:!1,animation:!0})},[]),pe=()=>{if(n==="table")return e.jsx("div",{className:s.tableContainer,children:e.jsxs("table",{className:s.table,children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Indicateur"}),["Jan","Fév","Mar","Avr","Mai","Jun"].map(D=>e.jsx("th",{children:D},D))]})}),e.jsx("tbody",{children:I.slice(0,5).map(D=>e.jsxs("tr",{children:[e.jsx("td",{children:D.name}),Array.from({length:6},(K,Q)=>e.jsx("td",{children:Math.floor(Math.random()*300)+50},Q))]},D.dataKey))})]})});const l={data:m,height:350,title:w.title,subtitle:w.subtitle,legend:{enabled:w.showLegend},tooltip:{enabled:w.showTooltip},grid:{horizontal:w.showGrid,vertical:!1},animation:{enabled:w.animation},colors:ce.primary},L=["pie","donut","radialBar","treemap","funnel"].includes(n),R=["line","area","bar","radar","scatter","composed"].includes(n);return e.jsx(us,{type:n,...l,series:R?I:void 0,dataKey:L?"value":void 0,nameKey:L?"name":void 0,xAxis:{dataKey:n==="radar"?void 0:"name"},options:{stacked:w.stacked,polarAngleAxisKey:n==="radar"?"subject":void 0,xAxisKey:n==="scatter"?"x":void 0,yAxisKey:n==="scatter"?"y":void 0}})};return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
      `}),e.jsxs("div",{className:E.container,children:[e.jsxs("div",{className:s.card,children:[e.jsx("div",{className:s.cardHeader,children:e.jsxs("h2",{className:s.cardTitle,children:[e.jsx(ze,{size:24}),"Créateur de visualisation"]})}),e.jsx("div",{className:s.form,children:e.jsxs("div",{className:`${s.grid} ${s.grid2}`,children:[e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Nom de la visualisation"}),e.jsx("input",{type:"text",className:s.formInput,value:x,onChange:l=>v(l.target.value),placeholder:"Entrez un nom..."})]}),e.jsxs("div",{className:s.formGroup,children:[e.jsx("label",{className:s.formLabel,children:"Description (optionnel)"}),e.jsx("input",{type:"text",className:s.formInput,value:y,onChange:l=>r(l.target.value),placeholder:"Décrivez votre visualisation..."})]})]})})]}),e.jsxs("div",{className:"viz-content",children:[e.jsxs("div",{className:"viz-sidebar",children:[e.jsxs("div",{className:"viz-section",children:[e.jsxs("div",{className:"viz-section-title",children:[e.jsx(ae,{size:18}),"Type de visualisation"]}),e.jsxs("div",{className:"viz-type-selector",children:[e.jsxs("button",{type:"button",className:`viz-type-option ${d==="dashboard"?"viz-type-option-active":""}`,onClick:()=>p("dashboard"),children:[e.jsx(Ke,{size:24}),e.jsx("span",{children:"Tableau de bord"})]}),e.jsxs("button",{type:"button",className:`viz-type-option ${d==="report"?"viz-type-option-active":""}`,onClick:()=>p("report"),children:[e.jsx(ae,{size:24}),e.jsx("span",{children:"Rapport"})]})]})]}),e.jsxs("div",{className:"viz-section",children:[e.jsxs("div",{className:"viz-section-title",children:[e.jsx(ze,{size:18}),"Visualisations sauvegardées"]}),e.jsx("div",{className:"viz-saved-list",children:he.length===0?e.jsx("div",{className:"viz-saved-empty",children:"Aucune visualisation pour ce type."}):he.map(l=>e.jsxs("div",{className:"viz-saved-item",children:[e.jsx("div",{className:"viz-saved-item-title",children:l.name}),l.description&&e.jsx("div",{className:"viz-saved-item-description",children:l.description}),e.jsxs("div",{className:"viz-saved-item-meta",children:[e.jsx("span",{children:l.chartType}),e.jsx("span",{children:"•"}),e.jsx("span",{children:new Date(l.updatedAt).toLocaleDateString()})]})]},l.id))})]}),e.jsxs("div",{className:"viz-section",children:[e.jsxs("div",{className:"viz-section-title",children:[e.jsx(Se,{size:18}),"Type de graphique"]}),e.jsx("div",{className:"viz-chart-type-grid",children:dt.map(l=>e.jsxs("button",{type:"button",className:`viz-chart-type-card ${n===l.id?"viz-chart-type-card-active":""}`,onClick:()=>f(l.id),title:l.description,children:[l.icon,e.jsx("span",{children:l.name})]},l.id))})]}),e.jsxs("div",{className:"viz-section",children:[e.jsxs("div",{className:"viz-section-title",children:[e.jsx(X,{size:18}),"Dimensions de données"]}),e.jsx(xe,{title:"Éléments de données",icon:e.jsx(X,{size:16}),items:B,selectedItems:z,onSelectionChange:c,searchPlaceholder:"Rechercher un élément..."}),e.jsx(xe,{title:"Indicateurs",icon:e.jsx(Pe,{size:16}),items:N,selectedItems:h,onSelectionChange:k,searchPlaceholder:"Rechercher un indicateur..."}),e.jsx(xe,{title:"Périodes",icon:e.jsx(Qe,{size:16}),items:_,selectedItems:a,onSelectionChange:T,searchPlaceholder:"Rechercher une période..."}),e.jsx(xe,{title:"Unités d'organisation",icon:e.jsx(Ze,{size:16}),items:g,selectedItems:G,onSelectionChange:H,searchPlaceholder:"Rechercher une unité..."})]})]}),e.jsxs("div",{className:"viz-main-area",children:[e.jsxs("div",{className:"viz-section",children:[e.jsxs("div",{className:"viz-section-title",children:[e.jsx(Ne,{size:18}),"Configuration de la mise en page"]}),e.jsxs("div",{className:"viz-layout-section",children:[e.jsx(ve,{title:"Colonnes",items:O,allItems:re,onRemove:l=>A(O.filter(L=>L!==l)),placeholder:"Colonnes"}),e.jsx(ve,{title:"Lignes",items:P,allItems:re,onRemove:l=>F(P.filter(L=>L!==l)),placeholder:"Lignes"}),e.jsx(ve,{title:"Filtres",items:V,allItems:re,onRemove:l=>q(V.filter(L=>L!==l)),placeholder:"Filtres"})]}),e.jsxs("div",{className:s.alert+" "+s.alertInfo,style:{margin:"0 1rem 1rem"},children:[e.jsx(Je,{size:18}),e.jsxs("div",{children:[e.jsx("strong",{children:"Astuce :"})," Sélectionnez des éléments dans les dimensions ci-dessus, puis réorganisez-les dans les zones Colonnes, Lignes et Filtres pour personnaliser l'affichage de vos données."]})]})]}),e.jsxs("div",{className:"viz-section",children:[e.jsxs("div",{className:"viz-section-title",children:[e.jsx(Ee,{size:18}),"Options d'affichage"]}),e.jsxs("div",{className:"viz-options-panel",children:[e.jsx("div",{className:"viz-option-row",children:e.jsxs("label",{children:["Titre:",e.jsx("input",{type:"text",value:w.title||"",onChange:l=>J({...w,title:l.target.value}),placeholder:"Titre du graphique"})]})}),e.jsx("div",{className:"viz-option-row",children:e.jsxs("label",{children:["Sous-titre:",e.jsx("input",{type:"text",value:w.subtitle||"",onChange:l=>J({...w,subtitle:l.target.value}),placeholder:"Sous-titre du graphique"})]})}),e.jsxs("div",{className:"viz-option-row",children:[e.jsxs("label",{children:[e.jsx("input",{type:"checkbox",checked:w.showLegend,onChange:l=>J({...w,showLegend:l.target.checked})}),"Afficher la légende"]}),e.jsxs("label",{children:[e.jsx("input",{type:"checkbox",checked:w.showTooltip,onChange:l=>J({...w,showTooltip:l.target.checked})}),"Afficher l'infobulle"]}),e.jsxs("label",{children:[e.jsx("input",{type:"checkbox",checked:w.showGrid,onChange:l=>J({...w,showGrid:l.target.checked})}),"Afficher la grille"]}),e.jsxs("label",{children:[e.jsx("input",{type:"checkbox",checked:w.stacked,onChange:l=>J({...w,stacked:l.target.checked})}),"Empilé"]}),e.jsxs("label",{children:[e.jsx("input",{type:"checkbox",checked:w.animation,onChange:l=>J({...w,animation:l.target.checked})}),"Animation"]})]})]})]}),e.jsxs("div",{className:"viz-preview-section",children:[e.jsxs("div",{className:"viz-preview-header",children:[e.jsxs("h3",{children:[e.jsx(Ie,{size:18}),"Aperçu"]}),e.jsxs("button",{type:"button",className:`${s.btn} ${s.btnOutline} ${s.btnSmall}`,onClick:()=>{c([...z])},children:[e.jsx(U,{size:16}),"Actualiser"]})]}),e.jsx("div",{className:"viz-preview-content",children:pe()}),e.jsxs("div",{className:"viz-actions",children:[e.jsxs("button",{type:"button",className:`${s.btn} ${s.btnPrimary}`,onClick:W,children:[e.jsx(Re,{size:18}),"Sauvegarder"]}),e.jsxs("button",{type:"button",className:`${s.btn} ${s.btnOutline}`,onClick:oe,children:[e.jsx(Z,{size:18}),"Réinitialiser"]})]})]})]})]})]})]})}const ut=[{id:"API_ACCESS",label:"API d'accès",icon:e.jsx(je,{size:18}),color:"#3b82f6"},{id:"DB_CONNECTION",label:"Connexion BD",icon:e.jsx(be,{size:18}),color:"#0ea5e9"},{id:"DATABASE",label:"Base de données",icon:e.jsx(X,{size:18}),color:"#22c55e"},{id:"DELETE_COUCHDB",label:"Supprimer CouchDB",icon:e.jsx(Z,{size:18}),color:"#f59e0b",danger:!0},{id:"VISUALIZATIONS",label:"Visualisations",icon:e.jsx(Se,{size:18}),color:"#14b8a6"},{id:"PDF_GENERATOR",label:"Générateur PDF",icon:e.jsx(ae,{size:18}),color:"#8b5cf6"},{id:"SIGNATURE",label:"Signature",icon:e.jsx(ye,{size:18}),color:"#06b6d4"},{id:"TRUNCATE_DATABASE",label:"Tronquer BD",icon:e.jsx(me,{size:18}),color:"#ef4444",danger:!0}];function Nt(){const[i,b]=t.useState("API_ACCESS"),d=n=>{b(n)},p=()=>{const n=(()=>{switch(i){case"API_ACCESS":return e.jsx(st,{});case"DB_CONNECTION":return e.jsx(tt,{});case"DATABASE":return e.jsx(it,{});case"DELETE_COUCHDB":return e.jsx(at,{});case"VISUALIZATIONS":return e.jsx(mt,{});case"PDF_GENERATOR":return e.jsx(ot,{});case"SIGNATURE":return e.jsx(lt,{});case"TRUNCATE_DATABASE":return e.jsx(ct,{});default:return null}})();return e.jsx(cs.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},exit:{opacity:0,y:-20},transition:{duration:.2},children:n},i)};return e.jsxs(ds,{title:"Administration",subtitle:"Configuration et maintenance du système",children:[e.jsx("div",{className:s.tabsContainer,children:e.jsx("div",{className:s.tabs,children:ut.map(n=>e.jsxs("button",{className:`${s.tab} ${i===n.id?s.tabActive:""} ${n.danger?s.tabDanger:""}`,onClick:()=>d(n.id),style:{"--tab-color":n.color},children:[e.jsx("span",{className:s.tabIcon,children:n.icon}),e.jsx("span",{className:s.tabLabel,children:n.label})]},n.id))})}),e.jsx("div",{className:s.tabContent,children:e.jsx(ls,{mode:"wait",children:p()})})]})}export{Nt as default};
