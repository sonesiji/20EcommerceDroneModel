class ARViewer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.mixer = null;
        this.clock = new THREE.Clock();
        this.modelLoaded = false;
        this.propellers = [];
    }

    async init(containerId) {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background

        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1, 3);

        // Create renderer
        const container = document.getElementById(containerId);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Add controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 1;

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        // Create and add drone model
        this.model = this.createDroneModel();
        this.scene.add(this.model);
        
        // Start propeller animation
        this.animate();
    }

    addDemoCube() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        this.scene.add(cube);
        this.model = cube;
    }

    async loadModel(modelUrl) {
        try {
            const loader = new THREE.GLTFLoader();
            const gltf = await new Promise((resolve, reject) => {
                loader.load(modelUrl, resolve, 
                    // Add loading progress
                    (xhr) => {
                        const percent = (xhr.loaded / xhr.total * 100);
                        this.updateLoadingStatus(`Loading: ${Math.round(percent)}%`);
                    }, 
                    reject
                );
            });

            // Remove demo cube if exists
            if (this.model) {
                this.scene.remove(this.model);
            }

            this.model = gltf.scene;
            
            // Center and scale model
            const box = new THREE.Box3().setFromObject(this.model);
            const center = box.getCenter(new THREE.Vector3());
            this.model.position.sub(center);
            
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            this.model.scale.multiplyScalar(scale);

            this.scene.add(this.model);

            // Add animations
            if (gltf.animations && gltf.animations.length) {
                this.mixer = new THREE.AnimationMixer(this.model);
                gltf.animations.forEach(clip => {
                    this.mixer.clipAction(clip).play();
                });
            }

            this.updateLoadingStatus('Model loaded successfully!');
            return true;
        } catch (error) {
            console.error('Error loading model:', error);
            this.updateLoadingStatus('Failed to load model. Showing demo object instead.');
            return false;
        }
    }

    async loadDroneModel() {
        const loader = new THREE.GLTFLoader();
        
        // Update this path to match your drone model filename
        const modelPath = 'C:\Users\sones\Desktop\ecommerce-master\eapp\static\models\drone\hiii.glb';

        try {
            const gltf = await new Promise((resolve, reject) => {
                loader.load(modelPath,
                    (gltf) => resolve(gltf),
                    (xhr) => {
                        const percent = (xhr.loaded / xhr.total * 100);
                        this.updateStatus(`Loading: ${Math.round(percent)}%`);
                    },
                    (error) => reject(error)
                );
            });

            // Remove any existing model
            if (this.model) {
                this.scene.remove(this.model);
            }

            this.model = gltf.scene;

            // Enhance materials and shadows
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Improve material properties
                    if (child.material) {
                        child.material.metalness = 0.7;
                        child.material.roughness = 0.3;
                        child.material.envMapIntensity = 1;
                    }

                    // Store propeller references
                    if (child.name.toLowerCase().includes('prop') || 
                        child.name.toLowerCase().includes('rotor')) {
                        this.propellers.push(child);
                    }
                }
            });

            // Scale and position the model
            const box = new THREE.Box3().setFromObject(this.model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Adjust scale based on model size
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 2; // Desired size in units
            const scale = targetSize / maxDim;
            this.model.scale.setScalar(scale);

            // Center the model
            this.model.position.sub(center.multiplyScalar(scale));
            this.model.position.y += 0.5; // Lift slightly above ground

            // Add to scene
            this.scene.add(this.model);
            this.modelLoaded = true;

            // Setup animations if present
            if (gltf.animations && gltf.animations.length) {
                this.mixer = new THREE.AnimationMixer(this.model);
                gltf.animations.forEach(clip => {
                    this.mixer.clipAction(clip).play();
                });
            }

            this.updateStatus('Model loaded successfully');
            return true;

        } catch (error) {
            console.error('Error loading drone model:', error);
            this.updateStatus('Error loading model');
            return false;
        }
    }

    updateLoadingStatus(message) {
        const statusElement = document.getElementById('arStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    updateStatus(message) {
        const status = document.getElementById('arStatus');
        if (status) {
            status.textContent = message;
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Rotate propellers with realistic blur effect
        if (this.propellers && this.propellers.length > 0) {
            this.propellers.forEach((propeller, index) => {
                const direction = index % 2 === 0 ? 1 : -1;
                propeller.rotation.y += 0.3 * direction;
                
                // Update propeller blade opacity based on speed
                propeller.children.forEach(blade => {
                    if (blade.material) {
                        blade.material.opacity = 0.6;
                    }
                });
            });
        }

        if (this.modelLoaded && this.propellers.length > 0) {
            this.propellers.forEach((propeller, index) => {
                const direction = index % 2 === 0 ? 1 : -1;
                propeller.rotation.y += 0.5 * direction;
            });
        }

        // Update mixer for animations
        if (this.mixer) {
            this.mixer.update(this.clock.getDelta());
        }

        if (this.controls) {
            this.controls.update();
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        this.scene.traverse(obj => {
            if (obj.geometry) {
                obj.geometry.dispose();
            }
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(material => material.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        
        this.renderer.dispose();
        this.controls.dispose();
    }

    createDroneModel() {
        const drone = new THREE.Group();

        // Create main body - hexagonal shape
        const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 6);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2c3e50,
            shininess: 100
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        drone.add(body);

        // Add top cover with vents
        const topCoverGeometry = new THREE.CylinderGeometry(0.35, 0.4, 0.05, 6);
        const topCover = new THREE.Mesh(topCoverGeometry, bodyMaterial);
        topCover.position.y = 0.1;
        drone.add(topCover);

        // Create arms
        const armPositions = [
            { angle: 0, length: 0.8 },
            { angle: Math.PI/2, length: 0.8 },
            { angle: Math.PI, length: 0.8 },
            { angle: -Math.PI/2, length: 0.8 }
        ];

        this.propellers = [];
        armPositions.forEach((pos, index) => {
            const arm = this.createArm();
            arm.position.x = Math.cos(pos.angle) * 0.4;
            arm.position.z = Math.sin(pos.angle) * 0.4;
            arm.rotation.y = pos.angle;
            drone.add(arm);

            // Add motor and propeller
            const motorGroup = this.createMotorWithPropeller();
            motorGroup.position.x = Math.cos(pos.angle) * pos.length;
            motorGroup.position.z = Math.sin(pos.angle) * pos.length;
            motorGroup.position.y = 0.1;
            drone.add(motorGroup);
            this.propellers.push(motorGroup.getObjectByName('propeller'));
        });

        // Add camera gimbal
        const gimbal = this.createCameraGimbal();
        gimbal.position.y = -0.1;
        drone.add(gimbal);

        // Add LED lights
        this.addStatusLEDs(drone);

        return drone;
    }

    createArm() {
        const armGroup = new THREE.Group();

        // Carbon fiber texture for arms
        const armMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x34495e,
            shininess: 30
        });

        // Main arm
        const armGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.05);
        const arm = new THREE.Mesh(armGeometry, armMaterial);
        arm.position.x = 0.4; // Center the arm
        armGroup.add(arm);

        // Add support strut
        const strutGeometry = new THREE.BoxGeometry(0.7, 0.02, 0.02);
        const strut = new THREE.Mesh(strutGeometry, armMaterial);
        strut.position.x = 0.35;
        strut.position.y = -0.04;
        strut.rotation.z = Math.PI * 0.03;
        armGroup.add(strut);

        return armGroup;
    }

    createMotorWithPropeller() {
        const motorGroup = new THREE.Group();

        // Motor housing
        const motorGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.12, 12);
        const motorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x95a5a6,
            shininess: 80
        });
        const motor = new THREE.Mesh(motorGeometry, motorMaterial);
        motorGroup.add(motor);

        // Propeller hub
        const hubGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12);
        const hubMaterial = new THREE.MeshPhongMaterial({ color: 0x2c3e50 });
        const hub = new THREE.Mesh(hubGeometry, hubMaterial);
        hub.position.y = 0.07;

        // Create propeller blades
        const propeller = new THREE.Group();
        propeller.name = 'propeller';
        const bladeGeometry = new THREE.BoxGeometry(0.6, 0.01, 0.08);
        const bladeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x34495e,
            transparent: true,
            opacity: 0.9
        });

        for (let i = 0; i < 2; i++) {
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.rotation.y = i * Math.PI;
            propeller.add(blade);
        }

        propeller.position.y = 0.085;
        motorGroup.add(hub);
        motorGroup.add(propeller);

        return motorGroup;
    }

    createCameraGimbal() {
        const gimbalGroup = new THREE.Group();

        // Gimbal base
        const baseGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.15);
        const gimbalMaterial = new THREE.MeshPhongMaterial({ color: 0x7f8c8d });
        const base = new THREE.Mesh(baseGeometry, gimbalMaterial);
        gimbalGroup.add(base);

        // Camera housing
        const cameraGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.08);
        const cameraMaterial = new THREE.MeshPhongMaterial({ color: 0x2c3e50 });
        const camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
        camera.position.y = -0.075;
        gimbalGroup.add(camera);

        // Lens
        const lensGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.02, 16);
        const lensMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const lens = new THREE.Mesh(lensGeometry, lensMaterial);
        lens.rotation.x = Math.PI / 2;
        lens.position.set(0, -0.075, 0.05);
        gimbalGroup.add(lens);

        return gimbalGroup;
    }

    addStatusLEDs(drone) {
        const ledGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const ledMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x2ecc71,
            emissive: 0x2ecc71,
            emissiveIntensity: 0.5
        });

        // Add LEDs at each arm
        for (let i = 0; i < 4; i++) {
            const led = new THREE.Mesh(ledGeometry, ledMaterial);
            const angle = i * Math.PI / 2;
            led.position.set(
                Math.cos(angle) * 0.35,
                0.08,
                Math.sin(angle) * 0.35
            );
            drone.add(led);
        }
    }
}

// Add this after creating ARViewer instance
document.addEventListener('DOMContentLoaded', async () => {
    const arViewer = new ARViewer();
    const arContainer = document.getElementById('arCanvas');
    
    // Check AR support
    if (navigator.xr) {
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!supported) {
            console.error('AR not supported');
            return;
        }
    } else {
        console.error('WebXR not supported');
        return;
    }

    document.querySelectorAll('.try-on-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const modelUrl = button.dataset.modelUrl;
            try {
                await arViewer.init('arCanvas');
                await arViewer.loadModel(modelUrl);
            } catch (error) {
                console.error('Failed to initialize AR:', error);
            }
        });
    });
});

// Export for use in other files
window.ARViewer = ARViewer;
