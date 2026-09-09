<?php

namespace App\Entity;

use App\Repository\MesureRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: MesureRepository::class)]
class Mesure
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $uuid = null;

    #[ORM\ManyToOne(targetEntity: Entrepot::class, inversedBy: 'mesures')]
    #[ORM\JoinColumn(referencedColumnName: 'uuid', nullable: false)]
    #[Assert\NotNull]
    private Entrepot $entrepot;

    #[ORM\Column(type: 'float')]
    #[Assert\NotNull]
    private float $temperature;

    #[ORM\Column(type: 'float')]
    #[Assert\NotNull]
    #[Assert\PositiveOrZero]
    private float $humidite;

    #[ORM\Column]
    #[Assert\NotNull]
    private \DateTimeImmutable $mesureLe;

    #[ORM\Column]
    #[Assert\NotNull]
    private \DateTimeImmutable $syncedAt;

    public function __construct()
    {
        $this->syncedAt = new \DateTimeImmutable();
    }

    public function getUuid(): ?Uuid { return $this->uuid; }

    public function getEntrepot(): Entrepot { return $this->entrepot; }
    public function setEntrepot(Entrepot $entrepot): static { $this->entrepot = $entrepot; return $this; }

    public function getTemperature(): float { return $this->temperature; }
    public function setTemperature(float $temperature): static { $this->temperature = $temperature; return $this; }

    public function getHumidite(): float { return $this->humidite; }
    public function setHumidite(float $humidite): static { $this->humidite = $humidite; return $this; }

    public function getMesureLe(): \DateTimeImmutable { return $this->mesureLe; }
    public function setMesureLe(\DateTimeImmutable $mesureLe): static { $this->mesureLe = $mesureLe; return $this; }

    public function getSyncedAt(): \DateTimeImmutable { return $this->syncedAt; }
    public function setSyncedAt(\DateTimeImmutable $syncedAt): static { $this->syncedAt = $syncedAt; return $this; }
}
