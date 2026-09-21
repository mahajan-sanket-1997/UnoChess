import React,{useEffect,useMemo,useState}from"react";
import{createRoot}from"react-dom/client";
import"./styles.css";

const BACK=["red","yellow","green","blue"];
const PIECES={king:{symbol:"♚",name:"King"},queen:{symbol:"♛",name:"Queen"},rook:{symbol:"♜",name:"Rook"},bishop:{symbol:"♝",name:"Bishop"},knight:{symbol:"♞",name:"Knight"},pawn:{symbol:"♟",name:"Pawn"}};
const back=[["rook","knight","bishop","queen","king","bishop","knight","rook"],Array(8).fill("pawn")];
const makePieces=()=>[...back.flatMap((row,r)=>row.map((type,c)=>({type,color:1,row:r,col:c,home:r*8+c}))),...back.flatMap((row,r)=>row.map((type,c)=>({type,color:0,row:7-r,col:c,home:(7-r)*8+c})))];
const initialBoard=()=>{const b=Array(64).fill(null);makePieces().forEach(p=>b[p.home]=p);return b};
const rc=i=>[Math.floor(i/8),i%8],ix=(r,c)=>r*8+c,inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
const shuffle=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};

function pseudoMoves(board,from,attacksOnly=false){
 const p=board[from];if(!p)return[];const[r,c]=rc(from),o=[];const add=to=>{const q=board[to];if(!q||q.color!==p.color)o.push(to)};
 if(p.type==="pawn"){const d=(p.color===player1Color?1:-1);if(attacksOnly){for(const dc of[-1,1]){const rr=r+d,cc=c+dc;if(inside(rr,cc))o.push(ix(rr,cc))}}else{const one=r+d,start=p.color===0?6:1;if(inside(one,c)&&!board[ix(one,c)]){o.push(ix(one,c));const two=r+d*2;if(r===start&&inside(two,c)&&!board[ix(two,c)])o.push(ix(two,c))}for(const dc of[-1,1]){const rr=r+d,cc=c+dc;if(inside(rr,cc)){const q=board[ix(rr,cc)];if(q&&q.color!==p.color&&q.type!=="king")o.push(ix(rr,cc))}}}}
 if(p.type==="knight")[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(([dr,dc])=>{const rr=r+dr,cc=c+dc;if(inside(rr,cc))add(ix(rr,cc))});
 if(p.type==="king")for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if((dr||dc)&&inside(r+dr,c+dc)){const to=ix(r+dr,c+dc);if(attacksOnly)o.push(to);else add(to)}
 const ray=(dr,dc)=>{let rr=r+dr,cc=c+dc;while(inside(rr,cc)){const to=ix(rr,cc),q=board[to];if(!q)o.push(to);else{if(q.color!==p.color)o.push(to);break}rr+=dr;cc+=dc}};
 if(p.type==="rook"||p.type==="queen")[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>ray(dr,dc));
 if(p.type==="bishop"||p.type==="queen")[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr,dc])=>ray(dr,dc));
 return o;
}
function kingIndex(board,color){return board.findIndex(p=>p?.color===color&&p.type==="king")}
function isSquareAttacked(board,square,byColor){for(let i=0;i<64;i++)if(board[i]?.color===byColor&&pseudoMoves(board,i,true).includes(square))return true;return false}
function isInCheck(board,color){const k=kingIndex(board,color);return k>=0&&isSquareAttacked(board,k,1-color)}
function legalMovesFor(board,from){const p=board[from];if(!p)return[];return pseudoMoves(board,from,false).filter(to=>{const z=[...board];if(z[to]?.type==="king")return false;z[to]={...p};z[from]=null;return!isInCheck(z,p.color)})}
function allLegalMoves(board,color){const out=[];for(let i=0;i<64;i++)if(board[i]?.color===color)for(const to of legalMovesFor(board,i))out.push([i,to]);return out}
const makeDeck=()=>{const numbers=shuffle(BACK.flatMap(color=>[1,2,3].map(value=>({type:"number",value,color}))));const specials=shuffle([...BACK.flatMap(color=>[{type:"skip",value:"SKIP",color},{type:"reverse",value:"↔",color},{type:"draw2",value:"+2",color}]),...Array(4).fill(0).map(()=>({type:"draw4",value:"+4",color:"wild"}))]);return shuffle([...numbers,...specials])};

