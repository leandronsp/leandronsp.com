(function(){let n=1,s=1,i=[];function g(){const t=new URLSearchParams(window.location.search);return{page:parseInt(t.get("page"))||1}}function m(t){const e=new URLSearchParams(window.location.search);t===1?e.delete("page"):e.set("page",t);const a=e.toString()?`${window.location.pathname}?${e.toString()}`:window.location.pathname;window.history.pushState({},"",a)}function c(){i=Array.from(document.querySelectorAll(".article-card"))}function b(){const t=i.filter(e=>e.style.display!=="none"&&!e.classList.contains("pinned-article"));s=Math.max(1,Math.ceil(t.length/10)),n>s&&(n=s)}function h(){b();const t=g(),e=t.page<=s?t.page:1;l(e,!1)}function l(t,e=!0){n=t;const a=i.find(o=>o.style.display!=="none"&&o.classList.contains("pinned-article")),r=i.filter(o=>o.style.display!=="none"&&!o.classList.contains("pinned-article")),d=(t-1)*10,p=d+10;i.forEach(o=>{o.classList.add("hidden")}),a&&a.classList.remove("hidden"),r.forEach((o,u)=>{u>=d&&u<p&&o.classList.remove("hidden")}),f(),v(r.length===0),m(t)}function f(){const t=document.getElementById("pagination-container");if(!t)return;const e=document.getElementById("current-page"),a=document.getElementById("total-pages");e&&(e.textContent=n),a&&(a.textContent=s);const r=i.filter(o=>o.style.display!=="none");if(s<=1){t.innerHTML="";return}const d=Math.min((n-1)*10+1,r.length),p=Math.min(n*10,r.length);t.innerHTML=`
      <div class="flex items-center justify-center gap-6 mt-16">
        <button class="px-4 py-3 rounded-full border-2 border-base-300 bg-base-100 hover:bg-base-200 hover:border-primary/30 text-base-content transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-base-100 disabled:hover:border-base-300 cursor-pointer shadow-sm" id="prev-page" onclick="window.pagination.prevPage()" aria-label="Previous page">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 pointer-events-none" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
        </button>

        <span class="text-base text-base-content/80 font-medium px-4">
          Page ${n} of ${s}
        </span>

        <button class="px-4 py-3 rounded-full border-2 border-base-300 bg-base-100 hover:bg-base-200 hover:border-primary/30 text-base-content transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-base-100 disabled:hover:border-base-300 cursor-pointer shadow-sm" id="next-page" onclick="window.pagination.nextPage()" aria-label="Next page">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 pointer-events-none" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
          </svg>
        </button>
      </div>
    `,w()}function w(){const t=document.getElementById("prev-page"),e=document.getElementById("next-page");t&&(t.disabled=n===1),e&&(e.disabled=n===s)}function v(t){let e=document.getElementById("empty-state");if(t){if(!e){const a=document.querySelector("main");a&&(e=document.createElement("div"),e.id="empty-state",e.className="text-center py-16",a.appendChild(e))}e&&(e.innerHTML=`
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-base-content/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p class="text-lg font-semibold text-base-content/60 mb-2">No articles found</p>
          <p class="text-sm text-base-content/40">Try adjusting your filters</p>
        `)}else e&&e.remove()}function y(){n<s&&l(n+1)}function E(){n>1&&l(n-1)}window.pagination={nextPage:y,prevPage:E,handleSearch:h},document.readyState==="loading"?document.addEventListener("DOMContentLoaded",c):c()})();
