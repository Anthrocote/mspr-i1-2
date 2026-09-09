<?php

namespace App\Controller;

use App\Pagination\Pagination;
use App\Repository\LotRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/lots', name: 'api_lots_')]
#[OA\Tag(name: 'Lots')]
class LotController extends AbstractController
{
    public function __construct(private readonly LotRepository $lotRepository)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[OA\Get(path: '/api/lots', summary: 'List lots (FIFO), filterable')]
    #[OA\Parameter(name: 'warehouse_id', in: 'query', required: false, schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'status',       in: 'query', required: false, schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'country_id',   in: 'query', required: false, schema: new OA\Schema(type: 'integer'))]
    #[OA\Parameter(name: 'page',         in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1))]
    #[OA\Parameter(name: 'limit',        in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 50))]
    #[OA\Response(response: 200, description: 'Paginated list of lots')]
    public function list(Request $request): JsonResponse
    {
        $entrepotUuid = $request->query->get('warehouse_id');
        $statut       = $request->query->get('status');
        $paysId       = $request->query->get('country_id');
        $pagination   = Pagination::fromRequest($request);

        $result = $this->lotRepository->findFiltered(
            $entrepotUuid,
            $statut,
            $paysId !== null ? (int) $paysId : null,
            $pagination->getLimit(),
            $pagination->getOffset(),
        );

        $data = array_map(fn ($l) => $this->serializeSummary($l), $result['items']);

        return $this->json($pagination->envelope($data, $result['total']));
    }

    #[Route('/{uuid}', name: 'show', methods: ['GET'])]
    #[OA\Get(path: '/api/lots/{uuid}', summary: 'Lot detail with storage history')]
    #[OA\Response(response: 200, description: 'Lot found')]
    #[OA\Response(response: 404, description: 'Lot not found')]
    public function show(string $uuid): JsonResponse
    {
        $lot = $this->lotRepository->find($uuid);
        if ($lot === null) {
            return $this->json(['error' => 'Lot not found'], 404);
        }

        return $this->json($this->serializeDetail($lot));
    }

    private function serializeSummary(mixed $l): array
    {
        return [
            'uuid'      => (string) $l->getUuid(),
            'label'     => $l->getLibelle(),
            'quantity'  => $l->getQuantite(),
            'status'    => $l->getStatut(),
            'syncedAt'  => $l->getSyncedAt()->format(\DateTimeInterface::ATOM),
            'product'   => [
                'uuid' => (string) $l->getProduit()->getUuid(),
                'name' => $l->getProduit()->getNom(),
            ],
        ];
    }

    private function serializeDetail(mixed $l): array
    {
        $data = $this->serializeSummary($l);
        $data['storageHistory'] = array_map(fn ($hs) => [
            'warehouse'  => [
                'uuid' => (string) $hs->getEntrepot()->getUuid(),
                'name' => $hs->getEntrepot()->getNom(),
            ],
            'arrivedAt'  => $hs->getDateArrivee()->format(\DateTimeInterface::ATOM),
            'departedAt' => $hs->getDateDepart()?->format(\DateTimeInterface::ATOM),
        ], $l->getHistoriqueStockages()->toArray());

        return $data;
    }
}
