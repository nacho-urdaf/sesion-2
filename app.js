// empty

document.addEventListener('DOMContentLoaded', ()=>{
	// Theme toggle
	const themeBtn = document.getElementById('theme-toggle');
	const body = document.body;
	const saved = localStorage.getItem('theme');
	if(saved === 'light') body.classList.add('light');
	updateThemeIcon();

	themeBtn.addEventListener('click', ()=>{
		body.classList.toggle('light');
		localStorage.setItem('theme', body.classList.contains('light') ? 'light' : 'dark');
		updateThemeIcon();
	});

	function updateThemeIcon(){
		themeBtn.textContent = body.classList.contains('light') ? '☼' : '☾';
	}

	// Color picker - change hero image src to a color-specific photo (local override)
	const swatches = document.querySelectorAll('.color-swatch');
	const carImage = document.getElementById('car-image');
	const originalSrc = carImage.src;
	const colorMap = {
		'black': 'https://www.diariomotor.com/imagenes/2015/10/bmw-m4-gts-2016-6.jpg?class=M',
		'red': 'https://thumbs.dreamstime.com/b/un-coche-rojo-de-bmw-m-72594621.jpg',
		'blue': 'https://soymotor.com/sites/default/files/imagenes/noticia/bmw-delantera-m4-soymotor.jpg',
		'amarillo-oro': 'https://images.coches.com/_vn_/bmw/M4-Coupe-F82-USA/bmw_m4-coupe-f82-usa-2014_r5.jpg?w=768&h=508&func=fit',
		'morado': 'https://i.pinimg.com/736x/ee/09/ed/ee09ed06924be2f5e33e0caa3a101274.jpg'
	};
	swatches.forEach(s => s.addEventListener('click', ()=>{
		const color = s.dataset.color || 'default';
		// if color has a mapped URL, set it; otherwise restore original
		if(color && colorMap[color]){
			carImage.src = colorMap[color];
		} else {
			carImage.src = originalSrc;
		}
		// update active visual on swatches
		swatches.forEach(x=>x.classList.remove('active'));
		s.classList.add('active');
	}));

	// CTA: scroll to specs
	document.getElementById('cta-drive').addEventListener('click', ()=>{
		document.getElementById('specs').scrollIntoView({behavior:'smooth'});
	});

	// Engine sound: try loading a real engine audio from candidates, fallback to WebAudio synth
	let audioCtx = null; let enginePlaying = false; let engineNodes = null; let engineAudio = null;
	const engineBtn = document.getElementById('engine-btn');
	engineBtn.addEventListener('click', ()=>{
		if(enginePlaying){ stopEngine(); return; }
		// try to load external audio first
		tryPlayExternalEngine().catch(()=>{
			if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
			startEngineSynth();
		});
	});

	async function tryPlayExternalEngine(){
		const candidates = [
				// Local user-provided engine sound found in repo root
				'engine sound.mp3',
				// Local engine MP3 (fallback for reliable playback)
				'assets/audio/engine.mp3',
				// Local WAV fallback (kept for redundancy)
				'assets/audio/engine.wav',
				// Previously used Soundstripe page (kept as fallback)
				'https://app.soundstripe.com/sound-effects/9717',
				// External MP3 fallbacks
				'https://www.soundjay.com/transportation/sounds/car-engine-idling-01.mp3',
				'https://www.soundjay.com/transportation/sounds/car-engine-rev-01.mp3'
			];
		for(const url of candidates){
			try{
				const audio = new Audio();
				audio.src = url;
				audio.preload = 'auto';
				audio.crossOrigin = 'anonymous';
				await new Promise((resolve, reject)=>{
					const to = setTimeout(()=>reject(new Error('timeout')), 4000);
					audio.addEventListener('canplaythrough', ()=>{ clearTimeout(to); resolve(); }, {once:true});
					audio.addEventListener('error', ()=>{ clearTimeout(to); reject(new Error('error')); }, {once:true});
				});
				// if loaded, play
				engineAudio = audio;
				engineAudio.loop = true;
				await engineAudio.play();
				enginePlaying = true; engineBtn.classList.add('playing'); engineBtn.textContent = 'DETENER RUGIDO';
				return; // success
			}catch(err){
				// try next
				continue;
			}
		}
		throw new Error('No external audio loaded');
	}

	function startEngineSynth(){
		const ctx = audioCtx;
		const base = ctx.createOscillator();
		const lfo = ctx.createOscillator();
		const gain = ctx.createGain();
		const lfoGain = ctx.createGain();
		const biquad = ctx.createBiquadFilter();

		base.type = 'sawtooth';
		base.frequency.value = 60; // low rumble

		lfo.type = 'sine';
		lfo.frequency.value = 6; // wobble
		lfoGain.gain.value = 40;
		lfo.connect(lfoGain);
		lfoGain.connect(base.frequency);

		gain.gain.value = 0.0001;
		base.connect(biquad);
		biquad.connect(gain);
		gain.connect(ctx.destination);

		biquad.type = 'lowpass';
		biquad.frequency.value = 800;

		base.start(); lfo.start();
		// ramp up
		gain.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + 0.5);

		engineNodes = {base,lfo,gain,biquad};
		enginePlaying = true; engineBtn.classList.add('playing'); engineBtn.textContent = 'DETENER RUGIDO';
	}

	function stopEngine(){
		// stop HTMLAudio if playing
		if(engineAudio){
			try{ engineAudio.pause(); engineAudio.currentTime = 0; }catch(e){}
			engineAudio = null;
			enginePlaying = false; engineBtn.classList.remove('playing'); engineBtn.textContent = 'RUGIDO MOTOR';
			return;
		}
		if(!engineNodes) return;
		const {base,lfo,gain} = engineNodes;
		const ctx = audioCtx;
		gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
		setTimeout(()=>{
			try{ base.stop(); lfo.stop(); }catch(e){}
			engineNodes = null; enginePlaying = false; engineBtn.classList.remove('playing'); engineBtn.textContent = 'RUGIDO MOTOR';
		},600);
	}

	// Gallery lightbox and captions based on filename
	const carouselSlides = document.querySelectorAll('.carousel-slide');
	carouselSlides.forEach(slide => {
		const img = slide.querySelector('img');
		if(!img) return;
		// derive a friendly caption from filename
		const src = img.getAttribute('src') || '';
		const file = decodeURIComponent(src.split('/').pop() || '').replace(/\.[^/.]+$/, '');
		const friendly = file.replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim();
		let caption = slide.querySelector('.carousel-caption');
		if(!caption){ caption = document.createElement('p'); caption.className='carousel-caption'; slide.appendChild(caption); }
		caption.textContent = friendly;
		// attach lightbox
		img.style.cursor = 'zoom-in';
		img.addEventListener('click', ()=> openLightbox(img.src, img.alt || friendly));
	});

	function openLightbox(src, alt){
		const overlay = document.createElement('div');
		overlay.style.position='fixed';overlay.style.inset='0';overlay.style.background='rgba(0,0,0,0.85)';overlay.style.display='flex';overlay.style.alignItems='center';overlay.style.justifyContent='center';overlay.style.zIndex=9999;overlay.style.cursor='zoom-out';
		const image = document.createElement('img');
		image.src = src; image.alt = alt; image.style.maxWidth='90%'; image.style.maxHeight='90%'; image.style.borderRadius='6px';
		overlay.appendChild(image);
		overlay.addEventListener('click', ()=>document.body.removeChild(overlay));
		document.body.appendChild(overlay);
	}

	// Quiz implementation (filtered per user request: keep questions 1,2,4,5,6,8)
	const questions = [
		{q:'¿Qué motor monta el M4 Coupé 2014?', opts:['S50','S65','S55','N54'], a:2},
		{q:'¿Cuántos litros tiene el motor S55?', opts:['2.0L','3.0L','4.0L','3.5L'], a:1},
		{q:'¿Cuál es el tipo de configuración del motor?', opts:['V8','Inline-6','V6','Flat-6'], a:1},
		{q:'¿El S55 es atmosférico o turbo?', opts:['Atmosférico','Biturbo','Turbo simple','Híbrido'], a:1},
		{q:'¿Cuál de estas transmisiones estaba disponible?', opts:['CVT','Manual 6','AMT','Dual Clutch 7'], a:3},
		{q:'¿La versión estándar produce aprox. cuántos CV?', opts:['250','350','431','520'], a:2}
	];

	const qContainer = document.getElementById('quiz-questions');
	const quizForm = document.getElementById('quiz-form');
	const quizResult = document.getElementById('quiz-result');
	const quizReset = document.getElementById('quiz-reset');

	function renderQuiz(){
		qContainer.innerHTML = '';
		// render all questions but keep them hidden; we'll show one at a time
		questions.forEach((item,i)=>{
			const el = document.createElement('fieldset'); el.className='quiz-question'; el.dataset.index = i;
			ele.style.display = 'none';
			const legend = document.createElement('legend'); legend.textContent = `${i+1}. ${item.q}`;
			el.appendChild(legend);
			item.opts.forEach((opt,idx)=>{
				const id = `q${i}_opt${idx}`;
				const label = document.createElement('label'); label.style.display='block'; label.style.padding='8px 0';
				const input = document.createElement('input'); input.type='radio'; input.name=`q${i}`; input.value=idx; input.id=id;
				label.appendChild(input); label.append(' ' + opt);
				el.appendChild(label);
			});
			// per-question inline warning
			const warn = document.createElement('div'); warn.className='quiz-warn'; warn.style.color='var(--accent-red)'; warn.style.display='none'; warn.style.marginTop='8px'; warn.textContent = 'Por favor, selecciona una opción para continuar.';
			el.appendChild(warn);
			qContainer.appendChild(el);
		});

		// navigation controls
		let nav = document.getElementById('quiz-nav');
		if(nav) nav.remove();
		nav = document.createElement('div'); nav.id='quiz-nav'; nav.className='quiz-nav'; nav.style.display='flex'; nav.style.justifyContent='space-between'; nav.style.alignItems='center'; nav.style.marginTop='12px';
		const prev = document.createElement('button'); prev.type='button'; prev.className='btn'; prev.textContent='Anterior'; prev.style.opacity='0.8';
		const next = document.createElement('button'); next.type='button'; next.className='btn btn-cta'; next.textContent='Siguiente';
		const submitBtn = document.createElement('button'); submitBtn.type='submit'; submitBtn.className='btn btn-accent'; submitBtn.textContent='Enviar respuestas'; submitBtn.style.display='none';
		nav.appendChild(prev); nav.appendChild(next); nav.appendChild(submitBtn);
		quizForm.querySelector('.quiz-actions').innerHTML = ''; // clear existing actions
		quizForm.querySelector('.quiz-actions').appendChild(nav);

		// state
		let current = 0;
		const questionEls = Array.from(document.querySelectorAll('.quiz-question'));

		function showQuestion(index){
			current = Math.max(0, Math.min(index, questionEls.length-1));
			questionEls.forEach((el,i)=>{ el.style.display = (i===current) ? 'block' : 'none'; el.querySelector('.quiz-warn').style.display='none'; });
			// update nav buttons
			prev.style.visibility = current===0 ? 'hidden' : 'visible';
			if(current === questionEls.length-1){ next.style.display='none'; submitBtn.style.display='inline-block'; } else { next.style.display='inline-block'; submitBtn.style.display='none'; }
		}

		prev.addEventListener('click', ()=>{ showQuestion(current-1); });
		next.addEventListener('click', ()=>{
			// validate current has a selection
			const sel = quizForm.querySelector(`input[name="q${current}"]:checked`);
			if(!sel){ questionEls[current].querySelector('.quiz-warn').style.display='block'; return; }
			showQuestion(current+1);
		});

		// show first question
		showQuestion(0);
	}

	quizForm.addEventListener('submit', (e)=>{
		e.preventDefault();
		const participantName = document.getElementById('participant-name').value.trim();
		if(!participantName){
			// replace alert with inline warning near name field
			const nameInput = document.getElementById('participant-name');
			nameInput.focus();
			nameInput.style.boxShadow = '0 0 0 3px rgba(215,26,42,0.12)';
			setTimeout(()=>{ nameInput.style.boxShadow = ''; }, 1600);
			return;
		}
		let score = 0; let total = questions.length; let unanswered=0;
		questions.forEach((item,i)=>{
			const sel = quizForm.querySelector(`input[name="q${i}"]:checked`);
			if(!sel){unanswered++; return}
			if(parseInt(sel.value,10) === item.a) score++;
		});
		const isPerfect = (score === total);
		const resultMessage = `Resultado de <strong>${participantName}</strong>: <strong>${score}/${total}</strong>. ${unanswered? `No contestadas: ${unanswered}.` : 'Todas las preguntas fueron contestadas.'}`;
		quizResult.innerHTML = `<p>${resultMessage}</p>`;
		if(isPerfect){
			const celebratory = `🎉 ¡Felicidades ${participantName}! ¡Obtuviste una puntuación perfecta de ${score}/${total}! Eres un verdadero experto del BMW M4. 🏁`;
			showResultModal(celebratory, true);
		} else if(score > 0){
			showResultModal(resultMessage, false);
		}
	});

	function showResultModal(messageHtml, isCelebration){
		// create overlay
		const overlay = document.createElement('div'); overlay.className = 'result-modal-overlay';
		// confetti canvas (if celebration)
		let canvas = null; let confettiAnim = null;
		if(isCelebration){
			canvas = document.createElement('canvas'); canvas.className = 'confetti-canvas';
			document.body.appendChild(canvas);
			startConfetti(canvas);
		}
		// modal box
		const modal = document.createElement('div'); modal.className = 'result-modal';
		// add a class to emphasize slide-in from right (animation defined in CSS)
		modal.classList.add('slide-in-right');
		const title = document.createElement('h3'); title.textContent = isCelebration ? '¡Puntuación perfecta!' : 'Resultado del quiz';
		const para = document.createElement('p'); para.innerHTML = messageHtml;
		const close = document.createElement('button'); close.className = 'close-btn'; close.textContent = isCelebration ? '¡Cerrar y celebrar!' : 'Cerrar';
		close.addEventListener('click', ()=>{ cleanup(); });
		modal.appendChild(title); modal.appendChild(para); modal.appendChild(close);
		overlay.appendChild(modal);
		document.body.appendChild(overlay);
		// focus the close button for accessibility
		setTimeout(()=>{ try{ close.focus(); }catch(e){} }, 50);
		// play celebration sound if needed
		if(isCelebration && typeof playCelebrationSound === 'function'){
			modal._stopSound = playCelebrationSound();
		}
		// allow click on overlay to close (but not when clicking modal)
		overlay.addEventListener('click', (ev)=>{ if(ev.target === overlay) cleanup(); });

		function cleanup(){
			try{ if(modal && modal._stopSound) modal._stopSound(); }catch(e){}
			try{ if(canvas){ stopConfetti(canvas); document.body.removeChild(canvas); }}catch(e){}
			if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
		}
		// auto-dismiss after 8s
		setTimeout(()=>{ if(document.body.contains(overlay)) cleanup(); }, 8000);
	}

	function startConfetti(canvas){
		const ctx = canvas.getContext('2d');
		function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
		resize(); window.addEventListener('resize', resize);
		const particles = [];
		const colors = ['#ffdd57','#ff6b6b','#6bc6ff','#8affb0','#d47bff'];
		for(let i=0;i<120;i++){
			particles.push({
				x: Math.random()*canvas.width,
				y: -Math.random()*canvas.height,
				r: 6+Math.random()*8,
				c: colors[Math.floor(Math.random()*colors.length)],
				dx: (Math.random()-0.5)*6,
				dy: 2+Math.random()*6,
				rot: Math.random()*360,
				drot: (Math.random()-0.5)*10
			});
		}
		let running = true;
		function frame(){
			ctx.clearRect(0,0,canvas.width,canvas.height);
			for(const p of particles){
				p.x += p.dx; p.y += p.dy; p.rot += p.drot; p.dy += 0.08; // gravity
				ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
				ctx.fillStyle = p.c; ctx.fillRect(-p.r/2,-p.r/2,p.r, p.r*1.6);
				ctx.restore();
				// recycle
				if(p.y > canvas.height + 50){ p.y = -10; p.x = Math.random()*canvas.width; p.dy = 2+Math.random()*6; }
			}
			if(running) rAF = requestAnimationFrame(frame);
		}
		let rAF = requestAnimationFrame(frame);
		canvas._stop = ()=>{ running=false; cancelAnimationFrame(rAF); window.removeEventListener('resize', resize); };
	}

	function stopConfetti(canvas){ if(canvas && canvas._stop) canvas._stop(); }

	// Simple celebration sound using WebAudio (returns a stop function)
	function playCelebrationSound(){
		try{
			if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
			const ctx = audioCtx;
			const now = ctx.currentTime;
			const master = ctx.createGain(); master.gain.value = 0.0001; master.connect(ctx.destination);
			// ramp up quickly
			master.gain.linearRampToValueAtTime(0.8, now + 0.02);
			const freqs = [880, 660, 520];
			const oscs = freqs.map((f, idx)=>{
				const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * (1 + (idx*0.02));
				const g = ctx.createGain(); g.gain.value = 0.0;
				o.connect(g); g.connect(master);
				// short envelope
				g.gain.setValueAtTime(0.0, now);
				g.gain.linearRampToValueAtTime(0.5/(idx+1), now + 0.02);
				g.gain.exponentialRampToValueAtTime(0.001, now + 1.0 + (idx*0.1));
				o.start(now);
				o.stop(now + 1.2 + (idx*0.1));
				return {o,g};
			});
			// gentle master fade out
			master.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
			// return stop function
			const stopFn = ()=>{
				try{ oscs.forEach(obj=>{ try{ obj.o.stop(); }catch(e){} }); }catch(e){}
				try{ master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02); }catch(e){}
			};
			return stopFn;
		}catch(e){ console.warn('Celebration sound failed', e); return ()=>{}; }
	}

	quizReset.addEventListener('click', ()=>{ renderQuiz(); quizResult.textContent=''; });
	renderQuiz();

	// Carousel functionality
	let currentSlide = 0;
	const slides = document.querySelectorAll('.carousel-slide');
	const indicators = document.querySelectorAll('.indicator');
	const prevBtn = document.querySelector('.carousel-prev');
	const nextBtn = document.querySelector('.carousel-next');

	function showSlide(index){
		if(index >= slides.length) currentSlide = 0;
		if(index < 0) currentSlide = slides.length - 1;
		slides.forEach(s => s.classList.remove('active'));
		indicators.forEach(i => i.classList.remove('active'));
		slides[currentSlide].classList.add('active');
		indicators[currentSlide].classList.add('active');
	}

	prevBtn?.addEventListener('click', ()=>{ currentSlide--; showSlide(currentSlide); });
	nextBtn?.addEventListener('click', ()=>{ currentSlide++; showSlide(currentSlide); });
	indicators.forEach(ind => ind.addEventListener('click', (e)=>{ currentSlide = parseInt(e.target.dataset.index, 10); showSlide(currentSlide); }));

	// Timeline collapsible items
	const timelineHeaders = document.querySelectorAll('.timeline-header');
	timelineHeaders.forEach(header => {
		header.addEventListener('click', ()=>{
			const toggle = header.querySelector('.timeline-toggle');
			const contentId = header.dataset.timeline + '-content';
			const content = document.getElementById(contentId);
			if(content.style.display === 'none'){
				content.style.display = 'block';
				toggle.textContent = '-';
			} else {
				content.style.display = 'none';
				toggle.textContent = '+';
			}
		});
	});

	// Populate timeline paragraphs and add captions based on image filenames
	const timelineInfo = {
		'bmw M3 E30': '1986-1991 — Origen del M3: compacto, ligero y enfocado a la pista. Motor 4-cilindros que convirtió a BMW M en una referencia.',
		'bmw M3 E36': '1992-1999 — Expansión comercial: más potencia, mayor confort y una puesta a punto que popularizó la marca entre entusiastas.',
		'bmw M3 E46': '2000-2006 — Clásico moderno: 333 CV, excelente equilibrio chasis-motor y muchas ediciones especiales apreciadas hoy.',
		'bmw M3 E92': '2007-2013 — V8 atmosférico: 414 CV en su culmen, mayor par motor y una experiencia sonora única antes de la era turbo.',
		'bmw M4 F82': '2014 — Debut del M4: S55 biturbo, 431-450 CV y un nuevo enfoque turboalimentado para rendimiento y eficiencia.'
	};

	document.querySelectorAll('.timeline-item').forEach(item => {
		const img = item.querySelector('.timeline-img');
		const para = item.querySelector('p');
		if(!img) return;
		const src = img.getAttribute('src') || '';
		const file = decodeURIComponent(src.split('/').pop() || '').replace(/\.[^/.]+$/, '');
		const key = file.trim();
		// If we have curated text for this file, replace paragraph text
		if(timelineInfo[key]){
			if(para) para.textContent = timelineInfo[key];
		}
		// add a small caption under the image with a friendly name
		let caption = item.querySelector('.timeline-caption');
		const friendly = file.replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim();
		if(!caption){
			caption = document.createElement('p');
			caption.className = 'timeline-caption';
			img.insertAdjacentElement('afterend', caption);
		}
		caption.textContent = friendly;
	});

	// small accessibility: close lightbox with Escape
	document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ const overlays = document.querySelectorAll('body > div'); overlays.forEach(o=>{ if(o && o.style && o.style.zIndex==='9999') document.body.removeChild(o); }); }});
});

