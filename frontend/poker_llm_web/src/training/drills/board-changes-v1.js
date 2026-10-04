import { Hand } from '../../utils/pokersolver.js'
const pair=(zh,en)=>({zh,en})
const display=cards=>cards.map(card=>card[0]+({s:'♠',h:'♥',d:'♦',c:'♣'})[card[1]]).join(' ')
const names={'High Card':'高牌',Pair:'一对','Two Pair':'两对','Three of a Kind':'三条',Straight:'顺子',Flush:'同花','Full House':'葫芦','Four of a Kind':'四条','Straight Flush':'同花顺'}
export const BOARD_CASES = [
  {hole:['Ah','Kh'],flop:['Qh','7h','2c'],turns:['Jh','Jd'],note:pair('只替换转牌花色：五张红桃成花；换成方片后同花仍未完成。','Only turn suit changes: five hearts make a flush; replacing the heart with a diamond leaves the flush incomplete.')},
  {hole:['9s','8s'],flop:['7d','6c','2h'],turns:['5h','Qs'],note:pair('5 补齐 5–9 的顺子；Q 没有补齐这条顺子。','A five completes the five-to-nine straight; a queen does not.')},
  {hole:['As','Ad'],flop:['Ac','7d','2s'],turns:['7h','9h'],note:pair('牌面配对 7 时，三张 A 加两张 7 组成葫芦；9 不会形成这副葫芦。','Pairing the board’s seven makes aces full of sevens; a nine does not make that full house.')},
  {hole:['Ks','Qd'],flop:['Kh','7s','2c'],turns:['Ah','Kd'],note:pair('A 出现时 K 对仍是一对，但从顶对降为第二对；K 出现时改善成三条。牌型名称不能单独表示对对手范围的相对强度。','An ace leaves a pair of kings but demotes top pair to second pair; another king makes trips. Hand category alone does not describe strength against a range.')},
  {hole:['Ah','7d'],flop:['Ac','7s','2h'],turns:['7h','2c'],note:pair('7 使两对改善成葫芦；2 虽然也使牌面配对，但最佳五张仍为两对。','A seven improves two pair to a full house. A deuce also pairs the board, but the best five-card hand is still two pair.')},
  {hole:['Qs','Jd'],flop:['Ts','9c','2h'],turns:['Kh','3d'],note:pair('K 完成 9–K 的顺子；3 在此案例中没有改善成牌。空白牌的意义仍取决于双方范围。','A king completes the nine-to-king straight; a three does not improve the made hand here. The meaning of a blank still depends on both ranges.')}
]
export const BOARD_CHANGE_LAB={version:'board-changes-v1',title:pair('牌面变化练习','Board changes'),intro:pair('12 道转牌练习，每轮三个案例及条件变化，共 6 题。观察成花、成顺、牌面配对、高张与空白牌如何改变当前牌力；不把牌型直接映射成下注建议。','12 turn exercises. Each round has three cases and their changed conditions, six questions total. Observe flushes, straights, paired boards, overcards and blanks; hand categories do not directly prescribe betting.'),lessons:BOARD_CASES.map((item,index)=>({id:`board-case-${index}`,steps:item.turns.map((turn,step)=>{
 const cards=[...item.hole,...item.flop,turn]
 const name=Hand.solve(cards).name
 const initialNotes=[
  pair('转牌补齐五张红桃，同花听牌已完成。','The turn completes five hearts, making the flush.'),
  pair('转牌 5 与手牌、翻牌补齐 5–9 的顺子。','The five connects with the hole cards and flop to complete a five-to-nine straight.'),
  pair('牌面配对 7，三张 A 与两张 7 组成葫芦。','Pairing the board’s seven makes three aces and two sevens: a full house.'),
  pair('A 出现后，K 对从顶对降为第二对，牌型仍是一对。','The ace demotes the king pair from top pair to second pair, while its category remains one pair.'),
  pair('7 让原来的两对改善为三张 7 与两张 A 的葫芦。','The seven improves the original two pair to sevens full of aces.'),
  pair('K 与 QJ、T9 补齐 9–K 的顺子。','The king connects with QJ and T9 to complete the nine-to-king straight.')
 ]
 const note=step?item.note:initialNotes[index]
 const others=Object.keys(names).filter(candidate=>candidate!==name)
 const choices=[name,...others.slice(index%4,index%4+3)]
 const offset=(index+step)%choices.length
 return {id:`board-${index}-${step}`,cards,expectedName:name,title:pair(`${step?'改变一个条件 · ':''}转牌之后，最佳五张是什么牌型？`,`${step?'Change one condition · ':''}What is the best five-card hand after the turn?`),context:pair(`Hero：${display(item.hole)}。翻牌：${display(item.flop)}。转牌：${display([turn])}。${step?'仅替换转牌，手牌与翻牌保持不变。':''}还有一张河牌未发出。`,`Hero: ${display(item.hole)}. Flop: ${display(item.flop)}. Turn: ${display([turn])}. ${step?'Only the turn changes; hole cards and flop stay fixed.':''} The river has not been dealt.`),options:[...choices.slice(offset),...choices.slice(0,offset)].map(choice=>({id:choice,label:pair(names[choice],choice)})),correctId:name,explanation:pair(`当前最佳五张为${names[name]}。${note.zh} 当前成牌不等于摊牌胜率，未来河牌与对手范围仍可能改变判断。`,`The current best five-card hand is ${name}. ${note.en} Made-hand category is not showdown equity; the river and opponent range can still change the assessment.`)}
})}))}
