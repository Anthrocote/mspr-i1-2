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

    #[Route('/pays/{id}', name: 'pays', methods: ['POST'])]
    #[OA\Post(path: '/api/sync/pays/{id}', summary: 'Déclenche manuellement la sync d\'un pays (ROLE_ADMIN)')]
    #[OA\Response(response: 202, description: 'Sync déclenchée')]
    #[OA\Response(response: 404, description: 'Pays non trouvé')]
    public function syncPays(int $id): JsonResponse
    {
        $pays = $this->paysRepository->find($id);
        if ($pays === null) {
            return $this->json(['error' => 'Pays non trouvé'], 404);
        }
        if ($pays->getApiUrl() === null) {
            return $this->json(['error' => 'Ce pays n\'a pas d\'URL de synchronisation configurée'], 422);
        }

        $this->bus->dispatch(new SyncPaysMessage($id));

        return $this->json(['message' => 'Synchronisation déclenchée pour ' . $pays->getNom()], 202);
    }

    #[Route('/status', name: 'status', methods: ['GET'])]
    #[OA\Get(path: '/api/sync/status', summary: 'Statut de synchronisation de tous les pays')]
    #[OA\Response(response: 200, description: 'Statut par pays')]
    public function status(): JsonResponse
    {
        $paysList = $this->paysRepository->findAll();

        $data = array_map(fn ($p) => [
            'id'           => $p->getId(),
            'nom'          => $p->getNom(),
            'codeIso'      => $p->getCodeIso(),
            'configured'   => $p->getApiUrl() !== null,
            'lastSyncedAt' => $p->getLastSyncedAt()?->format(\DateTimeInterface::ATOM),
        ], $paysList);

        return $this->json($data);
    }
}
