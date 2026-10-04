import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowDown, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProxiedImage from './ProxiedImage';
import { getProxiedImageUrl } from '../utils/imageProxy';

const HeroScene = ({ stories = [] }) => {
  const containerRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const cursorInnerRef = useRef(null);
  const cursorOuterRef = useRef(null);


  const [activeSlide, setActiveSlide] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isInsideHero, setIsInsideHero] = useState(false);

  // Real featured story from seeded data for Slide 2
  const featuredStory = stories.find(s => s.title.includes('Civil War') || s.title.includes('Infinity')) || stories[0] || {
    title: 'Civil War',
    cover_image: 'https://comicvine.gamespot.com/a/uploads/scale_small/11/118689/2903877-2767530_2700867_supsm2013001_camunvar_1_.jpg',
    description: 'Cuộc chiến chia rẽ các siêu anh hùng vĩ đại nhất Trái Đất.'
  };

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    // ==========================================
    // 1. THREE.JS SCENE SETUP
    // ==========================================
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    canvasContainerRef.current.innerHTML = '';
    canvasContainerRef.current.appendChild(renderer.domElement);

    // ==========================================
    // 2. LIGHTING RIG (Item 6)
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const keySpotLight = new THREE.SpotLight(0xff3333, 18.0);
    keySpotLight.position.set(4, 6, 3);
    keySpotLight.angle = Math.PI / 4;
    keySpotLight.penumbra = 0.5;
    scene.add(keySpotLight);

    const rimLight = new THREE.DirectionalLight(0x4d6fff, 10.0);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xfff3e6, 0.8);
    fillLight.position.set(-2, -4, 2);
    scene.add(fillLight);

    // ==========================================
    // 3. BACKGROUND SHADER (Item 3 - Marvel Palette)
    // ==========================================
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform float uScroll;
      varying vec2 vUv;

      // Pseudo random / noise
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                   mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
      }

      void main() {
        vec2 uv = (vUv - 0.5) * 2.0;
        float scrollDeform = uScroll * 5.0;

        // 3 Layer Waves
        float w1 = sin(uv.x * 2.4 + uTime * 0.6 + scrollDeform) * 0.50;
        float w2 = cos(uv.y * 3.2 - uTime * 0.7 - scrollDeform * 0.8) * 0.35;
        float w3 = sin((uv.x + uv.y) * 4.0 + uTime * 1.2) * 0.15;
        float wave = (w1 + w2 + w3) + noise(uv * 3.0 + uTime * 0.2) * 0.2;

        // Palette c0 (Head of Hero): Marvel Wine -> Rich Marvel Red
        vec3 c0_shadow = vec3(0.001, 0.0003, 0.0003);
        vec3 c0_wave1  = vec3(0.12, 0.015, 0.01);
        vec3 c0_wave2  = vec3(0.08, 0.01, 0.008);
        vec3 c0_crest  = vec3(0.55, 0.08, 0.06);

        // Palette c1 (Tail of Hero): Cosmic Navy -> Metallic Purple-Blue
        vec3 c1_shadow = vec3(0.0004, 0.0004, 0.0012);
        vec3 c1_wave1  = vec3(0.02, 0.015, 0.065);
        vec3 c1_wave2  = vec3(0.01, 0.008, 0.045);
        vec3 c1_crest  = vec3(0.25, 0.15, 0.55);

        // Interpolate across scroll
        vec3 shadow = mix(c0_shadow, c1_shadow, uScroll);
        vec3 waveCol1 = mix(c0_wave1, c1_wave1, uScroll);
        vec3 waveCol2 = mix(c0_wave2, c1_wave2, uScroll);
        vec3 crestCol = mix(c0_crest, c1_crest, uScroll);

        vec3 color = shadow;
        color += waveCol1 * smoothstep(-0.5, 0.3, wave);
        color += waveCol2 * smoothstep(0.0, 0.8, wave);
        color += crestCol * pow(max(0.0, wave), 2.5) * 1.4;

        // Vignette
        float vignette = 1.0 - dot(uv, uv) * 0.12;
        color *= clamp(vignette, 0.0, 1.0);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const shaderMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 }
      },
      depthWrite: false,
      depthTest: false
    });

    const bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), shaderMaterial);
    bgPlane.position.z = -8;
    bgPlane.renderOrder = -10;
    scene.add(bgPlane);

    // ==========================================
    // 4. FORGE SPARKS PARTICLES (Item 4)
    // ==========================================
    const sparkCount = 450;
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkColors = new Float32Array(sparkCount * 3);
    const sparkVelocity = [];

    // Create 16x16 radial gradient texture via 2D Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,200,200,0.8)');
    grad.addColorStop(0.8, 'rgba(237,29,36,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const sparkTexture = new THREE.CanvasTexture(canvas);

    for (let i = 0; i < sparkCount; i++) {
      // Position
      sparkPositions[i * 3 + 0] = (Math.random() - 0.5) * 7.0;
      sparkPositions[i * 3 + 1] = (Math.random() - 0.5) * 6.0;
      sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 6.0;

      // Color: 60% Marvel Red, 40% Cosmic Blue
      if (Math.random() < 0.6) {
        sparkColors[i * 3 + 0] = 1.0;
        sparkColors[i * 3 + 1] = 0.1;
        sparkColors[i * 3 + 2] = 0.1;
      } else {
        sparkColors[i * 3 + 0] = 0.3;
        sparkColors[i * 3 + 1] = 0.4;
        sparkColors[i * 3 + 2] = 1.0;
      }

      sparkVelocity.push({
        vx: (Math.random() - 0.5) * 0.006,
        vy: 0.008 + Math.random() * 0.015,
        vz: (Math.random() - 0.5) * 0.006,
        swaySpeed: 1.0 + Math.random() * 2.0,
        swayRadius: 0.005 + Math.random() * 0.008
      });
    }

    const sparkGeometry = new THREE.BufferGeometry();
    sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    sparkGeometry.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));

    const sparkMaterial = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      map: sparkTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
    scene.add(sparks);

    // ==========================================
    // 5. 3D COMIC COVER RING (Rotating Center Carousel)
    // ==========================================
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    // 6-8 authentic Marvel covers from DB or verified catalog
    const rawCovers = (stories && stories.length > 0)
      ? stories.map(s => s.cover_image).filter(Boolean)
      : [
          'https://comicvine.gamespot.com/a/uploads/scale_medium/0/394/78670-5533-105342-1-amazing-fantasy.jpg',
          'https://comicvine.gamespot.com/a/uploads/scale_small/11/118689/2903877-2767530_2700867_supsm2013001_camunvar_1_.jpg',
          'https://comicvine.gamespot.com/a/uploads/scale_medium/12/124259/9476911-large-3730198.jpg',
          'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9961117-wwww.jpg',
          'https://comicvine.gamespot.com/a/uploads/scale_small/11161/111615891/10169914-cover.jpg',
          'https://comicvine.gamespot.com/a/uploads/scale_medium/0/394/78670-5533-105342-1-amazing-fantasy.jpg'
        ];

    const coverUrls = Array.from(new Set(rawCovers)).slice(0, 6);
    const ringRadius = 3.4;
    const ringCount = coverUrls.length || 6;
    const ringPlanes = [];
    const planeGeo = new THREE.PlaneGeometry(1.6, 2.4);

    // Dark sleek comic frame backing
    const frameGeo = new THREE.BoxGeometry(1.66, 2.46, 0.04);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x111116,
      roughness: 0.4,
      metalness: 0.5
    });

    coverUrls.forEach((url, idx) => {
      const angle = (idx / ringCount) * Math.PI * 2;
      const x = Math.sin(angle) * ringRadius;
      const z = Math.cos(angle) * ringRadius;

      // Group for each comic card in the ring
      const cardGroup = new THREE.Group();
      cardGroup.position.set(x, 0, z);
      // Face outward along circle normal
      cardGroup.rotation.y = angle;

      // Frame backing
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      cardGroup.add(frameMesh);

      // Use proxy endpoint to guarantee CORS headers for WebGL texture
      const proxyUrl = getProxiedImageUrl(url);

      textureLoader.load(
        proxyUrl,
        (tex) => {
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          const mat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.25,
            metalness: 0.1,
            side: THREE.DoubleSide
          });
          const coverMesh = new THREE.Mesh(planeGeo, mat);
          coverMesh.position.z = 0.025; // Sit slightly in front of frame
          cardGroup.add(coverMesh);
        },
        undefined,
        () => {
          // Graceful fallback to direct URL
          textureLoader.load(url, (fallbackTex) => {
            const mat = new THREE.MeshStandardMaterial({
              map: fallbackTex,
              roughness: 0.25,
              metalness: 0.1,
              side: THREE.DoubleSide
            });
            const coverMesh = new THREE.Mesh(planeGeo, mat);
            coverMesh.position.z = 0.025;
            cardGroup.add(coverMesh);
          });
        }
      );

      ringGroup.add(cardGroup);
      ringPlanes.push({ cardGroup, baseAngle: angle, speed: 0.4 + idx * 0.1 });
    });

    // ==========================================
    // 6. MOUSE & SCROLL STATE FOR LERP (Item 10)
    // ==========================================
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    let targetScroll = 0;
    let currentScroll = 0;

    // Custom Cursor tracking
    let pointerX = -100;
    let pointerY = -100;
    let outerCursorX = -100;
    let outerCursorY = -100;

    const handleMouseMove = (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;

      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const heroHeight = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / heroHeight));

      targetScroll = progress;
      setScrollProgress(progress);

      // Determine active slide (4 slides across 400vh)
      const slideIndex = Math.min(3, Math.floor(progress * 4));
      setActiveSlide(slideIndex);
    };

    const handleMouseEnter = () => setIsInsideHero(true);
    const handleMouseLeave = () => {
      setIsInsideHero(false);
      pointerX = -100;
      pointerY = -100;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const heroContainerEl = containerRef.current;
    if (heroContainerEl) {
      heroContainerEl.addEventListener('mousemove', handleMouseMove);
      heroContainerEl.addEventListener('mouseenter', handleMouseEnter);
      heroContainerEl.addEventListener('mouseleave', handleMouseLeave);
    }

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // ==========================================
    // 7. ANIMATION LOOP (Item 10)
    // ==========================================
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smoothing Lerps
      currentScroll += (targetScroll - currentScroll) * 0.025;
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      // Outer cursor lerp (0.2)
      outerCursorX += (pointerX - outerCursorX) * 0.2;
      outerCursorY += (pointerY - outerCursorY) * 0.2;

      // Update Cursor Elements
      if (cursorInnerRef.current) {
        cursorInnerRef.current.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
      }
      if (cursorOuterRef.current) {
        cursorOuterRef.current.style.transform = `translate3d(${outerCursorX}px, ${outerCursorY}px, 0) translate(-50%, -50%)`;
      }

      // Update Shader Uniforms
      shaderMaterial.uniforms.uTime.value = elapsedTime;
      shaderMaterial.uniforms.uScroll.value = currentScroll;

      // Update Camera Orbit around 3D Comic Ring: phi = scroll * 2π, radius, lookAt(0,0,0)
      const orbitRadius = 7.5;
      const phi = currentScroll * Math.PI * 2.0;

      camera.position.x = Math.sin(phi) * orbitRadius + currentMouseX * 0.4;
      camera.position.z = Math.cos(phi) * orbitRadius;
      camera.position.y = currentMouseY * 0.35 + Math.sin(elapsedTime * 0.4) * 0.15;
      camera.lookAt(0, 0, 0);

      // Subtle dynamic ring tilt responding to mouse and time
      ringGroup.rotation.y = elapsedTime * 0.05 + currentMouseX * 0.15;
      ringGroup.rotation.x = currentMouseY * 0.08;

      // Subtle float on each comic card in the ring
      ringPlanes.forEach((item, i) => {
        item.cardGroup.position.y = Math.sin(elapsedTime * item.speed + i) * 0.08;
      });

      // Update Sparks Physics (Item 4)
      const posAttr = sparkGeometry.attributes.position;
      const positions = posAttr.array;

      for (let i = 0; i < sparkCount; i++) {
        const vel = sparkVelocity[i];
        const idx = i * 3;

        // Sway + Velocity
        positions[idx + 0] += vel.vx + Math.sin(elapsedTime * vel.swaySpeed + i) * vel.swayRadius;
        positions[idx + 1] += vel.vy;
        positions[idx + 2] += vel.vz;

        // Recycle Bounds: y > 3.0, |x| > 3.5, |z| > 3.5 => Respawn y = -2.5
        if (positions[idx + 1] > 3.0 || Math.abs(positions[idx + 0]) > 3.5 || Math.abs(positions[idx + 2]) > 3.5) {
          positions[idx + 0] = (Math.random() - 0.5) * 5.0;
          positions[idx + 1] = -2.5;
          positions[idx + 2] = (Math.random() - 0.5) * 5.0;
        }
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // ==========================================
    // 8. CLEANUP ON UNMOUNT
    // ==========================================
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (heroContainerEl) {
        heroContainerEl.removeEventListener('mousemove', handleMouseMove);
        heroContainerEl.removeEventListener('mouseenter', handleMouseEnter);
        heroContainerEl.removeEventListener('mouseleave', handleMouseLeave);
      }

      // Dispose Geometries & Materials
      bgPlane.geometry.dispose();
      shaderMaterial.dispose();
      sparkGeometry.dispose();
      sparkMaterial.dispose();
      sparkTexture.dispose();
      planeGeo.dispose();
      frameGeo.dispose();
      frameMat.dispose();

      ringGroup.traverse(child => {
        if (child.isMesh) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });

      renderer.dispose();
    };
  }, [stories]);

  // ==========================================
  // 9. PER-LETTER TITLE REVEAL HELPER (Item 7)
  // ==========================================
  const renderSplitText = (text, isVisible) => {
    return text.split('').map((char, index) => {
      if (char === '<') return null; // Simple safety
      return (
        <span
          key={index}
          className={`char-reveal ${isVisible ? 'revealed' : ''}`}
          style={{
            transitionDelay: `${index * 0.035}s`,
            marginRight: char === ' ' ? '0.3em' : '0'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  return (
    <div
      id="hero-3d"
      ref={containerRef}
      className={`relative w-full h-[400vh] bg-[#0F0F14] ${isInsideHero ? 'hero-cursor-area' : ''}`}
    >
      {/* Custom Cursor Elements (Item 2) */}
      <div
        ref={cursorInnerRef}
        className={`hero-cursor-inner ${isInsideHero ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        ref={cursorOuterRef}
        className={`hero-cursor-outer ${isInsideHero ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Fixed Sticky Wrapper for 3D Canvas & HTML Overlay (Item 1) */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden pointer-events-none">
        
        {/* Three.js Canvas Container */}
        <div ref={canvasContainerRef} className="absolute inset-0 z-0" />

        {/* 5 Vertical Grid Lines Overlay (Item 8) */}
        <div className="absolute inset-0 z-10 pointer-events-none opacity-40">
          <div className="hero-grid-line" style={{ left: '10%' }} />
          <div className="hero-grid-line" style={{ left: '30%' }} />
          <div className="hero-grid-line" style={{ left: '50%' }} />
          <div className="hero-grid-line" style={{ left: '70%' }} />
          <div className="hero-grid-line" style={{ left: '90%' }} />
          
          {/* Floating Dots on grid lines */}
          <div
            className="hero-grid-dot"
            style={{ left: '30%', top: `${15 + (scrollProgress * 70)}%` }}
          />
          <div
            className="hero-grid-dot"
            style={{ left: '70%', top: `${30 + (scrollProgress * 55)}%` }}
          />
        </div>

        {/* Progress Bar & Indicators (Item 8) */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center space-y-4 pointer-events-auto">
          <div className="w-1 h-32 bg-[#2A2A38] rounded-full overflow-hidden relative">
            <div
              className="w-full bg-[#ED1D24] transition-all duration-100 ease-linear shadow-[0_0_8px_#ED1D24]"
              style={{ height: `${scrollProgress * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-mono font-bold text-gray-400">
            0{activeSlide + 1} / 04
          </span>
        </div>

        {/* ==========================================
            4 SLIDES HTML OVERLAY (Item 9)
        ========================================== */}
        <div className="relative w-full h-full max-w-7xl mx-auto px-6 sm:px-12 flex items-center justify-between z-20 pointer-events-none">

          {/* SLIDE 1: Marvel Universe */}
          <div
            className={`absolute inset-x-6 sm:inset-x-12 transition-all duration-700 pointer-events-auto ${
              activeSlide === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'
            }`}
          >
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ED1D24]/10 border border-[#ED1D24]/30 text-[#ED1D24] text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Vũ Trụ Truyện Tranh Đỉnh Cao
              </div>
              <h1 className="font-italiana text-5xl sm:text-7xl lg:text-8xl font-normal tracking-wide text-white leading-tight">
                {renderSplitText('Marvel Universe', activeSlide === 0)}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-300 font-light leading-relaxed max-w-xl">
                Khám phá kho tàng huyền thoại nơi các siêu anh hùng và ác nhân định hình số phận đa vũ trụ. Sức mạnh kể chuyện bất hủ qua hơn 80 năm lịch sử.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <a
                  href="#story-catalog"
                  className="px-6 py-3 bg-[#ED1D24] hover:bg-[#ff3333] text-white font-semibold rounded-xl shadow-lg shadow-[#ED1D24]/20 transition-all flex items-center gap-2 group"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Khám Phá Ngay</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>

          {/* SLIDE 2: Featured Arc (Civil War / Infinity) */}
          <div
            className={`absolute inset-x-6 sm:inset-x-12 transition-all duration-700 pointer-events-auto flex items-center justify-between ${
              activeSlide === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
            }`}
          >
            {/* Left Column: Image Mask */}
            <div className="hidden md:block w-72 h-96 relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-[#ED1D24]/20 group">
              <ProxiedImage
                src={featuredStory.cover_image}
                alt={featuredStory.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                fallbackSrc="https://comicvine.gamespot.com/a/uploads/scale_medium/0/394/78670-5533-105342-1-amazing-fantasy.jpg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <span className="text-xs uppercase font-bold tracking-widest text-[#ED1D24]">Bản Quyền Comic Vine</span>
              </div>
            </div>

            {/* Right Column: Title & Description */}
            <div className="max-w-xl md:ml-12">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#4D6FFF] mb-2">
                Arc Kinh Điển Được Yêu Thích
              </div>
              <h2 className="font-italiana text-5xl sm:text-7xl font-normal text-white leading-tight">
                {renderSplitText(featuredStory.title, activeSlide === 1)}
              </h2>
              <p className="mt-4 text-base text-gray-300 leading-relaxed font-light">
                {featuredStory.description}
              </p>
              <div className="mt-6">
                <Link
                  to={`/stories/${featuredStory.id || 1}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#ED1D24] hover:text-white transition-colors"
                >
                  Xem chi tiết arc này &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* SLIDE 3: Infinite Stories */}
          <div
            className={`absolute inset-x-6 sm:inset-x-12 text-center transition-all duration-700 pointer-events-auto flex flex-col items-center justify-center ${
              activeSlide === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            <div className="max-w-3xl mx-auto">
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-3 block">
                Hàng Ngàn Ấn Phẩm Trực Tuyến
              </span>
              <h2 className="font-italiana text-5xl sm:text-7xl lg:text-8xl text-white font-normal leading-tight">
                {renderSplitText('Infinite Stories', activeSlide === 2)}
              </h2>
              <p className="mt-4 text-base sm:text-lg text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
                Đắm chìm vào các ấn phẩm Marvel nguyên bản từ The Amazing Spider-Man 1963 đến các đầu truyện hiện đại. Cập nhật liên tục từ cơ sở dữ liệu Comic Vine.
              </p>
            </div>
          </div>

          {/* SLIDE 4: Your Next Chapter */}
          <div
            className={`absolute inset-x-6 sm:inset-x-12 transition-all duration-700 pointer-events-auto ${
              activeSlide === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
            }`}
          >
            <div className="max-w-2xl">
              <span className="text-xs uppercase tracking-widest text-[#ED1D24] font-bold mb-3 block">
                Khởi Đầu Hành Trình Của Bạn
              </span>
              <h2 className="font-italiana text-5xl sm:text-7xl lg:text-8xl text-white font-normal leading-tight">
                {renderSplitText('Your Next Chapter', activeSlide === 3)}
              </h2>
              <p className="mt-4 text-base sm:text-lg text-gray-300 font-light leading-relaxed">
                Tham gia cộng đồng người hâm mộ Marvel, đánh dấu chương đọc, thảo luận cùng các độc giả khác và tận hưởng trọn vẹn từng trang truyện sắc nét.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#story-catalog"
                  className="px-7 py-3.5 bg-[#ED1D24] hover:bg-[#ff3333] text-white font-bold rounded-xl shadow-xl shadow-[#ED1D24]/30 transition-all flex items-center gap-2 group"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Đọc Ngay Bây Giờ</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <Link
                  to="/register"
                  className="px-6 py-3.5 bg-[#1A1A22] hover:bg-[#23232E] text-gray-200 border border-[#2A2A38] font-semibold rounded-xl transition-all"
                >
                  Đăng Ký Đọc Gói Tháng
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Scroll Down Hint at the bottom */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center space-y-2 pointer-events-auto opacity-70 hover:opacity-100 transition-opacity">
          <span className="text-[11px] uppercase tracking-widest text-gray-400 font-mono">
            Cuộn xuống để khám phá ({Math.round(scrollProgress * 100)}%)
          </span>
          <ArrowDown className="w-4 h-4 text-[#ED1D24] animate-bounce" />
        </div>

      </div>
    </div>
  );
};

export default HeroScene;
