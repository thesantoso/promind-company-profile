/**
 * PROMIND Spatial Digital Twin 3D Engine
 * Interactive Building Intelligence & Tenancy Visualization
 * Powered by Three.js with Canvas Fallback
 */

class PromindBuildingViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.currentMode = 'arch'; // 'arch', 'bms', 'occupancy'
    this.isExploded = false;
    this.timeOfDay = 'night'; // 'day', 'sunset', 'night'
    this.hoveredFloor = null;
    this.selectedFloor = null;
    this.floors = [];
    this.buildingGroup = null;

    this.init();
  }

  async init() {
    // Check if Three.js is available or dynamically load it
    if (typeof THREE === 'undefined') {
      try {
        await this.loadThreeScript();
      } catch (err) {
        console.warn('Three.js CDN unavailable, initializing High-Performance Canvas 3D Fallback:', err);
        this.initCanvasFallback();
        return;
      }
    }

    this.initThreeScene();
    this.createMangkuluhurTower();
    this.setupLighting();
    this.setupInteraction();
    this.animate();
    this.bindControls();
  }

  loadThreeScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Three.js script'));
      document.head.appendChild(script);
    });
  }

  initThreeScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070E1A);
    this.scene.fog = new THREE.FogExp2(0x070E1A, 0.015);

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(28, 22, 38);
    this.camera.lookAt(0, 10, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear container and append canvas
    this.container.innerHTML = '';
    this.renderer.domElement.className = 'spatial-canvas';
    this.container.appendChild(this.renderer.domElement);

    // Track mouse rotation manually for smooth zero-dependency orbit
    this.isDragging = false;
    this.prevMousePos = { x: 0, y: 0 };
    this.spherical = { radius: 46, theta: Math.PI / 4, phi: Math.PI / 3 };
    this.updateCameraFromSpherical();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  updateCameraFromSpherical() {
    const s = this.spherical;
    this.camera.position.x = s.radius * Math.sin(s.phi) * Math.sin(s.theta);
    this.camera.position.y = s.radius * Math.cos(s.phi) + 10;
    this.camera.position.z = s.radius * Math.sin(s.phi) * Math.cos(s.theta);
    this.camera.lookAt(0, 11, 0);
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x3B82F6, 0.6);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xE0F2FE, 1.2);
    this.dirLight.position.set(20, 40, 20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.scene.add(this.dirLight);

    this.pointLight = new THREE.PointLight(0x00B4D8, 2, 60);
    this.pointLight.position.set(0, 2, 0);
    this.scene.add(this.pointLight);
  }

  createMangkuluhurTower() {
    this.buildingGroup = new THREE.Group();
    this.scene.add(this.buildingGroup);

    // Ground Plaza / City District Grid
    const groundGeo = new THREE.PlaneGeometry(120, 120, 24, 24);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x080F1E,
      roughness: 0.85,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid lines for high-tech spatial feel
    const grid = new THREE.GridHelper(100, 30, 0x1B4D9B, 0x122442);
    grid.position.y = 0.05;
    this.scene.add(grid);

    // Surrounding low-poly city context buildings
    this.createSkylineContext();

    // Tower Structure Specification (32 Floors + Crown & Podium)
    const floorHeight = 0.85;
    const numFloors = 26;

    // Floor metadata
    const floorTypes = [
      { name: 'Ground Lobby & Concierge', cat: 'Lobby', occ: '98%', kwh: '42 kWh/m²', colorArch: 0x223554, colorBms: 0x06D6A0, colorOcc: 0x1B4D9B },
      { name: 'Podium Retail & F&B', cat: 'Retail', occ: '95%', kwh: '68 kWh/m²', colorArch: 0x243B5E, colorBms: 0xF59E0B, colorOcc: 0x00B4D8 },
      { name: 'Executive Conference Center', cat: 'Amenities', occ: '90%', kwh: '51 kWh/m²', colorArch: 0x264168, colorBms: 0x06D6A0, colorOcc: 0x8B5CF6 },
      { name: 'Banking & Financial Hub', cat: 'Banking', occ: '100%', kwh: '74 kWh/m²', colorArch: 0x284772, colorBms: 0xEF4444, colorOcc: 0x1E40AF },
      { name: 'Multinational Tech Suite', cat: 'Tech', occ: '100%', kwh: '82 kWh/m²', colorArch: 0x2A4D7C, colorBms: 0xF59E0B, colorOcc: 0x3B82F6 },
      { name: 'Grade-A Prime Office (Leased)', cat: 'Corporate', occ: '100%', kwh: '55 kWh/m²', colorArch: 0x2C5386, colorBms: 0x06D6A0, colorOcc: 0x10B981 },
      { name: 'Prime Office Floor (Available)', cat: 'Vacant', occ: '0%', kwh: '15 kWh/m²', colorArch: 0x2E5990, colorBms: 0x00B4D8, colorOcc: 0xEC4899 },
      { name: 'Penthouse Executive Boardroom', cat: 'Penthouse', occ: '100%', kwh: '48 kWh/m²', colorArch: 0x30609A, colorBms: 0x06D6A0, colorOcc: 0xD97706 }
    ];

    for (let i = 0; i < numFloors; i++) {
      // Gentle taper & architectural facade shaping inspired by Mangkuluhur City
      const scale = 1.0 - (i / numFloors) * 0.22;
      const w = 11 * scale;
      const d = 8.5 * scale;
      const y = i * floorHeight + floorHeight / 2;

      // Floor Geometry
      const floorGeo = new THREE.BoxGeometry(w, floorHeight * 0.88, d);

      // Floor data assignment
      const meta = floorTypes[i % floorTypes.length];
      const floorNumber = i + 1;

      const floorMat = new THREE.MeshStandardMaterial({
        color: meta.colorArch,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.88
      });

      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.y = y;
      floorMesh.castShadow = true;
      floorMesh.receiveShadow = true;

      // Edges / wireframe for architectural clarity
      const edges = new THREE.EdgesGeometry(floorGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0.35 });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      floorMesh.add(wireframe);

      // Store floor info for raycasting and inspection
      floorMesh.userData = {
        floorIndex: i,
        floorNumber: floorNumber,
        originalY: y,
        name: `Level ${floorNumber}: ${meta.name}`,
        category: meta.cat,
        occupancy: meta.occ,
        energyKwh: meta.kwh,
        baseColor: meta.colorArch,
        bmsColor: meta.colorBms,
        occColor: meta.colorOcc
      };

      this.floors.push(floorMesh);
      this.buildingGroup.add(floorMesh);
    }

    // Skyscraper Crown & Helipad
    const crownY = numFloors * floorHeight + 0.8;
    const crownGeo = new THREE.CylinderGeometry(2.5, 3.8, 1.6, 8);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x0F2952, metalness: 0.9, roughness: 0.1 });
    const crownMesh = new THREE.Mesh(crownGeo, crownMat);
    crownMesh.position.y = crownY;
    this.buildingGroup.add(crownMesh);

    // Spire / Antenna
    const spireGeo = new THREE.CylinderGeometry(0.1, 0.4, 4, 8);
    const spireMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.9, roughness: 0.1 });
    const spireMesh = new THREE.Mesh(spireGeo, spireMat);
    spireMesh.position.y = crownY + 2.6;
    this.buildingGroup.add(spireMesh);

    // Red beacon light on spire
    const beaconGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.y = crownY + 4.6;
    this.buildingGroup.add(beaconMesh);
  }

  createSkylineContext() {
    const contextGroup = new THREE.Group();
    const positions = [
      { x: -28, z: -20, w: 9, h: 16, d: 9 },
      { x: -25, z: 15, w: 7, h: 22, d: 7 },
      { x: 26, z: -18, w: 8, h: 20, d: 8 },
      { x: 24, z: 22, w: 10, h: 14, d: 10 },
      { x: -35, z: 0, w: 11, h: 12, d: 11 },
      { x: 38, z: 4, w: 9, h: 26, d: 9 }
    ];

    positions.forEach(p => {
      const geo = new THREE.BoxGeometry(p.w, p.h, p.d);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0D1B33,
        roughness: 0.7,
        metalness: 0.3,
        transparent: true,
        opacity: 0.6
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.x, p.h / 2, p.z);
      contextGroup.add(mesh);

      // Edges for context
      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x1E3A8A, opacity: 0.25, transparent: true }));
      mesh.add(line);
    });

    this.scene.add(contextGroup);
  }

  setupInteraction() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    dom.addEventListener('mousemove', (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.isDragging) {
        const deltaX = e.clientX - this.prevMousePos.x;
        const deltaY = e.clientY - this.prevMousePos.y;

        this.spherical.theta -= deltaX * 0.007;
        this.spherical.phi = Math.max(0.1, Math.min(Math.PI / 2.1, this.spherical.phi - deltaY * 0.007));
        this.updateCameraFromSpherical();

        this.prevMousePos = { x: e.clientX, y: e.clientY };
      } else {
        this.checkRaycast();
      }
    });

    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.spherical.radius = Math.max(20, Math.min(85, this.spherical.radius + e.deltaY * 0.04));
      this.updateCameraFromSpherical();
    }, { passive: false });

    dom.addEventListener('click', () => {
      if (this.hoveredFloor) {
        this.selectFloor(this.hoveredFloor);
      }
    });

    // Touch support for mobile/tablet
    let touchStartDist = 0;
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });

    dom.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        const deltaX = e.touches[0].clientX - this.prevMousePos.x;
        const deltaY = e.touches[0].clientY - this.prevMousePos.y;
        this.spherical.theta -= deltaX * 0.008;
        this.spherical.phi = Math.max(0.1, Math.min(Math.PI / 2.1, this.spherical.phi - deltaY * 0.008));
        this.updateCameraFromSpherical();
        this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = (touchStartDist - dist) * 0.08;
        this.spherical.radius = Math.max(20, Math.min(85, this.spherical.radius + factor));
        this.updateCameraFromSpherical();
        touchStartDist = dist;
      }
    });

    dom.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  checkRaycast() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.floors);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (this.hoveredFloor !== hit) {
        if (this.hoveredFloor && this.hoveredFloor !== this.selectedFloor) {
          this.resetFloorColor(this.hoveredFloor);
        }
        this.hoveredFloor = hit;
        hit.material.emissive = new THREE.Color(0x38BDF8);
        hit.material.emissiveIntensity = 0.45;
        this.updateTooltip(hit.userData);
      }
    } else {
      if (this.hoveredFloor && this.hoveredFloor !== this.selectedFloor) {
        this.resetFloorColor(this.hoveredFloor);
      }
      this.hoveredFloor = null;
    }
  }

  resetFloorColor(floor) {
    floor.material.emissive = new THREE.Color(0x000000);
    floor.material.emissiveIntensity = 0;
  }

  selectFloor(floor) {
    this.selectedFloor = floor;
    const d = floor.userData;
    this.updateHUD(d.name, d.category, d.occupancy, d.energyKwh);
  }

  updateTooltip(data) {
    const tooltip = document.getElementById('spatialTooltip');
    if (tooltip) {
      tooltip.innerHTML = `
        <strong style="color:#38BDF8;">${data.name}</strong><br>
        <span style="color:#94A3B8;">Type:</span> ${data.category}<br>
        <span style="color:#94A3B8;">Occupancy:</span> ${data.occupancy}<br>
        <span style="color:#94A3B8;">Efficiency:</span> ${data.energyKwh}
      `;
      tooltip.style.opacity = '1';
    }
  }

  updateHUD(floorName, category, occupancy, energy) {
    const elName = document.getElementById('hudFloorName');
    const elOcc = document.getElementById('hudOccupancy');
    const elEnergy = document.getElementById('hudEnergy');

    if (elName) elName.textContent = floorName;
    if (elOcc) elOcc.textContent = occupancy;
    if (elEnergy) elEnergy.textContent = energy;
  }

  setVisualMode(mode) {
    this.currentMode = mode;
    this.floors.forEach(f => {
      const d = f.userData;
      let targetColor;
      if (mode === 'bms') {
        targetColor = d.bmsColor;
      } else if (mode === 'occupancy') {
        targetColor = d.occColor;
      } else {
        targetColor = d.baseColor;
      }
      f.material.color.setHex(targetColor);
    });
  }

  toggleExplodedView() {
    this.isExploded = !this.isExploded;
    const factor = this.isExploded ? 1.9 : 1.0;

    this.floors.forEach((f, idx) => {
      const targetY = this.isExploded ? f.userData.originalY * factor : f.userData.originalY;
      // Animate with lerp in render loop
      f.targetY = targetY;
    });

    return this.isExploded;
  }

  setTimeOfDay(time) {
    this.timeOfDay = time;
    if (time === 'day') {
      this.scene.background.setHex(0xE0F2FE);
      this.scene.fog.color.setHex(0xE0F2FE);
      this.ambientLight.color.setHex(0xFFFFFF);
      this.ambientLight.intensity = 0.9;
      this.dirLight.color.setHex(0xFFFBEB);
      this.dirLight.intensity = 1.4;
    } else if (time === 'sunset') {
      this.scene.background.setHex(0x2A153A);
      this.scene.fog.color.setHex(0x2A153A);
      this.ambientLight.color.setHex(0xF97316);
      this.ambientLight.intensity = 0.6;
      this.dirLight.color.setHex(0xFB923C);
      this.dirLight.intensity = 1.0;
    } else {
      // Night / Dark corporate cyber luxury
      this.scene.background.setHex(0x070E1A);
      this.scene.fog.color.setHex(0x070E1A);
      this.ambientLight.color.setHex(0x3B82F6);
      this.ambientLight.intensity = 0.6;
      this.dirLight.color.setHex(0x93C5FD);
      this.dirLight.intensity = 1.1;
    }
  }

  bindControls() {
    const btnArch = document.getElementById('btnModeArch');
    const btnBms = document.getElementById('btnModeBms');
    const btnOcc = document.getElementById('btnModeOcc');
    const btnExplode = document.getElementById('btnToggleExplode');
    const btnLighting = document.getElementById('btnToggleLighting');

    const setActive = (activeBtn) => {
      [btnArch, btnBms, btnOcc].forEach(b => b && b.classList.remove('active'));
      if (activeBtn) activeBtn.classList.add('active');
    };

    if (btnArch) {
      btnArch.addEventListener('click', () => {
        setActive(btnArch);
        this.setVisualMode('arch');
      });
    }

    if (btnBms) {
      btnBms.addEventListener('click', () => {
        setActive(btnBms);
        this.setVisualMode('bms');
      });
    }

    if (btnOcc) {
      btnOcc.addEventListener('click', () => {
        setActive(btnOcc);
        this.setVisualMode('occupancy');
      });
    }

    if (btnExplode) {
      btnExplode.addEventListener('click', () => {
        const active = this.toggleExplodedView();
        btnExplode.classList.toggle('active', active);
      });
    }

    if (btnLighting) {
      const times = ['night', 'day', 'sunset'];
      let timeIdx = 0;
      btnLighting.addEventListener('click', () => {
        timeIdx = (timeIdx + 1) % times.length;
        this.setTimeOfDay(times[timeIdx]);
        btnLighting.textContent = times[timeIdx].toUpperCase();
      });
    }
  }

  onWindowResize() {
    if (!this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Slow ambient rotation when not dragging
    if (!this.isDragging && this.buildingGroup) {
      this.buildingGroup.rotation.y += 0.0025;
    }

    // Smooth floor explosion lerp
    this.floors.forEach(f => {
      if (f.targetY !== undefined) {
        f.position.y += (f.targetY - f.position.y) * 0.1;
      }
    });

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /* -------------------------------------------------------------------------
     High-Performance Canvas 2.5D Fallback
     Ensures 100% reliability offline or when WebGL CDN is blocked
     ------------------------------------------------------------------------- */
  initCanvasFallback() {
    this.container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.className = 'spatial-canvas';
    this.container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let angle = 0.4;
    let isDragging = false;
    let startX = 0;

    const resize = () => {
      canvas.width = this.container.clientWidth * (window.devicePixelRatio || 1);
      canvas.height = this.container.clientHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
    });

    window.addEventListener('mouseup', () => isDragging = false);

    canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - startX;
        angle += dx * 0.01;
        startX = e.clientX;
      }
    });

    const draw = () => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Background gradient
      const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w / 1.5);
      grad.addColorStop(0, '#0F1E36');
      grad.addColorStop(1, '#060B14');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Floor rendering in isometric perspective
      const cx = w / 2;
      const cy = h * 0.85;
      const numFloors = 22;
      const floorH = 14;

      if (!isDragging) angle += 0.005;

      for (let i = 0; i < numFloors; i++) {
        const fy = cy - i * floorH;
        const scale = 1 - (i / numFloors) * 0.3;
        const radius = 70 * scale;

        ctx.save();
        ctx.translate(cx, fy);

        // Floor Polygon
        ctx.beginPath();
        const p1 = { x: Math.cos(angle) * radius * 1.5, y: Math.sin(angle) * radius * 0.5 };
        const p2 = { x: Math.cos(angle + Math.PI / 2) * radius * 1.5, y: Math.sin(angle + Math.PI / 2) * radius * 0.5 };
        const p3 = { x: Math.cos(angle + Math.PI) * radius * 1.5, y: Math.sin(angle + Math.PI) * radius * 0.5 };
        const p4 = { x: Math.cos(angle + Math.PI * 1.5) * radius * 1.5, y: Math.sin(angle + Math.PI * 1.5) * radius * 0.5 };

        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();

        let strokeColor = '#38BDF8';
        let fillColor = 'rgba(27, 77, 155, 0.4)';

        if (this.currentMode === 'bms') {
          strokeColor = i % 3 === 0 ? '#06D6A0' : i % 5 === 0 ? '#F59E0B' : '#00B4D8';
          fillColor = strokeColor + '33';
        }

        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
      }

      requestAnimationFrame(draw);
    };

    draw();
    this.bindControls();
  }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.promindTwin = new PromindBuildingViewer('spatialViewer');
});

