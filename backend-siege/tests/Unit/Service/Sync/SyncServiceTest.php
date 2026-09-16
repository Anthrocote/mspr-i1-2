<?php

namespace App\Tests\Unit\Service\Sync;

use App\Entity\Alerte;
use App\Entity\Exploitation;
use App\Entity\Lot;
use App\Entity\Pays;
use App\Entity\Produit;
use App\Repository\AlerteRepository;
use App\Repository\EntrepotRepository;
use App\Repository\ExploitationRepository;
use App\Repository\LotRepository;
use App\Repository\MesureRepository;
use App\Repository\PaysRepository;
use App\Repository\ProduitRepository;
use App\Service\Sync\SyncService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\ResponseInterface;

class SyncServiceTest extends TestCase
{
    private SyncService $syncService;
    private HttpClientInterface $httpClient;
    private EntityManagerInterface $em;
    private PaysRepository $paysRepository;
    private EntrepotRepository $entrepotRepository;
    private ProduitRepository $produitRepository;
    private ExploitationRepository $exploitationRepository;
    private LotRepository $lotRepository;
    private MesureRepository $mesureRepository;
    private AlerteRepository $alerteRepository;
    private LoggerInterface $logger;

    protected function setUp(): void
    {
        $this->httpClient             = $this->createMock(HttpClientInterface::class);
        $this->em                     = $this->createMock(EntityManagerInterface::class);
        $this->paysRepository         = $this->createMock(PaysRepository::class);
        $this->entrepotRepository     = $this->createMock(EntrepotRepository::class);
        $this->produitRepository      = $this->createMock(ProduitRepository::class);
        $this->exploitationRepository = $this->createMock(ExploitationRepository::class);
        $this->lotRepository          = $this->createMock(LotRepository::class);
        $this->mesureRepository       = $this->createMock(MesureRepository::class);
        $this->alerteRepository       = $this->createMock(AlerteRepository::class);
        $this->logger                 = $this->createMock(LoggerInterface::class);

        $this->syncService = new SyncService(
            $this->httpClient,
            $this->em,
            $this->paysRepository,
            $this->entrepotRepository,
            $this->produitRepository,
            $this->exploitationRepository,
            $this->lotRepository,
            $this->mesureRepository,
            $this->alerteRepository,
            $this->logger,
        );
    }

    public function testSyncAllSkipsPaysWithoutApiUrl(): void
    {
        $pays = new Pays();
        $pays->setNom('Brésil')->setCodeIso('BRA');

        $this->paysRepository->expects($this->once())
            ->method('findAll')
            ->willReturn([$pays]);

        $this->httpClient->expects($this->never())
            ->method('request');

        $this->syncService->syncAll();
    }

    public function testSyncPaysCallsAllSixEndpoints(): void
    {
        $pays = (new Pays())
            ->setNom('Brésil')
            ->setCodeIso('BRA')
            ->setApiUrl('https://bresil.futurekawa.local')
            ->setApiKey('secret');

        $emptyResponse = $this->createMock(ResponseInterface::class);
        $emptyResponse->method('toArray')->willReturn([]);

        // warehouses + products + exploitations + lots + measurements + alerts = 6 GET,
        // no ack (nothing synced).
        $this->httpClient->expects($this->exactly(6))
            ->method('request')
            ->willReturn($emptyResponse);

        $this->em->expects($this->once())->method('flush');

        $this->syncService->syncPays($pays);
    }

