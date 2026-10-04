// Session-only novelty: no browser storage or backend required.
export function variedSelection(items, count, seed, previousIds = []) {
 let value=[...String(seed)].reduce((sum,char)=>(Math.imul(sum,31)+char.charCodeAt(0))>>>0,17)
 const shuffled=[...items]
 for(let i=shuffled.length-1;i>0;i--) {
  value=(Math.imul(value,1664525)+1013904223)>>>0
  const j=value%(i+1); [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]
 }
 const previous=new Set(previousIds)
 return [...shuffled.filter(item=>!previous.has(item.id)),...shuffled.filter(item=>previous.has(item.id))].slice(0,count)
}
