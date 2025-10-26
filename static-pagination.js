(function(){let n=1,o=1,i=[];function u(){const e=new URLSearchParams(window.location.search);return{page:parseInt(e.get("page"))||1}}function b(e){const t=new URLSearchParams(window.location.search);e===1?t.delete("page"):t.set("page",e);const s=t.toString()?`${window.location.pathname}?${t.toString()}`:window.location.pathname;window.history.pushState({},"",s)}function c(){i=Array.from(document.querySelectorAll(".article-card"))}function h(){const e=i.filter(t=>t.style.display!=="none"&&!t.classList.contains("pinned-article"));o=Math.max(1,Math.ceil(e.length/10)),n>o&&(n=o)}function f(){h();const e=u(),t=e.page<=o?e.page:1;l(t,!1)}function l(e,t=!0){n=e;const s=i.find(a=>a.style.display!=="none"&&a.classList.contains("pinned-article")),r=i.filter(a=>a.style.display!=="none"&&!a.classList.contains("pinned-article")),d=(e-1)*10,g=d+10;i.forEach(a=>{a.classList.add("hidden")}),s&&s.classList.remove("hidden"),r.forEach((a,p)=>{p>=d&&p<g&&a.classList.remove("hidden")}),m(),b(e)}function m(){const e=document.getElementById("pagination-container");if(!e)return;const t=document.getElementById("current-page"),s=document.getElementById("total-pages");t&&(t.textContent=n),s&&(s.textContent=o);const r=i.filter(a=>a.style.display!=="none");if(o<=1){e.innerHTML="";return}const d=Math.min((n-1)*10+1,r.length),g=Math.min(n*10,r.length);e.innerHTML=`
      <div class="flex items-center justify-center gap-6 mt-16">
        <button class="px-4 py-3 rounded-full border-2 border-base-300 bg-base-100 hover:bg-base-200 hover:border-primary/30 text-base-content transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-base-100 disabled:hover:border-base-300 cursor-pointer shadow-sm" id="prev-page" onclick="window.pagination.prevPage()" aria-label="Previous page">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 pointer-events-none" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
        </button>

        <span class="text-base text-base-content/80 font-medium px-4">
          Page ${n} of ${o}
        </span>

        <button class="px-4 py-3 rounded-full border-2 border-base-300 bg-base-100 hover:bg-base-200 hover:border-primary/30 text-base-content transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-base-100 disabled:hover:border-base-300 cursor-pointer shadow-sm" id="next-page" onclick="window.pagination.nextPage()" aria-label="Next page">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 pointer-events-none" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
          </svg>
        </button>
      </div>
    `,w()}function w(){const e=document.getElementById("prev-page"),t=document.getElementById("next-page");e&&(e.disabled=n===1),t&&(t.disabled=n===o)}function v(){n<o&&l(n+1)}function P(){n>1&&l(n-1)}window.pagination={nextPage:v,prevPage:P,handleSearch:f},document.readyState==="loading"?document.addEventListener("DOMContentLoaded",c):c()})();
