<?php

namespace App\Controller;

use App\Message\SyncPaysMessage;
use App\Pagination\Pagination;
use App\Repository\PaysRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
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
    #[OA\Parameter(name: 'page',  in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1))]
    #[OA\Parameter(name: 'limit', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 50))]
    #[OA\Response(response: 200, description: 'Paginated sync status by country')]
    public function status(Request $request): JsonResponse
    {
        $pagination = Pagination::fromRequest($request);
        $result = $this->paysRepository->findPaginated($pagination->getLimit(), $pagination->getOffset());

        $data = array_map(fn ($p) => [
            'id'           => $p->getId(),
            'name'         => $p->getNom(),
            'isoCode'      => $p->getCodeIso(),
            'configured'   => $p->getApiUrl() !== null,
            'lastSyncedAt' => $p->getLastSyncedAt()?->format(\DateTimeInterface::ATOM),
        ], $result['items']);

        return $this->json($pagination->envelope($data, $result['total']));
    }
}
