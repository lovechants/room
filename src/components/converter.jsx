import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

const Room3DConverter = () => {
  const [image, setImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('upload');
  const [error, setError] = useState(null);
  const [furniture, setFurniture] = useState([]);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  
  const canvasRef = useRef();
  const sceneRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const fileInputRef = useRef();
  const animationRef = useRef();
  const mouseRef = useRef(new THREE.Vector2());

  // Clean furniture library
  const furnitureLibrary = [
    { id: 'chair', name: 'Chair', color: 0x8B4513, size: [0.6, 1.0, 0.6] },
    { id: 'table', name: 'Table', color: 0x654321, size: [1.2, 0.4, 0.8] },
    { id: 'sofa', name: 'Sofa', color: 0x2F4F4F, size: [2.0, 0.8, 0.9] },
    { id: 'lamp', name: 'Lamp', color: 0xFFD700, size: [0.3, 1.8, 0.3] },
    { id: 'plant', name: 'Plant', color: 0x228B22, size: [0.5, 1.2, 0.5] },
    { id: 'bed', name: 'Bed', color: 0x4A4A4A, size: [2.0, 0.6, 1.4] }
  ];

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(0, 4, 8);
    camera.lookAt(0, 0, 0);
    
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true 
    });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      renderer.dispose();
    };
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage({ 
          file, 
          dataUrl: e.target.result, 
          element: img,
          width: img.width,
          height: img.height
        });
        setStage('uploaded');
      };
      img.onerror = () => setError('Failed to load image');
      img.src = e.target.result;
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsDataURL(file);
  };

  const createFurniture = (type, position) => {
    const furnitureType = furnitureLibrary.find(f => f.id === type);
    if (!furnitureType) return null;

    const [width, height, depth] = furnitureType.size;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({ 
      color: furnitureType.color
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.position.y = height / 2 - 1.5;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { 
      isFurniture: true, 
      type: type,
      id: Date.now() + Math.random(),
      originalColor: furnitureType.color
    };
    
    return mesh;
  };

  const addFurnitureToScene = (type) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const x = (Math.random() - 0.5) * 6;
    const z = (Math.random() - 0.5) * 4;
    const position = new THREE.Vector3(x, 0, z);
    
    const furnitureMesh = createFurniture(type, position);
    if (furnitureMesh) {
      scene.add(furnitureMesh);
      
      const furnitureData = {
        id: furnitureMesh.userData.id,
        type: type,
        mesh: furnitureMesh,
        position: position.clone()
      };
      
      setFurniture(prev => [...prev, furnitureData]);
    }
  };

  const removeFurniture = (id) => {
    const scene = sceneRef.current;
    const furnitureItem = furniture.find(f => f.id === id);
    
    if (furnitureItem && scene) {
      scene.remove(furnitureItem.mesh);
      setFurniture(prev => prev.filter(f => f.id !== id));
    }
    
    if (selectedFurniture && selectedFurniture.id === id) {
      setSelectedFurniture(null);
    }
  };

  const selectFurniture = (furnitureData) => {
    // Deselect previous
    if (selectedFurniture) {
      selectedFurniture.mesh.material.emissive.setHex(0x000000);
    }
    
    // Select new
    setSelectedFurniture(furnitureData);
    furnitureData.mesh.material.emissive.setHex(0x444444);
  };

  const deselectFurniture = () => {
    if (selectedFurniture) {
      selectedFurniture.mesh.material.emissive.setHex(0x000000);
      setSelectedFurniture(null);
    }
  };

  const processImage = async () => {
    if (!image) {
      setError('No image to process');
      return;
    }
    
    setProcessing(true);
    setStage('processing');
    setError(null);
    
    try {
      setProgress(25);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setProgress(75);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const scene = sceneRef.current;
      
      // Clear any existing room
      const existingRoom = scene.children.filter(child => 
        child.userData.isRoomStructure
      );
      existingRoom.forEach(obj => scene.remove(obj));
      
      // Create room structure
      addRoomStructure(scene);
      
      setProgress(100);
      
      const camera = cameraRef.current;
      camera.position.set(0, 4, 8);
      camera.lookAt(0, 0, 0);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setStage('viewing');
      
    } catch (error) {
      setError(`Processing failed: ${error.message}`);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const addRoomStructure = (scene) => {
    const roomBounds = { width: 8, height: 3, depth: 6 };
    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(roomBounds.width, roomBounds.depth);
    const floorMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8B7355
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -roomBounds.height / 2;
    floor.receiveShadow = true;
    floor.userData.isRoomStructure = true;
    scene.add(floor);
    
    // Walls
    const wallMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xF5F5F5,
      transparent: true,
      opacity: 0.3
    });
    
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomBounds.width, roomBounds.height),
      wallMaterial
    );
    backWall.position.z = -roomBounds.depth / 2;
    backWall.userData.isRoomStructure = true;
    scene.add(backWall);
    
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomBounds.depth, roomBounds.height),
      wallMaterial
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.x = -roomBounds.width / 2;
    leftWall.userData.isRoomStructure = true;
    scene.add(leftWall);
    
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomBounds.depth, roomBounds.height),
      wallMaterial
    );
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.x = roomBounds.width / 2;
    rightWall.userData.isRoomStructure = true;
    scene.add(rightWall);
  };

  const resetApp = () => {
    setImage(null);
    setStage('upload');
    setError(null);
    setFurniture([]);
    setSelectedFurniture(null);
    
    const scene = sceneRef.current;
    if (scene) {
      const objectsToRemove = scene.children.filter(child => 
        child.userData.isRoomStructure || child.userData.isFurniture
      );
      objectsToRemove.forEach(obj => scene.remove(obj));
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Proper mouse controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let mouseDownPos = { x: 0, y: 0 };
    let isMouseDown = false;
    let hasMoved = false;

    const handleMouseDown = (event) => {
      isMouseDown = true;
      hasMoved = false;
      mouseDownPos.x = event.clientX;
      mouseDownPos.y = event.clientY;
    };

    const handleMouseMove = (event) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - mouseDownPos.x;
      const deltaY = event.clientY - mouseDownPos.y;
      const moveThreshold = 5;

      if (Math.abs(deltaX) > moveThreshold || Math.abs(deltaY) > moveThreshold) {
        hasMoved = true;

        if (selectedFurniture) {
          // Move furniture
          const rect = canvas.getBoundingClientRect();
          const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
          );

          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, cameraRef.current);

          // Create floor plane at y = -1.5
          const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.5);
          const intersection = new THREE.Vector3();

          if (raycaster.ray.intersectPlane(floorPlane, intersection)) {
            selectedFurniture.mesh.position.x = intersection.x;
            selectedFurniture.mesh.position.z = intersection.z;
          }
        } else {
          // Rotate camera
          const camera = cameraRef.current;
          const spherical = new THREE.Spherical();
          spherical.setFromVector3(camera.position);

          spherical.theta -= deltaX * 0.01;
          spherical.phi += deltaY * 0.01;
          spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

          camera.position.setFromSpherical(spherical);
          camera.lookAt(0, 0, 0);
        }

        mouseDownPos.x = event.clientX;
        mouseDownPos.y = event.clientY;
      }
    };

    const handleMouseUp = (event) => {
      if (isMouseDown && !hasMoved) {
        // This was a click, not a drag - handle furniture selection
        const rect = canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);

        // Get all furniture meshes
        const furnitureObjects = furniture.map(f => f.mesh);
        const intersects = raycaster.intersectObjects(furnitureObjects, false);

        if (intersects.length > 0) {
          // Clicked on furniture
          const clickedMesh = intersects[0].object;
          const furnitureData = furniture.find(f => f.mesh === clickedMesh);
          
          if (furnitureData) {
            selectFurniture(furnitureData);
          }
        } else {
          // Clicked on empty space
          deselectFurniture();
        }
      }

      isMouseDown = false;
      hasMoved = false;
    };

    const handleWheel = (event) => {
      event.preventDefault();
      const camera = cameraRef.current;
      const distance = camera.position.length();
      const newDistance = Math.max(3, Math.min(20, distance + event.deltaY * 0.01));
      camera.position.normalize().multiplyScalar(newDistance);
    };

    const handleKeyDown = (event) => {
      if (!selectedFurniture) return;

      const moveDistance = 0.3;
      const mesh = selectedFurniture.mesh;

      switch (event.key) {
        case 'ArrowLeft':
          mesh.position.x -= moveDistance;
          event.preventDefault();
          break;
        case 'ArrowRight':
          mesh.position.x += moveDistance;
          event.preventDefault();
          break;
        case 'ArrowUp':
          mesh.position.z -= moveDistance;
          event.preventDefault();
          break;
        case 'ArrowDown':
          mesh.position.z += moveDistance;
          event.preventDefault();
          break;
        case 'r':
        case 'R':
          mesh.rotation.y += Math.PI / 4;
          event.preventDefault();
          break;
        case 'Escape':
          deselectFurniture();
          event.preventDefault();
          break;
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [furniture, selectedFurniture]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-light mb-12 text-center text-gray-800">
          Room Staging Tool
        </h1>
        
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Controls Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium mb-4 text-gray-800">Upload Image</h2>
              
              {stage === 'upload' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Select Image
                  </button>
                  <p className="text-gray-500 mt-2 text-sm">
                    Or drag and drop
                  </p>
                </div>
              )}
              
              {stage === 'uploaded' && image && (
                <div className="space-y-4">
                  <img 
                    src={image.dataUrl} 
                    alt="Room" 
                    className="w-full rounded-lg"
                  />
                  <button
                    onClick={processImage}
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {processing ? 'Converting...' : 'Convert to 3D'}
                  </button>
                </div>
              )}
              
              {processing && (
                <div className="space-y-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    {progress}%
                  </p>
                </div>
              )}
              
              {stage === 'viewing' && (
                <button
                  onClick={resetApp}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  New Room
                </button>
              )}
            </div>

            {/* Furniture Controls */}
            {stage === 'viewing' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-medium mb-4 text-gray-800">Add Furniture</h2>
                <div className="space-y-2">
                  {furnitureLibrary.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addFurnitureToScene(item.id)}
                      className="w-full text-left bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-lg font-medium transition-colors"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
                
                {furniture.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="font-medium mb-3 text-gray-800">
                      Placed Items ({furniture.length})
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {furniture.map((item) => (
                        <div 
                          key={item.id} 
                          className={`flex justify-between items-center p-3 rounded-lg transition-colors ${
                            selectedFurniture?.id === item.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                          }`}
                        >
                          <span className="text-sm font-medium">
                            {furnitureLibrary.find(f => f.id === item.type)?.name}
                          </span>
                          <button
                            onClick={() => removeFurniture(item.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Controls Help */}
            {stage === 'viewing' && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2 text-gray-800">Controls</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Drag: Rotate camera</p>
                  <p>Scroll: Zoom</p>
                  <p>Click: Select furniture</p>
                  {selectedFurniture && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="font-medium text-blue-600">
                        {furnitureLibrary.find(f => f.id === selectedFurniture.type)?.name} selected
                      </p>
                      <p>Drag: Move furniture</p>
                      <p>Arrow keys: Fine movement</p>
                      <p>R: Rotate</p>
                      <p>ESC: Deselect</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* 3D Viewport */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-medium mb-4 text-gray-800">3D Environment</h2>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="w-full rounded-lg border border-gray-200 cursor-grab active:cursor-grabbing"
                  style={{ aspectRatio: '4/3' }}
                />
                {stage === 'upload' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 rounded-lg">
                    <p className="text-gray-600">Upload an image to begin</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room3DConverter;