function App(){
 const[mode,setMode]=useState(null),[board,setBoard]=useState(initialBoard),[turn,setTurn]=useState(0),[player1Color,setPlayer1Color]=useState(0),[deck,setDeck]=useState(makeDeck),[discard,setDiscard]=useState([]),[card,setCard]=useState(null),[moves,setMoves]=useState(0),[selected,setSelected]=useState(null),[winner,setWinner]=useState(null),[status,setStatus]=useState(""),[log,setLog]=useState(["Draw a card to start. Number cards give 1–3 chess moves."]),[flipped,setFlipped]=useState(false),[lastMove,setLastMove]=useState(null);

 const activeColor=turn===0?player1Color:1-player1Color;
 const playerColor=player=>player===0?player1Color:1-player1Color;
 const legal=useMemo(()=>selected!==null&&board[selected]?.color===activeColor?legalMovesFor(board,selected):[],[board,selected,activeColor]);
 const inCheck=isInCheck(board,activeColor),checkmate=inCheck&&allLegalMoves(board,activeColor).length===0,stalemate=!inCheck&&allLegalMoves(board,activeColor).length===0;
 const addLog=m=>setLog(x=>[m,...x].slice(0,7));
 const reset=()=>{setBoard(initialBoard());setTurn(0);setDeck(makeDeck());setDiscard([]);setCard(null);setMoves(0);setSelected(null);setWinner(null);setStatus("");setFlipped(false);setPlayer1Color(0);setLastMove(null);setLog(["New game started. Draw a card."]);setMode(null)};
 const nextTurn=()=>{setTurn(t=>1-t);setMoves(0);setCard(null);setSelected(null);setLastMove(null);setStatus("")};

 useEffect(()=>{if(winner!==null)return;if(checkmate){const winningPlayer=1-turn;setWinner(winningPlayer);setStatus("CHECKMATE");addLog(`♔ CHECKMATE — Player ${winningPlayer+1} wins.`)}else if(stalemate){setWinner("draw");setStatus("STALEMATE");addLog("STALEMATE — the game is a draw.")}else if(inCheck)setStatus("CHECK");else setStatus("")},[board,turn,winner,checkmate,stalemate,inCheck]);

 const draw=()=>{
   if(moves||winner!==null||turn!==0&&mode==="computer")return;
   let d=deck;if(!d.length)d=shuffle(discard.slice(1));if(!d.length)return;
   const c=d[0];setDeck(d.slice(1));setDiscard(x=>[c,...x]);setCard(c);
   if(c.type==="number"){setMoves(c.value);addLog(`Player ${turn+1} drew ${c.value} — ${c.value} chess moves.`)}
   else if(c.type==="skip"){addLog(`Player ${turn+1} played SKIP — opponent loses the turn.`);setTimeout(nextTurn,500)}
   else if(c.type==="reverse"){setFlipped(x=>!x);setPlayer1Color(x=>1-x);setBoard(x=>x.map(p=>p?p.color===0?{...p,color:1}:{...p,color:0}:null));addLog(`Player ${turn+1} played REVERSE — board flipped and sides swapped.`);setTimeout(nextTurn,600)}
   else{const n=c.type==="draw2"?2:4;setMoves(n);addLog(`Player ${turn+1} played ${c.value} — ${n} chess moves.`)}
 };

 const move=(to)=>{
   if(!moves||selected===null||!legal.includes(to)||winner!==null)return;
   const from=selected,p=board[from],captured=board[to];if(captured?.type==="king")return;
   const z=[...board];z[to]={...p};z[from]=null;
   if(p.type==="pawn"&&((p.color===0&&Math.floor(to/8)===0)||(p.color===1&&Math.floor(to/8)===7)))z[to]={...z[to],type:"queen"};
   setBoard(z);setLastMove([from,to]);setSelected(null);setMoves(m=>m-1);
   addLog(p.type==="pawn"&&z[to].type==="queen"?`Player ${turn+1} promoted a pawn to a queen.`:`Player ${turn+1} moved the ${PIECES[p.type].name}.`);
   const nextMoves=moves-1;const opponentColor=1-activeColor;
   if(isInCheck(z,opponentColor))addLog(`⚠️ Player ${turn===0?2:1} is in CHECK.`);
   if(isInCheck(z,opponentColor)&&allLegalMoves(z,opponentColor).length===0){setWinner(turn);setStatus("CHECKMATE");addLog(`♔ CHECKMATE — Player ${turn+1} wins.`);return}
   if(nextMoves===0)setTimeout(nextTurn,350);
 };

 // Computer: draw its own card, then make random legal chess moves one at a time.
 useEffect(()=>{
   if(mode!=="computer"||turn!==1||winner!==null)return;
   if(!moves){const t=setTimeout(()=>{let d=deck;if(!d.length)d=shuffle(discard.slice(1));if(!d.length)return;const c=d[0];setDeck(d.slice(1));setDiscard(x=>[c,...x]);setCard(c);if(c.type==="number"){setMoves(c.value);addLog(`🤖 Computer drew ${c.value} — ${c.value} moves.`)}else if(c.type==="skip"){addLog("🤖 Computer played SKIP.");setTimeout(nextTurn,600)}else if(c.type==="reverse"){setFlipped(x=>!x);setPlayer1Color(x=>1-x);setBoard(x=>x.map(p=>p?p.color===0?{...p,color:1}:{...p,color:0}:null));addLog("🤖 Computer played REVERSE — board flipped and sides swapped.");setTimeout(nextTurn,700)}else{const n=c.type==="draw2"?2:4;setMoves(n);addLog(`🤖 Computer played ${c.value} — ${n} moves.`)}},800);return()=>clearTimeout(t)}
   const t=setTimeout(()=>{
     const choices=allLegalMoves(board,activeColor);if(!choices.length)return;
     const [from,to]=choices[Math.floor(Math.random()*choices.length)];
     const p=board[from],z=[...board];z[to]={...p};z[from]=null;
     if(p.type==="pawn"&&Math.floor(to/8)===7)z[to]={...z[to],type:"queen"};
     setBoard(z);setLastMove([from,to]);setMoves(m=>m-1);
     addLog(`🤖 Computer moved the ${PIECES[p.type].name}.`);
     const opponentColor=1-activeColor;
     if(isInCheck(z,opponentColor))addLog("⚠️ Player 1 is in CHECK.");
     if(isInCheck(z,opponentColor)&&allLegalMoves(z,opponentColor).length===0){setWinner(1);setStatus("CHECKMATE");addLog("♔ CHECKMATE — Computer wins.");return}
     if(moves-1===0)setTimeout(nextTurn,400);
   },650);return()=>clearTimeout(t)
 },[mode,turn,activeColor,winner,moves,board,deck,discard]);

 useEffect(()=>{const f=e=>{if(e.code==="Space")draw()};window.addEventListener("keydown",f);return()=>window.removeEventListener("keydown",f)},[moves,winner,deck,discard,turn,mode]);
 const squares=Array.from({length:64},(_,i)=>i);

 return <div className="app">
  <header><div className="brand"><div><span>UNO</span><b>CHESS</b></div><small>CARD-POWERED CHESS BATTLE</small></div><div className="top-actions"><button onClick={()=>setFlipped(x=>!x)}>↻ FLIP BOARD</button><button onClick={reset}>NEW GAME</button></div></header>
  <div className="game">
   <section className="board-wrap">
    <div className="playerbar p2"><div className={`avatar ${playerColor(1)?"black":"white"}`}>{playerColor(1)?"♚":"♔"}</div><div><b>PLAYER 2</b><small>{mode==="computer"?`COMPUTER · ${playerColor(1)===0?"WHITE":"BLACK"}`:`${playerColor(1)===0?"WHITE":"BLACK"}`}</small></div><div className="dots"><i/><i/><i/><i/></div></div>
    <div className="board-frame"><div className="coords top">{["a","b","c","d","e","f","g","h"].map(x=><span>{x}</span>)}</div><div className="board">{squares.map(i=>{const j=flipped?63-i:i,[r,c]=rc(j),p=board[j],can=legal.includes(j),isSel=selected===j,last=lastMove?.includes(j);return <button key={i} className={`sq ${(r+c)%2?"dark":"light"} ${can?"legal":""} ${isSel?"selected":""} ${last?"last":""}`} onClick={()=>{if(p?.color===activeColor&&!(mode==="computer"&&turn===1)){setSelected(j);return}if(moves&&selected!==null&&can)move(j)}}>{p&&<span className={`chess-piece ${p.color===0?"white-piece":"black-piece"}`}>{PIECES[p.type].symbol}</span>}{can&&<span className="move-dot"/>}</button>})}</div><div className="coords bottom">{["a","b","c","d","e","f","g","h"].map(x=><span>{x}</span>)}</div></div>
    <div className="playerbar p1"><div className={`avatar ${player1Color?"black":"white"}`}>{player1Color?"♚":"♔"}</div><div><b>PLAYER 1</b><small>{player1Color===0?"WHITE":"BLACK"} · YOU</small></div><div className="dots"><i/><i/><i/><i/></div></div>
   </section>
   <aside>
    <div className="turn-panel"><small>CURRENT TURN</small><div className="turn"><div className={`turn-avatar ${activeColor?"black":"white"}`}>{activeColor?"♚":"♔"}</div><div><b>{mode==="computer"&&turn===1?"COMPUTER":`PLAYER ${turn+1}`}</b><span>{activeColor?"BLACK":"WHITE"}</span></div></div><hr/><small>MOVES LEFT</small><strong className="move-count">{moves}</strong>{status&&<div className={`status ${status.toLowerCase()}`}>{status}</div>}</div>
    <div className={`uno-card ${card?.color||"blue"} ${card?"visible":""}`}><b>{card?.value||"?"}</b><span>{card?card.type==="number"?`NUMBER · ${card.value} CHESS MOVES`:card.type.toUpperCase():"DRAW CARD"}</span></div>
    <button className="draw-btn" disabled={!!moves||winner!==null||!mode||turn===1&&mode==="computer"} onClick={draw}>{turn===1&&mode==="computer"?"COMPUTER TURN":"DRAW CARD"} <kbd>SPACE</kbd></button>
    <div className="move-help">{moves?<>Select a highlighted legal destination. <strong>{moves} move{moves===1?"":"s"} left.</strong></>:<>Draw a card first. Number cards are limited to 1–3.</>}</div>
    <div className="powers"><div><b className="skip">↪</b><span><strong>SKIP</strong>Skip opponent's turn</span></div><div><b className="reverse">↔</b><span><strong>REVERSE</strong>Flip board / change direction</span></div><div><b className="plus2">+2</b><span><strong>+2</strong>Play 2 chess moves</span></div><div><b className="plus4">+4</b><span><strong>+4</strong>Play 4 chess moves</span></div></div>
    <div className="rules"><b>HOW TO PLAY</b><p>Number cards are only <strong>1, 2 or 3</strong>.</p><p>SKIP skips the opponent's turn. REVERSE flips the board and swaps White/Black control.</p><p>+2 and +4 give 2 or 4 chess moves.</p><p>Chess rules apply: you cannot leave your own king in check.</p><p>King is never captured. Checkmate wins; stalemate is a draw.</p></div>
    <div className="log"><b>BATTLE LOG</b>{log.map((x,i)=><p key={i}>{x}</p>)}</div>
   </aside>
  </div>
  {winner!==null&&<div className="winner"><div><div className="crown">{winner==="draw"?"½":"♛"}</div><h1>{winner==="draw"?"STALEMATE":`PLAYER ${winner+1} WINS!`}</h1><p>{winner==="draw"?"No legal moves remain and the king is not in check.":"CHECKMATE — the king has no legal escape."}</p><button onClick={reset}>PLAY AGAIN</button></div></div>}
  {!mode&&<div className="mode-modal"><div className="mode-card"><div className="mode-icon">♞</div><h1>CHOOSE YOUR OPPONENT</h1><p>Player 1 is White and starts at the bottom.</p><div className="mode-options"><button onClick={()=>setMode("human")}><strong>👥 TWO PLAYERS</strong><span>Play against another person</span></button><button onClick={()=>setMode("computer")}><strong>🤖 COMPUTER</strong><span>Player 2 is a random-move bot</span></button></div></div></div>}
 </div>
}
createRoot(document.getElementById("root")).render(<App/>);