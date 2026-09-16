<?php

namespace App\Controller;

use App\Pagination\Pagination;
use App\Repository\EntrepotRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/warehouses', name: 'api_entrepots_')]
#[OA\Tag(name: 'Warehouses')]
class EntrepotController extends AbstractController
{
    public function __construct(private readonly EntrepotRepository $entrepotRepository)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(path: '/api/warehouses', summary: 'List warehouses, filterable by country')]
    #[OA\Parameter(name: 'country', in: 'query', required: false, schema: new OA\Schema(type: 'string'), description: '2-letter ISO country code')]
    #[OA\Parameter(name: 'page',    in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1))]
    #[OA\Parameter(name: 'limit',   in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 50))]
    #[OA\Response(response: 200, description: 'Paginated list of warehouses')]
    public function list(Request $request): JsonResponse
    {
        $paysCode = $request->query->get('country');
        $pagination = Pagination::fromRequest($request);

        $result = $this->entrepotRepository->findFilteredPaginated(
            $paysCode !== null ? (string) $paysCode : null,
            $pagination->getLimit(),
            $pagination->getOffset(),
        );

        $data = array_map(fn ($e) => $this->serialize($e), $result['items']);

        return $this->json($pagination->envelope($data, $result['total']));
    }

    #[Route('/{uuid}', name: 'show', methods: ['GET'])]
    #[OA\Get(path: '/api/warehouses/{uuid}', summary: 'Warehouse detail')]
    #[OA\Response(response: 200, description: 'Warehouse found')]
    #[OA\Response(response: 404, description: 'Warehouse not found')]
    public function show(string $uuid): JsonResponse
    {
        $entrepot = $this->entrepotRepository->find($uuid);
        if ($entrepot === null) {
            return $this->json(['error' => 'Warehouse not found'], 404);
        }

        return $this->json($this->serialize($entrepot));
    }

    private function serialize(mixed $e): array
    {
        return [
            'uuid'         => (string) $e->getUuid(),
            'name'         => $e->getNom(),
            'streetNumber' => $e->getNumeroRue(),
            'address'      => $e->getAdresse(),
            'postalCode'   => $e->getCodePostal(),
            'city'         => $e->getVille(),
            'active'       => $e->isActif(),
            'status'       => $e->getDernierStatut(),
            'statusAt'     => $e->getDernierStatutLe()?->format(\DateTimeInterface::ATOM),
            'country'      => [
                'code' => $e->getPays()->getCode(),
            ],
        ];
    }
}
