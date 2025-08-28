  // ===== Neon particle network (Canvas 2D, optimized) =====
  const canvas = document.getElementById('fx-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, DPR = Math.min(window.devicePixelRatio || 1, 2);
  const state = { points: [], mouse: { x: -9999, y: -9999 }, max: 110 };

  function resize(){
    W = canvas.width = innerWidth * DPR; H = canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
    // rebuild points proportionally to viewport
    const target = Math.min(160, Math.floor((innerWidth * innerHeight) / 12000));
    state.max = target;
    state.points = Array.from({ length: target }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - .5) * .25 * DPR,
      vy: (Math.random() - .5) * .25 * DPR,
      r: (Math.random() * 1.2 + .3) * DPR
    }));
  }
  resize();
  addEventListener('resize', resize);

  addEventListener('mousemove', (e)=>{
    const x = (e.clientX) * DPR, y = (e.clientY) * DPR;
    state.mouse.x = x; state.mouse.y = y;
    // update CSS vars for shine
    document.querySelectorAll('.mini').forEach(el=>{
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - rect.left)/rect.width*100)+'%');
      el.style.setProperty('--my', ((e.clientY - rect.top)/rect.height*100)+'%');
    });
    // move cursor light
    cursorLight.style.left = e.clientX + 'px';
    cursorLight.style.top = e.clientY + 'px';
  });
  addEventListener('mouseleave', ()=>{ state.mouse.x = state.mouse.y = -9999; });

  function step(){
    ctx.clearRect(0,0,W,H);
    // subtle background glow
    ctx.globalCompositeOperation = 'lighter';

    const m = state.mouse; const linkDist = 130 * DPR;
    for(const p of state.points){
      // physics
      p.x += p.vx; p.y += p.vy;
      if(p.x < 0 || p.x > W) p.vx *= -1;
      if(p.y < 0 || p.y > H) p.vy *= -1;

      // mouse repel
      const dx = p.x - m.x, dy = p.y - m.y; const d2 = dx*dx + dy*dy; const r = 120*DPR;
      if(d2 < r*r){ const d = Math.sqrt(d2)||1; p.vx += dx/d*0.04; p.vy += dy/d*0.04; }

      // draw point
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18*DPR);
      grad.addColorStop(0,'rgba(122,92,255,.45)');
      grad.addColorStop(.6,'rgba(0,230,255,.25)');
      grad.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(p.x,p.y, 18*DPR, 0, Math.PI*2); ctx.fill();
    }

    // draw lines (limited neighbors for perf)
    for(let i=0;i<state.points.length;i++){
      const p = state.points[i];
      for(let j=i+1;j<i+8 && j<state.points.length;j++){
        const q = state.points[j];
        const dx = p.x - q.x, dy = p.y - q.y; const d = Math.hypot(dx,dy);
        if(d < linkDist){
          const a = 1 - d/linkDist;
          ctx.strokeStyle = `rgba(122,92,255,${0.35*a})`;
          ctx.lineWidth = 1 * DPR; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
        }
      }
    }

    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  // ===== 3D Tilt for .tilt elements =====
  const tilts = new Set();
  document.querySelectorAll('[data-tilt]').forEach(el=> tilts.add(el));
  addEventListener('mousemove', (e)=>{
    tilts.forEach(el=>{
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width/2)) / r.width;
      const dy = (e.clientY - (r.top + r.height/2)) / r.height;
      el.style.setProperty('--rx', (-dy*8)+'deg');
      el.style.setProperty('--ry', (dx*10)+'deg');
      el.style.setProperty('--tz', '14px');
    })
  });
  ;['mouseleave','blur'].forEach(evt=>{
    document.addEventListener(evt,()=>{
      tilts.forEach(el=>{ el.style.setProperty('--rx','0deg'); el.style.setProperty('--ry','0deg'); el.style.setProperty('--tz','0px'); })
    })
  });

  // ===== Scroll reveal =====
  const io = new IntersectionObserver((entries)=>{
    for(const e of entries){ if(e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target); } }
  }, { threshold:.12 });
  document.querySelectorAll('.reveal').forEach(el=> io.observe(el));

  // ===== Contact actions =====
  const email = 'hello@yourmail.com';
  document.getElementById('copyBtn').addEventListener('click', async ()=>{
    await navigator.clipboard.writeText(email);
    toast('Email copied to clipboard');
  });
  document.getElementById('sendBtn').addEventListener('click', ()=>{
    const n = document.getElementById('name').value.trim();
    const m = document.getElementById('msg').value.trim();
    const e = document.getElementById('email').value.trim();
    const subject = encodeURIComponent('Project inquiry from '+ (n||'Website'));
    const body = encodeURIComponent(m + '\n\n— ' + (n||'Anonymous') + ' (' + (e||'no email') + ')');
    location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  });

  // mini toast
  function toast(text){
    const t = document.createElement('div'); t.textContent = text; t.style.cssText = `position:fixed; left:50%; bottom:24px; transform:translateX(-50%); background:rgba(20,24,34,.9); border:1px solid rgba(255,255,255,.12); color:#e9f1ff; padding:10px 14px; border-radius:12px; z-index:9999; box-shadow: 0 10px 30px rgba(0,0,0,.35);`;
    document.body.appendChild(t); setTimeout(()=>{ t.style.transition='opacity .4s ease, transform .4s ease'; t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(8px)'; }, 1200); setTimeout(()=> t.remove(), 1800);
  }

  // footer year
  document.getElementById('year').textContent = new Date().getFullYear();
