(function(){
  const $ = (q) => document.querySelector(q);

  // Orientation toggle for scan frame
  const oButtons = document.querySelectorAll('[data-orient]');
  oButtons.forEach(b=>{
    b.addEventListener('click', ()=>{
      oButtons.forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const box = document.querySelector('.v-qr-box');
      if(!box) return;
      if(b.dataset.orient === 'landscape'){
        box.style.width='320px'; box.style.height='200px';
      }else{
        box.style.width='240px'; box.style.height='300px';
      }
    });
  });

  // Fake OCR via filename when user uploads an image
  const fileBtn = document.getElementById('openFileScan');
  if(fileBtn){
    fileBtn.addEventListener('click', ()=>{
      const inp = document.createElement('input');
      inp.type='file'; inp.accept='image/*';
      inp.onchange = ()=>{
        const f = inp.files[0];
        const m = (f && f.name.match(/[A-Z0-9]{6,}/i)) ? f.name.match(/[A-Z0-9]{6,}/i)[0] : 'A123456';
        const url = new URL('vneid-diplomas.html', location.href);
        url.searchParams.set('q', m);
        location.href = url.toString();
      };
      inp.click();
    });
  }

  // Make entire cards clickable while keeping real buttons working
  document.querySelectorAll('[data-link]').forEach(card=>{
    card.style.cursor='pointer';
    card.addEventListener('click', (e)=>{
      const isControl = e.target.closest('a,button');
      if(isControl && isControl.getAttribute('href')) return;
      const href = card.getAttribute('data-link');
      if(href) location.href = href;
    });
  });
})();