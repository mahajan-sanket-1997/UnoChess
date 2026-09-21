import React,{useEffect,useMemo,useState}from"react";
import{createRoot}from"react-dom/client";
import"./styles.css";

const C=["#ff3b5c","#3385ff","#24d477","#ffb020"],N=["RED","BLUE","GREEN","YELLOW"];
const PIECES=[{name:"QUEEN",symbol:"♛"},{name:"ROOK",symbol:"♜"},{name:"BISHOP",symbol:"♝"},{name:"KNIGHT",symbol:"♞"}];
const START=[0,7,56,63],TARGET=[63,56,7,0];

const mk=()=>{let d=[];for(const c of["red","blue","green","yellow"]){for(let n=1;n<10;n++)for(let i=0;i<2;i++)d.push({type:"number",value:n,color:c});d.push({type:"skip",value:"SKIP",color:c},{type:"reverse",value:"↻",color:c},{type:"+2",value:"+2",color:c})}for(let i=0;i<4;i++)d.push({type:"+4",value:"+4",color:"wild"});return d};
const sh=a=>{a=[...a];for(let i=a.length-1;i;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const rc=i=>[Math.floor(i/8),i%8],idx=(r,c)=>r*8+c;

function legalMoves(piece,from,occupied){
 const [r,c]=rc(from),out=[];
 const add=(rr,cc)=>{if(rr<0||rr>7||cc<0||cc>7)return false;const q=idx(rr,cc);if(occupied.has(q))return false;out.push(q);return true};
 const slide=(dr,dc)=>{let rr=r+dr,cc=c+dc;while(rr>=0&&rr<8&&cc>=0&&cc<8){const q=idx(rr,cc);if(occupied.has(q))break;out.push(q);rr+=dr;cc+=dc}};
 if(piece==="KNIGHT")[[1,2],[1,-2],[-1,2],[-1,-2],[2,1],[2,-1],[-2,1],[-2,-1]].forEach(([a,b])=>add(r+a,c+b));
 if(piece==="KING")for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)if(a||b)add(r+a,c+b);
 if(piece==="ROOK")[[1,0],[-1,0],[0,1],[0,-1]].forEach(x=>slide(...x));
 if(piece==="BISHOP")[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(x=>slide(...x));
 if(piece==="QUEEN")[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(x=>slide(...x));
 return out;
}

function App(){
 const[p,setP]=useState(4),[pos,setPos]=useState(START),[alive,setAlive]=useState([true,true,true,true]),[turn,setTurn]=useState(0),[dir,setDir]=useState(1),[deck,setDeck]=useState(()=>sh(mk())),[discard,setDiscard]=useState([]),[card,setCard]=useState(),[moves,setMoves]=useState(0),[winner,setWinner]=useState(null),[selected,setSelected]=useState(null),[log,setLog]=useState(["Welcome to UNO Chess. Draw a card!"]),[anim,setAnim]=useState(null);
 const active=useMemo(()=>Array.from({length:p},(_,i)=>i),[p]);
 const occupied=useMemo(()=>new Map(pos.map((x,i)=>[x,i]).filter(([_,i])=>alive[i])),[pos,alive]);
 const legal=useMemo(()=>moves&&alive[turn]?legalMoves(PIECES[turn].name,pos[turn],new Set([...occupied.keys()].filter(x=>x!==pos[turn]))):[],[moves,turn,pos,occupied,alive]);
 const lg=x=>setLog(l=>[x,...l].slice(0,6));
 const reset=()=>{setPos(START.slice());setAlive([true,true,true,true]);setTurn(0);setDir(1);setDeck(sh(mk()));setDiscard([]);setCard();setMoves(0);setWinner(null);setSelected(null);setAnim(null);setLog(["New game started. Draw a card!"])};
 const next=(skip=false)=>{let t=turn;for(let i=0;i<p;i++){t=(t+dir*(skip?2:1)+p*8)%p;if(alive[t])break}setTurn(t);setCard();setMoves(0);setSelected(null)};
 const draw=()=>{if(moves||winner!==null)return;let d=deck;if(!d.length){d=sh(discard);setDiscard([])}const c=d[0];setDeck(d.slice(1));setDiscard(x=>[c,...x]);setCard(c);
   if(c.type==="number"){setMoves(c.value);lg(N[turn]+" drew "+c.value+": "+c.value+" chess moves available.")}
   else if(c.type==="skip"){lg(N[turn]+" drew SKIP.");setTimeout(()=>next(true),500)}
   else if(c.type==="reverse"){setDir(x=>-x);lg(N[turn]+" drew REVERSE. Direction flipped.");setTimeout(next,600)}
   else{setPos(START.slice());setAlive([true,true,true,true].map((_,i)=>i<p));setMoves(0);lg(N[turn]+" drew "+c.type+": all pieces revived at their starts!");setTimeout(next,750)}
 };
 const move=to=>{if(!moves||winner!==null||!legal.includes(to))return;const from=pos[turn];setSelected(to);setAnim({p:turn});setTimeout(()=>{setPos(q=>{let z=[...q];const victim=Array.from(occupied.entries()).find(([sq,who])=>sq===to&&who!==turn);if(victim){const [,who]=victim;z[who]=-1;setAlive(a=>a.map((v,i)=>i===who?false:v));}z[turn]=to;return z});setMoves(m=>m-1);setAnim(null);if(to===TARGET[turn]){setWinner(turn);lg("🏆 "+N[turn]+" reached the finish!")}else if(moves-1===0)setTimeout(next,350);},220)};
 useEffect(()=>{const f=e=>{if(e.code==="Space")draw()};addEventListener("keydown",f);return()=>removeEventListener("keydown",f)},[moves,winner,turn,deck,discard]);
 return <div className="app"><header><div className="logo"><span>UNO</span><b>CHESS</b><small>CARD-POWERED CHESS BATTLE</small></div><button className="new" onClick={reset}>↻ NEW GAME</button></header>
 <main><section><div className="hud"><div className="pill"><i style={{background:C[turn]}}/>{N[turn]}'S TURN · {PIECES[turn].symbol} {PIECES[turn].name}</div><div className="pill">DIRECTION <b>{dir===1?"→":"←"}</b></div><label className="pill">PLAYERS <select value={p} onChange={e=>{const n=+e.target.value;setP(n);setPos(START.slice());setAlive([true,true,true,true].map((_,i)=>i<n));setTurn(0);setMoves(0);setCard();}}><option>2</option><option>3</option><option>4</option></select></label></div>
 <div className="board">{Array.from({length:64},(_,i)=>{let r=Math.floor(i/8),c=Math.floor(i%8),who=occupied.get(i),isLegal=legal.includes(i);return <button key={i} className={"sq "+((r+c)%2?"dark":"light")+" "+(i===TARGET[turn]?"target ":"")+(isLegal?"legal ":"")+(selected===i?"selected":"")} onClick={()=>isLegal&&move(i)}>{i===TARGET[turn]&&<span className="flag">★</span>}{who!==undefined&&<div className={"piece "+(anim?.p===who?"moving":"")} style={{"--c":C[who]}}><span>{PIECES[who].symbol}</span><small>{who+1}</small></div>}</button>})}</div>
 <div className="players">{active.map(x=><div className={(turn===x?"player active":"player")+" "+(!alive[x]?"dead":"")}><i style={{background:C[x]}}/><b>{N[x]} · {PIECES[x].symbol}</b><small>{alive[x]?"POS "+(pos[x]+1):"CAPTURED"}</small></div>)}</div></section>
 <aside><div className="panel"><h3>CURRENT CARD</h3><div className={"card "+(card?.color||"wild")+" "+(card?"show":"")}><strong>{card?card.value:"?"}</strong><small>{card?(card.type==="number"?card.value+" CHESS MOVES":card.type):"DRAW"}</small></div><button className="draw" disabled={moves>0||winner!==null} onClick={draw}>DRAW CARD</button></div>
 <div className="panel"><h3>YOUR MOVES</h3><div className="moves">{moves}<small>CHESS MOVES LEFT</small></div><p className="hint">{moves?"Select a highlighted square for your next legal chess move.":"Draw a number card to get moves."}</p></div>
 <div className="panel rules"><h3>UNO POWERS</h3><p><b>1–9</b> Number = that many chess moves</p><p><b>SKIP</b> Skip current turn</p><p><b>↻</b> Reverse direction</p><p><b>+2 / +4</b> Revive all pieces at start</p><p><b>♛♜♝♞</b> Real chess movement rules</p></div><div className="panel"><h3>BATTLE LOG</h3>{log.map(x=><p className="log">{x}</p>)}</div></aside></main>
 {winner!==null&&<div className="winner"><div><div className="stars">✦ ✦ ✦</div><div className="winpiece">{PIECES[winner].symbol}</div><h1>{N[winner]} WINS!</h1><p>Reached the opposite corner.</p><button onClick={reset}>PLAY AGAIN</button></div></div>}</div>
}
createRoot(document.getElementById("root")).render(<App/>);