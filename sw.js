let stream = null;
const video = document.getElementById('video');
const startScanBtn = document.getElementById('startScanBtn');
const stopScanBtn = document.getElementById('stopScanBtn');
const scanningOverlay = document.getElementById('scanningOverlay');
const captureBtn = document.getElementById('captureBtn');
const photoCount = document.getElementById('photoCount');
const generateModelBtn = document.getElementById('generateModelBtn');
const scanHelp = document.getElementById('scanHelp');

let capturedImages = [];
const MIN_PHOTOS = 10;

// Fonction pour démarrer la caméra
async function startCamera() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Votre navigateur ne supporte pas l'accès à la caméra.");
            return false;
        }
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        video.srcObject = stream;
        await video.play();
        return true;
    } catch (err) {
        alert("Impossible d'accéder à la caméra : " + (err.message || err));
        return false;
    }
}

// Fonction pour arrêter la caméra
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        stream = null;
    }
}

// Bouton démarrer scan
startScanBtn.addEventListener('click', async () => {
    const ok = await startCamera();
    if (!ok) return;
    startScanBtn.classList.add('hidden');
    stopScanBtn.classList.remove('hidden');
    scanningOverlay.classList.remove('hidden');
    captureBtn.classList.remove('hidden');
    capturedImages = [];
    updatePhotoCount();
    generateModelBtn.classList.add('hidden');
    scanHelp.textContent = "Prenez des photos sous différents angles";
});

// Bouton arrêter scan
stopScanBtn.addEventListener('click', () => {
    stopCamera();
    startScanBtn.classList.remove('hidden');
    stopScanBtn.classList.add('hidden');
    scanningOverlay.classList.add('hidden');
    captureBtn.classList.add('hidden');
    generateModelBtn.classList.add('hidden');
    scanHelp.textContent = "Déplacez lentement autour de l'objet";
    capturedImages = [];
    updatePhotoCount();
});

// Capture photo
captureBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    capturedImages.push(canvas.toDataURL('image/jpeg'));
    updatePhotoCount();
    if (capturedImages.length >= MIN_PHOTOS) {
        generateModelBtn.classList.remove('hidden');
        scanHelp.textContent = "Vous pouvez générer le modèle 3D !";
    }
});

function updatePhotoCount() {
    photoCount.textContent = `${capturedImages.length} / ${MIN_PHOTOS} photos`;
}
