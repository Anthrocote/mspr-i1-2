<?php

namespace App\Entity;

use App\Repository\PaysRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: PaysRepository::class)]
class Pays
{
    // The 2-letter ISO country code is the natural primary key, assigned and
    // never generated: the siège shares the same country identity as the local
    // tier (which also keys on the 2-letter code) and the frontend consumes it
    // directly, with no id and no iso3-to-code translation in between.
    #[ORM\Id]
    #[ORM\Column(length: 2)]
    #[Assert\NotBlank]
    #[Assert\Length(exactly: 2)]
    private string $code;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 50)]
    private string $nom;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $apiUrl = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $apiKey = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $lastSyncedAt = null;

    #[ORM\Column(nullable: true)]
    #[Assert\PositiveOrZero]
    private ?float $tempIdeale = null;

    #[ORM\Column(nullable: true)]
    #[Assert\PositiveOrZero]
    private ?float $humiditeIdeale = null;

    #[ORM\OneToMany(mappedBy: 'pays', targetEntity: Entrepot::class)]
    private Collection $entrepots;

    public function __construct()
    {
        $this->entrepots = new ArrayCollection();
    }

    public function getCode(): string { return $this->code; }
    public function setCode(string $code): static { $this->code = $code; return $this; }

    public function getNom(): string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = $nom; return $this; }

    public function getApiUrl(): ?string { return $this->apiUrl; }
    public function setApiUrl(?string $apiUrl): static { $this->apiUrl = $apiUrl; return $this; }

    public function getApiKey(): ?string { return $this->apiKey; }
    public function setApiKey(?string $apiKey): static { $this->apiKey = $apiKey; return $this; }

    public function getLastSyncedAt(): ?\DateTimeImmutable { return $this->lastSyncedAt; }
    public function setLastSyncedAt(?\DateTimeImmutable $lastSyncedAt): static { $this->lastSyncedAt = $lastSyncedAt; return $this; }

    public function getTempIdeale(): ?float { return $this->tempIdeale; }
    public function setTempIdeale(?float $tempIdeale): static { $this->tempIdeale = $tempIdeale; return $this; }

    public function getHumiditeIdeale(): ?float { return $this->humiditeIdeale; }
    public function setHumiditeIdeale(?float $humiditeIdeale): static { $this->humiditeIdeale = $humiditeIdeale; return $this; }

    public function getEntrepots(): Collection { return $this->entrepots; }
}
