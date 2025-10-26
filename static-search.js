(function(){const l=document.getElementById("search-input");if(!l)return;const r=document.getElementById("search-results"),i=document.getElementById("search-clear");let u=[];async function f(){try{u=await(await fetch("/search-index.json")).json()}catch(e){console.error("Failed to load search index:",e),u=[]}}function d(e){return(e||"").toLowerCase().trim()}function h(e,s){const t=d(s),n=d(e.title),a=d((e.tags||[]).join(" ")),o=d(e.snippet||"");let c=0;return n.includes(t)&&(c+=10),n.startsWith(t)&&(c+=5),a.includes(t)&&(c+=5),o.includes(t)&&(c+=1),c}function x(e){const s=new Date(e),t=String(s.getDate()).padStart(2,"0"),a=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][s.getMonth()],o=s.getFullYear();return`${t} ${a} ${o}`}function m(e){return e==="pt-BR"||e==="pt"?"\u{1F1E7}\u{1F1F7}":e==="en"?"\u{1F1FA}\u{1F1F8}":""}function b(e){if(e.length===0){r.innerHTML=`
        <div class="px-8 py-10 text-center text-base-content/60">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-base-content/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p class="text-lg font-semibold text-base-content/60 mb-2">No articles found</p>
          <p class="text-sm text-base-content/40">Try different keywords</p>
        </div>
      `;return}const s=e.map(t=>{const n=(t.tags||[]).slice(0,3),a=t.snippet||t.description||"",o=a.length>80?a.substring(0,80)+"...":a;return`
        <a href="/articles/${t.slug}.html" class="block px-4 py-4 mb-2 last:mb-0 bg-base-200/30 hover:bg-base-200 rounded-xl transition-all duration-200 group">
          <div class="flex flex-col gap-3">
            <h3 class="font-semibold text-base text-base-content group-hover:text-primary transition-colors leading-snug line-clamp-2">${t.title}</h3>
            ${o?`<p class="text-sm text-base-content/70 leading-relaxed line-clamp-2">${o}</p>`:""}
            <div class="flex flex-wrap items-center gap-3 text-xs text-base-content/60">
              <span class="font-medium">${x(t.published_at)}</span>
              ${t.language?`<span class="flex items-center gap-1.5"><span class="w-1 h-1 rounded-full bg-base-content/30"></span>${m(t.language)}</span>`:""}
              ${n.length>0?`<span class="flex items-center gap-2">${n.map(c=>`<span class="px-2.5 py-1 bg-yellow-100 group-hover:bg-yellow-200 rounded-full transition-colors">${c}</span>`).join("")}</span>`:""}
            </div>
          </div>
        </a>
      `}).join("");r.innerHTML=s}function v(e){if(!e||e.length<2){r.classList.add("hidden");return}const s=window.blogFilters?window.blogFilters.getFilters():{lang:"all"},t=u.map(n=>({item:n,score:h(n,e)})).filter(({score:n,item:a})=>{if(n===0)return!1;if(s.lang!=="all"){const o=a.language||"en";return s.lang==="pt"?o==="pt-BR"||o==="pt":o===s.lang}return!0}).sort((n,a)=>a.score-n.score).slice(0,5).map(({item:n})=>n);b(t),r.classList.remove("hidden")}function p(){i&&(l.value.length>0?i.classList.remove("hidden"):i.classList.add("hidden"))}i&&i.addEventListener("click",()=>{l.value="",r.classList.add("hidden"),p(),l.focus()}),l.addEventListener("input",e=>{v(e.target.value),p()}),document.addEventListener("click",e=>{!l.contains(e.target)&&!r.contains(e.target)&&r.classList.add("hidden")}),document.addEventListener("keydown",e=>{e.key==="Escape"&&(r.classList.add("hidden"),l.blur())});async function g(){await f()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",g):g()})();
