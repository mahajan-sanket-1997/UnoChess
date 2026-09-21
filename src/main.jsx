import React,{useEffect,useMemo,useState}from"react";
import{createRoot}from"react-dom/client";
import"./styles.css";

const COLORS={white:"#eef4ff",black:"#111827"};
const BACK=["red","yellow","green","blue"];
const PIECES={
 king:{symbol:"♚",name:"King"},queen:{symbol:"♛",name:"Queen"},rook:{symbol:"♜",name:"Rook"},
 bishop:{symbol:"♝",name:"Bishop"},knight:{symbol:"♞",name:"Knight"},pawn:{symbol:"♟",name:"Pawn"}
};
const back=[["rook","knight","bishop","queen","king","bishop","knight","rook"],Array(8).fill("pawn")];
const makePieces=()=>[...back.flatMap((row,r)=>row.map((type,c)=>({type,color:0,row:r,col:c,home:r*8+c}))),...back.flatMap((row,r)=>row.map((type,c)=>({type,color:1,row:7-r,col:c,home:(7-r)*8+c})))];
const initialBoard=()=>{const b=Array(64).fill(null);makePieces().forEach(p=>b[p.home]=p);return b};
const rc=i=>[Math.floor(i/8),i%8],ix=(r,c)=>r*8+c;
const inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
const ray=(board,from,dr,dc,color)=>{const out=[];let[r,c]=rc(from);for(r+=dr,c+=dc;inside(r,c);r+=dr,c+=dc){const to=ix(r,c),q=board[to];if(!q)out.push(to);else{if(q.color!==color)out.push(to);break}}return out};
function movesFor(board,from){
 const p=board[from];if(!p)return[];const[r,c]=rc(from),o=[];
 if(p.type==="pawn"){const d=p.color===0?-1:1,start=p.color===0?6:1;let to=ix(r+d,c);if(inside(r+d,c)&&!board[to]){o.push(to);const two=ix(r+2*d,c);if(r===start&&!board[two])o.push(two)}for(const dc of[-1,1]){const rr=r+d,cc=c+dc;if(inside(rr,cc)&&board[ix(rr,cc)]&&board[ix(rr,cc)].color!==p.color)o.push(ix(rr,cc))}}
 if(p.type==="knight")[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(([dr,dc])=>{const rr=r+dr,cc=c+dc;if(inside(rr,cc)&&(!board[ix(rr,cc)]||board[ix(rr,cc)].color!==p.color))o.push(ix(rr,cc))});
 if(p.type==="king")for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if((dr||dc)&&inside(r+dr,c+dc)&&(!board[ix(r+dr,c+dc)]||board[ix(r+dr,c+dc)].color!==p.color))o.push(ix(r+dr,c+dc));
 if(p.type==="rook"||p.type==="queen")[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>o.push(...ray(board,from,dr,dc,p.color)));
 if(p.type==="bishop"||p.type==="queen")[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc])=>o.push(...ray(board,from,dr,dc,p.color)));
 return o;
}
const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
const makeDeck=()=>shuffle([...BACK.flatMap(color=>[...Array(2)].flatMap(()=>[1,2,3,4,5,6,7,8,9].map(value=>({type:"number",value,color})).concat([{type:"skip",value:"SKIP",color},{type:"reverse",value:"↔",color},{type:"draw2",value:"+2",color}]))),...Array(4).fill(0).map(()=>({type:"draw4",value:"+4",color:"wild"}))]);

