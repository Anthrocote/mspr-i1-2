<?php

namespace App\Controller;

use App\Repository\PaysRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/countries', name: 'api_pays_')]
#[OA\Tag(name: 'Countries')]
class PaysController extends AbstractController
{
    public function __construct(private readonly PaysRepository $paysRepository)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(path: '/api/countries', summary: 'List all countries')]
    #[OA\Response(response: 200, description: 'List of countries')]
    public function list(): JsonResponse
    {
        $pays = $this->paysRepository->findAll();

        return $this->json(array_map(fn ($p) => [
            'id'               => $p->getId(),
            'name'             => $p->getNom(),
            'isoCode'          => $p->getCodeIso(),
            'idealTemperature' => $p->getTempIdeale(),
            'idealHumidity'    => $p->getHumiditeIdeale(),
            'lastSyncedAt'     => $p->getLastSyncedAt()?->format(\DateTimeInterface::ATOM),
        ], $pays));
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[OA\Get(path: '/api/countries/{id}', summary: 'Country detail')]
    #[OA\Response(response: 200, description: 'Country found')]
    #[OA\Response(response: 404, description: 'Country not found')]
    public function show(int $id): JsonResponse
    {
        $pays = $this->paysRepository->find($id);
        if ($pays === null) {
            return $this->json(['error' => 'Country not found'], 404);
        }

        return $this->json([
            'id'               => $pays->getId(),
            'name'             => $pays->getNom(),
            'isoCode'          => $pays->getCodeIso(),
            'idealTemperature' => $pays->getTempIdeale(),
            'idealHumidity'    => $pays->getHumiditeIdeale(),
            'lastSyncedAt'     => $pays->getLastSyncedAt()?->format(\DateTimeInterface::ATOM),
        ]);
    }
}
