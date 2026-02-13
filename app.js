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
				// User-requested Epidemic Sound page (may not be a direct audio file)
				'https://www.epidemicsound.com/sound-effects/tracks/01f2b8bb-fba7-4248-8280-8d534a85613a/',
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

	// Quiz implementation
	const questions = [
		{q:'¿Qué motor monta el M4 Coupé 2014?', opts:['S50','S65','S55','N54'], a:2},
		{q:'¿Cuántos litros tiene el motor S55?', opts:['2.0L','3.0L','4.0L','3.5L'], a:1},
		{q:'¿El M4 F82 reemplazó a cuál modelo?', opts:['M3 E46','M3 E92','M3 E30','M3 E36'], a:1},
		{q:'¿Cuál es el tipo de configuración del motor?', opts:['V8','Inline-6','V6','Flat-6'], a:1},
		{q:'¿El S55 es atmosférico o turbo?', opts:['Atmosférico','Biturbo','Turbo simple','Híbrido'], a:1},
		{q:'¿Cuál de estas transmisiones estaba disponible?', opts:['CVT','Manual 6','AMT','Dual Clutch 7'], a:3},
		{q:'¿En qué año debutó el M4 F82?', opts:['2012','2013','2014','2015'], a:2},
		{q:'¿La versión estándar produce aprox. cuántos CV?', opts:['250','350','431','520'], a:2},
		{q:'¿BMW M es la división de qué?', opts:['Audi Sport','BMW Motorsport','Mercedes AMG','Porsche Motorsport'], a:1},
		{q:'¿El M4 Coupé es basado originalmente en?', opts:['Serie 2','Serie 3','Serie 4','Serie 5'], a:2}
	];

	const qContainer = document.getElementById('quiz-questions');
	const quizForm = document.getElementById('quiz-form');
	const quizResult = document.getElementById('quiz-result');
	const quizReset = document.getElementById('quiz-reset');

	function renderQuiz(){
		qContainer.innerHTML = '';
		questions.forEach((item,i)=>{
			const el = document.createElement('fieldset'); el.className='quiz-question';
			const legend = document.createElement('legend'); legend.textContent = `${i+1}. ${item.q}`;
			el.appendChild(legend);
			item.opts.forEach((opt,idx)=>{
				const id = `q${i}_opt${idx}`;
				const label = document.createElement('label'); label.style.display='block'; label.style.padding='6px 0';
				const input = document.createElement('input'); input.type='radio'; input.name=`q${i}`; input.value=idx; input.id=id;
				label.appendChild(input); label.append(' ' + opt);
				el.appendChild(label);
			});
			qContainer.appendChild(el);
		});
	}

	quizForm.addEventListener('submit', (e)=>{
		e.preventDefault();
		const participantName = document.getElementById('participant-name').value.trim();
		if(!participantName){
			alert('Por favor, ingresa tu nombre antes de enviar el quiz.');
			return;
		}
		let score = 0; let total = questions.length; let unanswered=0;
		questions.forEach((item,i)=>{
			const sel = quizForm.querySelector(`input[name="q${i}"]:checked`);
			if(!sel){unanswered++; return}
			if(parseInt(sel.value,10) === item.a) score++;
		});
		if(score === total){
			alert(`🎉 ¡Felicidades ${participantName}! ¡Obtuviste una puntuación perfecta de ${score}/${total}! Eres un verdadero experto del BMW M4. 🏁`);
		}
		quizResult.innerHTML = `<p>Resultado de <strong>${participantName}</strong>: <strong>${score}/${total}</strong>. ${unanswered? `No contestadas: ${unanswered}.` : 'Todas las preguntas fueron contestadas.'}</p>`;
	});

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

	// small accessibility: close lightbox with Escape
	document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ const overlays = document.querySelectorAll('body > div'); overlays.forEach(o=>{ if(o && o.style && o.style.zIndex==='9999') document.body.removeChild(o); }); }});
});

