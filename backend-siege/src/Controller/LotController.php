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
    #[OA\Parameter(name: 'country',      in: 'query', required: false, schema: new OA\Schema(type: 'string'), description: '2-letter ISO country code')]
    #[OA\Parameter(name: 'page',         in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1))]
    #[OA\Parameter(name: 'limit',        in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 50))]
    #[OA\Parameter(name: 'search',       in: 'query', required: false, schema: new OA\Schema(type: 'string'), description: 'Case-insensitive substring on lot label, product, warehouse and country names')]
    #[OA\Parameter(name: 'age',          in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['lt90', '90_180', '180_365', 'gt365']))]
    #[OA\Parameter(name: 'sort',         in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['id', 'country', 'warehouse', 'duration', 'status']))]
    #[OA\Parameter(name: 'order',        in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'], default: 'asc'))]
    #[OA\Response(response: 200, description: 'Paginated list of lots')]
    public function list(Request $request): JsonResponse
    {
        $entrepotUuid = $request->query->get('warehouse_id');
        $statut       = $request->query->get('status');
        $paysCode     = $request->query->get('country');
        $search       = $request->query->get('search');
        $age          = $request->query->get('age');
        $sort         = $request->query->get('sort');
        $order        = $request->query->get('order');
        $pagination   = Pagination::fromRequest($request);

        $result = $this->lotRepository->findFiltered(
            $entrepotUuid,
            $statut,
            $paysCode !== null ? (string) $paysCode : null,
            $pagination->getLimit(),
            $pagination->getOffset(),
            $search,
            $age,
            $sort,
            $order,
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
        $current = $this->currentStockage($l);
        $entrepot = $current?->getEntrepot();
        $exploitation = $l->getExploitation();

        return [
            'uuid'             => (string) $l->getUuid(),
            'label'            => $l->getLibelle(),
            'quantity'         => $l->getQuantite(),
            'status'           => $l->getStatut(),
            'syncedAt'         => $l->getSyncedAt()->format(\DateTimeInterface::ATOM),
            'product'          => [
                'uuid' => (string) $l->getProduit()->getUuid(),
                'name' => $l->getProduit()->getNom(),
            ],
            'currentWarehouse' => $entrepot === null ? null : [
                'uuid' => (string) $entrepot->getUuid(),
                'name' => $entrepot->getNom(),
            ],
            'country'          => $entrepot === null ? null : [
                'code' => $entrepot->getPays()->getCode(),
                'name' => $entrepot->getPays()->getNom(),
            ],
            'exploitation'     => $exploitation === null ? null : [
                'uuid' => (string) $exploitation->getUuid(),
                'name' => $exploitation->getNom(),
            ],
            'constitutedAt'    => $l->getConstitueeLe()?->format(\DateTimeInterface::ATOM),
            'arrivedAt'        => $current?->getDateArrivee()->format(\DateTimeInterface::ATOM),
            'durationDays'     => $this->durationDays($l),
        ];
    }

    /**
     * Current warehouse = the storage entry still open (no departure date); if
     * several are open, the most recently arrived; otherwise the most recent overall.
     */
    private function currentStockage(mixed $l): mixed
    {
        $stockages = $l->getHistoriqueStockages()->toArray();
        if ($stockages === []) {
            return null;
        }

        $open = array_filter($stockages, fn ($hs) => $hs->getDateDepart() === null);
        $pool = $open !== [] ? array_values($open) : $stockages;

        usort($pool, fn ($a, $b) => $b->getDateArrivee() <=> $a->getDateArrivee());

        return $pool[0];
    }

    private function durationDays(mixed $l): ?int
    {
        $start = $l->getConstitueeLe();

        if ($start === null) {
            $stockages = $l->getHistoriqueStockages()->toArray();
            foreach ($stockages as $hs) {
                if ($start === null || $hs->getDateArrivee() < $start) {
                    $start = $hs->getDateArrivee();
                }
            }
        }

        if ($start === null) {
            return null;
        }

        return $start->diff(new \DateTimeImmutable())->days;
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
