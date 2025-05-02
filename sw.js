// Bouton générer le modèle
generateModelBtn.addEventListener('click', () => {
    if (capturedImages.length < MIN_PHOTOS) {
        alert("Vous devez capturer au moins 10 photos avant de générer le modèle.");
        return;
    }

    // Simuler le processus de génération de modèle
    scanHelp.textContent = "Génération du modèle 3D en cours...";
    generateModelBtn.disabled = true; // Désactiver le bouton pour éviter plusieurs clics

    setTimeout(() => {
        alert("Modèle 3D généré avec succès !");
        // Réinitialiser l'application après génération
        generateModelBtn.disabled = false;
        generateModelBtn.classList.add('hidden');
        scanHelp.textContent = "Déplacez lentement autour de l'objet";
        capturedImages = [];
        updatePhotoCount();
    }, 3000); // Simuler un délai de 3 secondes
});
