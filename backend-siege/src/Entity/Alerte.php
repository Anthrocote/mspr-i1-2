<?php

namespace App\Entity;

use App\Repository\AlerteRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AlerteRepository::class)]
class Alerte
{
    public const TYPE_CONDITION_HORS_PLAGE = 'condition_hors_plage';
    public const TYPE_LOT_PERIME           = 'lot_perime';

    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $uuid = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: [self::TYPE_CONDITION_HORS_PLAGE, self::TYPE_LOT_PERIME])]
    private string $type;

    #[ORM\ManyToOne(targetEntity: Lot::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?Lot $lot = null;

    #[ORM\ManyToOne(targetEntity: Entrepot::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?Entrepot $entrepot = null;

    #[ORM\Column]
    #[Assert\NotNull]
    private \DateTimeImmutable $declencheeLe;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $resolueLe = null;

    public function __construct()
    {
        $this->declencheeLe = new \DateTimeImmutable();
    }

    public function getUuid(): ?Uuid { return $this->uuid; }

    public function getType(): string { return $this->type; }
    public function setType(string $type): static { $this->type = $type; return $this; }

    public function getLot(): ?Lot { return $this->lot; }
    public function setLot(?Lot $lot): static { $this->lot = $lot; return $this; }

    public function getEntrepot(): ?Entrepot { return $this->entrepot; }
    public function setEntrepot(?Entrepot $entrepot): static { $this->entrepot = $entrepot; return $this; }

    public function getDeclencheeLe(): \DateTimeImmutable { return $this->declencheeLe; }
    public function setDeclencheeLe(\DateTimeImmutable $declencheeLe): static { $this->declencheeLe = $declencheeLe; return $this; }

    public function getResolueLe(): ?\DateTimeImmutable { return $this->resolueLe; }
    public function setResolueLe(?\DateTimeImmutable $resolueLe): static { $this->resolueLe = $resolueLe; return $this; }
}
