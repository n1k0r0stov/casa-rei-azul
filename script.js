const nav=document.querySelector('.nav');
if(nav){
  if(document.querySelector('.page-hero')) nav.classList.add('page-nav');
  window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>70));
  const toggle=document.createElement('button');
  toggle.className='menu-toggle';
  toggle.type='button';
  toggle.setAttribute('aria-label','Open menu');
  toggle.innerHTML='Menu <span></span>';
  const brand=nav.querySelector('.brand');
  if(brand) brand.after(toggle);
  toggle.addEventListener('click',()=>nav.classList.toggle('open'));
  nav.querySelectorAll('.links a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
}
const translations={en:{photos:'Photos',olhao:'Olhão',book:'Book',terms:'Terms',bookDirect:'Book Direct'},pt:{photos:'Fotos',olhao:'Olhão',book:'Reservar',terms:'Termos',bookDirect:'Reservar'}};
let lang='en'; document.querySelectorAll('.lang').forEach(btn=>btn.addEventListener('click',()=>{lang=btn.dataset.lang;document.documentElement.lang=lang;document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(translations[lang]&&translations[lang][key])el.textContent=translations[lang][key]});document.querySelectorAll('.lang').forEach(b=>b.style.fontWeight=b.dataset.lang===lang?'900':'400')}));
const lb=document.createElement('div');lb.className='lightbox';lb.innerHTML='<button type="button">Close</button><img alt=""><p></p>';document.body.appendChild(lb);lb.querySelector('button').onclick=()=>lb.classList.remove('open');lb.onclick=e=>{if(e.target===lb)lb.classList.remove('open')};document.querySelectorAll('[data-lightbox]').forEach(fig=>fig.addEventListener('click',()=>{const img=fig.querySelector('img');lb.querySelector('img').src=img.src;lb.querySelector('img').alt=img.alt;lb.querySelector('p').textContent=fig.dataset.caption||img.alt;lb.classList.add('open')}));
