<?php

namespace App\Entity;

use App\Repository\ProduitRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ProduitRepository::class)]
class Produit
{
    // The uuid is assigned from the producing tier's payload during sync, never
    // generated here, so the siège shares the same identity as the local record.
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\Column(length: 150)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 150)]
    private string $nom;

    #[ORM\Column(length: 1000)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 1000)]
    private string $description;

    #[ORM\Column(length: 100, nullable: true)]
    #[Assert\Length(max: 100)]
    private ?string $variete = null;

    #[ORM\Column(nullable: true)]
    #[Assert\Range(min: 0, max: 10)]
    private ?int $intensite = null;

    #[ORM\Column(nullable: true)]
    #[Assert\Range(min: 0, max: 10)]
    private ?int $amertume = null;

    #[ORM\Column(nullable: true)]
    #[Assert\Range(min: 0, max: 10)]
    private ?int $acidite = null;

    #[ORM\Column(nullable: true)]
    #[Assert\Range(min: 0, max: 10)]
    private ?int $corps = null;

    public function getUuid(): ?Uuid { return $this->uuid ?? null; }
    public function setUuid(Uuid $uuid): static { $this->uuid = $uuid; return $this; }

    public function getNom(): string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function getDescription(): string { return $this->description; }
    public function setDescription(string $description): static { $this->description = $description; return $this; }

    public function getVariete(): ?string { return $this->variete; }
    public function setVariete(?string $variete): static { $this->variete = $variete; return $this; }

    public function getIntensite(): ?int { return $this->intensite; }
    public function setIntensite(?int $intensite): static { $this->intensite = $intensite; return $this; }

    public function getAmertume(): ?int { return $this->amertume; }
    public function setAmertume(?int $amertume): static { $this->amertume = $amertume; return $this; }

    public function getAcidite(): ?int { return $this->acidite; }
    public function setAcidite(?int $acidite): static { $this->acidite = $acidite; return $this; }

    public function getCorps(): ?int { return $this->corps; }
    public function setCorps(?int $corps): static { $this->corps = $corps; return $this; }
}