    public function testSyncAlertesUsesTriggerDateFromPayload(): void
    {
        $pays = (new Pays())
            ->setNom('Colombie')
            ->setCodeIso('COL')
            ->setApiUrl('https://colombie.futurekawa.local')
            ->setApiKey('secret');

        $emptyResponse = $this->createMock(ResponseInterface::class);
        $emptyResponse->method('toArray')->willReturn([]);

        $alertesResponse = $this->createMock(ResponseInterface::class);
        $alertesResponse->method('toArray')->willReturn([[
            'uuid'           => 'a1b2c3d4-0000-0000-0000-000000000000',
            'type'           => Alerte::TYPE_CONDITION_HORS_PLAGE,
            'warehouse_uuid' => null,
            'triggered_at'   => '2026-06-10T02:15:00+00:00',
        ]]);

        $this->httpClient->method('request')
            ->willReturnCallback(function (string $method, string $url) use ($emptyResponse, $alertesResponse) {
                return str_ends_with($url, '/sync/alerts') ? $alertesResponse : $emptyResponse;
            });

        $this->alerteRepository->method('find')->willReturn(null);

        $persisted = [];
        $this->em->method('persist')->willReturnCallback(function ($entity) use (&$persisted) {
            if ($entity instanceof Alerte) {
                $persisted[] = $entity;
            }
        });

        $this->syncService->syncPays($pays);

        $this->assertCount(1, $persisted);
        $this->assertSame(
            '2026-06-10T02:15:00+00:00',
            $persisted[0]->getDeclencheeLe()->format(\DateTimeInterface::ATOM),
        );
    }

    public function testSyncPaysAcksPersistedRecords(): void
    {
        $pays = (new Pays())
            ->setNom('Brésil')
            ->setCodeIso('BRA')
            ->setApiUrl('https://bresil.futurekawa.local')
            ->setApiKey('secret');

        $emptyResponse = $this->createMock(ResponseInterface::class);
        $emptyResponse->method('toArray')->willReturn([]);

        $mesuresResponse = $this->createMock(ResponseInterface::class);
        $mesuresResponse->method('toArray')->willReturn([[
            'uuid'           => 'c1000000-0000-0000-0000-000000000000',
            'warehouse_uuid' => 'e1000000-0000-0000-0000-000000000000',
            'temperature'    => 28.4,
            'humidity'       => 57.0,
            'measured_at'    => '2026-09-09T02:15:00+00:00',
        ]]);

        $calls = [];
        $this->httpClient->method('request')
            ->willReturnCallback(function (string $method, string $url, array $options = []) use (&$calls, $emptyResponse, $mesuresResponse) {
                $calls[] = ['method' => $method, 'url' => $url, 'options' => $options];

                return str_ends_with($url, '/sync/measurements') ? $mesuresResponse : $emptyResponse;
            });

        $this->mesureRepository->method('find')->willReturn(null);
        $this->entrepotRepository->method('find')->willReturn(null);

        $this->syncService->syncPays($pays);

        $ackCalls = array_values(array_filter($calls, fn ($c) => str_ends_with($c['url'], '/sync/ack')));
        $this->assertCount(1, $ackCalls, 'un POST /sync/ack doit être émis');
        $this->assertSame('POST', $ackCalls[0]['method']);
        $this->assertContains(
            'c1000000-0000-0000-0000-000000000000',
            $ackCalls[0]['options']['json']['measurements'] ?? [],
        );
    }

    public function testSyncPaysDoesNotAckWhenNothingSynced(): void
    {
        $pays = (new Pays())
            ->setNom('Colombie')
            ->setCodeIso('COL')
            ->setApiUrl('https://colombie.futurekawa.local')
            ->setApiKey('secret');

        $emptyResponse = $this->createMock(ResponseInterface::class);
        $emptyResponse->method('toArray')->willReturn([]);

        $urls = [];
        $this->httpClient->method('request')
            ->willReturnCallback(function (string $method, string $url) use (&$urls, $emptyResponse) {
                $urls[] = $url;

                return $emptyResponse;
            });

        $this->syncService->syncPays($pays);

        $this->assertNotContains('https://colombie.futurekawa.local/sync/ack', $urls);
    }

    public function testSyncPaysLogsErrorOnHttpFailure(): void
    {
        $pays = (new Pays())
            ->setNom('Équateur')
            ->setCodeIso('ECU')
            ->setApiUrl('https://equateur.futurekawa.local');

        $this->httpClient->method('request')
            ->willThrowException(new \RuntimeException('Connection refused'));

        $this->logger->expects($this->once())
            ->method('error');

        $this->em->expects($this->never())->method('flush');

        $this->syncService->syncPays($pays);
    }

