const CACHE_NAME = 'scanner-3d-v2';
const SERVER_URL = 'https://your-server-url.com/api/generate3d'; // Remplacez par l'URL de votre backend

let stream = null;
let capturedImages = [];
const MIN_PHOTOS = 10;

// DOM Elements
const video = document.getElementById('video');
const startScanBtn = document.getElementById('startScanBtn');
const stopScanBtn = document.getElementById('stopScanBtn');
const captureBtn = document.getElementById('captureBtn');
const generateModelBtn = document.getElementById('generateModelBtn');
const photoCount = document.getElementById('photoCount');
const scanHelp = document.getElementById('scanHelp');

// Fonction pour démarrer la caméra
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: 1280, height: 720 }
        });
        video.srcObject = stream;
        await video.play();
        return true;
    } catch (error) {
        alert(`Erreur d'accès à la caméra : ${error.message}`);
        return false;
    }
}

// Fonction pour arrêter la caméra
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
        stream = null;
    }
}

// Fonction pour capturer une image
function captureImage() {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    capturedImages.push(canvas.toDataURL('image/jpeg'));
    updatePhotoCount();
}

// Mise à jour du compteur de photos
function updatePhotoCount() {
    photoCount.textContent = `${capturedImages.length} / ${MIN_PHOTOS} photos`;
    if (capturedImages.length >= MIN_PHOTOS) {
        generateModelBtn.classList.remove('hidden');
        scanHelp.textContent = "Vous pouvez générer le modèle 3D !";
    } else {
        scanHelp.textContent = `Encore ${MIN_PHOTOS - capturedImages.length} photo(s) à prendre...`;
    }
}

// Fonction pour générer un modèle 3D
async function generateModel() {
    scanHelp.textContent = "Envoi des images au serveur...";
    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: capturedImages })
        });

        if (response.ok) {
            const result = await response.json();
            scanHelp.textContent = `Modèle généré avec succès. ID : ${result.modelId}`;
        } else {
            throw new Error('Erreur lors de la génération du modèle.');
        }
    } catch (error) {
        scanHelp.textContent = `Erreur : ${error.message}`;
    } finally {
        capturedImages = [];
        updatePhotoCount();
        generateModelBtn.classList.add('hidden');
    }
}

// Événements des boutons
startScanBtn.addEventListener('click', async () => {
    if (await startCamera()) {
        startScanBtn.classList.add('hidden');
        stopScanBtn.classList.remove('hidden');
        captureBtn.classList.remove('hidden');
    }
});

stopScanBtn.addEventListener('click', () => {
    stopCamera();
    startScanBtn.classList.remove('hidden');
    stopScanBtn.classList.add('hidden');
    captureBtn.classList.add('hidden');
    generateModelBtn.classList.add('hidden');
    capturedImages = [];
    updatePhotoCount();
});

captureBtn.addEventListener('click', captureImage);
generateModelBtn.addEventListener('click', generateModel);

// Service Worker (PWA)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(console.error);
}
