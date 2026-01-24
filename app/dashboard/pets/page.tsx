'use client';

import { useState, useEffect } from 'react';
import { PawPrint, Heart } from 'lucide-react';

type Pet = {
  id: string;
  name: string;
  breed: string;
  bio: string;
  imageUrl: string;
  favoriteToy: string;
};

const initialPets: Pet[] = [
  {
    id: '1',
    name: 'Milo',
    breed: 'Golden Retriever',
    bio: 'Un batuffolo di pelo dorato che ama le coccole e rubare i calzini. È il re della casa e il nostro primo figlio peloso.',
    imageUrl: '/milo.jpg', // Placeholder image
    favoriteToy: 'La sua paperella di gomma'
  },
  {
    id: '2',
    name: 'Luna',
    breed: 'Gatto Certosino',
    bio: 'La regina indiscussa della casa. Passa le sue giornate a sonnecchiare al sole e a giudicare le nostre scelte di vita. La amiamo per questo.',
    imageUrl: '/luna.jpg', // Placeholder image
    favoriteToy: 'Un semplice laccetto'
  }
];

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch this data.
    // For now, we use mock data.
    setPets(initialPets);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="pets-container">
      <div className="pets-header">
        <h1 className="pets-title font-handwritten">I Nostri Cuccioli</h1>
        <p className="pets-subtitle">I membri pelosi della nostra famiglia.</p>
      </div>

      <div className="pets-grid">
        {pets.map(pet => (
          <div key={pet.id} className="pet-card">
            <div className="pet-image-container">
              <img src={pet.imageUrl} alt={pet.name} className="pet-image" />
            </div>
            <div className="pet-info">
              <h2 className="pet-name font-handwritten">{pet.name}</h2>
              <p className="pet-breed">{pet.breed}</p>
              <p className="pet-bio">{pet.bio}</p>
              <div className="pet-favorite">
                <Heart className="icon-xs" />
                <span>Gioco preferito: {pet.favoriteToy}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