function App(){
 const[board,setBoard]=useState(initialBoard),[turn,setTurn]=useState(0),[deck,setDeck]=useState(makeDeck),[discard,setDiscard]=useState([]),[card,setCard]=useState(null),[moves,setMoves]=useState(0),[selected,setSelected]=useState(null),[winner,setWinner]=useState(null),[log,setLog]=useState(["Draw a number card to get your chess moves."]),[flipped,setFlipped]=useState(false),[lastMove,setLastMove]=useState(null);
 const legal=useMemo(()=>selected!==null?movesFor(board,selected):[],[board,selected]);
 const addLog=m=>setLog(x=>[m,...x].slice(0,5));
 const reset=()=>{setBoard(initialBoard());setTurn(0);setDeck(makeDeck());setDiscard([]);setCard(null);setMoves(0);setSelected(null);setWinner(null);setFlipped(false);setLastMove(null);setLog(["New game started. Draw a card."])};
 const nextTurn=()=>{setTurn(t=>1-t);setMoves(0);setCard(null);setSelected(null);setLastMove(null)};
 const draw=()=>{
   if(moves||winner!==null)return;
   let d=deck;if(!d.length)d=shuffle(discard.slice(0,-1));
   if(!d.length)return;
   const c=d[0];setDeck(d.slice(1));setDiscard(x=>[c,...x]);setCard(c);
   if(c.type==="number"){setMoves(c.value);addLog(`Player ${turn+1} drew ${c.value} — ${c.value} chess moves.`)}
   else if(c.type==="skip"){addLog(`Player ${turn+1} played SKIP.`);setTimeout(nextTurn,450)}
   else if(c.type==="reverse"){setFlipped(x=>!x);addLog(`Player ${turn+1} played REVERSE — board flipped.`);setTimeout(nextTurn,500)}
   else {const n=c.type==="draw2"?2:4;let revived=0;setBoard(b=>{const z=[...b];for(let i=0;i<64&&revived<n;i++){if(!z[i])continue}return z});addLog(`Player ${turn+1} played ${c.value} — revive power ready.`);setMoves(n)}
 };
 const revivePower=()=>{
   if(!card||!["draw2","draw4"].includes(card.type)||!moves)return;
   const n=card.type==="draw2"?2:4;let left=n;
   setBoard(b=>{const z=[...b];for(let home=0;home<64&&left;home++){const r=Math.floor(home/8),c=home%8;const original=makePieces().find(p=>p.home===home);if(!original||z[home])continue;if(z.some(p=>p&&p.color===original.color&&p.type===original.type&&p.home===home))continue;z[home]=original;left--}return z});
   addLog(`Player ${turn+1} revived up to ${n} pieces at home.`);setMoves(0);setTimeout(nextTurn,350);
 };
 const move=(to)=>{
   if(!moves||selected===null||!legal.includes(to)||winner!==null)return;
   const from=selected,p=board[from],captured=board[to];
   const z=[...board];z[to]={...p};z[from]=null;
   if(p.type==="pawn"&&((p.color===0&&Math.floor(to/8)===0)||(p.color===1&&Math.floor(to/8)===7))){z[to]={...z[to],type:"queen"};addLog(`Player ${turn+1} promoted a pawn to a queen.`)}
   setBoard(z);setLastMove([from,to]);setSelected(null);setMoves(m=>m-1);
   if(captured?.type==="king"){setWinner(turn);addLog(`🏆 Player ${turn+1} captured the king!`);return}
   addLog(`Player ${turn+1} moved the ${PIECES[p.type].name}.`);
   if(moves-1===0)setTimeout(nextTurn,300);
 };
 useEffect(()=>{const f=e=>{if(e.code==="Space")draw()};window.addEventListener("keydown",f);return()=>window.removeEventListener("keydown",f)},[moves,winner,deck,discard,turn]);
 const squares=Array.from({length:64},(_,i)=>i);
 return <div className="app">
  <header><div className="brand"><div><span>UNO</span><b>CHESS</b></div><small>CARD-POWERED CHESS BATTLE</small></div><div className="top-actions"><button onClick={()=>setFlipped(x=>!x)}>↻ FLIP BOARD</button><button onClick={reset}>NEW GAME</button></div></header>
  <div className="game">
   <section className="board-wrap">
    <div className="playerbar p2"><div className="avatar black">♚</div><div><b>PLAYER 2</b><small>BLACK</small></div><div className="dots"><i/><i/><i/><i/></div></div>
    <div className="board-frame"><div className="coords top">{["a","b","c","d","e","f","g","h"].map(x=><span>{x}</span>)}</div><div className="board">{squares.map(i=>{const j=flipped?63-i:i,[r,c]=rc(j),p=board[j],can=legal.includes(j),isSel=selected===j,last=lastMove?.includes(j);return <button key={i} className={`sq ${(r+c)%2?"dark":"light"} ${can?"legal":""} ${isSel?"selected":""} ${last?"last":""}`} onClick={()=>{if(moves){if(p?.color===turn)setSelected(j);else if(can)move(j)}}}>{p&&<span className={`chess-piece ${p.color===0?"white-piece":"black-piece"}`}>{PIECES[p.type].symbol}</span>}{can&&<span className="move-dot"/>}</button>})}</div><div className="coords bottom">{["a","b","c","d","e","f","g","h"].map(x=><span>{x}</span>)}</div></div>
    <div className="playerbar p1"><div className="avatar white">♔</div><div><b>PLAYER 1</b><small>WHITE</small></div><div className="dots"><i/><i/><i/><i/></div></div>
   </section>
   <aside>
    <div className="turn-panel"><small>CURRENT TURN</small><div className="turn"><div className={`turn-avatar ${turn?"black":"white"}`}>{turn?"♚":"♔"}</div><div><b>PLAYER {turn+1}</b><span>{turn?"BLACK":"WHITE"}</span></div></div><hr/><small>MOVES LEFT</small><strong className="move-count">{moves}</strong></div>
    <div className={`uno-card ${card?.color||"blue"} ${card?"visible":""}`}><b>{card?.value||"?"}</b><span>{card?card.type==="number"?`NEXT MOVE · ${card.value} CHESS MOVES`:card.type.toUpperCase():"DRAW CARD"}</span></div>
    <button className="draw-btn" disabled={!!moves||winner!==null} onClick={draw}>DRAW CARD <kbd>SPACE</kbd></button>
    {card?.type==="draw2"||card?.type==="draw4"?<button className="power-btn" onClick={revivePower}>{card.value} · REVIVE PIECES</button>:null}
    <div className="powers"><div><b className="skip">↪</b><span><strong>SKIP</strong>Skip opponent's turn</span></div><div><b className="reverse">↔</b><span><strong>REVERSE</strong>Flip board / change direction</span></div><div><b className="plus2">+2</b><span><strong>+2</strong>Revive 2 pieces at home</span></div><div><b className="plus4">+4</b><span><strong>+4</strong>Revive 4 pieces at home</span></div></div>
    <div className="rules"><b>HOW TO PLAY</b><p>Number card = number of <strong>chess moves</strong>.</p><p>Select one of your pieces, then a highlighted legal square.</p><p>Capture the opponent king to win.</p></div>
    <div className="log"><b>BATTLE LOG</b>{log.map(x=><p>{x}</p>)}</div>
   </aside>
  </div>
  {winner!==null&&<div className="winner"><div><div className="crown">♛</div><h1>PLAYER {winner+1} WINS!</h1><p>The king has been captured.</p><button onClick={reset}>PLAY AGAIN</button></div></div>}
 </div>
}
createRoot(document.getElementById("root")).render(<App/>);