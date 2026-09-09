<?php

namespace App\Entity;

use App\Repository\HistoriqueStockageRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: HistoriqueStockageRepository::class)]
class HistoriqueStockage
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Lot::class, inversedBy: 'historiqueStockages')]
    #[ORM\JoinColumn(referencedColumnName: 'uuid', nullable: false)]
    #[Assert\NotNull]
    private Lot $lot;

    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Entrepot::class, inversedBy: 'historiqueStockages')]
    #[ORM\JoinColumn(referencedColumnName: 'uuid', nullable: false)]
    #[Assert\NotNull]
    private Entrepot $entrepot;

    #[ORM\Column]
    #[Assert\NotNull]
    private \DateTimeImmutable $dateArrivee;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $dateDepart = null;

    public function getLot(): Lot { return $this->lot; }
    public function setLot(Lot $lot): static { $this->lot = $lot; return $this; }

    public function getEntrepot(): Entrepot { return $this->entrepot; }
    public function setEntrepot(Entrepot $entrepot): static { $this->entrepot = $entrepot; return $this; }

    public function getDateArrivee(): \DateTimeImmutable { return $this->dateArrivee; }
    public function setDateArrivee(\DateTimeImmutable $dateArrivee): static { $this->dateArrivee = $dateArrivee; return $this; }

    public function getDateDepart(): ?\DateTimeImmutable { return $this->dateDepart; }
    public function setDateDepart(?\DateTimeImmutable $dateDepart): static { $this->dateDepart = $dateDepart; return $this; }
}
