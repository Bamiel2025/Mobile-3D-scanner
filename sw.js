async function sendImagesToServer(images) {
    try {
        const response = await fetch('http://localhost:5000/process-images', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ images }) // Envoyer les images capturées
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l’envoi des images au serveur');
        }

        const result = await response.json();

        // Vérifiez si le modèle a été généré avec succès
        if (result.modelUrl) {
            alert('Modèle 3D généré avec succès ! Chargement du modèle...');
            load3DModel(`http://localhost:5000${result.modelUrl}`); // Charger automatiquement le modèle
        } else {
            alert('Erreur : Le modèle n’a pas pu être généré.');
        }

        return result;
    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de la génération du modèle 3D.');
    }
}

// Bouton générer le modèle
generateModelBtn.addEventListener('click', async () => {
    if (capturedImages.length < MIN_PHOTOS) {
        alert("Vous devez capturer au moins 10 photos avant de générer le modèle.");
        return;
    }

    scanHelp.textContent = "Envoi des images au serveur pour génération du modèle 3D...";
    generateModelBtn.disabled = true;

    const result = await sendImagesToServer(capturedImages);

    generateModelBtn.disabled = false;
    capturedImages = [];
    updatePhotoCount();

    if (result) {
        scanHelp.textContent = "Modèle 3D chargé avec succès. Vous pouvez le visualiser ci-dessous.";
    } else {
        scanHelp.textContent = "Une erreur est survenue. Veuillez réessayer.";
    }
});
