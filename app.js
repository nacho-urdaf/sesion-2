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
			el.style.display = 'none';
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
		nav = document.createElement('div'); nav.id='quiz-nav'; nav.className='quiz-nav'; nav.style.display='flex'; nav.style.justifyContent='space-between'; nav.style.alignItems='center'; nav.style.gap='12px'; nav.style.marginTop='12px';
		const prev = document.createElement('button'); prev.type='button'; prev.className='btn'; prev.id='quiz-prev'; prev.textContent='Anterior'; prev.style.opacity='0.8';
		const next = document.createElement('button'); next.type='button'; next.className='btn btn-cta'; next.id='quiz-next'; next.textContent='Siguiente';
		const submitBtn = document.createElement('button'); submitBtn.type='submit'; submitBtn.className='btn btn-accent'; submitBtn.id='quiz-submit'; submitBtn.textContent='Enviar respuestas'; submitBtn.style.display='none';
		const progress = document.createElement('div'); progress.className='quiz-progress'; progress.style.fontWeight='700'; progress.style.minWidth='140px'; progress.style.textAlign='center'; progress.textContent = `Pregunta 1/${questions.length}`;
		nav.appendChild(prev);
		nav.appendChild(progress);
		nav.appendChild(next);
		nav.appendChild(submitBtn);

		// ensure actions container exists
		let actionsContainer = quizForm.querySelector('.quiz-actions');
		if(!actionsContainer){ actionsContainer = document.createElement('div'); actionsContainer.className = 'quiz-actions'; quizForm.appendChild(actionsContainer); }
		actionsContainer.innerHTML = '';
		actionsContainer.appendChild(nav);

		// state
		let current = 0;
		const questionEls = Array.from(document.querySelectorAll('.quiz-question'));

		function showQuestion(index){
			current = Math.max(0, Math.min(index, questionEls.length-1));
			questionEls.forEach((el,i)=>{ el.style.display = (i===current) ? 'block' : 'none'; el.querySelector('.quiz-warn').style.display='none'; });
			// micro animation for question entry
			const activeEl = questionEls[current];
			if(activeEl){
				activeEl.classList.remove('question-enter');
				void activeEl.offsetWidth; // force reflow
				activeEl.classList.add('question-enter');
				setTimeout(()=>{ try{ activeEl.classList.remove('question-enter'); }catch(e){} }, 420);
			}
			// update nav buttons
			prev.style.visibility = current===0 ? 'hidden' : 'visible';
			if(current === questionEls.length-1){ next.style.display='none'; submitBtn.style.display='inline-block'; } else { next.style.display='inline-block'; submitBtn.style.display='none'; }
			// update progress indicator
			if(progress) progress.textContent = `Pregunta ${current+1}/${questionEls.length}`;
		}

		prev.addEventListener('click', ()=>{ showQuestion(current-1); });
		next.addEventListener('click', ()=>{
			// validate current has a selection
			const sel = quizForm.querySelector(`input[name="q${current}"]:checked`);
			if(!sel){ questionEls[current].querySelector('.quiz-warn').style.display='block'; return; }
			showQuestion(current+1);
		});

		// allow Enter to act like "Siguiente" (but ignore when focused on name input)
		if(quizForm._enterHandler) quizForm.removeEventListener('keydown', quizForm._enterHandler);
		quizForm._enterHandler = function(e){
			if(e.key !== 'Enter') return;
			const active = document.activeElement;
			// if focus is on the participant name input, do not intercept Enter
			if(active && active.id === 'participant-name') return;
			e.preventDefault();
			// if on last question, trigger submit; otherwise trigger next
			if(submitBtn.style.display !== 'none'){
				submitBtn.click();
			} else {
				next.click();
			}
		};
		quizForm.addEventListener('keydown', quizForm._enterHandler);

		// expose quiz control state for external handlers (startQuiz will reuse it)
		quizForm._quizState = { showQuestion, prev, next, submitBtn, questionEls, getCurrent: ()=>current };

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
		// celebration canvas (if celebration) - used for confetti and fireworks
		let canvas = null;
		if(isCelebration){
			canvas = document.createElement('canvas'); canvas.className = 'confetti-canvas';
			document.body.appendChild(canvas);
			startConfetti(canvas);
			startFireworks(canvas);
		}
		// modal box (card)
		const modal = document.createElement('div'); modal.className = 'result-modal';
		// animate entry from right
		modal.classList.add('slide-in-right');
		const title = document.createElement('h3'); title.textContent = isCelebration ? '¡Puntuación perfecta! 🏁🚗🏎️' : 'Resultado del quiz';
		const para = document.createElement('p'); para.innerHTML = messageHtml;
		const accept = document.createElement('button'); accept.className = 'close-btn btn btn-accent'; accept.textContent = isCelebration ? 'Aceptar 🎉' : 'Cerrar';
		const repeatBtn = document.createElement('button'); repeatBtn.className = 'btn btn-accent close-btn'; repeatBtn.textContent = 'Repetir quiz';
		modal.appendChild(title); modal.appendChild(para); modal.appendChild(accept); modal.appendChild(repeatBtn);
		overlay.appendChild(modal);
		document.body.appendChild(overlay);
		// focus the accept button for accessibility
		setTimeout(()=>{ try{ accept.focus(); }catch(e){} }, 50);
		// play celebration sound if needed
		if(isCelebration && typeof playCelebrationSound === 'function'){
			modal._stopSound = playCelebrationSound();
		}

		function animateClose(){
			// animate modal sliding out to left
			modal.classList.remove('slide-in-right');
			modal.classList.add('slide-out-left');
			modal.addEventListener('animationend', cleanup, {once:true});
		}

		accept.addEventListener('click', ()=>{ animateClose(); });
		repeatBtn.addEventListener('click', ()=>{
			// close modal and restart the quiz immediately (keep name if present)
			try{ animateClose(); }catch(e){}
			setTimeout(()=>{
				try{ quizResult.textContent = ''; }catch(e){}
				try{ nameIntro.style.display = 'none'; quizForm.style.display = ''; }catch(e){}
				try{ if(startBtn) startBtn.style.display = 'none'; }catch(e){}
				// clear previous answers and warnings
				try{ document.querySelectorAll('#quiz-form input[type="radio"]').forEach(i=>i.checked=false); }catch(e){}
				try{ document.querySelectorAll('.quiz-warn').forEach(w=>w.style.display='none'); }catch(e){}
				// ensure quiz is rendered and show first question
				try{
					if(typeof renderQuiz === 'function') renderQuiz();
				}catch(e){}
				try{
					if(quizForm._quizState && typeof quizForm._quizState.showQuestion === 'function'){
						quizForm._quizState.showQuestion(0);
						const firstInput = quizForm.querySelector('input[type="radio"]');
						if(firstInput) firstInput.focus();
					}
				}catch(e){}
			}, 420);
		});
		// allow click on overlay to close (but not when clicking modal)
		overlay.addEventListener('click', (ev)=>{ if(ev.target === overlay) animateClose(); });

		function cleanup(){
			try{ if(modal && modal._stopSound) modal._stopSound(); }catch(e){}
			try{ if(canvas){ stopConfetti(canvas); stopFireworks(canvas); document.body.removeChild(canvas); }}catch(e){}
			if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
		}

		// auto-dismiss after 8s via animateClose
		setTimeout(()=>{ if(document.body.contains(overlay)) animateClose(); }, 8000);
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

	// Simple fireworks effect: bursts of radial particles
	function startFireworks(canvas){
		const ctx = canvas.getContext('2d');
		function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
		resize(); window.addEventListener('resize', resize);
		const bursts = [];
		let running = true;
		function spawn(){
			if(!running) return;
			const x = 100 + Math.random()*(canvas.width-200);
			const y = 100 + Math.random()*(canvas.height*0.5);
			const color = ['#ffdd57','#ff6b6b','#6bc6ff','#8affb0','#d47bff'][Math.floor(Math.random()*5)];
			const parts = [];
			for(let i=0;i<30;i++){ parts.push({
				x, y, r:2+Math.random()*3, angle:Math.random()*Math.PI*2, speed:2+Math.random()*4, life:60+Math.floor(Math.random()*40), c:color
			}); }
			bursts.push(parts);
			setTimeout(spawn, 400 + Math.random()*800);
		}
		spawn();
		function frame(){
			ctx.clearRect(0,0,canvas.width,canvas.height);
			for(let b=bursts.length-1;b>=0;b--){
				const parts = bursts[b];
				for(let i=parts.length-1;i>=0;i--){
					const p = parts[i];
					p.x += Math.cos(p.angle)*p.speed; p.y += Math.sin(p.angle)*p.speed + 0.5; p.speed *= 0.99; p.life--;
					ctx.beginPath(); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, p.life/120);
					ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
					if(p.life<=0) parts.splice(i,1);
				}
				if(parts.length===0) bursts.splice(b,1);
			}
			if(running) rAF2 = requestAnimationFrame(frame);
		}
		let rAF2 = requestAnimationFrame(frame);
		canvas._stopFire = ()=>{ running=false; cancelAnimationFrame(rAF2); window.removeEventListener('resize', resize); };
	}

	function stopFireworks(canvas){ if(canvas && canvas._stopFire) canvas._stopFire(); }

	// Simple celebration sound using WebAudio (returns a stop function)
	function playCelebrationSound(){
		try{
			if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
			const ctx = audioCtx;
			const now = ctx.currentTime;
			const master = ctx.createGain(); master.gain.value = 0.0001; master.connect(ctx.destination);
			// ramp up to a warm, gentle level
			master.gain.linearRampToValueAtTime(0.6, now + 0.04);
			// warmer, lower-frequency chord
			const freqs = [440, 330, 220];
			const oscs = freqs.map((f, idx)=>{
				const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * (1 + (idx*0.01));
				const g = ctx.createGain(); g.gain.value = 0.0;
				o.connect(g); g.connect(master);
				// smooth envelope: gentle attack, slow release
				g.gain.setValueAtTime(0.0, now);
				g.gain.linearRampToValueAtTime(0.45/(idx+1), now + 0.06);
				g.gain.exponentialRampToValueAtTime(0.0001, now + 2.0 + (idx*0.15));
				o.start(now);
				o.stop(now + 2.2 + (idx*0.15));
				return {o,g};
			});
			// gentle master fade out
			master.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
			// return stop function
			const stopFn = ()=>{
				try{ oscs.forEach(obj=>{ try{ obj.o.stop(); }catch(e){} }); }catch(e){}
				try{ master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02); }catch(e){}
			};
			return stopFn;
		}catch(e){ console.warn('Celebration sound failed', e); return ()=>{}; }
	}

	// Separate name entry from quiz: create start button and hide quiz until name entered
	const nameIntro = document.querySelector('.quiz-intro');
	const nameInput = document.getElementById('participant-name');
	let startBtn = document.getElementById('start-quiz-btn');
	if(!startBtn){
		startBtn = document.createElement('button'); startBtn.id='start-quiz-btn'; startBtn.type='button'; startBtn.className='btn btn-cta'; startBtn.textContent='Comenzar';
		nameIntro.appendChild(startBtn);
	}
	// Initially hide quiz form until user starts
	quizForm.style.display = 'none';

	function startQuiz(){
		const participantName = nameInput.value.trim();
		if(!participantName){
			nameInput.focus(); nameInput.style.boxShadow = '0 0 0 3px rgba(215,26,42,0.12)';
			setTimeout(()=>{ nameInput.style.boxShadow = ''; }, 1400);
			return;
		}
		// animate fade-out of nameIntro, then show quiz
		nameIntro.classList.add('fade-out');
		// also add small button hide for visual polish
		if(startBtn) startBtn.classList.add('btn-hide');

		function after(){
			nameIntro.removeEventListener('animationend', after);
			nameIntro.style.display = 'none';
			quizForm.style.display = '';
			// render quiz if not already rendered
			renderQuiz();
			// hide the original start button visually (we'll use nav buttons)
			try{ startBtn.style.display = 'none'; }catch(e){}
			// show first question and ensure focus
			setTimeout(()=>{
				if(quizForm._quizState && typeof quizForm._quizState.showQuestion === 'function'){
					quizForm._quizState.showQuestion(0);
					const firstInput = quizForm.querySelector('input[type="radio"]');
					if(firstInput) firstInput.focus();
				}
			}, 80);
		}
		nameIntro.addEventListener('animationend', after);
	}

	startBtn.addEventListener('click', startQuiz);

	nameInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); startQuiz(); } });

	quizReset.addEventListener('click', ()=>{ 
		// reset to name step
		quizResult.textContent='';
		quizForm.style.display = 'none';
		nameIntro.style.display = '';
		nameInput.value='';
		nameInput.focus();
	});

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

