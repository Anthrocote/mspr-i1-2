<?php

namespace App\Tests\Integration\Controller;

use App\Entity\Entrepot;
use App\Entity\HistoriqueStockage;
use App\Entity\Lot;
use App\Entity\Pays;
use App\Entity\Produit;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Uid\Uuid;

class LotControllerTest extends ApiTestCase
{
    public function testListReturns200(): void
    {
        $this->client->request('GET', '/api/lots');

        $this->assertResponseStatusCodeSame(200);
        $this->assertIsArray(json_decode($this->client->getResponse()->getContent(), true));
    }

    public function testListFilterByStatusReturns200(): void
    {
        $this->client->request('GET', '/api/lots?status=compliant');

        $this->assertResponseStatusCodeSame(200);
    }

    public function testShowNonExistentLotReturns404(): void
    {
        $this->client->request('GET', '/api/lots/00000000-0000-0000-0000-000000000000');

        $this->assertResponseStatusCodeSame(404);
    }

    public function testDefaultOrderIsFifoByFirstArrival(): void
    {
        $this->seed();

        // Default (no sort) must stay FIFO: oldest first arrival first. Start dates
        // (constitueeLe) are D -400, -300, -250, -120, -10 for D, E, C, B, A but FIFO
        // keys on first STORAGE arrival, which for D is its earliest storage (-400).
        $labels = $this->labels('/api/lots');
        $this->assertSame(['LOT-D', 'LOT-E', 'LOT-C', 'LOT-B', 'LOT-A'], $labels);
    }

    public function testSearchMatchesLabelCaseInsensitive(): void
    {
        $this->seed();

        $this->assertSame(['LOT-C'], $this->labels('/api/lots?search=lot-c'));
    }

    public function testSearchMatchesCountryNameAcrossAnyStorage(): void
    {
        $this->seed();

        // "beta" hits Beta country / Warehouse Beta: LOT-B (in Beta) and LOT-D
        // (its current storage is Beta after moving out of Alpha).
        $labels = $this->labels('/api/lots?search=beta');
        sort($labels);
        $this->assertSame(['LOT-B', 'LOT-D'], $labels);
    }

    public function testAgeBucketLt90(): void
    {
        $this->seed();
        $this->assertSame(['LOT-A'], $this->labels('/api/lots?age=lt90'));
    }

    public function testAgeBucket90To180(): void
    {
        $this->seed();
        $this->assertSame(['LOT-B'], $this->labels('/api/lots?age=90_180'));
    }

    public function testAgeBucket180To365(): void
    {
        $this->seed();
        // LOT-C (constitueeLe -250) and LOT-E (no constitueeLe, MIN arrival -300).
        $labels = $this->labels('/api/lots?age=180_365');
        sort($labels);
        $this->assertSame(['LOT-C', 'LOT-E'], $labels);
    }

    public function testAgeBucketGt365(): void
    {
        $this->seed();
        $this->assertSame(['LOT-D'], $this->labels('/api/lots?age=gt365'));
    }

    public function testSortByIdAscAndDesc(): void
    {
        $this->seed();
        $this->assertSame(['LOT-A', 'LOT-B', 'LOT-C', 'LOT-D', 'LOT-E'], $this->labels('/api/lots?sort=id&order=asc'));
        $this->assertSame(['LOT-E', 'LOT-D', 'LOT-C', 'LOT-B', 'LOT-A'], $this->labels('/api/lots?sort=id&order=desc'));
    }

    public function testSortByStatus(): void
    {
        $this->seed();
        $statuses = array_map(
            static fn (array $l) => $l['status'],
            $this->decode('/api/lots?sort=status&order=asc')['data']
        );
        $sorted = $statuses;
        sort($sorted);
        $this->assertSame($sorted, $statuses, 'statuses must come out alphabetically ascending');
    }

    public function testSortByDurationInvertsStartDate(): void
    {
        $this->seed();

        // Duration ASC = shortest duration first = most recent start date first.
        $this->assertSame(
            ['LOT-A', 'LOT-B', 'LOT-C', 'LOT-E', 'LOT-D'],
            $this->labels('/api/lots?sort=duration&order=asc')
        );
        // Duration DESC = longest duration first = oldest start date first.
        $this->assertSame(
            ['LOT-D', 'LOT-E', 'LOT-C', 'LOT-B', 'LOT-A'],
            $this->labels('/api/lots?sort=duration&order=desc')
        );
    }

    public function testSortByWarehouseUsesCurrentWarehouse(): void
    {
        $this->seed();

        // LOT-D moved from Warehouse Alpha to Warehouse Beta; sorting by warehouse
        // must place it with the Beta group, not Alpha.
        $labels = $this->labels('/api/lots?sort=warehouse&order=asc');
        $alphaGroup = array_slice($labels, 0, 3);
        $betaGroup = array_slice($labels, 3, 2);
        sort($alphaGroup);
        sort($betaGroup);
        $this->assertSame(['LOT-A', 'LOT-C', 'LOT-E'], $alphaGroup);
        $this->assertSame(['LOT-B', 'LOT-D'], $betaGroup);
    }

