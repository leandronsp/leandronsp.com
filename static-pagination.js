(function(){let t=1,i=1,a=[];function g(){a=Array.from(document.querySelectorAll(".article-card")),u(),c(1)}function u(){const e=a.filter(n=>n.style.display!=="none");i=Math.max(1,Math.ceil(e.length/10)),t>i&&(t=i)}function f(){t=1,u(),c(1)}function c(e){t=e;const n=a.filter(o=>o.style.display!=="none"),s=(e-1)*10,l=s+10;a.forEach(o=>{o.classList.add("hidden")}),n.forEach((o,d)=>{d>=s&&d<l&&o.classList.remove("hidden")}),m();const r=document.getElementById("articles-container");r&&(r.scrollTop=0)}function m(){const e=document.getElementById("pagination-container");if(!e)return;const n=document.getElementById("current-page"),s=document.getElementById("total-pages");n&&(n.textContent=t),s&&(s.textContent=i);const l=a.filter(d=>d.style.display!=="none");if(i<=1){e.innerHTML="";return}const r=Math.min((t-1)*10+1,l.length),o=Math.min(t*10,l.length);e.innerHTML=`
      <div class="flex flex-col items-center gap-4">
        <div class="text-sm text-base-content/70">
          Showing ${r}-${o} of ${l.length} articles
        </div>

        <div class="join">
          <button class="join-item btn btn-sm" id="prev-page" onclick="window.pagination.prevPage()" aria-label="Previous page">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button class="join-item btn btn-sm no-animation" aria-label="Page ${t} of ${i}">
            Page ${t} of ${i}
          </button>

          <button class="join-item btn btn-sm" id="next-page" onclick="window.pagination.nextPage()" aria-label="Next page">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    `,b()}function b(){const e=document.getElementById("prev-page"),n=document.getElementById("next-page");e&&(e.disabled=t===1,t===1?e.classList.add("btn-disabled"):e.classList.remove("btn-disabled")),n&&(n.disabled=t===i,t===i?n.classList.add("btn-disabled"):n.classList.remove("btn-disabled"))}function E(){t<i&&c(t+1)}function p(){t>1&&c(t-1)}window.pagination={nextPage:E,prevPage:p,handleSearch:f},document.readyState==="loading"?document.addEventListener("DOMContentLoaded",g):g()})();