    public function testSyncProductThenLotPersistWithPayloadUuidAndLink(): void
    {
        $pays = (new Pays())
            ->setNom('Brésil')
            ->setCodeIso('BRA')
            ->setApiUrl('https://bresil.futurekawa.local')
            ->setApiKey('secret');

        $productUuid = '11111111-1111-1111-1111-111111111111';
        $lotUuid     = '22222222-2222-2222-2222-222222222222';

        $empty = $this->createMock(ResponseInterface::class);
        $empty->method('toArray')->willReturn([]);

        $products = $this->createMock(ResponseInterface::class);
        $products->method('toArray')->willReturn([[
            'uuid'        => $productUuid,
            'name'        => 'Arabica Minas',
            'description' => 'Café vert',
            'variety'     => 'Arabica',
        ]]);

        $lots = $this->createMock(ResponseInterface::class);
        $lots->method('toArray')->willReturn([[
            'uuid'         => $lotUuid,
            'product_uuid' => $productUuid,
            'label'        => 'LOT-BRA-1',
            'quantity'     => 100.0,
            'status'       => Lot::STATUT_CONFORME,
        ]]);

        $calls = [];
        $this->httpClient->method('request')
            ->willReturnCallback(function (string $method, string $url, array $options = []) use (&$calls, $empty, $products, $lots) {
                $calls[] = ['method' => $method, 'url' => $url, 'options' => $options];
                if (str_ends_with($url, '/sync/products')) {
                    return $products;
                }
                if (str_ends_with($url, '/sync/lots')) {
                    return $lots;
                }

                return $empty;
            });

        $persisted = [];
        $this->em->method('persist')->willReturnCallback(function ($entity) use (&$persisted) {
            $persisted[] = $entity;
        });

        // Simulate the identity map: a product persisted during syncProducts is found by syncLots.
        $this->produitRepository->method('find')->willReturnCallback(function ($uuid) use (&$persisted) {
            foreach ($persisted as $e) {
                if ($e instanceof Produit && (string) $e->getUuid() === (string) $uuid) {
                    return $e;
                }
            }

            return null;
        });
        $this->lotRepository->method('find')->willReturn(null);

        $this->syncService->syncPays($pays);

        $produitsPersisted = array_values(array_filter($persisted, fn ($e) => $e instanceof Produit));
        $lotsPersisted     = array_values(array_filter($persisted, fn ($e) => $e instanceof Lot));

        $this->assertCount(1, $produitsPersisted);
        $this->assertCount(1, $lotsPersisted);
        $this->assertSame($productUuid, (string) $produitsPersisted[0]->getUuid());
        $this->assertSame($lotUuid, (string) $lotsPersisted[0]->getUuid());
        $this->assertSame($produitsPersisted[0], $lotsPersisted[0]->getProduit());

        $ackCalls = array_values(array_filter($calls, fn ($c) => str_ends_with($c['url'], '/sync/ack')));
        $this->assertCount(1, $ackCalls);
        $this->assertContains($productUuid, $ackCalls[0]['options']['json']['products'] ?? []);
        $this->assertContains($lotUuid, $ackCalls[0]['options']['json']['lots'] ?? []);
    }

