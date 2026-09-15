<?php

namespace App\Controller;

use App\Pagination\Pagination;
use App\Repository\EntrepotRepository;
use App\Repository\MesureRepository;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[OA\Tag(name: 'Measurements')]
class MesureController extends AbstractController
{
    public function __construct(
        private readonly MesureRepository  $mesureRepository,
        private readonly EntrepotRepository $entrepotRepository,
    ) {
    }

    #[Route('/api/measurements', name: 'api_mesures_list', methods: ['GET'])]
    #[OA\Get(path: '/api/measurements', summary: 'List IoT measurements of a warehouse with date filter')]
    #[OA\Parameter(name: 'warehouse_id', in: 'query', required: true,  schema: new OA\Schema(type: 'string'))]
    #[OA\Parameter(name: 'from',         in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date-time'))]
    #[OA\Parameter(name: 'to',           in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date-time'))]
    #[OA\Parameter(name: 'page',         in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1))]
    #[OA\Parameter(name: 'limit',        in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 50))]
    #[OA\Response(response: 200, description: 'Paginated list of measurements')]
    #[OA\Response(response: 400, description: 'Missing warehouse_id parameter')]
    public function list(Request $request): JsonResponse
    {
        $entrepotUuid = $request->query->get('warehouse_id');
        if ($entrepotUuid === null) {
            return $this->json(['error' => 'The warehouse_id parameter is required'], 400);
        }

        $from = $request->query->get('from') ? new \DateTimeImmutable($request->query->get('from')) : null;
        $to   = $request->query->get('to')   ? new \DateTimeImmutable($request->query->get('to'))   : null;

        return $this->measurementsResponse($entrepotUuid, $from, $to, $request);
    }

    #[Route('/api/warehouses/{uuid}/measurements', name: 'api_entrepots_mesures', methods: ['GET'])]
    #[OA\Get(path: '/api/warehouses/{uuid}/measurements', summary: 'IoT measurements of a given warehouse')]
    #[OA\Parameter(name: 'from',  in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date-time'))]
    #[OA\Parameter(name: 'to',    in: 'query', required: false, schema: new OA\Schema(type: 'string', format: 'date-time'))]
    #[OA\Parameter(name: 'page',  in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1))]
    #[OA\Parameter(name: 'limit', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 50))]
    #[OA\Response(response: 200, description: 'Paginated list of measurements')]
    #[OA\Response(response: 404, description: 'Warehouse not found')]
    public function listByEntrepot(string $uuid, Request $request): JsonResponse
    {
        $entrepot = $this->entrepotRepository->find($uuid);
        if ($entrepot === null) {
            return $this->json(['error' => 'Warehouse not found'], 404);
        }

        $from = $request->query->get('from') ? new \DateTimeImmutable($request->query->get('from')) : null;
        $to   = $request->query->get('to')   ? new \DateTimeImmutable($request->query->get('to'))   : null;

        return $this->measurementsResponse($uuid, $from, $to, $request);
    }

    /**
     * A date filter bounds the result, so the whole range is returned in one
     * (unpaginated) response — the chart needs the full window, not a 200-row
     * slice. Without a date filter the default pagination still caps the payload.
     */
    private function measurementsResponse(string $uuid, ?\DateTimeImmutable $from, ?\DateTimeImmutable $to, Request $request): JsonResponse
    {
        if ($from !== null || $to !== null) {
            $items = $this->mesureRepository->findAllByEntrepot($uuid, $from, $to);
            $data = array_map(fn ($m) => $this->serialize($m), $items);
            $count = count($data);

            return $this->json([
                'data'       => $data,
                'pagination' => ['page' => 1, 'limit' => $count, 'total' => $count, 'pages' => 1],
            ]);
        }

        $pagination = Pagination::fromRequest($request);
        $result = $this->mesureRepository->findByEntrepot($uuid, $from, $to, $pagination->getLimit(), $pagination->getOffset());
        $data = array_map(fn ($m) => $this->serialize($m), $result['items']);

        return $this->json($pagination->envelope($data, $result['total']));
    }

    private function serialize(mixed $m): array
    {
        return [
            'uuid'          => (string) $m->getUuid(),
            'warehouseUuid' => (string) $m->getEntrepot()->getUuid(),
            'temperature'   => $m->getTemperature(),
            'humidity'      => $m->getHumidite(),
            'measuredAt'    => $m->getMesureLe()->format(\DateTimeInterface::ATOM),
            'syncedAt'      => $m->getSyncedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
