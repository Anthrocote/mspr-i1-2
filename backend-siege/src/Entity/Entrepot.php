<?php

namespace App\Entity;

use App\Repository\EntrepotRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: EntrepotRepository::class)]
class Entrepot
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $uuid = null;

    #[ORM\Column(length: 150)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 150)]
    private string $nom;

    #[ORM\Column(type: 'integer')]
    #[Assert\NotNull]
    #[Assert\Positive]
    private int $numeroRue;

    #[ORM\Column(length: 200)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 200)]
    private string $adresse;

    #[ORM\Column(type: 'integer')]
    #[Assert\NotNull]
    #[Assert\Positive]
    private int $codePostal;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 100)]
    private string $ville;

    #[ORM\ManyToOne(targetEntity: Pays::class, inversedBy: 'entrepots')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull]
    private Pays $pays;

    #[ORM\Column(options: ['default' => true])]
    private bool $actif = true;

    #[ORM\OneToMany(mappedBy: 'entrepot', targetEntity: Mesure::class)]
    private Collection $mesures;

    #[ORM\OneToMany(mappedBy: 'entrepot', targetEntity: HistoriqueStockage::class)]
    private Collection $historiqueStockages;

    public function __construct()
    {
        $this->mesures = new ArrayCollection();
        $this->historiqueStockages = new ArrayCollection();
    }

    public function getUuid(): ?Uuid { return $this->uuid; }

    public function getNom(): string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function getNumeroRue(): int { return $this->numeroRue; }
    public function setNumeroRue(int $numeroRue): static { $this->numeroRue = $numeroRue; return $this; }

    public function getAdresse(): string { return $this->adresse; }
    public function setAdresse(string $adresse): static { $this->adresse = $adresse; return $this; }

    public function getCodePostal(): int { return $this->codePostal; }
    public function setCodePostal(int $codePostal): static { $this->codePostal = $codePostal; return $this; }

    public function getVille(): string { return $this->ville; }
    public function setVille(string $ville): static { $this->ville = $ville; return $this; }

    public function getPays(): Pays { return $this->pays; }
    public function setPays(Pays $pays): static { $this->pays = $pays; return $this; }

    public function isActif(): bool { return $this->actif; }
    public function setActif(bool $actif): static { $this->actif = $actif; return $this; }

    public function getMesures(): Collection { return $this->mesures; }
    public function getHistoriqueStockages(): Collection { return $this->historiqueStockages; }
}