    public function testSyncLotLinksExploitationAndSetsConstitueeLe(): void
    {
        $pays = (new Pays())
            ->setNom('Colombie')
            ->setCodeIso('COL')
            ->setApiUrl('https://colombie.futurekawa.local')
            ->setApiKey('secret');

        $productUuid = '11111111-1111-1111-1111-111111111111';
        $exploUuid   = '33333333-3333-3333-3333-333333333333';
        $lotUuid     = '22222222-2222-2222-2222-222222222222';

        $empty = $this->createMock(ResponseInterface::class);
        $empty->method('toArray')->willReturn([]);

        $products = $this->createMock(ResponseInterface::class);
        $products->method('toArray')->willReturn([[
            'uuid' => $productUuid,
            'name' => 'Arabica',
        ]]);

        $exploitations = $this->createMock(ResponseInterface::class);
        $exploitations->method('toArray')->willReturn([[
            'uuid'    => $exploUuid,
            'name'    => 'Hacienda La Esperanza',
            'country' => 'co',
        ]]);

        $lots = $this->createMock(ResponseInterface::class);
        $lots->method('toArray')->willReturn([[
            'uuid'              => $lotUuid,
            'product_uuid'      => $productUuid,
            'exploitation_uuid' => $exploUuid,
            'constituted_at'    => '2026-05-01T00:00:00+00:00',
            'quantity'          => 250.0,
        ]]);

        $calls = [];
        $this->httpClient->method('request')
            ->willReturnCallback(function (string $method, string $url, array $options = []) use (&$calls, $empty, $products, $exploitations, $lots) {
                $calls[] = ['method' => $method, 'url' => $url, 'options' => $options];
                if (str_ends_with($url, '/sync/products')) {
                    return $products;
                }
                if (str_ends_with($url, '/sync/exploitations')) {
                    return $exploitations;
                }
                if (str_ends_with($url, '/sync/lots')) {
                    return $lots;
                }

                return $empty;
            });

        $persisted = [];
        $this->em->method('persist')->willReturnCallback(function ($entity) use (&$persisted) {
            $persisted[] = $entity;
        });

        $this->produitRepository->method('find')->willReturnCallback(function ($uuid) use (&$persisted) {
            foreach ($persisted as $e) {
                if ($e instanceof Produit && (string) $e->getUuid() === (string) $uuid) {
                    return $e;
                }
            }

            return null;
        });
        $this->exploitationRepository->method('find')->willReturnCallback(function ($uuid) use (&$persisted) {
            foreach ($persisted as $e) {
                if ($e instanceof Exploitation && (string) $e->getUuid() === (string) $uuid) {
                    return $e;
                }
            }

            return null;
        });
        $this->lotRepository->method('find')->willReturn(null);

        $this->syncService->syncPays($pays);

        $lotsPersisted = array_values(array_filter($persisted, fn ($e) => $e instanceof Lot));
        $this->assertCount(1, $lotsPersisted);
        $lot = $lotsPersisted[0];

        $this->assertNotNull($lot->getExploitation());
        $this->assertSame($exploUuid, (string) $lot->getExploitation()->getUuid());
        $this->assertSame(
            '2026-05-01T00:00:00+00:00',
            $lot->getConstitueeLe()->format(\DateTimeInterface::ATOM),
        );

        $ackCalls = array_values(array_filter($calls, fn ($c) => str_ends_with($c['url'], '/sync/ack')));
        $this->assertCount(1, $ackCalls);
        $this->assertContains($exploUuid, $ackCalls[0]['options']['json']['exploitations'] ?? []);
    }

    public function testSyncLotSkippedWhenProductMissing(): void
    {
        $pays = (new Pays())
            ->setNom('Équateur')
            ->setCodeIso('ECU')
            ->setApiUrl('https://equateur.futurekawa.local')
            ->setApiKey('secret');

        $empty = $this->createMock(ResponseInterface::class);
        $empty->method('toArray')->willReturn([]);

        $lots = $this->createMock(ResponseInterface::class);
        $lots->method('toArray')->willReturn([[
            'uuid'         => '22222222-2222-2222-2222-222222222222',
            'product_uuid' => '99999999-9999-9999-9999-999999999999',
            'quantity'     => 100.0,
        ]]);

        $this->httpClient->method('request')
            ->willReturnCallback(function (string $method, string $url) use ($empty, $lots) {
                return str_ends_with($url, '/sync/lots') ? $lots : $empty;
            });

        $this->produitRepository->method('find')->willReturn(null);

        $persisted = [];
        $this->em->method('persist')->willReturnCallback(function ($entity) use (&$persisted) {
            $persisted[] = $entity;
        });

        $this->logger->expects($this->once())->method('warning');

        $this->syncService->syncPays($pays);

        $lotsPersisted = array_values(array_filter($persisted, fn ($e) => $e instanceof Lot));
        $this->assertCount(0, $lotsPersisted, 'un lot dont le produit est introuvable ne doit pas être persisté');
    }
}
