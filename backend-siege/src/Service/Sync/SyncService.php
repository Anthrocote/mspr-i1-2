<?php

namespace App\Service\Sync;

use App\Entity\Alerte;
use App\Entity\Entrepot;
use App\Entity\HistoriqueStockage;
use App\Entity\Lot;
use App\Entity\Mesure;
use App\Entity\Pays;
use App\Entity\Produit;
use App\Repository\AlerteRepository;
use App\Repository\EntrepotRepository;
use App\Repository\LotRepository;
use App\Repository\MesureRepository;
use App\Repository\PaysRepository;
use App\Repository\ProduitRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class SyncService
{
    public function __construct(
        private readonly HttpClientInterface    $httpClient,
        private readonly EntityManagerInterface $em,
        private readonly PaysRepository         $paysRepository,
        private readonly EntrepotRepository     $entrepotRepository,
        private readonly ProduitRepository      $produitRepository,
        private readonly LotRepository          $lotRepository,
        private readonly MesureRepository       $mesureRepository,
        private readonly AlerteRepository       $alerteRepository,
        private readonly LoggerInterface        $logger,
    ) {
    }

    public function syncAll(): void
    {
        $paysList = $this->paysRepository->findAll();
        foreach ($paysList as $pays) {
            if ($pays->getApiUrl() === null) {
                continue;
            }
            $this->syncPays($pays);
        }
    }

    public function syncPays(Pays $pays): void
    {
        $baseUrl = rtrim((string) $pays->getApiUrl(), '/');
        $headers = ['X-API-KEY' => $pays->getApiKey() ?? ''];

        try {
            $this->syncLots($pays, $baseUrl, $headers);
            $this->syncMesures($pays, $baseUrl, $headers);
            $this->syncAlertes($pays, $baseUrl, $headers);

            $pays->setLastSyncedAt(new \DateTimeImmutable());
            $this->em->flush();

            $this->logger->info('Sync OK pour le pays {pays}', ['pays' => $pays->getNom()]);
        } catch (\Throwable $e) {
            $this->logger->error('Sync échouée pour {pays} : {msg}', [
                'pays' => $pays->getNom(),
                'msg'  => $e->getMessage(),
            ]);
        }
    }

    private function syncLots(Pays $pays, string $baseUrl, array $headers): void
    {
        $response = $this->httpClient->request('GET', $baseUrl . '/sync/lots', ['headers' => $headers]);
        $data = $response->toArray();

        foreach ($data as $item) {
            $lot = $this->lotRepository->find($item['uuid']);
            if ($lot === null) {
                $lot = new Lot();
                $this->em->persist($lot);
            }

            $produit = $this->upsertProduit($item['produit']);
            $entrepot = $this->resolveEntrepot($pays, $item['entrepot_uuid'] ?? null);

            $lot->setLibelle($item['libelle'] ?? null)
                ->setQuantite((float) $item['quantite'])
                ->setProduit($produit)
                ->setStatut($item['statut'] ?? Lot::STATUT_CONFORME)
                ->setSyncedAt(new \DateTimeImmutable());

            if ($entrepot !== null) {
                $this->upsertHistoriqueStockage($lot, $entrepot, $item);
            }
        }
    }

    private function syncMesures(Pays $pays, string $baseUrl, array $headers): void
    {
        $response = $this->httpClient->request('GET', $baseUrl . '/sync/mesures', ['headers' => $headers]);
        $data = $response->toArray();

        foreach ($data as $item) {
            if ($this->mesureRepository->find($item['uuid']) !== null) {
                continue;
            }

            $entrepot = $this->resolveEntrepot($pays, $item['entrepot_uuid'] ?? null);
            if ($entrepot === null) {
                continue;
            }

            $mesure = (new Mesure())
                ->setEntrepot($entrepot)
                ->setTemperature((float) $item['temperature'])
                ->setHumidite((float) $item['humidite'])
                ->setMesureLe(new \DateTimeImmutable($item['mesure_le']));

            $this->em->persist($mesure);
        }
    }

    private function syncAlertes(Pays $pays, string $baseUrl, array $headers): void
    {
        $response = $this->httpClient->request('GET', $baseUrl . '/sync/alertes', ['headers' => $headers]);
        $data = $response->toArray();

        foreach ($data as $item) {
            if ($this->alerteRepository->find($item['uuid']) !== null) {
                continue;
            }

            $entrepot = $this->resolveEntrepot($pays, $item['entrepot_uuid'] ?? null);

            $alerte = (new Alerte())
                ->setType($item['type'])
                ->setEntrepot($entrepot)
                ->setDeclencheeLe(new \DateTimeImmutable($item['declenchee_le']));

            if (!empty($item['lot_uuid'])) {
                $lot = $this->lotRepository->find($item['lot_uuid']);
                $alerte->setLot($lot);
            }

            if (!empty($item['resolue_le'])) {
                $alerte->setResolueLe(new \DateTimeImmutable($item['resolue_le']));
            }

            $this->em->persist($alerte);
        }
    }

    private function upsertProduit(array $data): Produit
    {
        $produit = $this->produitRepository->find($data['uuid']);
        if ($produit === null) {
            $produit = new Produit();
            $this->em->persist($produit);
        }

        $produit->setNom($data['nom'])
            ->setDescription($data['description'] ?? '')
            ->setVariete($data['variete'] ?? null);

        return $produit;
    }

    private function resolveEntrepot(Pays $pays, ?string $entrepotUuid): ?Entrepot
    {
        if ($entrepotUuid === null) {
            return null;
        }

        $entrepot = $this->entrepotRepository->find($entrepotUuid);
        if ($entrepot === null) {
            $entrepot = (new Entrepot())
                ->setNom('Entrepôt ' . $pays->getNom())
                ->setNumeroRue(0)
                ->setAdresse('')
                ->setCodePostal(0)
                ->setVille('')
                ->setPays($pays);
            $this->em->persist($entrepot);
        }

        return $entrepot;
    }

    private function upsertHistoriqueStockage(Lot $lot, Entrepot $entrepot, array $item): void
    {
        foreach ($lot->getHistoriqueStockages() as $hs) {
            if ((string) $hs->getEntrepot()->getUuid() === (string) $entrepot->getUuid()) {
                return;
            }
        }

        $hs = (new HistoriqueStockage())
            ->setLot($lot)
            ->setEntrepot($entrepot)
            ->setDateArrivee(new \DateTimeImmutable($item['date_arrivee'] ?? 'now'));

        if (!empty($item['date_depart'])) {
            $hs->setDateDepart(new \DateTimeImmutable($item['date_depart']));
        }

        $this->em->persist($hs);
    }
}
