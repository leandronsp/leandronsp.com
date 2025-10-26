(function(){const c=document.getElementById("search-input");if(!c)return;const r=document.getElementById("search-results");let d=[];async function p(){try{d=await(await fetch("/search-index.json")).json()}catch(t){console.error("Failed to load search index:",t),d=[]}}function i(t){return(t||"").toLowerCase().trim()}function g(t,s){const e=i(s),n=i(t.title),a=i((t.tags||[]).join(" ")),o=i(t.snippet||"");let l=0;return n.includes(e)&&(l+=10),n.startsWith(e)&&(l+=5),a.includes(e)&&(l+=5),o.includes(e)&&(l+=1),l}function f(t){const s=new Date(t),e=String(s.getDate()).padStart(2,"0"),a=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][s.getMonth()],o=s.getFullYear();return`${e} ${a} ${o}`}function h(t){return t==="pt-BR"||t==="pt"?"\u{1F1E7}\u{1F1F7}":t==="en"?"\u{1F1FA}\u{1F1F8}":""}function x(t){if(t.length===0){r.innerHTML=`
        <div class="px-8 py-10 text-center text-base-content/60">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto mb-3 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p class="font-semibold text-sm mb-1">No articles found</p>
          <p class="text-xs text-base-content/50">Try different keywords</p>
        </div>
      `;return}const s=t.map(e=>{const n=(e.tags||[]).slice(0,3),a=e.snippet||e.description||"",o=a.length>80?a.substring(0,80)+"...":a;return`
        <a href="/articles/${e.slug}.html" class="block px-4 py-4 mb-2 last:mb-0 bg-base-200/30 hover:bg-base-200 rounded-xl transition-all duration-200 group">
          <div class="flex flex-col gap-3">
            <h3 class="font-semibold text-base text-base-content group-hover:text-primary transition-colors leading-snug line-clamp-2">${e.title}</h3>
            ${o?`<p class="text-sm text-base-content/70 leading-relaxed line-clamp-2">${o}</p>`:""}
            <div class="flex flex-wrap items-center gap-3 text-xs text-base-content/60">
              <span class="font-medium">${f(e.published_at)}</span>
              ${e.language?`<span class="flex items-center gap-1.5"><span class="w-1 h-1 rounded-full bg-base-content/30"></span>${h(e.language)}</span>`:""}
              ${n.length>0?`<span class="flex items-center gap-2">${n.map(l=>`<span class="px-2.5 py-1 bg-yellow-100 group-hover:bg-yellow-200 rounded-full transition-colors">${l}</span>`).join("")}</span>`:""}
            </div>
          </div>
        </a>
      `}).join("");r.innerHTML=s}function m(t){if(!t||t.length<2){r.classList.add("hidden");return}const s=window.blogFilters?window.blogFilters.getFilters():{lang:"all"},e=d.map(n=>({item:n,score:g(n,t)})).filter(({score:n,item:a})=>{if(n===0)return!1;if(s.lang!=="all"){const o=a.language||"en";return s.lang==="pt"?o==="pt-BR"||o==="pt":o===s.lang}return!0}).sort((n,a)=>a.score-n.score).slice(0,5).map(({item:n})=>n);x(e),r.classList.remove("hidden")}c.addEventListener("input",t=>{m(t.target.value)}),document.addEventListener("click",t=>{!c.contains(t.target)&&!r.contains(t.target)&&r.classList.add("hidden")}),document.addEventListener("keydown",t=>{t.key==="Escape"&&(r.classList.add("hidden"),c.blur())});async function u(){await p()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",u):u()})();
