<?php

namespace App\Controller;

use App\Repository\PaysRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/pays', name: 'api_pays_')]
#[OA\Tag(name: 'Pays')]
class PaysController extends AbstractController
{
    public function __construct(private readonly PaysRepository $paysRepository)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(path: '/api/pays', summary: 'Liste tous les pays')]
    #[OA\Response(response: 200, description: 'Liste des pays')]
    public function list(): JsonResponse
    {
        $pays = $this->paysRepository->findAll();

        return $this->json(array_map(fn ($p) => [
            'id'              => $p->getId(),
            'nom'             => $p->getNom(),
            'codeIso'         => $p->getCodeIso(),
            'tempIdeale'      => $p->getTempIdeale(),
            'humiditeIdeale'  => $p->getHumiditeIdeale(),
            'lastSyncedAt'    => $p->getLastSyncedAt()?->format(\DateTimeInterface::ATOM),
        ], $pays));
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[OA\Get(path: '/api/pays/{id}', summary: 'Détail d\'un pays')]
    #[OA\Response(response: 200, description: 'Pays trouvé')]
    #[OA\Response(response: 404, description: 'Pays non trouvé')]
    public function show(int $id): JsonResponse
    {
        $pays = $this->paysRepository->find($id);
        if ($pays === null) {
            return $this->json(['error' => 'Pays non trouvé'], 404);
        }

        return $this->json([
            'id'              => $pays->getId(),
            'nom'             => $pays->getNom(),
            'codeIso'         => $pays->getCodeIso(),
            'tempIdeale'      => $pays->getTempIdeale(),
            'humiditeIdeale'  => $pays->getHumiditeIdeale(),
            'lastSyncedAt'    => $pays->getLastSyncedAt()?->format(\DateTimeInterface::ATOM),
        ]);
    }
}
