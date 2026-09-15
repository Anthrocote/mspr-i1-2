<?php

namespace App\Entity;

use App\Repository\AlerteRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AlerteRepository::class)]
class Alerte
{
    public const TYPE_CONDITION_HORS_PLAGE = 'out_of_range';
    public const TYPE_LOT_PERIME           = 'expired_lot';

    // The uuid is assigned from the producing tier's payload during sync, never
    // generated here, so the siège shares the same identity as the local record.
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME, unique: true)]
    private Uuid $uuid;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: [self::TYPE_CONDITION_HORS_PLAGE, self::TYPE_LOT_PERIME])]
    private string $type;

    #[ORM\ManyToOne(targetEntity: Lot::class)]
    #[ORM\JoinColumn(referencedColumnName: 'uuid', nullable: true)]
    private ?Lot $lot = null;

    #[ORM\ManyToOne(targetEntity: Entrepot::class)]
    #[ORM\JoinColumn(referencedColumnName: 'uuid', nullable: true)]
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

    public function getUuid(): ?Uuid { return $this->uuid ?? null; }
    public function setUuid(Uuid $uuid): static { $this->uuid = $uuid; return $this; }

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