    public function testSortByCountryUsesCurrentWarehouseCountryDesc(): void
    {
        $this->seed();

        // Country DESC: Beta group first, Alpha group last. LOT-D counts as Beta.
        $labels = $this->labels('/api/lots?sort=country&order=desc');
        $betaGroup = array_slice($labels, 0, 2);
        $alphaGroup = array_slice($labels, 2, 3);
        sort($betaGroup);
        sort($alphaGroup);
        $this->assertSame(['LOT-B', 'LOT-D'], $betaGroup);
        $this->assertSame(['LOT-A', 'LOT-C', 'LOT-E'], $alphaGroup);
    }

    public function testPaginationTotalReflectsFilters(): void
    {
        $this->seed();

        $payload = $this->decode('/api/lots?age=180_365&limit=1&page=1');
        $this->assertCount(1, $payload['data']);
        $this->assertSame(2, $payload['pagination']['total']);
        $this->assertSame(2, $payload['pagination']['pages']);
    }

    /**
     * @return list<string>
     */
    private function labels(string $uri): array
    {
        return array_map(static fn (array $l) => $l['label'], $this->decode($uri)['data']);
    }

    private function decode(string $uri): array
    {
        $this->client->request('GET', $uri);
        $this->assertResponseStatusCodeSame(200);

        return json_decode($this->client->getResponse()->getContent(), true);
    }

    /**
     * Seed a controlled dataset:
     * - two countries (Alpha, Beta), one warehouse each
     * - five lots with distinct start dates / statuses covering every age bucket
     * - LOT-D moved out of Alpha into Beta, so its CURRENT warehouse is Beta while
     *   its history still references Alpha (exercises current-warehouse sorting/search)
     * - LOT-E has no constitueeLe, so its start date falls back to MIN(dateArrivee)
     */
    private function seed(): void
    {
        /** @var EntityManagerInterface $em */
        $em = static::getContainer()->get(EntityManagerInterface::class);

        $alpha = (new Pays())->setNom('Alpha')->setCode('aa');
        $beta = (new Pays())->setNom('Beta')->setCode('bb');
        $em->persist($alpha);
        $em->persist($beta);

        $wAlpha = $this->makeEntrepot('Warehouse Alpha', $alpha);
        $wBeta = $this->makeEntrepot('Warehouse Beta', $beta);
        $em->persist($wAlpha);
        $em->persist($wBeta);

        $produit = (new Produit())->setUuid(Uuid::v4())->setNom('Café Test')->setDescription('d');
        $em->persist($produit);

        $mk = function (string $label, ?string $constOffset, string $statut) use ($em, $produit): Lot {
            $lot = (new Lot())
                ->setUuid(Uuid::v4())
                ->setLibelle($label)
                ->setQuantite(1)
                ->setProduit($produit)
                ->setStatut($statut)
                ->setSyncedAt(new \DateTimeImmutable());
            if ($constOffset !== null) {
                $lot->setConstitueeLe(new \DateTimeImmutable($constOffset));
            }
            $em->persist($lot);

            return $lot;
        };

        $storage = function (Lot $lot, Entrepot $e, string $arrOffset, ?string $depOffset = null) use ($em): void {
            $hs = (new HistoriqueStockage())
                ->setLot($lot)
                ->setEntrepot($e)
                ->setDateArrivee(new \DateTimeImmutable($arrOffset));
            if ($depOffset !== null) {
                $hs->setDateDepart(new \DateTimeImmutable($depOffset));
            }
            $em->persist($hs);
        };

        $a = $mk('LOT-A', '-10 days', Lot::STATUT_CONFORME);
        $storage($a, $wAlpha, '-10 days');

        $b = $mk('LOT-B', '-120 days', Lot::STATUT_EN_ALERTE);
        $storage($b, $wBeta, '-120 days');

        $c = $mk('LOT-C', '-250 days', Lot::STATUT_PERIME);
        $storage($c, $wAlpha, '-250 days');

        // Moved: arrived in Alpha, left, now open in Beta. Current = Beta.
        $d = $mk('LOT-D', '-400 days', Lot::STATUT_CONFORME);
        $storage($d, $wAlpha, '-400 days', '-20 days');
        $storage($d, $wBeta, '-20 days');

        // No constitueeLe: start date must fall back to the earliest arrival (-300).
        $e = $mk('LOT-E', null, Lot::STATUT_PERIME);
        $storage($e, $wAlpha, '-300 days');

        $em->flush();
        $em->clear();
    }

    private function makeEntrepot(string $nom, Pays $pays): Entrepot
    {
        return (new Entrepot())
            ->setUuid(Uuid::v4())
            ->setNom($nom)
            ->setNumeroRue(1)
            ->setAdresse('a')
            ->setCodePostal(1)
            ->setVille('v')
            ->setPays($pays);
    }
}
