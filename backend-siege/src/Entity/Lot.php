<?php

namespace App\Entity;

use App\Repository\LotRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: LotRepository::class)]
class Lot
{
    public const STATUT_CONFORME  = 'compliant';
    public const STATUT_EN_ALERTE = 'in_alert';
    public const STATUT_PERIME    = 'expired';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $uuid = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Assert\Length(max: 100)]
    private ?string $libelle = null;

    #[ORM\Column(type: 'float')]
    #[Assert\NotNull]
    #[Assert\Positive]
    private float $quantite;

    #[ORM\ManyToOne(targetEntity: Produit::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull]
    private Produit $produit;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: [self::STATUT_CONFORME, self::STATUT_EN_ALERTE, self::STATUT_PERIME])]
    private string $statut = self::STATUT_CONFORME;

    #[ORM\Column]
    #[Assert\NotNull]
    private \DateTimeImmutable $syncedAt;

    #[ORM\OneToMany(mappedBy: 'lot', targetEntity: HistoriqueStockage::class)]
    private Collection $historiqueStockages;

    public function __construct()
    {
        $this->historiqueStockages = new ArrayCollection();
        $this->syncedAt = new \DateTimeImmutable();
    }

    public function getUuid(): ?Uuid { return $this->uuid; }

    public function getLibelle(): ?string { return $this->libelle; }
    public function setLibelle(?string $libelle): static { $this->libelle = $libelle; return $this; }

    public function getQuantite(): float { return $this->quantite; }
    public function setQuantite(float $quantite): static { $this->quantite = $quantite; return $this; }

    public function getProduit(): Produit { return $this->produit; }
    public function setProduit(Produit $produit): static { $this->produit = $produit; return $this; }

    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }

    public function getSyncedAt(): \DateTimeImmutable { return $this->syncedAt; }
    public function setSyncedAt(\DateTimeImmutable $syncedAt): static { $this->syncedAt = $syncedAt; return $this; }

    public function getHistoriqueStockages(): Collection { return $this->historiqueStockages; }
}
