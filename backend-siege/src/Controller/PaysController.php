<?php

namespace App\Controller;

use App\Pagination\Pagination;
use App\Repository\PaysRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
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
    #[OA\Parameter(name: 'page',  in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1))]
    #[OA\Parameter(name: 'limit', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 50))]
    #[OA\Response(response: 200, description: 'Paginated list of countries')]
    public function list(Request $request): JsonResponse
    {
        $pagination = Pagination::fromRequest($request);
        $result = $this->paysRepository->findPaginated($pagination->getLimit(), $pagination->getOffset());

        $data = array_map(fn ($p) => [
            'code'             => $p->getCode(),
            'idealTemperature' => $p->getTempIdeale(),
            'idealHumidity'    => $p->getHumiditeIdeale(),
            'lastSyncedAt'     => $p->getLastSyncedAt()?->format(\DateTimeInterface::ATOM),
        ], $result['items']);

        return $this->json($pagination->envelope($data, $result['total']));
    }

    #[Route('/{code}', name: 'show', methods: ['GET'])]
    #[OA\Get(path: '/api/countries/{code}', summary: 'Country detail')]
    #[OA\Response(response: 200, description: 'Country found')]
    #[OA\Response(response: 404, description: 'Country not found')]
    public function show(string $code): JsonResponse
    {
        $pays = $this->paysRepository->find($code);
        if ($pays === null) {
            return $this->json(['error' => 'Country not found'], 404);
        }

        return $this->json([
            'code'             => $pays->getCode(),
            'idealTemperature' => $pays->getTempIdeale(),
            'idealHumidity'    => $pays->getHumiditeIdeale(),
            'lastSyncedAt'     => $pays->getLastSyncedAt()?->format(\DateTimeInterface::ATOM),
        ]);
    }
}
