(function(){let e=1,i=1,l=[];function g(){l=Array.from(document.querySelectorAll(".article-card")),u();const t=sessionStorage.getItem("homepage-state");if(t)try{const n=JSON.parse(t);if(o(n.page||1),n.search){const a=document.getElementById("search-input");a&&(a.value=n.search,a.dispatchEvent(new Event("input",{bubbles:!0})))}}catch{o(1)}else o(1)}function u(){const t=l.filter(n=>n.style.display!=="none");i=Math.max(1,Math.ceil(t.length/10)),e>i&&(e=i)}function f(){e=1,u(),o(1)}function o(t){e=t;const n=l.filter(s=>s.style.display!=="none"),a=(t-1)*10,c=a+10;l.forEach(s=>{s.classList.add("hidden")}),n.forEach((s,d)=>{d>=a&&d<c&&s.classList.remove("hidden")}),p(),m();const r=document.getElementById("articles-container");r&&(r.scrollTop=0)}function m(){const t=document.getElementById("search-input"),n={page:e,search:t?t.value:""};sessionStorage.setItem("homepage-state",JSON.stringify(n))}function p(){const t=document.getElementById("pagination-container");if(!t)return;const n=document.getElementById("current-page"),a=document.getElementById("total-pages");n&&(n.textContent=e),a&&(a.textContent=i);const c=l.filter(d=>d.style.display!=="none");if(i<=1){t.innerHTML="";return}const r=Math.min((e-1)*10+1,c.length),s=Math.min(e*10,c.length);t.innerHTML=`
      <div class="flex flex-col items-center gap-4">
        <div class="text-sm text-base-content/70">
          Showing ${r}-${s} of ${c.length} articles
        </div>

        <div class="join">
          <button class="join-item btn btn-sm" id="prev-page" onclick="window.pagination.prevPage()" aria-label="Previous page">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button class="join-item btn btn-sm no-animation" aria-label="Page ${e} of ${i}">
            Page ${e} of ${i}
          </button>

          <button class="join-item btn btn-sm" id="next-page" onclick="window.pagination.nextPage()" aria-label="Next page">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    `,h()}function h(){const t=document.getElementById("prev-page"),n=document.getElementById("next-page");t&&(t.disabled=e===1,e===1?t.classList.add("btn-disabled"):t.classList.remove("btn-disabled")),n&&(n.disabled=e===i,e===i?n.classList.add("btn-disabled"):n.classList.remove("btn-disabled"))}function v(){e<i&&o(e+1)}function E(){e>1&&o(e-1)}window.pagination={nextPage:v,prevPage:E,handleSearch:f},document.readyState==="loading"?document.addEventListener("DOMContentLoaded",g):g()})();
