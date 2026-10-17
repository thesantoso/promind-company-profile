import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Layers, Activity, Building, Sun, Moon, Sunset, Info, CheckCircle2, Zap } from 'lucide-react';

export default function DigitalTwinViewer({ lang }) {
  const mountRef = useRef(null);
  const [mode, setMode] = useState('arch');
  const [timeOfDay, setTimeOfDay] = useState('day');
  const [selectedFloorData, setSelectedFloorData] = useState({
    floor: 28,
    name: lang === 'id' ? "Level 28 - PROMIND Executive Suite" : "Level 28 - PROMIND Executive Suite",
    gla: "1,850 m²",
    tenant: "PT PROPERTI MANAJEMEN INOVASI INDONESIA (HQ)",
    occupancy: "100%",
    energy: "0.62 kW/TR (High Efficiency)",
    bmsStatus: "Optimal | Sensor Active"
  });

  const sceneStateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    floors: [],
    buildingGroup: null,
    dirLight: null,
    ambientLight: null,
    animFrameId: null
  });

  const floorDatabase = [
    { floor: 32, name: lang === 'id' ? "Observation Deck & Sky Garden" : "Observation Deck & Sky Garden", gla: "1,200 m²", tenant: "Executive Sky Lounge", occupancy: "100%", energy: "0.70 kW/TR", bmsStatus: "Optimal" },
    { floor: 30, name: "Level 30 - Technology & AI Hub", gla: "1,920 m²", tenant: "Global Tech Enterprise", occupancy: "100%", energy: "0.65 kW/TR", bmsStatus: "Optimal" },
    { floor: 28, name: "Level 28 - PROMIND Executive Suite", gla: "1,850 m²", tenant: "PT Properti Manajemen Inovasi Indonesia", occupancy: "100%", energy: "0.62 kW/TR", bmsStatus: "Optimal" },
    { floor: 24, name: "Level 24 - Corporate Advisory", gla: "1,980 m²", tenant: "International Legal & Tax Firm", occupancy: "95%", energy: "0.68 kW/TR", bmsStatus: "Optimal" },
    { floor: 20, name: "Level 20 - Banking & Capital Markets", gla: "2,050 m²", tenant: "Regional Investment Bank HQ", occupancy: "100%", energy: "0.66 kW/TR", bmsStatus: "Optimal" },
    { floor: 16, name: "Level 16 - Multi-Tenant Enterprise", gla: "2,100 m²", tenant: "Fintech & Renewable Energy Cos", occupancy: "90%", energy: "0.69 kW/TR", bmsStatus: "Optimal" },
    { floor: 12, name: "Level 12 - Engineering & Logistics", gla: "2,100 m²", tenant: "Supply Chain & Infra HQ", occupancy: "92%", energy: "0.71 kW/TR", bmsStatus: "Optimal" },
    { floor: 8, name: "Level 8 - Flexible Workplace Suites", gla: "2,150 m²", tenant: "Enterprise Coworking Suites", occupancy: "88%", energy: "0.72 kW/TR", bmsStatus: "Optimal" },
    { floor: 4, name: "Level 4 - Conference & Wellness", gla: "2,200 m²", tenant: "Convention Hall & Fitness Center", occupancy: "95%", energy: "0.74 kW/TR", bmsStatus: "Optimal" },
    { floor: 1, name: "Ground Level - Grand Lobby & Transit", gla: "2,400 m²", tenant: "Lobby, Banking Branch, LRT Skybridge", occupancy: "100%", energy: "0.68 kW/TR", bmsStatus: "Optimal" },
  ];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1c2e);
    scene.fog = new THREE.FogExp2(0x0e1c2e, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(28, 24, 38);
    camera.lookAt(0, 11, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x3B82F6, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xE0F2FE, 1.4);
    dirLight.position.set(25, 45, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const grid = new THREE.GridHelper(60, 30, 0x2563EB, 0x1E293B);
    grid.position.y = -0.05;
    scene.add(grid);

    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);

    const floorMeshList = [];
    const totalFloors = 24;
    const baseWidth = 11;
    const baseDepth = 8;
    const floorHeight = 0.95;

    // Podium Base
    const podiumGeo = new THREE.BoxGeometry(baseWidth + 3, 2.2, baseDepth + 3);
    const podiumMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.8, roughness: 0.25 });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.y = 1.1;
    buildingGroup.add(podium);

    // Core
    const coreGeo = new THREE.BoxGeometry(3.5, totalFloors * floorHeight + 2, 3.5);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.8 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = (totalFloors * floorHeight) / 2;
    buildingGroup.add(coreMesh);

    // Construct Floors
    for (let i = 0; i < totalFloors; i++) {
      const taper = 1 - (i / totalFloors) * 0.22;
      const w = baseWidth * taper;
      const d = baseDepth * taper;
      const yPos = 2.4 + i * floorHeight;

      const floorGeo = new THREE.BoxGeometry(w, floorHeight * 0.88, d);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x2959AB,
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.7,
        opacity: 0.85,
        transparent: true,
        reflectivity: 0.9
      });

      const floorMesh = new THREE.Mesh(floorGeo, glassMat);
      floorMesh.position.set(0, yPos, 0);

      floorMesh.userData = {
        floorIndex: i + 1,
        actualFloorNum: Math.floor(1 + (i / totalFloors) * 32),
        baseY: yPos,
        width: w,
        depth: d
      };

      const edges = new THREE.EdgesGeometry(floorGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0.3 });
      const edgeLines = new THREE.LineSegments(edges, lineMat);
      floorMesh.add(edgeLines);

      buildingGroup.add(floorMesh);
      floorMeshList.push(floorMesh);
    }

    // Crown
    const crownGeo = new THREE.ConeGeometry(2, 4.5, 4);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x38BDF8, metalness: 0.9, roughness: 0.1, emissive: 0x2959AB, emissiveIntensity: 0.5 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 2.4 + totalFloors * floorHeight + 2;
    crown.rotation.y = Math.PI / 4;
    buildingGroup.add(crown);

    sceneStateRef.current = {
      scene,
      camera,
      renderer,
      floors: floorMeshList,
      buildingGroup,
      dirLight,
      ambientLight,
      animFrameId: null
    };

    // Orbit Drag
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    const spherical = { radius: 46, theta: Math.PI / 4, phi: Math.PI / 3 };

    const updateCamera = () => {
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi) + 10;
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 12, 0);
    };
    updateCamera();

    const onMouseDown = (e) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      spherical.theta -= deltaX * 0.007;
      spherical.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, spherical.phi - deltaY * 0.007));

      updateCamera();
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => { isDragging = false; };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(floorMeshList);

      if (intersects.length > 0) {
        const hitFloor = intersects[0].object;
        const flNum = hitFloor.userData.actualFloorNum;
        const matched = floorDatabase.find(f => Math.abs(f.floor - flNum) <= 3) || {
          floor: flNum,
          name: `Level ${flNum} - Commercial Office Suite`,
          gla: `${1800 + (flNum % 5) * 80} m²`,
          tenant: flNum > 20 ? "Financial Advisory / MNC" : "Tech & Creative Enterprise",
          occupancy: `${88 + (flNum % 10)}%`,
          energy: "0.68 kW/TR (LEED Gold)",
          bmsStatus: "Optimal | Active"
        };
        setSelectedFloorData(matched);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('click', onClick);

    let rotSpeed = 0.0015;
    const animate = () => {
      sceneStateRef.current.animFrameId = requestAnimationFrame(animate);
      if (!isDragging) {
        spherical.theta += rotSpeed;
        updateCamera();
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 500;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(sceneStateRef.current.animFrameId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const { floors } = sceneStateRef.current;
    if (!floors || floors.length === 0) return;

    floors.forEach((mesh, idx) => {
      const progress = idx / floors.length;

      if (mode === 'explode') {
        mesh.position.y = mesh.userData.baseY + idx * 0.45;
      } else {
        mesh.position.y = mesh.userData.baseY;
      }

      if (mode === 'bms') {
        const heatColor = progress > 0.7 ? 0xEF4444 : progress > 0.4 ? 0xF59E0B : 0x10B981;
        mesh.material.color.setHex(heatColor);
        mesh.material.emissive.setHex(heatColor);
        mesh.material.emissiveIntensity = 0.35;
      } else if (mode === 'tenancy') {
        let tenantColor = 0x3B82F6;
        if (idx > 20) tenantColor = 0xC59B27;
        else if (idx > 14) tenantColor = 0x8B5CF6;
        else if (idx > 7) tenantColor = 0x06B6D4;
        else tenantColor = 0x10B981;

        mesh.material.color.setHex(tenantColor);
        mesh.material.emissive.setHex(tenantColor);
        mesh.material.emissiveIntensity = 0.25;
      } else {
        mesh.material.color.setHex(0x2959AB);
        mesh.material.emissive.setHex(0x0F172A);
        mesh.material.emissiveIntensity = 0.1;
      }
    });
  }, [mode]);

  useEffect(() => {
    const { dirLight, ambientLight, scene } = sceneStateRef.current;
    if (!dirLight || !ambientLight || !scene) return;

    if (timeOfDay === 'day') {
      scene.background.setHex(0x0e1c2e);
      ambientLight.color.setHex(0xFFFFFF);
      ambientLight.intensity = 0.9;
      dirLight.color.setHex(0xFEF08A);
      dirLight.intensity = 1.6;
    } else if (timeOfDay === 'sunset') {
      scene.background.setHex(0x1a152e);
      ambientLight.color.setHex(0xF43F5E);
      ambientLight.intensity = 0.6;
      dirLight.color.setHex(0xFB923C);
      dirLight.intensity = 1.8;
    } else {
      scene.background.setHex(0x070E1A);
      ambientLight.color.setHex(0x3B82F6);
      ambientLight.intensity = 0.5;
      dirLight.color.setHex(0x93C5FD);
      dirLight.intensity = 1.2;
    }
  }, [timeOfDay]);

  return (
    <div className="bg-[#fff] border border-[#d6dfe6] rounded-none shadow-md overflow-hidden">
      {/* 3D Dashboard Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Main 3D Canvas Area (8 cols) */}
        <div className="lg:col-span-8 bg-[#0a1524] relative min-h-[460px] flex flex-col justify-between">
          {/* Top Controls Toolbar */}
          <div className="p-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            <div className="pointer-events-auto flex items-center p-1 bg-[#10233b]/90 border border-white/15 backdrop-blur-md text-xs font-semibold">
              <button
                onClick={() => setMode('arch')}
                className={`px-3 py-1.5 transition ${mode === 'arch' ? 'bg-[#2959ab] text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                {lang === 'id' ? 'Arsitektur' : 'Architecture'}
              </button>
              <button
                onClick={() => setMode('bms')}
                className={`px-3 py-1.5 transition flex items-center space-x-1 ${mode === 'bms' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                <Activity className="w-3 h-3" />
                <span>BMS Heatmap</span>
              </button>
              <button
                onClick={() => setMode('tenancy')}
                className={`px-3 py-1.5 transition flex items-center space-x-1 ${mode === 'tenancy' ? 'bg-purple-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                <Building className="w-3 h-3" />
                <span>Tenancy Mix</span>
              </button>
              <button
                onClick={() => setMode('explode')}
                className={`px-3 py-1.5 transition flex items-center space-x-1 ${mode === 'explode' ? 'bg-amber-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                <Layers className="w-3 h-3" />
                <span>Explode Stacking</span>
              </button>
            </div>

            <div className="pointer-events-auto flex items-center p-1 bg-[#10233b]/90 border border-white/15 backdrop-blur-md text-xs font-semibold">
              <button
                onClick={() => setTimeOfDay('day')}
                className={`p-2 transition ${timeOfDay === 'day' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Siang / Day"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTimeOfDay('sunset')}
                className={`p-2 transition ${timeOfDay === 'sunset' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Senja / Sunset"
              >
                <Sunset className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTimeOfDay('night')}
                className={`p-2 transition ${timeOfDay === 'night' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Malam / Night"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mount Three.js */}
          <div ref={mountRef} className="w-full h-[450px] cursor-grab active:cursor-grabbing" />

          {/* Floating Telemetry Strip */}
          <div className="p-4 z-20 pointer-events-none">
            <div className="p-3 bg-[#0a1524]/90 border border-white/15 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs text-slate-200">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-blue-500 inline-block"></span>
                <span><strong>GLA: 58,400 m²</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-emerald-400 inline-block"></span>
                <span><strong>Okupansi: 94.2%</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-amber-400 inline-block"></span>
                <span><strong>Sertifikasi: LEED Gold</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-sky-400 inline-block"></span>
                <span><strong>HVAC: 0.68 kW/TR</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Inspector (4 cols) */}
        <div className="lg:col-span-4 p-7 bg-[#fbfcfd] border-t lg:border-t-0 lg:border-l border-[#d6dfe6] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#d8e0e8] pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2959ab] flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5" />
                <span>3D Spatial Telemetry Live</span>
              </span>
              <h3 className="text-lg font-bold text-[#172b42] mt-1 font-manrope">
                {selectedFloorData.name}
              </h3>
              <p className="text-xs text-[#5a6a7c] mt-0.5">
                {lang === 'id' ? 'Klik lantai pada model 3D untuk inspeksi telemetri langsung.' : 'Click any floor on the 3D model to inspect live telemetry.'}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#f2f6fa] border border-[#d0dbe6]">
                <span className="text-[#657688] block text-[10px] uppercase font-bold">{lang === 'id' ? 'Penyewa / Kategori' : 'Occupier / Category'}</span>
                <span className="text-[#172b42] font-bold text-sm mt-0.5 block">{selectedFloorData.tenant}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#f2f6fa] border border-[#d0dbe6]">
                  <span className="text-[#657688] block text-[10px] uppercase font-bold">Gross Leasable Area</span>
                  <span className="text-[#2959ab] font-extrabold text-sm mt-0.5 block">{selectedFloorData.gla}</span>
                </div>
                <div className="p-3 bg-[#f2f6fa] border border-[#d0dbe6]">
                  <span className="text-[#657688] block text-[10px] uppercase font-bold">{lang === 'id' ? 'Tingkat Okupansi' : 'Occupancy Rate'}</span>
                  <span className="text-emerald-700 font-extrabold text-sm mt-0.5 block">{selectedFloorData.occupancy}</span>
                </div>
              </div>

              <div className="p-3 bg-[#f2f6fa] border border-[#d0dbe6]">
                <span className="text-[#657688] block text-[10px] uppercase font-bold">{lang === 'id' ? 'Efisiensi Energi HVAC (BMS)' : 'HVAC Energy Index (BMS)'}</span>
                <span className="text-[#204a8b] font-semibold text-xs mt-0.5 block">{selectedFloorData.energy}</span>
              </div>

              <div className="p-3 bg-[#f2f6fa] border border-[#d0dbe6]">
                <span className="text-[#657688] block text-[10px] uppercase font-bold">Status IoT Sensor Controller</span>
                <div className="flex items-center space-x-1.5 mt-0.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{selectedFloorData.bmsStatus}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#d8e0e8] text-[11px] text-[#6b7b8d] flex items-center space-x-2">
            <Info className="w-4 h-4 text-[#2959ab] shrink-0" />
            <span>{lang === 'id' ? 'Teknologi eksklusif PROMIND untuk pemantauan aset institusional.' : 'Proprietary PROMIND intelligence for institutional asset governance.'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

