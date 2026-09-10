<?php

namespace App\Tests\Unit\Service\Sync;

use App\Entity\Alerte;
use App\Entity\Pays;
use App\Repository\AlerteRepository;
use App\Repository\EntrepotRepository;
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
    private LotRepository $lotRepository;
    private MesureRepository $mesureRepository;
    private AlerteRepository $alerteRepository;
    private LoggerInterface $logger;

    protected function setUp(): void
    {
        $this->httpClient         = $this->createMock(HttpClientInterface::class);
        $this->em                 = $this->createMock(EntityManagerInterface::class);
        $this->paysRepository     = $this->createMock(PaysRepository::class);
        $this->entrepotRepository = $this->createMock(EntrepotRepository::class);
        $this->produitRepository  = $this->createMock(ProduitRepository::class);
        $this->lotRepository      = $this->createMock(LotRepository::class);
        $this->mesureRepository   = $this->createMock(MesureRepository::class);
        $this->alerteRepository   = $this->createMock(AlerteRepository::class);
        $this->logger             = $this->createMock(LoggerInterface::class);

        $this->syncService = new SyncService(
            $this->httpClient,
            $this->em,
            $this->paysRepository,
            $this->entrepotRepository,
            $this->produitRepository,
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

    public function testSyncPaysCallsAllThreeEndpoints(): void
    {
        $pays = (new Pays())
            ->setNom('Brésil')
            ->setCodeIso('BRA')
            ->setApiUrl('https://bresil.futurekawa.local')
            ->setApiKey('secret');

        $emptyResponse = $this->createMock(ResponseInterface::class);
        $emptyResponse->method('toArray')->willReturn([]);

        $this->httpClient->expects($this->exactly(3))
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
            'uuid'          => 'a1b2c3d4-0000-0000-0000-000000000000',
            'type'          => Alerte::TYPE_CONDITION_HORS_PLAGE,
            'entrepot_uuid' => null,
            'declenchee_le' => '2026-06-10T02:15:00+00:00',
        ]]);

        $this->httpClient->method('request')
            ->willReturnCallback(function (string $method, string $url) use ($emptyResponse, $alertesResponse) {
                return str_ends_with($url, '/sync/alertes') ? $alertesResponse : $emptyResponse;
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
            'uuid'          => 'm1000000-0000-0000-0000-000000000000',
            'entrepot_uuid' => 'e1000000-0000-0000-0000-000000000000',
            'temperature'   => 28.4,
            'humidite'      => 57.0,
            'mesure_le'     => '2026-09-09T02:15:00+00:00',
        ]]);

        $calls = [];
        $this->httpClient->method('request')
            ->willReturnCallback(function (string $method, string $url, array $options = []) use (&$calls, $emptyResponse, $mesuresResponse) {
                $calls[] = ['method' => $method, 'url' => $url, 'options' => $options];

                return str_ends_with($url, '/sync/mesures') ? $mesuresResponse : $emptyResponse;
            });

        $this->mesureRepository->method('find')->willReturn(null);
        $this->entrepotRepository->method('find')->willReturn(null);

        $this->syncService->syncPays($pays);

        $ackCalls = array_values(array_filter($calls, fn ($c) => str_ends_with($c['url'], '/sync/ack')));
        $this->assertCount(1, $ackCalls, 'un POST /sync/ack doit être émis');
        $this->assertSame('POST', $ackCalls[0]['method']);
        $this->assertContains(
            'm1000000-0000-0000-0000-000000000000',
            $ackCalls[0]['options']['json']['mesures'] ?? [],
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
}
