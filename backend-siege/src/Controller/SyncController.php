<?php

namespace App\Controller;

use App\Message\SyncPaysMessage;
use App\Repository\PaysRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/sync', name: 'api_sync_')]
#[OA\Tag(name: 'Sync')]
class SyncController extends AbstractController
{
    public function __construct(
        private readonly MessageBusInterface $bus,
        private readonly PaysRepository     $paysRepository,
    ) {
    }

    #[Route('/countries/{id}', name: 'pays', methods: ['POST'])]
    #[OA\Post(path: '/api/sync/countries/{id}', summary: 'Manually trigger the sync of a country')]
    #[OA\Response(response: 202, description: 'Sync triggered')]
    #[OA\Response(response: 404, description: 'Country not found')]
    public function syncPays(int $id): JsonResponse
    {
        $pays = $this->paysRepository->find($id);
        if ($pays === null) {
            return $this->json(['error' => 'Country not found'], 404);
        }
        if ($pays->getApiUrl() === null) {
            return $this->json(['error' => 'This country has no configured sync URL'], 422);
        }

        $this->bus->dispatch(new SyncPaysMessage($id));

        return $this->json(['message' => 'Sync triggered for ' . $pays->getNom()], 202);
    }

    #[Route('/status', name: 'status', methods: ['GET'])]
    #[OA\Get(path: '/api/sync/status', summary: 'Sync status of all countries')]
    #[OA\Response(response: 200, description: 'Status by country')]
    public function status(): JsonResponse
    {
        $paysList = $this->paysRepository->findAll();

        $data = array_map(fn ($p) => [
            'id'           => $p->getId(),
            'name'         => $p->getNom(),
            'isoCode'      => $p->getCodeIso(),
            'configured'   => $p->getApiUrl() !== null,
            'lastSyncedAt' => $p->getLastSyncedAt()?->format(\DateTimeInterface::ATOM),
        ], $paysList);

        return $this->json($data);
    }
}
