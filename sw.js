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
        alert('Modèle 3D généré avec succès ! Téléchargez-le ici : ' + result.modelUrl);
        return result;
    } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de la génération du modèle 3D.');
    }
}
